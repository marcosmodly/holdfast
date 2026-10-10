// Rules for voice notes left in storage after transcription failed twice.
// The webhook uploads each note under captures/ and deletes it once the
// transcript is saved, so anything still there is one of these. The daily
// cleanup (failed-audio-cleanup.ts) applies the rules below: try once more if
// it's worth it, then delete either way. /privacy promises deletion within 2
// days, so keep the two in sync.
// Pure functions, no db import, so tests run without env vars.

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export const CAPTURE_AUDIO_PREFIX = 'captures/';

// The webhook finishes with a note within seconds, so a file younger than
// this may still be in use. Leave it for the next day's run.
export const IN_FLIGHT_GRACE_MS = HOUR_MS;

// Older than this, a recovered note is too stale to be useful. Delete it
// without retrying.
export const MAX_RETRY_AGE_MS = 7 * DAY_MS;

// The upload time goes in the path because $files has no created-at field.
// The cleanup uses it to tell a file's age and to date a recovered note
// correctly.
export function captureAudioPath(chatId: number, messageId: number, uploadedAt: number): string {
  return `${CAPTURE_AUDIO_PREFIX}${chatId}/${messageId}-${uploadedAt}.ogg`;
}

export interface CaptureAudio {
  path: string;
  chatId: number;
  uploadedAt: number;
}

// Group chats have negative ids.
const CAPTURE_AUDIO_PATH = /^captures\/(-?\d+)\/\d+-(\d+)\.ogg$/;

// Returns null for anything not in captureAudioPath's format, including
// files saved before the upload time was added to the path.
export function parseCaptureAudioPath(path: string): CaptureAudio | null {
  const match = CAPTURE_AUDIO_PATH.exec(path);
  if (match == null) {
    return null;
  }
  return { path, chatId: Number(match[1]), uploadedAt: Number(match[2]) };
}

// True if the same chat has another failed note uploaded after this one.
export function hasNewerFailedNote(audio: CaptureAudio, all: CaptureAudio[]): boolean {
  const { chatId, uploadedAt } = audio;
  return all.some((other) => other.chatId === chatId && other.uploadedAt > uploadedAt);
}

export type FailedAudioAction = 'wait' | 'retry' | 'delete';

// `uploadedAt` is null when the path has no upload time.
// `userSentNewerNote` is true when the chat saved a note, or has another
// failed note, from after this one. The bot already asked them to try again,
// so recovering this one as well would likely save the same note twice.
export function chooseFailedAudioAction(
  uploadedAt: number | null,
  userSentNewerNote: boolean,
  now: number,
): FailedAudioAction {
  // Saved before upload times were in the path, so it's old, and a note
  // can't be recovered without knowing what day it was said.
  if (uploadedAt == null) return 'delete';

  const age = now - uploadedAt;
  if (age < IN_FLIGHT_GRACE_MS) return 'wait';
  if (age > MAX_RETRY_AGE_MS) return 'delete';
  if (userSentNewerNote) return 'delete';
  return 'retry';
}
