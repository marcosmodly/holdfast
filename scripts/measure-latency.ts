// One-off measurement harness for the portfolio case study. Runs the real
// V4 extraction path (same model, same prompt, same schema, temperature 0 as
// production) over the 12 fixture transcripts, twice, and reports per-call
// wall time + token usage + cost. Also times the pure-code date resolver.
// OpenAI only — never touches Instant. Run: npx tsx --env-file=.env.local scripts/measure-latency.ts
import { EXTRACTION_PROMPT_V4, fillPromptTemplate } from '../src/lib/extraction-prompt';
import { EXTRACTION_SCHEMA_V4 } from '../src/lib/extract';
import { resolveDateExpression } from '../src/lib/resolve-date';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const MODEL = 'gpt-4o-mini';
const CAPTURE_DATE = '2026-08-21';

// gpt-4o-mini list price (USD per 1M tokens) — stated here so the cost math
// is checkable against OpenAI's pricing page.
const PRICE_IN_PER_M = 0.15;
const PRICE_OUT_PER_M = 0.60;

const TRANSCRIPTS: string[] = [
  "Grabbed lunch with Priya. Her presentation is on Thursday and she's nervous about it.",
  "Talked to Mateo. Wednesday night he's having dinner with his brother to patch things up.",
  "Caught up with Dana. Her apartment lease renewal is due the 14th and she's stressed about the rent increase.",
  "Ran into Sam at the gym. I told him I'd send over the trainer's contact info next week.",
  "Had coffee with Lena. She's planning a trip for her birthday. I told her I'd look into flight options for her.",
  "Caught up with Jordan. He's job hunting and pretty stressed about it. I said I'd send him the recruiter contact I mentioned.",
  "Talked to Marcus about the opening on my team. He said he'd send me his CV this weekend.",
  "She's doing so much better lately. Told me she's finally sleeping through the night again after the move.",
  "Had coffee with Elena this morning. She mentioned her brother Tom just got engaged.",
  "Caught up with Owen. He mentioned he's really into rock climbing these days.",
  "Caught up with Priya. Her presentation went great and she wants to celebrate properly. I told her I'd plan a dinner sometime after the holidays.",
  "Grabbed a drink with Noah. He's overwhelmed moving into his new place next month. We talked about maybe getting a group together to help him carry boxes.",
];

interface Sample {
  ms: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
}

async function oneExtraction(transcript: string): Promise<Sample> {
  const systemPrompt = fillPromptTemplate(EXTRACTION_PROMPT_V4, CAPTURE_DATE);
  const t0 = performance.now();
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
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
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(body)}`);
  const u = body.usage;
  const costUsd =
    (u.prompt_tokens / 1e6) * PRICE_IN_PER_M + (u.completion_tokens / 1e6) * PRICE_OUT_PER_M;
  return {
    ms,
    promptTokens: u.prompt_tokens,
    completionTokens: u.completion_tokens,
    totalTokens: u.total_tokens,
    costUsd,
  };
}

function pct(sorted: number[], p: number): number {
  const i = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(i, sorted.length - 1))];
}

async function main() {
  const samples: Sample[] = [];
  const ROUNDS = 2;
  for (let r = 0; r < ROUNDS; r++) {
    for (let i = 0; i < TRANSCRIPTS.length; i++) {
      const s = await oneExtraction(TRANSCRIPTS[i]);
      samples.push(s);
      console.log(
        `round ${r + 1} #${String(i + 1).padStart(2)}  ${s.ms.toFixed(0).padStart(5)} ms   ` +
          `in ${s.promptTokens}  out ${s.completionTokens}  tot ${s.totalTokens}  $${s.costUsd.toFixed(6)}`,
      );
    }
  }

  const times = samples.map((s) => s.ms).sort((a, b) => a - b);
  const totalToks = samples.map((s) => s.totalTokens).sort((a, b) => a - b);
  const costs = samples.map((s) => s.costUsd).sort((a, b) => a - b);
  const promptToks = samples.map((s) => s.promptTokens);
  const compToks = samples.map((s) => s.completionTokens).sort((a, b) => a - b);
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const mean = (a: number[]) => sum(a) / a.length;

  console.log('\n=== EXTRACTION (gpt-4o-mini, temp 0, json_schema V4) — n = ' + samples.length + ' ===');
  console.log(`wall time   p50 ${pct(times, 50).toFixed(0)} ms   p95 ${pct(times, 95).toFixed(0)} ms   min ${times[0].toFixed(0)} ms   max ${times[times.length - 1].toFixed(0)} ms   mean ${mean(times).toFixed(0)} ms`);
  console.log(`prompt tok  constant ${promptToks[0]}  (system prompt dominates; range ${Math.min(...promptToks)}–${Math.max(...promptToks)})`);
  console.log(`output tok  p50 ${pct(compToks, 50)}   min ${compToks[0]}   max ${compToks[compToks.length - 1]}   mean ${mean(compToks).toFixed(0)}`);
  console.log(`total tok   p50 ${pct(totalToks, 50)}   min ${totalToks[0]}   max ${totalToks[totalToks.length - 1]}   mean ${mean(totalToks).toFixed(0)}`);
  console.log(`cost/call   p50 $${pct(costs, 50).toFixed(6)}   max $${costs[costs.length - 1].toFixed(6)}   mean $${mean(costs).toFixed(6)}`);
  console.log(`            => ~$${(mean(costs) * 1000).toFixed(3)} per 1,000 captures`);

  // Pure-code date resolver timing (no network). Resolve a representative
  // spread of expressions many times and report per-call microseconds.
  const exprs = ['Thursday', 'Wednesday night', 'the 14th', 'next week', 'this weekend', 'tomorrow', null, 'sometime after the holidays'];
  const ITER = 200000;
  const d0 = performance.now();
  for (let i = 0; i < ITER; i++) resolveDateExpression(exprs[i % exprs.length], CAPTURE_DATE);
  const dms = performance.now() - d0;
  console.log(`\n=== DATE RESOLVER (pure TS, no API) ===`);
  console.log(`${ITER} resolutions in ${dms.toFixed(1)} ms  =>  ${((dms / ITER) * 1000).toFixed(2)} µs/call`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
