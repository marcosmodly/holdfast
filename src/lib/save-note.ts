import { id } from '@instantdb/admin';
import { db } from '@/lib/instant-admin';
import { extract, formatExtractionSummary } from '@/lib/extract';
import { persistExtraction } from '@/lib/persist';
import { sendTelegramMessage } from '@/lib/telegram';

const NO_PERSON_REPLY = "Got that, but I couldn't tell who it was about. Mind sending it again with their name?";
const PERSIST_FAILED_REPLY = "Got that, but something went wrong saving it. Mind sending it again in a bit?";

// Everything that happens to a voice note once it has a transcript: save the
// text, delete the audio, extract, persist, and reply with what was saved.
// Shared by the Telegram webhook and the failed-audio cleanup, which passes
// `replyPrefix` so the user knows which note a late reply is about.
// `captureTime` is when the note was sent; relative dates resolve against it.
export async function saveTranscribedNote(
  chatId: number,
  storagePath: string,
  transcript: string,
  captureTime: number,
  replyPrefix?: string,
): Promise<void> {
  const reply = (text: string) =>
    sendTelegramMessage(chatId, replyPrefix == null ? text : `${replyPrefix}\n\n${text}`);

  const captureId = id();
  await db.transact(
    db.tx.captures[captureId].create({
      transcript,
      createdAt: captureTime,
      chatId: String(chatId),
    }),
  );

  // Non-negotiable: delete audio only after the transcript is persisted.
  await db.storage.delete(storagePath);

  let extraction: Awaited<ReturnType<typeof extract>>;
  try {
    const captureDate = new Date(captureTime).toISOString().slice(0, 10);
    extraction = await extract(transcript, captureDate);
  } catch (error) {
    // Extraction is best-effort for now — the user still gets their transcript.
    console.error('Extraction failed for capture', captureId, error);
    await reply(transcript);
    return;
  }

  // The reply must describe what actually landed in the database, not what
  // the model extracted — those two can diverge (see persistExtraction).
  const result = await persistExtraction(chatId, captureId, captureTime, extraction, transcript);
  switch (result.status) {
    case 'saved':
      await reply(formatExtractionSummary(extraction));
      break;
    case 'no_person':
      await reply(NO_PERSON_REPLY);
      break;
    case 'failed':
      await reply(PERSIST_FAILED_REPLY);
      break;
  }

  // TODO: remove this debug block before production — dumps the raw
  // transcript and extraction JSON to Telegram for prompt tuning.
  if (process.env.NODE_ENV === 'development') {
    await sendTelegramMessage(chatId, `TRANSCRIPT:\n${transcript}`);
    await sendTelegramMessage(
      chatId,
      `\`\`\`\n${JSON.stringify({ extraction, persist: result }, null, 2)}\n\`\`\``,
    );
  }
}
