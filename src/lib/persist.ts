import { id } from '@instantdb/admin';
import { db } from '@/lib/instant-admin';
import type { ExtractionResult } from '@/lib/extract';

const NEW_PERSON_TIER = 'good';
const NEW_PERSON_CADENCE_DAYS = 45;
const NEW_PROFILE_PLAN = 'trial';
const NEW_COMMITMENT_STATUS = 'open';

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
    chunks.push(
      db.tx.facts[id()]
        .create({
          type: fact.type,
          content: fact.content,
          confidence: fact.confidence,
          ...(fact.event_date ? { eventDate: new Date(fact.event_date).getTime() } : {}),
        })
        .link({ person: personId, capture: captureId }),
    );
  }

  for (const commitment of extraction.commitments) {
    chunks.push(
      db.tx.commitments[id()]
        .create({
          description: commitment.description,
          dueDate: new Date(commitment.due_date).getTime(),
          status: NEW_COMMITMENT_STATUS,
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
