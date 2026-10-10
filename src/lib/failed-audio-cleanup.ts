import { db } from '@/lib/instant-admin';
import { transcribe } from '@/lib/transcribe';
import { saveTranscribedNote } from '@/lib/save-note';
import {
  CAPTURE_AUDIO_PREFIX,
  chooseFailedAudioAction,
  hasNewerFailedNote,
  parseCaptureAudioPath,
  type CaptureAudio,
  type FailedAudioAction,
} from '@/lib/failed-audio';

// Goes above the usual reply. A retry runs up to a day after the note was
// sent, so the user needs telling which note this is.
const RECOVERED_REPLY_PREFIX = "That voice note I couldn't catch earlier went through on a second try.";

export interface FailedAudioReport {
  path: string;
  action: FailedAudioAction;
  // 'planned' on a dry run. A retry that fails again ends as 'deleted'.
  outcome: 'planned' | 'waiting' | 'recovered' | 'deleted' | 'error';
}

interface Plan {
  path: string;
  audio: CaptureAudio | null;
  action: FailedAudioAction;
}

async function hasSavedNoteSince(audio: CaptureAudio): Promise<boolean> {
  const { captures } = await db.query({
    captures: {
      $: {
        where: { chatId: String(audio.chatId), createdAt: { $gt: new Date(audio.uploadedAt) } },
      },
    },
  });
  return captures.length > 0;
}

async function makePlan(path: string, all: CaptureAudio[], now: number): Promise<Plan> {
  const audio = parseCaptureAudioPath(path);
  const userSentNewerNote =
    audio != null && (hasNewerFailedNote(audio, all) || (await hasSavedNoteSince(audio)));
  const action = chooseFailedAudioAction(audio == null ? null : audio.uploadedAt, userSentNewerNote, now);
  return { path, audio, action };
}

// One more transcription attempt. On success the note goes through the same
// steps as in the webhook, which delete the audio once the text is saved.
async function retry(audio: CaptureAudio): Promise<boolean> {
  let transcript: string;
  try {
    transcript = await transcribe(audio.path);
  } catch (error) {
    console.error('Failed audio retry: transcription failed again', audio.path, error);
    return false;
  }

  try {
    await saveTranscribedNote(audio.chatId, audio.path, transcript, audio.uploadedAt, RECOVERED_REPLY_PREFIX);
    return true;
  } catch (error) {
    console.error('Failed audio retry: transcribed, but saving failed', audio.path, error);
    return false;
  }
}

// saveTranscribedNote may already have deleted the file before it failed,
// so check first.
async function deleteIfPresent(path: string): Promise<void> {
  const { $files } = await db.query({ $files: { $: { where: { path } } } });
  if ($files.length > 0) {
    await db.storage.delete(path);
  }
}

async function carryOut(plan: Plan): Promise<FailedAudioReport['outcome']> {
  if (plan.action === 'wait') {
    return 'waiting';
  }
  if (plan.action === 'retry' && plan.audio != null) {
    const recovered = await retry(plan.audio);
    if (recovered) {
      return 'recovered';
    }
  }
  await deleteIfPresent(plan.path);
  return 'deleted';
}

// Every recording under captures/ is one whose transcription failed twice
// (see lib/failed-audio.ts for the rules). Anything older than the in-flight
// grace period is retried at most once and is gone when this returns, unless
// deleting it errors, which is logged and reported. With `dryRun`, nothing is
// retried or deleted: the report just says what would happen.
export async function cleanUpFailedAudio(now: number, dryRun: boolean): Promise<FailedAudioReport[]> {
  const { $files } = await db.query({
    $files: { $: { where: { path: { $like: `${CAPTURE_AUDIO_PREFIX}%` } } } },
  });
  const paths = $files.map((file) => file.path);
  const all = paths
    .map((path) => parseCaptureAudioPath(path))
    .filter((audio): audio is CaptureAudio => audio != null);

  const plans: Plan[] = [];
  for (const path of paths) {
    plans.push(await makePlan(path, all, now));
  }

  const reports: FailedAudioReport[] = [];
  for (const plan of plans) {
    let outcome: FailedAudioReport['outcome'] = 'planned';
    if (!dryRun) {
      try {
        outcome = await carryOut(plan);
      } catch (error) {
        console.error('Failed audio cleanup error for', plan.path, error);
        outcome = 'error';
      }
    }
    reports.push({ path: plan.path, action: plan.action, outcome });
  }
  return reports;
}
