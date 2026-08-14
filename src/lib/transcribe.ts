import { db } from '@/lib/instant-admin';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const TRANSCRIBE_MODEL = 'gpt-4o-mini-transcribe';

async function downloadAudio(path: string): Promise<Buffer> {
  const result = await db.query({ $files: { $: { where: { path } } } });
  const file = result.$files[0];
  if (!file) {
    throw new Error(`No file found in storage at path: ${path}`);
  }

  const res = await fetch(file.url);
  if (!res.ok) {
    throw new Error(`Failed to download audio from storage: ${res.status}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

// Downloads the audio at `path` from Instant storage and transcribes it via
// OpenAI. Does not delete the file — callers own the delete-after-persist step.
export async function transcribe(path: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY environment variable');
  }

  const audio = await downloadAudio(path);

  const formData = new FormData();
  formData.append(
    'file',
    new Blob([new Uint8Array(audio)], { type: 'audio/ogg' }),
    path.split('/').pop() ?? 'audio.ogg',
  );
  formData.append('model', TRANSCRIBE_MODEL);

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`OpenAI transcription failed: ${res.status} ${await res.text()}`);
  }

  const result = (await res.json()) as { text: string };
  return result.text;
}
