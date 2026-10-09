// Which AI service transcribes voice notes and reads the transcripts.
//
// OpenAI is the default and the paid-plan stack. Groq has a free tier, and
// Holdfast runs on it until there are paying users: set
// HOLDFAST_AI_PROVIDER=groq to switch, and unset it (or set "openai") to
// switch back. Both speak the OpenAI API format, so only the base URL, the
// key and the model names differ.
//
// The extraction prompt was tuned on gpt-4o-mini. After switching provider,
// run `npm run eval:extraction -- --only=V4` before trusting the results.
//
// The landing page and the privacy policy name the provider from this setting
// too (see ai-data-policy.ts), so they never tell users their notes go
// somewhere they don't.

export type AiProviderName = 'openai' | 'groq';

export interface AiProvider {
  name: AiProviderName;
  // Used in logs and error messages. User-facing wording lives in
  // ai-data-policy.ts.
  displayName: string;
  baseUrl: string;
  apiKey: string | undefined;
  apiKeyEnvVar: string;
  transcribeModel: string;
  extractionModel: string;
  // Extra chat-completion fields only this provider's extraction model accepts.
  extractionParams: Record<string, unknown>;
}

export function getAiProviderName(): AiProviderName {
  // Forgiving about case and stray spaces ("Groq", "groq "), strict about
  // anything else: a typo must not quietly send notes to the wrong service.
  const value = (process.env.HOLDFAST_AI_PROVIDER ?? '').trim().toLowerCase();
  if (value === '' || value === 'openai') return 'openai';
  if (value === 'groq') return 'groq';
  throw new Error(
    `Unknown HOLDFAST_AI_PROVIDER "${process.env.HOLDFAST_AI_PROVIDER}". Use "openai" or "groq".`,
  );
}

export function getAiProvider(): AiProvider {
  if (getAiProviderName() === 'groq') {
    return {
      name: 'groq',
      displayName: 'Groq',
      baseUrl: 'https://api.groq.com/openai/v1',
      apiKey: process.env.HOLDFAST_GROQ_API_KEY,
      apiKeyEnvVar: 'HOLDFAST_GROQ_API_KEY',
      transcribeModel: 'whisper-large-v3-turbo',
      // One of the Groq models that supports strict json_schema output.
      extractionModel: 'openai/gpt-oss-120b',
      extractionParams: {
        // gpt-oss is a reasoning model. Reading a 20 second note needs little
        // reasoning, and the free tier counts reasoning tokens against its
        // ~8K tokens a minute.
        reasoning_effort: 'low',
        // Reasoning tokens count toward this cap too; the default is too low
        // to leave room for the JSON.
        max_completion_tokens: 2048,
      },
    };
  }

  return {
    name: 'openai',
    displayName: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY,
    apiKeyEnvVar: 'OPENAI_API_KEY',
    transcribeModel: 'gpt-4o-mini-transcribe',
    extractionModel: 'gpt-4o-mini',
    extractionParams: {},
  };
}
