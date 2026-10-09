import { getAiProviderName, type AiProviderName } from '@/lib/ai-provider';

// What users are told about the AI service that transcribes and reads their
// notes. Shown on the landing page and in the privacy policy. It must name
// the service actually in use, so it follows HOLDFAST_AI_PROVIDER.
export interface AiDataPolicy {
  name: string;
  // One or two sentences on training and retention, in the provider's terms.
  policy: string;
  // The provider's page on what it does with API data.
  dataPolicyUrl: string;
  // The provider's general privacy policy.
  privacyUrl: string;
}

const AI_DATA_POLICY: Record<AiProviderName, AiDataPolicy> = {
  openai: {
    name: 'OpenAI',
    policy:
      "OpenAI says it doesn't train its models on data sent through its API by default. It may keep the text for up to 30 days for abuse checks.",
    dataPolicyUrl: 'https://developers.openai.com/api/docs/guides/your-data',
    privacyUrl: 'https://openai.com/policies/privacy-policy',
  },
  groq: {
    name: 'Groq',
    policy:
      "Groq says it doesn't train models on data sent through its API, and doesn't keep it by default. It may keep it for up to 30 days to fix problems or check for abuse.",
    dataPolicyUrl: 'https://console.groq.com/docs/your-data',
    privacyUrl: 'https://groq.com/privacy-policy',
  },
};

// Never throws: a typo in HOLDFAST_AI_PROVIDER must not take the website
// down. The bot fails loudly on the same typo (see ai-provider.ts), so no
// note reaches any AI service until it's fixed, and the default wording is
// the safe thing to show meanwhile.
export function currentAiDataPolicy(): AiDataPolicy {
  try {
    return AI_DATA_POLICY[getAiProviderName()];
  } catch (error) {
    console.error(error);
    return AI_DATA_POLICY.openai;
  }
}
