import { id } from '@instantdb/admin';
import { db } from '@/lib/instant-admin';
import type { ExtractionResult } from '@/lib/extract';

const NEW_PERSON_TIER = 'good';
const NEW_PERSON_CADENCE_DAYS = 45;
const NEW_PROFILE_PLAN = 'trial';
const NEW_COMMITMENT_STATUS = 'open';

async function findOrCreateProfileId(telegramChatId: string): Promise<string> {
  const { profiles } = await db.query({
    profiles: { $: { where: { telegramChatId } } },
  });
  if (profiles.length > 0) {
    return profiles[0].id;
  }
  return id();
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

// Persists an extraction result: finds-or-creates the profile and person,
// then writes facts, commitments, and the capture/person link atomically.
// No-ops (beyond profile lookup) if the extraction didn't name a person.
export async function persistExtraction(
  telegramChatId: number,
  captureId: string,
  captureTime: number,
  extraction: ExtractionResult,
): Promise<void> {
  const trimmedName = extraction.person_name?.trim();
  if (!trimmedName) {
    console.error('Extraction had no person_name; skipping persistence for capture', captureId);
    return;
  }

  const chatIdStr = String(telegramChatId);
  const profileId = await findOrCreateProfileId(chatIdStr);
  const existingPersonId = await findExistingPersonId(profileId, trimmedName);
  const personId = existingPersonId ?? id();

  const chunks = [];

  if (existingPersonId === null) {
    chunks.push(
      db.tx.profiles[profileId].create({
        telegramChatId: chatIdStr,
        plan: NEW_PROFILE_PLAN,
      }),
      db.tx.people[personId]
        .create({
          name: trimmedName,
          tier: NEW_PERSON_TIER,
          cadenceDays: NEW_PERSON_CADENCE_DAYS,
        })
        .link({ profile: profileId }),
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

  await db.transact(chunks);
}
