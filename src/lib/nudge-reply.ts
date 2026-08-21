import { db } from '@/lib/instant-admin';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const SNOOZE_DAYS = 3;
const DONE_STATUS = 'done';
const DROPPED_STATUS = 'dropped';

// Small closed set of intents a nudge reply can carry. Matched in code, not
// by the model (see CLAUDE.md "Where work belongs") — word-boundary regexes
// so "no" doesn't false-positive inside "not sure", and multi-word phrases
// like "not yet" are checked as phrases.
//
// The nudge asks "Still worth doing?", so "yes" and "no" answer THAT
// question, not "is it done": "yes" means still worth doing (snooze), "no"
// means not worth doing (drop it).
const DONE_PATTERNS = [/\bdone\b/i, /\bdid it\b/i, /\bsent it\b/i, /\balready did\b/i];
const SNOOZE_PATTERNS = [/\bnot yet\b/i, /\blater\b/i, /\bskip\b/i, /\byes\b/i, /\bstill\b/i];
const DROPPED_PATTERNS = [/\bno\b/i, /\bdrop it\b/i, /\bnever mind\b/i, /\bforget it\b/i];

type ReplyIntent = 'done' | 'snooze' | 'dropped' | 'unknown';

function classifyReply(text: string): ReplyIntent {
  const trimmed = text.trim();
  if (DONE_PATTERNS.some((pattern) => pattern.test(trimmed))) return 'done';
  if (SNOOZE_PATTERNS.some((pattern) => pattern.test(trimmed))) return 'snooze';
  if (DROPPED_PATTERNS.some((pattern) => pattern.test(trimmed))) return 'dropped';
  return 'unknown';
}

const HELP_REPLY = 'Say "done" if you took care of it, or send a voice note to log something new.';
const UPDATE_FAILED_REPLY = "Got that, but something went wrong updating it. Mind trying again?";

interface UnactedCommitmentNudge {
  nudgeId: string;
  commitmentId: string;
  personName: string;
}

// Only commitment-kind nudges ask "Still worth doing?" — event and drift
// nudges ask something else and have no commitment to mark done or snooze,
// so a reply can only be "about" the most recent unacted commitment nudge.
async function findMostRecentUnactedCommitmentNudge(
  telegramChatId: string,
): Promise<UnactedCommitmentNudge | null> {
  const { nudges } = await db.query({
    nudges: {
      $: {
        where: {
          'person.profile.telegramChatId': telegramChatId,
          actedOn: false,
          kind: 'commitment',
        },
      },
      commitment: {},
      person: {},
    },
  });

  const withCommitment = nudges.filter((n) => n.commitment != null && n.person != null);
  if (withCommitment.length === 0) return null;

  const mostRecent = withCommitment.reduce((latest, n) =>
    Number(n.sentAt) > Number(latest.sentAt) ? n : latest,
  );

  return {
    nudgeId: mostRecent.id,
    commitmentId: mostRecent.commitment!.id,
    personName: mostRecent.person!.name,
  };
}

// Handles a plain-text reply to a nudge. Never calls the model — this is a
// small closed set of intents referring to whatever nudge is still
// outstanding, and belongs in code (CLAUDE.md "Where work belongs"). Never
// throws: any failure is caught and reported back as a plain-language
// fallback reply, matching persist.ts's "never leave the user silent"
// pattern.
export async function handleNudgeReply(telegramChatId: number, text: string): Promise<string> {
  try {
    const target = await findMostRecentUnactedCommitmentNudge(String(telegramChatId));
    if (!target) return HELP_REPLY;

    const intent = classifyReply(text);
    if (intent === 'unknown') return HELP_REPLY;

    if (intent === 'done') {
      await db.transact([
        db.tx.commitments[target.commitmentId].update({ status: DONE_STATUS }),
        db.tx.nudges[target.nudgeId].update({ actedOn: true }),
      ]);
      return `Marked it done for ${target.personName}.`;
    }

    if (intent === 'dropped') {
      await db.transact([
        db.tx.commitments[target.commitmentId].update({ status: DROPPED_STATUS }),
        db.tx.nudges[target.nudgeId].update({ actedOn: true }),
      ]);
      return "Dropped it. Won't mention it again.";
    }

    // snooze: acted on so it stops repeating tomorrow, but pushed forward
    // from NOW (not from the old, already-past due date) so it resurfaces
    // in a few days instead of immediately becoming overdue again.
    await db.transact([
      db.tx.commitments[target.commitmentId].update({ dueDate: Date.now() + SNOOZE_DAYS * MS_PER_DAY }),
      db.tx.nudges[target.nudgeId].update({ actedOn: true }),
    ]);
    return "Okay, I'll bring it up again in a few days.";
  } catch (error) {
    console.error('Nudge reply handling failed for chat', telegramChatId, error);
    return UPDATE_FAILED_REPLY;
  }
}
