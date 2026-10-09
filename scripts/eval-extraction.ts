// Runs the fixture set in tests/extraction-cases.md against every extraction
// prompt version and reports a pass/fail comparison. Calls the AI provider
// only (see src/lib/ai-provider.ts); never touches Instant, so it's safe to
// run against the real .env.local (see
// CLAUDE.md "Persistence": test scripts must never write to the production
// Instant app).
//
// V1-V3 return a resolved date directly (event_date/due_date); V4 returns a
// verbatim date_expression that resolve-date.ts resolves in code. Both are
// normalized into a common shape below, after running the exact same
// persist-layer logic production code applies (evidence check, framing
// strip, date resolution), so the comparison reflects what actually reaches
// the database, not just the raw model output.
//
// Run via `npm run eval:extraction` (loads .env.local via `tsx --env-file`).
// Production only uses V4, so `npm run eval:extraction -- --only=V4` is the
// check to run after switching provider.
import {
  EXTRACTION_PROMPT_V1,
  EXTRACTION_PROMPT_V2,
  EXTRACTION_PROMPT_V3,
  EXTRACTION_PROMPT_V4,
  fillPromptTemplate,
} from '../src/lib/extraction-prompt';
import {
  runExtraction,
  EXTRACTION_SCHEMA,
  EXTRACTION_SCHEMA_V3,
  EXTRACTION_SCHEMA_V4,
  type LegacyExtractionResult,
  type ExtractionResult,
} from '../src/lib/extract';
import {
  stripCommitmentFraming,
  commitmentEvidenceHolds,
  resolveCommitmentDueDate,
} from '../src/lib/persist';
import { resolveFinalDate } from '../src/lib/resolve-date';
import { getAiProvider } from '../src/lib/ai-provider';

const CAPTURE_DATE = '2026-08-21'; // Friday — matches tests/extraction-cases.md

interface NormalizedResult {
  person_name: string | null;
  facts: { event_date: string | null }[];
  commitments: { description: string; due_date: string | null }[];
}

function normalizeLegacy(raw: LegacyExtractionResult, transcript: string): NormalizedResult {
  return {
    person_name: raw.person_name,
    facts: raw.facts.map((f) => ({ event_date: f.event_date })),
    commitments: raw.commitments
      .filter((c) => commitmentEvidenceHolds(c.evidence, transcript).holds)
      .map((c) => ({ description: stripCommitmentFraming(c.description), due_date: c.due_date })),
  };
}

function normalizeV4(raw: ExtractionResult, transcript: string): NormalizedResult {
  return {
    person_name: raw.person_name,
    facts: raw.facts.map((f) => ({ event_date: resolveFinalDate(f, raw.met_on) })),
    commitments: raw.commitments
      .filter((c) => commitmentEvidenceHolds(c.evidence, transcript).holds)
      .map((c) => ({
        description: stripCommitmentFraming(c.description),
        due_date: resolveCommitmentDueDate(c, raw.met_on),
      })),
  };
}

function dateOnly(iso: string | null | undefined): string | null {
  return iso ? iso.slice(0, 10) : null;
}

function noCommitments(r: NormalizedResult): string | null {
  return r.commitments.length > 0
    ? `expected 0 commitments, got ${JSON.stringify(r.commitments)}`
    : null;
}

interface Case {
  id: number;
  name: string;
  transcript: string;
  grade: (result: NormalizedResult) => string | null;
}

const CASES: Case[] = [
  {
    id: 1,
    name: 'Bare weekday',
    transcript:
      "Grabbed lunch with Priya. Her presentation is on Thursday and she's nervous about it.",
    grade: (r) => {
      const nc = noCommitments(r);
      if (nc) return nc;
      const dated = r.facts.find((f) => f.event_date != null);
      if (!dated) return 'no fact carries a date';
      return dateOnly(dated.event_date) !== '2026-08-27'
        ? `expected 2026-08-27 (Thursday), got ${dateOnly(dated.event_date)}`
        : null;
    },
  },
  {
    id: 2,
    name: 'Weekday with time of day',
    transcript:
      "Talked to Mateo. Wednesday night he's having dinner with his brother to patch things up.",
    grade: (r) => {
      const nc = noCommitments(r);
      if (nc) return nc;
      const dated = r.facts.find((f) => f.event_date != null);
      if (!dated) return 'no fact carries a date';
      return dateOnly(dated.event_date) !== '2026-08-26'
        ? `expected 2026-08-26 (Wednesday), got ${dateOnly(dated.event_date)}`
        : null;
    },
  },
  {
    id: 3,
    name: 'Ordinal',
    transcript:
      "Caught up with Dana. Her apartment lease renewal is due the 14th and she's stressed about the rent increase.",
    grade: (r) => {
      const nc = noCommitments(r);
      if (nc) return nc;
      const dated = r.facts.find((f) => f.event_date != null);
      if (!dated) return 'no fact carries a date';
      return dateOnly(dated.event_date) !== '2026-09-14'
        ? `expected 2026-09-14 (forward-resolved 14th), got ${dateOnly(dated.event_date)}`
        : null;
    },
  },
  {
    id: 4,
    name: 'Relative date ("next week")',
    transcript: "Ran into Sam at the gym. I told him I'd send over the trainer's contact info next week.",
    grade: (r) => {
      if (r.commitments.length !== 1) return `expected 1 commitment, got ${r.commitments.length}`;
      const c = r.commitments[0];
      if (dateOnly(c.due_date) !== '2026-08-28')
        return `expected due_date 2026-08-28, got ${dateOnly(c.due_date)}`;
      // Naming the person is no longer the model's job (see
      // tests/extraction-cases.md, "As of V4"); the template names them. A
      // leftover pronoun is fine — only first-person framing is a failure.
      if (/^i'?\s*(said|d|will)/i.test(c.description))
        return `description still has first-person framing: "${c.description}"`;
      return null;
    },
  },
  {
    id: 5,
    name: 'No timeframe -> 3-day default',
    transcript:
      "Had coffee with Lena. She's planning a trip for her birthday. I told her I'd look into flight options for her.",
    grade: (r) => {
      if (r.commitments.length !== 1) return `expected 1 commitment, got ${r.commitments.length}`;
      const c = r.commitments[0];
      return dateOnly(c.due_date) !== '2026-08-24'
        ? `expected due_date 2026-08-24 (3-day default), got ${dateOnly(c.due_date)}`
        : null;
    },
  },
  {
    id: 6,
    name: 'Commitment by ME',
    transcript:
      "Caught up with Jordan. He's job hunting and pretty stressed about it. I said I'd send him the recruiter contact I mentioned.",
    grade: (r) => {
      if (r.commitments.length !== 1) return `expected 1 commitment, got ${r.commitments.length}`;
      const c = r.commitments[0];
      if (dateOnly(c.due_date) !== '2026-08-24')
        return `expected due_date 2026-08-24 (3-day default), got ${dateOnly(c.due_date)}`;
      if (/^i'?\s*(said|d|will)/i.test(c.description))
        return `description still has first-person framing: "${c.description}"`;
      return null;
    },
  },
  {
    id: 7,
    name: 'Commitment by THEM — must stay empty',
    transcript:
      "Talked to Marcus about the opening on my team. He said he'd send me his CV this weekend.",
    grade: noCommitments,
  },
  {
    id: 8,
    name: 'No name, only pronouns',
    transcript:
      "She's doing so much better lately. Told me she's finally sleeping through the night again after the move.",
    grade: (r) =>
      noCommitments(r) ??
      (r.person_name !== null ? `expected null person_name, got "${r.person_name}"` : null),
  },
  {
    id: 9,
    name: 'Two people in one capture',
    transcript: 'Had coffee with Elena this morning. She mentioned her brother Tom just got engaged.',
    grade: (r) =>
      noCommitments(r) ??
      (r.person_name !== 'Elena' ? `expected person_name "Elena", got "${r.person_name}"` : null),
  },
  {
    id: 10,
    name: 'Fact with no date at all',
    transcript: "Caught up with Owen. He mentioned he's really into rock climbing these days.",
    grade: (r) => {
      const nc = noCommitments(r);
      if (nc) return nc;
      const wronglyDated = r.facts.find((f) => f.event_date != null);
      return wronglyDated ? `fact got a date it shouldn't have: ${JSON.stringify(wronglyDated)}` : null;
    },
  },
  {
    id: 11,
    name: 'Stated but vague timeframe',
    transcript:
      "Caught up with Priya. Her presentation went great and she wants to celebrate properly. I told her I'd plan a dinner sometime after the holidays.",
    grade: (r) => {
      if (r.commitments.length !== 1) return `expected 1 commitment, got ${r.commitments.length}`;
      const due = dateOnly(r.commitments[0].due_date);
      // A timeframe WAS stated ("sometime after the holidays"), so due_date
      // must never silently collapse to the 3-day no-timeframe default
      // (2026-08-24). Under V4, resolve-date.ts doesn't recognize this
      // phrase, so null (honest "couldn't resolve it") is a pass; under
      // V1-V3, the model's own best-effort guess is a pass as long as it
      // isn't the default in disguise.
      if (due === '2026-08-24') return `due_date fell back to the 3-day default despite a stated timeframe`;
      return null;
    },
  },
  {
    id: 12,
    name: 'Likely-hallucinated commitment',
    transcript:
      "Grabbed a drink with Noah. He's overwhelmed moving into his new place next month. We talked about maybe getting a group together to help him carry boxes.",
    grade: noCommitments,
  },
];

interface PromptVersion {
  name: string;
  template: string;
  schema: typeof EXTRACTION_SCHEMA | typeof EXTRACTION_SCHEMA_V3 | typeof EXTRACTION_SCHEMA_V4;
  normalize: (raw: never, transcript: string) => NormalizedResult;
}

const VERSIONS: PromptVersion[] = [
  { name: 'V1', template: EXTRACTION_PROMPT_V1, schema: EXTRACTION_SCHEMA, normalize: normalizeLegacy as never },
  { name: 'V2', template: EXTRACTION_PROMPT_V2, schema: EXTRACTION_SCHEMA, normalize: normalizeLegacy as never },
  { name: 'V3', template: EXTRACTION_PROMPT_V3, schema: EXTRACTION_SCHEMA_V3, normalize: normalizeLegacy as never },
  { name: 'V4', template: EXTRACTION_PROMPT_V4, schema: EXTRACTION_SCHEMA_V4, normalize: normalizeV4 as never },
];

const TRIALS = 3;

// `--only=V4` runs a single prompt version instead of all of them.
const ONLY = process.argv.find((arg) => arg.startsWith('--only='))?.slice('--only='.length);

// Groq's free tier allows ~8K tokens a minute, about four extraction calls
// of ~1.6K tokens. Three a minute stays clear of it, so cases fail on the
// model's answer, not on a 429.
const PAUSE_BETWEEN_CALLS_MS = getAiProvider().name === 'groq' ? 20_000 : 0;

async function runOne(
  version: PromptVersion,
  testCase: Case,
): Promise<{ pass: boolean; note: string | null }> {
  const systemPrompt = fillPromptTemplate(version.template, CAPTURE_DATE);
  try {
    // Eval-only looseness: each version's raw shape differs (legacy vs V4),
    // and `normalize` above is paired correctly per version at declaration
    // time. Production code (extract.ts, persist.ts) stays strictly typed.
    const raw = await runExtraction<LegacyExtractionResult & ExtractionResult>(
      testCase.transcript,
      CAPTURE_DATE,
      systemPrompt,
      version.schema,
    );
    const normalized = version.normalize(raw as never, testCase.transcript);
    const note = testCase.grade(normalized);
    return { pass: note === null, note };
  } catch (error) {
    return { pass: false, note: `error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

async function main() {
  const provider = getAiProvider();
  const versions = ONLY ? VERSIONS.filter((v) => v.name === ONLY) : VERSIONS;
  if (versions.length === 0) {
    throw new Error(`Unknown prompt version "${ONLY}". Use one of: ${VERSIONS.map((v) => v.name).join(', ')}`);
  }
  console.log(`Provider: ${provider.displayName}, model: ${provider.extractionModel}`);

  const results: Record<string, string[][]> = {};
  for (const version of versions) {
    results[version.name] = CASES.map(() => []);
    for (let t = 0; t < TRIALS; t++) {
      for (let i = 0; i < CASES.length; i++) {
        const testCase = CASES[i];
        if (PAUSE_BETWEEN_CALLS_MS > 0) {
          await new Promise((resolve) => setTimeout(resolve, PAUSE_BETWEEN_CALLS_MS));
        }
        const result = await runOne(version, testCase);
        results[version.name][i].push(result.pass ? 'PASS' : 'FAIL');
        if (!result.pass) {
          console.log(`${version.name} trial ${t + 1} case ${testCase.id} FAIL — ${result.note}`);
        }
      }
      console.log(`${version.name} trial ${t + 1}/${TRIALS} done`);
    }
  }

  console.log('\n--- 3-trial results (P=pass F=fail per trial) ---');
  console.log('Case'.padEnd(38) + versions.map((v) => v.name.padEnd(10)).join(''));
  for (let i = 0; i < CASES.length; i++) {
    const row = versions.map((v) => results[v.name][i].map((r) => r[0]).join('').padEnd(10)).join('');
    console.log(`${String(CASES[i].id).padStart(2, '0')}. ${CASES[i].name}`.padEnd(38) + row);
  }

  for (const version of versions) {
    const totalPass = results[version.name].reduce(
      (sum, trials) => sum + trials.filter((r) => r === 'PASS').length,
      0,
    );
    console.log(`\n${version.name}: ${totalPass}/${CASES.length * TRIALS} trial-passes`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
