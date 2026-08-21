import { EXTRACTION_PROMPT_V4, fillPromptTemplate } from '@/lib/extraction-prompt';
import { resolveFinalDate } from '@/lib/resolve-date';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const EXTRACTION_MODEL = 'gpt-4o-mini';

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

export const EXTRACTION_SCHEMA_V4 = {
  name: 'holdfast_extraction_v4',
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
    required: ['person_name', 'met_on', 'facts', 'commitments', 'sentiment'],
    additionalProperties: false,
  },
};

type JsonSchemaSpec = { name: string; strict: boolean; schema: Record<string, unknown> };

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
  if (!OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY environment variable');
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('Extraction input:', JSON.stringify({ captureDate, transcript }, null, 2));
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: EXTRACTION_MODEL,
      temperature: 0,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: transcript },
      ],
      response_format: { type: 'json_schema', json_schema: schema },
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI extraction failed: ${res.status} ${await res.text()}`);
  }

  const body = await res.json();
  const content = body.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI extraction returned no content');
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
