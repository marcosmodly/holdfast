import { id } from '@instantdb/admin';
import { db } from '@/lib/instant-admin';
import type { ExtractionResult, ExtractedCommitment } from '@/lib/extract';
import { resolveDateExpression, resolveFinalDate, addDaysIso } from '@/lib/resolve-date';

const NEW_PERSON_TIER = 'good';
const NEW_PERSON_CADENCE_DAYS = 45;
const NEW_PROFILE_PLAN = 'trial';
const NEW_COMMITMENT_STATUS = 'open';
const NO_TIMEFRAME_DEFAULT_DAYS = 3;

// A commitment's due date. resolved_date wins if the model set it (a full
// stated date). Otherwise: no date_expression at all means the speaker gave
// no timeframe, which is the ONLY case that gets the 3-day default; a
// stated-but-unresolvable expression stays null rather than silently
// collapsing to that default (extraction-prompt.ts V4 rule 6).
export function resolveCommitmentDueDate(
  commitment: ExtractedCommitment,
  captureDate: string,
): string | null {
  if (commitment.resolved_date != null) return commitment.resolved_date;
  if (commitment.date_expression == null) return addDaysIso(captureDate, NO_TIMEFRAME_DEFAULT_DAYS);
  return resolveDateExpression(commitment.date_expression, captureDate);
}

// Checked longest/most-specific first; extraction-prompt.ts rule 4 (V1) /
// rule 4 (V3) tells the model never to include these, but this is the
// backstop for when it does anyway.
const COMMITMENT_FRAMING_PREFIXES = ["i said i'd ", "i'd ", 'i will ', "i'm going to "];

// Strips a leading first-person prefix so `description` is a bare action.
// The nudge and reply templates already say "You said you'd ..."; a leftover
// prefix here would double it up ("You said you'd I'd send...").
export function stripCommitmentFraming(description: string): string {
  const trimmed = description.trim();
  const lower = trimmed.toLowerCase();
  const prefix = COMMITMENT_FRAMING_PREFIXES.find((p) => lower.startsWith(p));
  return prefix ? trimmed.slice(prefix.length).trimStart() : trimmed;
}

// A verbatim transcript substring proves the QUOTE is real. It doesn't prove
// the quote is a PROMISE — a model can (and does) cite a real, unrelated
// sentence as "evidence" for an invented commitment. These two checks catch
// that: the evidence must contain first-person volitional language, and must
// not contain hedging language that signals no commitment was actually made.
const VOLITIONAL_MARKERS = [
  "i'll",
  'i will',
  "i'd",
  "i said i'd",
  "i told him i'd",
  "i told her i'd",
  'i promised',
  "i'm going to",
  'let me',
];

const COMMITMENT_HEDGES = ['we talked about', 'maybe', 'might', 'thinking about', 'we should'];

function hasVolitionalMarker(evidence: string): boolean {
  const lower = evidence.toLowerCase();
  return VOLITIONAL_MARKERS.some((marker) => lower.includes(marker));
}

function hasHedge(evidence: string): boolean {
  const lower = evidence.toLowerCase();
  return COMMITMENT_HEDGES.some((hedge) => lower.includes(hedge));
}

export interface EvidenceCheck {
  holds: boolean;
  reason?: string;
}

// V3+ commitments carry `evidence`: the exact transcript substring the model
// claims proves the speaker made the promise. Older prompt versions don't
// set it, so its absence is not itself a failure. When present, it must (1)
// actually be in the transcript, (2) contain first-person volitional
// language, and (3) not contain hedging language — or the commitment is
// dropped rather than trusted on wording alone (extraction-prompt.ts rule 3
// is the highest-stakes rule in the product; this makes it enforceable in
// code, not just prompt text).
export function commitmentEvidenceHolds(
  evidence: string | undefined,
  transcript: string,
): EvidenceCheck {
  if (evidence == null) return { holds: true };
  if (!transcript.includes(evidence)) {
    return { holds: false, reason: 'evidence not found verbatim in transcript' };
  }
  if (!hasVolitionalMarker(evidence)) {
    return { holds: false, reason: 'evidence has no first-person volitional marker' };
  }
  if (hasHedge(evidence)) {
    return { holds: false, reason: 'evidence contains hedging language' };
  }
  return { holds: true };
}

interface ProfileLookup {
  id: string;
  isNew: boolean;
}

async function findOrCreateProfileId(telegramChatId: string): Promise<ProfileLookup> {
  const { profiles } = await db.query({
    profiles: { $: { where: { telegramChatId } } },
  });
  if (profiles.length > 0) {
    return { id: profiles[0].id, isNew: false };
  }
  return { id: id(), isNew: true };
}

async function findExistingPersonId(
  profileId: string,
  trimmedName: string,
): Promise<string | null> {
  const { people } = await db.query({
    people: {
      $: { where: { 'profile.id': profileId, name: { $ilike: trimmedName } } },
    },
  });
  return people.length > 0 ? people[0].id : null;
}

// What actually happened to an extraction on the way to the database. The
// Telegram reply must be built from this, never from the raw extraction,
// because "saved" is the only status where the extraction and the database
// agree.
export type PersistResult =
  | { status: 'no_person' }
  | { status: 'saved'; personName: string }
  | { status: 'failed'; error: unknown };

// Persists an extraction result: finds-or-creates the profile and person,
// then writes facts, commitments, and the capture/person link atomically.
// Never throws: a failed transaction is caught, logged in full with the
// capture id, and reported back as `{ status: 'failed' }` instead.
export async function persistExtraction(
  telegramChatId: number,
  captureId: string,
  captureTime: number,
  extraction: ExtractionResult,
  transcript: string,
): Promise<PersistResult> {
  const trimmedName = extraction.person_name?.trim();
  if (!trimmedName) {
    console.error('Extraction had no person_name; skipping persistence for capture', captureId);
    return { status: 'no_person' };
  }

  const chatIdStr = String(telegramChatId);
  const profile = await findOrCreateProfileId(chatIdStr);
  const existingPersonId = await findExistingPersonId(profile.id, trimmedName);
  const personId = existingPersonId ?? id();
  const isNewPerson = existingPersonId === null;

  const chunks = [];

  // Profile and person are independent existence checks. Conflating them
  // (e.g. gating both creates on `isNewPerson`) re-`create()`s an
  // already-existing profile whenever a returning user mentions someone
  // new, which InstantDB rejects as a whole-transaction validation error
  // ("Creating entities that exist") because `telegramChatId` is unique.
  if (profile.isNew) {
    chunks.push(
      db.tx.profiles[profile.id].create({
        telegramChatId: chatIdStr,
        plan: NEW_PROFILE_PLAN,
      }),
    );
  }

  if (isNewPerson) {
    chunks.push(
      db.tx.people[personId]
        .create({
          name: trimmedName,
          tier: NEW_PERSON_TIER,
          cadenceDays: NEW_PERSON_CADENCE_DAYS,
        })
        .link({ profile: profile.id }),
    );
  }

  chunks.push(
    db.tx.people[personId].update({ lastContactAt: captureTime }),
    db.tx.captures[captureId].link({ person: personId }),
  );

  for (const fact of extraction.facts) {
    const eventDate = resolveFinalDate(fact, extraction.met_on);
    chunks.push(
      db.tx.facts[id()]
        .create({
          type: fact.type,
          content: fact.content,
          confidence: fact.confidence,
          ...(eventDate ? { eventDate: new Date(eventDate).getTime() } : {}),
        })
        .link({ person: personId, capture: captureId }),
    );
  }

  for (const commitment of extraction.commitments) {
    const evidenceCheck = commitmentEvidenceHolds(commitment.evidence, transcript);
    if (!evidenceCheck.holds) {
      console.error(
        `Dropping commitment for capture ${captureId} (${evidenceCheck.reason}): ` +
          `description="${commitment.description}" evidence="${commitment.evidence}"`,
      );
      continue;
    }
    const dueDate = resolveCommitmentDueDate(commitment, extraction.met_on);
    chunks.push(
      db.tx.commitments[id()]
        .create({
          description: stripCommitmentFraming(commitment.description),
          status: NEW_COMMITMENT_STATUS,
          ...(dueDate ? { dueDate: new Date(dueDate).getTime() } : {}),
        })
        .link({ person: personId }),
    );
  }

  try {
    await db.transact(chunks);
  } catch (error) {
    console.error('Persistence failed for capture', captureId, error);
    return { status: 'failed', error };
  }

  return { status: 'saved', personName: trimmedName };
}
