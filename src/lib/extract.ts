import { EXTRACTION_PROMPT_V4, fillPromptTemplate } from '@/lib/extraction-prompt';
import { resolveFinalDate } from '@/lib/resolve-date';
import { getAiProvider } from '@/lib/ai-provider';

export type FactType = 'life_event' | 'state' | 'detail';
export type Sentiment = 'worried' | 'happy' | 'neutral' | 'low';

// V4 contract: the model never resolves a date itself (see
// extraction-prompt.ts V4 and resolve-date.ts). `date_expression` is the
// speaker's own words verbatim; `resolved_date` is set by the model only
// when the transcript stated a full explicit date. Everything else is
// resolved in code, in persist.ts.
export interface ExtractedFact {
  type: FactType;
  content: string;
  date_expression: string | null;
  resolved_date: string | null;
  confidence: number;
}

export interface ExtractedCommitment {
  description: string;
  date_expression: string | null;
  resolved_date: string | null;
  // The exact transcript substring the model points to as proof the speaker
  // made this commitment; persist.ts verifies it and drops the commitment
  // if it isn't actually there (and isn't actually a promise).
  evidence: string;
}

export interface ExtractionResult {
  person_name: string | null;
  met_on: string;
  facts: ExtractedFact[];
  commitments: ExtractedCommitment[];
  sentiment: Sentiment;
}

// Legacy shapes, kept only so the prompt-version eval script can still run
// V1/V2/V3 for comparison. `extract()` itself only ever uses V4 below.
export interface LegacyExtractedFact {
  type: FactType;
  content: string;
  event_date: string | null;
  confidence: number;
}

export interface LegacyExtractedCommitment {
  description: string;
  due_date: string;
  evidence?: string; // V3 only
}

export interface LegacyExtractionResult {
  person_name: string | null;
  met_on: string;
  facts: LegacyExtractedFact[];
  commitments: LegacyExtractedCommitment[];
  sentiment: Sentiment;
}

export const EXTRACTION_SCHEMA = {
  name: 'holdfast_extraction',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      person_name: { type: ['string', 'null'] },
      met_on: { type: 'string' },
      facts: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['life_event', 'state', 'detail'] },
            content: { type: 'string' },
            event_date: { type: ['string', 'null'] },
            confidence: { type: 'number' },
          },
          required: ['type', 'content', 'event_date', 'confidence'],
          additionalProperties: false,
        },
      },
      commitments: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            due_date: { type: 'string' },
          },
          required: ['description', 'due_date'],
          additionalProperties: false,
        },
      },
      sentiment: { type: 'string', enum: ['worried', 'happy', 'neutral', 'low'] },
    },
    required: ['person_name', 'met_on', 'facts', 'commitments', 'sentiment'],
    additionalProperties: false,
  },
};

export const EXTRACTION_SCHEMA_V3 = {
  name: 'holdfast_extraction_v3',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      ...EXTRACTION_SCHEMA.schema.properties,
      commitments: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            due_date: { type: 'string' },
            evidence: { type: 'string' },
          },
          required: ['description', 'due_date', 'evidence'],
          additionalProperties: false,
        },
      },
    },
    required: ['person_name', 'met_on', 'facts', 'commitments', 'sentiment'],
    additionalProperties: false,
  },
};

// No `met_on` here: the capture date is known to us exactly and
// runExtraction() sets it in code. Asking the model for it only gave it a
// field to get wrong (on Groq, gpt-oss returned null and the whole answer was
// rejected for not matching the schema).
export const EXTRACTION_SCHEMA_V4 = {
  name: 'holdfast_extraction_v4',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      person_name: { type: ['string', 'null'] },
      facts: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['life_event', 'state', 'detail'] },
            content: { type: 'string' },
            date_expression: { type: ['string', 'null'] },
            resolved_date: { type: ['string', 'null'] },
            confidence: { type: 'number' },
          },
          required: ['type', 'content', 'date_expression', 'resolved_date', 'confidence'],
          additionalProperties: false,
        },
      },
      commitments: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            date_expression: { type: ['string', 'null'] },
            resolved_date: { type: ['string', 'null'] },
            evidence: { type: 'string' },
          },
          required: ['description', 'date_expression', 'resolved_date', 'evidence'],
          additionalProperties: false,
        },
      },
      sentiment: { type: 'string', enum: ['worried', 'happy', 'neutral', 'low'] },
    },
    required: ['person_name', 'facts', 'commitments', 'sentiment'],
    additionalProperties: false,
  },
};

type JsonSchemaSpec = { name: string; strict: boolean; schema: Record<string, unknown> };

// Groq's free tier allows ~8K tokens a minute, about four notes, so a few
// people sending notes in the same minute get a 429. The response says how
// long to wait (usually a few seconds), but the allowance refills gradually,
// so one wait isn't always enough. Retry a few times, never waiting more than
// 20s in total; longer waits (e.g. the daily limit is used up) fail straight
// away.
const MAX_RATE_LIMIT_RETRIES = 3;
const MAX_TOTAL_RATE_LIMIT_WAIT_MS = 20_000;
const DEFAULT_RATE_LIMIT_WAIT_MS = 5_000;
// Groq rounds `retry-after`; waiting exactly that long often still gets a 429.
const RATE_LIMIT_BUFFER_MS = 1_000;

// Turns a 429's `retry-after` header (seconds) into how long to wait before
// the next retry.
export function rateLimitWaitMs(retryAfter: string | null): number {
  const seconds = retryAfter == null || retryAfter === '' ? NaN : Number(retryAfter);
  return Number.isFinite(seconds)
    ? Math.ceil(seconds * 1000) + RATE_LIMIT_BUFFER_MS
    : DEFAULT_RATE_LIMIT_WAIT_MS;
}

// Calls the model with a fully-rendered system prompt and a response schema,
// and normalizes the result. Shared by `extract()` (always V4 +
// EXTRACTION_SCHEMA_V4) and the prompt-version eval script, which passes
// other prompt/schema versions with their own result shapes via `T`.
export async function runExtraction<T extends { met_on: string }>(
  transcript: string,
  captureDate: string,
  systemPrompt: string,
  schema: JsonSchemaSpec,
): Promise<T> {
  const provider = getAiProvider();
  if (!provider.apiKey) {
    throw new Error(`Missing ${provider.apiKeyEnvVar} environment variable`);
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('Extraction input:', JSON.stringify({ captureDate, transcript }, null, 2));
  }

  const send = () =>
    fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: provider.extractionModel,
        temperature: 0,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: transcript },
        ],
        response_format: { type: 'json_schema', json_schema: schema },
        ...provider.extractionParams,
      }),
    });

  let res = await send();
  let waitedMs = 0;
  for (let retry = 0; retry < MAX_RATE_LIMIT_RETRIES && res.status === 429; retry++) {
    const waitMs = rateLimitWaitMs(res.headers.get('retry-after'));
    if (waitedMs + waitMs > MAX_TOTAL_RATE_LIMIT_WAIT_MS) break;
    console.warn(`${provider.displayName} rate limit hit, retrying extraction in ${waitMs}ms`);
    // Release the unread 429 body so its connection is freed for the retry.
    await res.body?.cancel();
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    waitedMs += waitMs;
    res = await send();
  }

  if (!res.ok) {
    throw new Error(`${provider.displayName} extraction failed: ${res.status} ${await res.text()}`);
  }

  const body = await res.json();
  const content = body.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(`${provider.displayName} extraction returned no content`);
  }

  const result = JSON.parse(content) as T;
  // The capture date is known to us exactly; don't trust the model to echo it back.
  result.met_on = captureDate;

  if (process.env.NODE_ENV === 'development') {
    console.log('Extraction output:', JSON.stringify(result, null, 2));
  }

  return result;
}

// Runs structured extraction over a transcript. `captureDate` is an ISO 8601
// date (YYYY-MM-DD) that resolve-date.ts resolves every date expression
// against.
export async function extract(
  transcript: string,
  captureDate: string,
): Promise<ExtractionResult> {
  const systemPrompt = fillPromptTemplate(EXTRACTION_PROMPT_V4, captureDate);
  return runExtraction<ExtractionResult>(transcript, captureDate, systemPrompt, EXTRACTION_SCHEMA_V4);
}

// Renders an ISO date's day-of-month as an ordinal, e.g. "2026-08-14" -> "the 14th".
function formatDayOrdinal(isoDate: string): string {
  const day = parseInt(isoDate.slice(8, 10), 10);
  const lastDigit = day % 10;
  const lastTwoDigits = day % 100;
  let suffix = 'th';
  if (lastTwoDigits < 11 || lastTwoDigits > 13) {
    if (lastDigit === 1) suffix = 'st';
    else if (lastDigit === 2) suffix = 'nd';
    else if (lastDigit === 3) suffix = 'rd';
  }
  return `the ${day}${suffix}`;
}

// Builds the short, human, non-JSON summary sent back to the user in Telegram.
export function formatExtractionSummary(extraction: ExtractionResult): string {
  const name = extraction.person_name ?? 'Someone';
  const factParts = extraction.facts.map((fact) => {
    const eventDate = resolveFinalDate(fact, extraction.met_on);
    return eventDate ? `${fact.content} on ${formatDayOrdinal(eventDate)}` : fact.content;
  });
  const headline = factParts.length > 0 ? `${name}: ${factParts.join(', ')}.` : `${name}.`;

  if (extraction.commitments.length === 0) {
    return headline;
  }

  const commitmentParts = extraction.commitments.map((c) => c.description);
  return `${headline}\n${name}: you said you'd ${commitmentParts.join(' and ')}.`;
}
