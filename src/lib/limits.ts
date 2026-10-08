// Usage guardrails for voice capture. The webhook checks these BEFORE the
// audio is downloaded or transcribed, so a rejected note costs nothing.
// Pure functions, no db import, so tests run without env vars.

export const MAX_VOICE_SECONDS = 120;
export const MAX_NOTES_PER_WINDOW = 15;
export const NOTE_WINDOW_MS = 24 * 60 * 60 * 1000;

export const TOO_LONG_REPLY = `That one's over ${MAX_VOICE_SECONDS / 60} minutes, so I didn't save it. Mind sending a shorter one? Twenty seconds is plenty.`;
export const DAILY_LIMIT_REPLY = `That's ${MAX_NOTES_PER_WINDOW} voice notes in the last 24 hours, which is the limit for now. I didn't save this one. Try again a little later.`;

// `durationSeconds` is Telegram's voice.duration. When Telegram omits it,
// accept the note rather than guess.
export function isTooLong(durationSeconds: number | null | undefined): boolean {
  return durationSeconds != null && durationSeconds > MAX_VOICE_SECONDS;
}

// `notesInWindow` counts captures already saved for this chat in the last
// NOTE_WINDOW_MS, not including the note being checked.
export function isOverDailyLimit(notesInWindow: number): boolean {
  return notesInWindow >= MAX_NOTES_PER_WINDOW;
}
