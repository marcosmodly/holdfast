import { id } from '@instantdb/admin';
import { db } from '@/lib/instant-admin';
import { sendTelegramMessage } from '@/lib/telegram';

const MAX_NUDGES_PER_WINDOW = 3;
const ROLLING_WINDOW_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type NudgeKind = 'commitment' | 'event' | 'drift';

interface Candidate {
  kind: NudgeKind;
  priority: 1 | 2 | 3;
  ageDays: number;
  personId: string;
  commitmentId?: string;
  message: string;
}

export interface NudgeSendResult {
  profileId: string;
  personId: string;
  kind: NudgeKind;
  priority: number;
  message: string;
}

function startOfUTCDay(ms: number): number {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function daysBetween(laterMs: number, earlierMs: number): number {
  return Math.round((laterMs - earlierMs) / MS_PER_DAY);
}

// Renders a day count as a rough week phrase, e.g. 90 -> "13 weeks".
function formatWeeks(days: number): string {
  const weeks = Math.max(1, Math.round(days / 7));
  return weeks === 1 ? '1 week' : `${weeks} weeks`;
}

interface PersonWithRelations {
  id: string;
  name: string;
  cadenceDays: number;
  lastContactAt?: string | number | null;
  commitments: {
    id: string;
    description: string;
    status: string;
    dueDate?: string | number | null;
    nudges: { actedOn: boolean }[];
  }[];
  facts: { content: string; eventDate?: string | number | null }[];
}

function buildCandidatesForPerson(
  person: PersonWithRelations,
  today: number,
  yesterday: number,
): Candidate[] {
  const candidates: Candidate[] = [];

  for (const commitment of person.commitments) {
    // Only 'open' commitments are candidates — a reply of "done" or "no"
    // (nudge-reply.ts) sets status to 'done' or 'dropped', and both are
    // excluded here same as any other non-'open' status.
    if (commitment.status !== 'open' || commitment.dueDate == null) continue;
    // Already nudged and not yet acted on: don't re-candidate it every day
    // until the reply (or a "not yet" snooze) resolves it, or it would
    // nudge daily until the 3-per-week cap happened to absorb it.
    if (commitment.nudges.some((n) => !n.actedOn)) continue;
    const dueDate = Number(commitment.dueDate);
    if (dueDate < today) {
      candidates.push({
        kind: 'commitment',
        priority: 1,
        ageDays: daysBetween(today, dueDate),
        personId: person.id,
        commitmentId: commitment.id,
        message: `${person.name}: you said you'd ${commitment.description}. Still worth doing?`,
      });
    }
  }

  for (const fact of person.facts) {
    if (fact.eventDate == null) continue;
    const eventDate = Number(fact.eventDate);
    if (startOfUTCDay(eventDate) === yesterday) {
      candidates.push({
        kind: 'event',
        priority: 2,
        ageDays: daysBetween(today, eventDate),
        personId: person.id,
        message: `${person.name}'s ${fact.content} yesterday. Ask how it went?`,
      });
    }
  }

  if (person.lastContactAt != null) {
    const daysSinceContact = daysBetween(today, startOfUTCDay(Number(person.lastContactAt)));
    if (daysSinceContact > person.cadenceDays) {
      candidates.push({
        kind: 'drift',
        priority: 3,
        ageDays: daysSinceContact,
        personId: person.id,
        message: `You and ${person.name} haven't spoken in ${formatWeeks(daysSinceContact)}.`,
      });
    }
  }

  return candidates;
}

async function countRecentNudges(profileId: string, windowStart: number): Promise<number> {
  const { nudges } = await db.query({
    nudges: {
      $: { where: { 'person.profile.id': profileId, sentAt: { $gte: new Date(windowStart) } } },
    },
  });
  return nudges.length;
}

async function processProfile(
  profile: { id: string; telegramChatId?: string },
  now: number,
): Promise<NudgeSendResult[]> {
  if (!profile.telegramChatId) {
    return [];
  }

  const today = startOfUTCDay(now);
  const yesterday = today - MS_PER_DAY;
  const windowStart = now - ROLLING_WINDOW_DAYS * MS_PER_DAY;

  const { people } = await db.query({
    people: {
      $: { where: { 'profile.id': profile.id } },
      commitments: { nudges: {} },
      facts: {},
    },
  });

  const candidates = (people as PersonWithRelations[]).flatMap((person) =>
    buildCandidatesForPerson(person, today, yesterday),
  );
  candidates.sort((a, b) => a.priority - b.priority || b.ageDays - a.ageDays);

  const alreadySent = await countRecentNudges(profile.id, windowStart);
  const remaining = Math.max(0, MAX_NUDGES_PER_WINDOW - alreadySent);
  const toSend = candidates.slice(0, remaining);
  // Candidates beyond `toSend` are silently dropped: no row, no queue, no retry.

  const results: NudgeSendResult[] = [];
  const chatId = Number(profile.telegramChatId);

  for (const candidate of toSend) {
    try {
      await sendTelegramMessage(chatId, candidate.message);
    } catch (error) {
      console.error(`Failed to send ${candidate.kind} nudge for person ${candidate.personId}:`, error);
      continue;
    }

    await db.transact(
      db.tx.nudges[id()]
        .create({
          kind: candidate.kind,
          priority: candidate.priority,
          scheduledFor: now,
          sentAt: now,
          actedOn: false,
        })
        .link({
          person: candidate.personId,
          ...(candidate.commitmentId ? { commitment: candidate.commitmentId } : {}),
        }),
    );

    results.push({
      profileId: profile.id,
      personId: candidate.personId,
      kind: candidate.kind,
      priority: candidate.priority,
      message: candidate.message,
    });
  }

  return results;
}

// Evaluates every profile's candidates and sends up to 3 nudges per profile
// per rolling 7-day window. Safe to call repeatedly: a second run on the same
// day sends nothing further because the window is already spent.
export async function runNudgeEngine(now: number = Date.now()): Promise<NudgeSendResult[]> {
  const { profiles } = await db.query({ profiles: {} });

  const results: NudgeSendResult[] = [];
  for (const profile of profiles) {
    try {
      results.push(...(await processProfile(profile, now)));
    } catch (error) {
      console.error(`Nudge processing failed for profile ${profile.id}:`, error);
    }
  }
  return results;
}
