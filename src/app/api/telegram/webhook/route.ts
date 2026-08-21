import { NextRequest, NextResponse } from 'next/server';
import { id } from '@instantdb/admin';
import { db } from '@/lib/instant-admin';
import { transcribe } from '@/lib/transcribe';
import { extract, formatExtractionSummary } from '@/lib/extract';
import { persistExtraction } from '@/lib/persist';
import { sendTelegramMessage } from '@/lib/telegram';

const BOT_TOKEN = process.env.HOLDFAST_TELEGRAM_BOT_TOKEN;
const WEBHOOK_SECRET = process.env.HOLDFAST_TELEGRAM_WEBHOOK_SECRET;

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const TELEGRAM_FILE_API = `https://api.telegram.org/file/bot${BOT_TOKEN}`;

const NOT_A_VOICE_NOTE_REPLY = "Send a voice note and I'll remember it for you.";
const TRANSCRIPTION_FAILED_REPLY = "Couldn't catch that one. Mind trying again?";
const NO_PERSON_REPLY = "Got that, but I couldn't tell who it was about. Mind sending it again with their name?";
const PERSIST_FAILED_REPLY = "Got that, but something went wrong saving it. Mind sending it again in a bit?";

const RETRY_BACKOFF_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function transcribeWithRetry(path: string): Promise<string> {
  try {
    return await transcribe(path);
  } catch (error) {
    console.error('Transcription attempt 1 failed:', error);
    await sleep(RETRY_BACKOFF_MS);
    return transcribe(path);
  }
}

interface TelegramMessage {
  message_id: number;
  chat: { id: number };
  voice?: { file_id: string };
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

async function handleVoiceMessage(
  chatId: number,
  messageId: number,
  fileId: string,
): Promise<void> {
  const fileInfoRes = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`);
  const fileInfo = await fileInfoRes.json();
  if (!fileInfoRes.ok || !fileInfo.ok) {
    throw new Error(`getFile failed: ${JSON.stringify(fileInfo)}`);
  }

  const filePath = fileInfo.result.file_path;
  const audioRes = await fetch(`${TELEGRAM_FILE_API}/${filePath}`);
  if (!audioRes.ok) {
    throw new Error(`file download failed: ${audioRes.status}`);
  }
  const audioBuffer = Buffer.from(await audioRes.arrayBuffer());

  const storagePath = `captures/${chatId}/${messageId}.ogg`;
  await db.storage.uploadFile(storagePath, audioBuffer, {
    contentType: 'audio/ogg',
  });

  let transcript: string;
  try {
    transcript = await transcribeWithRetry(storagePath);
  } catch (error) {
    // Keep the audio so the user (or a retry) can still recover it.
    console.error('Transcription failed twice:', error);
    await sendTelegramMessage(chatId, TRANSCRIPTION_FAILED_REPLY);
    return;
  }

  const captureId = id();
  const captureTime = Date.now();
  await db.transact(
    db.tx.captures[captureId].create({ transcript, createdAt: captureTime }),
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
    await sendTelegramMessage(chatId, transcript);
    return;
  }

  // The reply must describe what actually landed in the database, not what
  // the model extracted — those two can diverge (see persistExtraction).
  const result = await persistExtraction(chatId, captureId, captureTime, extraction);
  switch (result.status) {
    case 'saved':
      await sendTelegramMessage(chatId, formatExtractionSummary(extraction));
      break;
    case 'no_person':
      await sendTelegramMessage(chatId, NO_PERSON_REPLY);
      break;
    case 'failed':
      await sendTelegramMessage(chatId, PERSIST_FAILED_REPLY);
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

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-telegram-bot-api-secret-token');
  if (secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const update = (await request.json()) as TelegramUpdate;

    if (process.env.NODE_ENV === 'development') {
      console.log('Telegram update:', JSON.stringify(update, null, 2));
    }

    const message = update.message;
    const chatId = message?.chat.id;

    if (message && chatId !== undefined) {
      if (message.voice) {
        await handleVoiceMessage(chatId, message.message_id, message.voice.file_id);
      } else {
        await sendTelegramMessage(chatId, NOT_A_VOICE_NOTE_REPLY);
      }
    }
  } catch (error) {
    console.error('Telegram webhook error:', error);
  }

  return NextResponse.json({ ok: true });
}
