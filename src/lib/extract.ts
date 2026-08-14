import { EXTRACTION_PROMPT_V1 } from '@/lib/extraction-prompt';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const EXTRACTION_MODEL = 'gpt-4o-mini';

export type FactType = 'life_event' | 'state' | 'detail';
export type Sentiment = 'worried' | 'happy' | 'neutral' | 'low';

export interface ExtractedFact {
  type: FactType;
  content: string;
  event_date: string | null;
  confidence: number;
}

export interface ExtractedCommitment {
  description: string;
  due_date: string;
}

export interface ExtractionResult {
  person_name: string | null;
  met_on: string;
  facts: ExtractedFact[];
  commitments: ExtractedCommitment[];
  sentiment: Sentiment;
}

const EXTRACTION_SCHEMA = {
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

// Runs structured extraction over a transcript. `captureDate` is an ISO 8601
// date (YYYY-MM-DD) that every relative date in the prompt resolves against.
export async function extract(
  transcript: string,
  captureDate: string,
): Promise<ExtractionResult> {
  if (!OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY environment variable');
  }

  const systemPrompt = EXTRACTION_PROMPT_V1.replace('{{CAPTURE_DATE}}', captureDate);

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
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: transcript },
      ],
      response_format: { type: 'json_schema', json_schema: EXTRACTION_SCHEMA },
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

  const result = JSON.parse(content) as ExtractionResult;
  // The capture date is known to us exactly; don't trust the model to echo it back.
  result.met_on = captureDate;

  if (process.env.NODE_ENV === 'development') {
    console.log('Extraction output:', JSON.stringify(result, null, 2));
  }

  return result;
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
  const factParts = extraction.facts.map((fact) =>
    fact.event_date ? `${fact.content} on ${formatDayOrdinal(fact.event_date)}` : fact.content,
  );
  const headline = factParts.length > 0 ? `${name} — ${factParts.join(', ')}.` : `${name}.`;

  if (extraction.commitments.length === 0) {
    return headline;
  }

  const commitmentParts = extraction.commitments.map((c) => c.description);
  return `${headline}\nYou said you'd ${commitmentParts.join(' and ')}.`;
}
