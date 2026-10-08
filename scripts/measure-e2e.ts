// End-to-end pipeline timing for the portfolio case study: transcription
// (gpt-4o-mini-transcribe) -> extraction (gpt-4o-mini V4) -> in-code date
// resolution, run back-to-back the way the Telegram webhook does, 12 times.
// Excludes only the final InstantDB persist/schedule write (one transaction),
// which is not run here to avoid touching the production Instant app.
// Run: npx tsx --env-file=.env.local scripts/measure-e2e.ts <path-to-wav>
import { readFileSync } from 'node:fs';
import { EXTRACTION_PROMPT_V4, fillPromptTemplate } from '../src/lib/extraction-prompt';
import { EXTRACTION_SCHEMA_V4 } from '../src/lib/extract';
import { resolveFinalDate } from '../src/lib/resolve-date';

const KEY = process.env.OPENAI_API_KEY!;
const CAPTURE_DATE = '2026-08-21';
const wavPath = process.argv[2];
const audio = readFileSync(wavPath);

async function transcribe(): Promise<{ text: string; ms: number }> {
  const fd = new FormData();
  fd.append('file', new Blob([new Uint8Array(audio)], { type: 'audio/wav' }), 'voicenote.wav');
  fd.append('model', 'gpt-4o-mini-transcribe');
  const t0 = performance.now();
  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}` },
    body: fd,
  });
  const body = await res.json();
  const ms = performance.now() - t0;
  if (!res.ok) throw new Error(`transcribe ${res.status} ${JSON.stringify(body)}`);
  return { text: body.text, ms };
}

async function extract(transcript: string): Promise<{ ms: number; raw: any }> {
  const systemPrompt = fillPromptTemplate(EXTRACTION_PROMPT_V4, CAPTURE_DATE);
  const t0 = performance.now();
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: transcript },
      ],
      response_format: { type: 'json_schema', json_schema: EXTRACTION_SCHEMA_V4 },
    }),
  });
  const body = await res.json();
  const ms = performance.now() - t0;
  if (!res.ok) throw new Error(`extract ${res.status} ${JSON.stringify(body)}`);
  return { ms, raw: JSON.parse(body.choices[0].message.content) };
}

function pctl(xs: number[], p: number): number {
  const s = [...xs].sort((a, b) => a - b);
  const i = Math.ceil((p / 100) * s.length) - 1;
  return s[Math.max(0, Math.min(i, s.length - 1))];
}

async function main() {
  const N = 12;
  const e2e: number[] = [];
  const txs: number[] = [];
  const exs: number[] = [];
  for (let i = 0; i < N; i++) {
    const whole0 = performance.now();
    const t = await transcribe();
    const e = await extract(t.text);
    const r0 = performance.now();
    for (const f of e.raw.facts) resolveFinalDate(f, CAPTURE_DATE);
    for (const c of e.raw.commitments) resolveFinalDate(c, CAPTURE_DATE);
    const resolveMs = performance.now() - r0;
    const whole = performance.now() - whole0;
    e2e.push(whole);
    txs.push(t.ms);
    exs.push(e.ms);
    console.log(
      `#${String(i + 1).padStart(2)}  transcribe ${t.ms.toFixed(0).padStart(5)}ms  extract ${e.ms
        .toFixed(0)
        .padStart(5)}ms  resolve ${resolveMs.toFixed(2)}ms  => e2e ${whole.toFixed(0)}ms`,
    );
  }
  console.log(`\n=== n=${N}, audio clip = 14.5 s TTS voice note ===`);
  console.log(`transcription   p50 ${pctl(txs, 50).toFixed(0)}ms   worst ${Math.max(...txs).toFixed(0)}ms`);
  console.log(`extraction      p50 ${pctl(exs, 50).toFixed(0)}ms   worst ${Math.max(...exs).toFixed(0)}ms`);
  console.log(`end-to-end      p50 ${pctl(e2e, 50).toFixed(0)}ms   worst ${Math.max(...e2e).toFixed(0)}ms   (persist/schedule write excluded)`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
