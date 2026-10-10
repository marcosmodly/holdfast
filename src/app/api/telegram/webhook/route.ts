import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/instant-admin';
import { transcribe } from '@/lib/transcribe';
import { saveTranscribedNote } from '@/lib/save-note';
import { captureAudioPath } from '@/lib/failed-audio';
import { handleNudgeReply } from '@/lib/nudge-reply';
import { sendTelegramMessage } from '@/lib/telegram';
import {
  DAILY_LIMIT_REPLY,
  NOTE_WINDOW_MS,
  TOO_LONG_REPLY,
  isOverDailyLimit,
  isTooLong,
} from '@/lib/limits';

const BOT_TOKEN = process.env.HOLDFAST_TELEGRAM_BOT_TOKEN;
const WEBHOOK_SECRET = process.env.HOLDFAST_TELEGRAM_WEBHOOK_SECRET;

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const TELEGRAM_FILE_API = `https://api.telegram.org/file/bot${BOT_TOKEN}`;

const NOT_A_VOICE_NOTE_REPLY = "Send a voice note and I'll remember it for you.";
const TRANSCRIPTION_FAILED_REPLY = "Couldn't catch that one. Mind trying again?";

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
  voice?: { file_id: string; duration?: number };
  text?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

async function countRecentCaptures(chatId: number, now: number): Promise<number> {
  const { captures } = await db.query({
    captures: {
      $: {
        where: { chatId: String(chatId), createdAt: { $gte: new Date(now - NOTE_WINDOW_MS) } },
      },
    },
  });
  return captures.length;
}

async function handleVoiceMessage(
  chatId: number,
  messageId: number,
  fileId: string,
  durationSeconds: number | undefined,
): Promise<void> {
  // Guardrails run before any download or AI call, so a rejected note
  // costs nothing. The length check needs no query, so it goes first.
  if (isTooLong(durationSeconds)) {
    await sendTelegramMessage(chatId, TOO_LONG_REPLY);
    return;
  }
  if (isOverDailyLimit(await countRecentCaptures(chatId, Date.now()))) {
    await sendTelegramMessage(chatId, DAILY_LIMIT_REPLY);
    return;
  }

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

  const storagePath = captureAudioPath(chatId, messageId, Date.now());
  await db.storage.uploadFile(storagePath, audioBuffer, {
    contentType: 'audio/ogg',
  });

  let transcript: string;
  try {
    transcript = await transcribeWithRetry(storagePath);
  } catch (error) {
    // Leave the audio in storage. The daily failed-audio cron
    // (lib/failed-audio-cleanup.ts) tries once more, then deletes it.
    console.error('Transcription failed twice:', error);
    await sendTelegramMessage(chatId, TRANSCRIPTION_FAILED_REPLY);
    return;
  }

  await saveTranscribedNote(chatId, storagePath, transcript, Date.now());
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
        await handleVoiceMessage(
          chatId,
          message.message_id,
          message.voice.file_id,
          message.voice.duration,
        );
      } else if (message.text) {
        await sendTelegramMessage(chatId, await handleNudgeReply(chatId, message.text));
      } else {
        await sendTelegramMessage(chatId, NOT_A_VOICE_NOTE_REPLY);
      }
    }
  } catch (error) {
    console.error('Telegram webhook error:', error);
  }

  return NextResponse.json({ ok: true });
}
