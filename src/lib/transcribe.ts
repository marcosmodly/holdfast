import { db } from '@/lib/instant-admin';
import { getAiProvider } from '@/lib/ai-provider';

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
// the configured AI provider (see ai-provider.ts). Does not delete the file —
// callers own the delete-after-persist step.
export async function transcribe(path: string): Promise<string> {
  const provider = getAiProvider();
  if (!provider.apiKey) {
    throw new Error(`Missing ${provider.apiKeyEnvVar} environment variable`);
  }

  const audio = await downloadAudio(path);

  const formData = new FormData();
  formData.append(
    'file',
    new Blob([new Uint8Array(audio)], { type: 'audio/ogg' }),
    path.split('/').pop() ?? 'audio.ogg',
  );
  formData.append('model', provider.transcribeModel);

  const res = await fetch(`${provider.baseUrl}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${provider.apiKey}` },
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`${provider.displayName} transcription failed: ${res.status} ${await res.text()}`);
  }

  const result = (await res.json()) as { text: string };
  // Groq's Whisper starts the text with a space.
  return result.text.trim();
}
