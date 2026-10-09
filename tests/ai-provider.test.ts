// Pure unit tests for the AI provider switch (src/lib/ai-provider.ts) and the
// rate-limit retry wait in src/lib/extract.ts.
import { afterEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { getAiProvider, getAiProviderName } from '../src/lib/ai-provider';
import { rateLimitWaitMs } from '../src/lib/extract';

const original = process.env.HOLDFAST_AI_PROVIDER;

afterEach(() => {
  if (original == null) delete process.env.HOLDFAST_AI_PROVIDER;
  else process.env.HOLDFAST_AI_PROVIDER = original;
});

describe('getAiProviderName', () => {
  test('unset means OpenAI', () => {
    delete process.env.HOLDFAST_AI_PROVIDER;
    assert.equal(getAiProviderName(), 'openai');
  });
  test('empty means OpenAI', () => {
    process.env.HOLDFAST_AI_PROVIDER = '';
    assert.equal(getAiProviderName(), 'openai');
  });
  test('groq selects Groq', () => {
    process.env.HOLDFAST_AI_PROVIDER = 'groq';
    assert.equal(getAiProviderName(), 'groq');
  });
  test('case and stray spaces are forgiven', () => {
    process.env.HOLDFAST_AI_PROVIDER = ' Groq ';
    assert.equal(getAiProviderName(), 'groq');
  });
  test('a typo fails loudly instead of quietly using OpenAI', () => {
    process.env.HOLDFAST_AI_PROVIDER = 'grok';
    assert.throws(() => getAiProviderName(), /Unknown HOLDFAST_AI_PROVIDER "grok"/);
  });
});

describe('getAiProvider', () => {
  test('Groq reads its own key, never the OpenAI one', () => {
    process.env.HOLDFAST_AI_PROVIDER = 'groq';
    const provider = getAiProvider();
    assert.equal(provider.apiKeyEnvVar, 'HOLDFAST_GROQ_API_KEY');
    assert.equal(provider.baseUrl, 'https://api.groq.com/openai/v1');
  });
  test('OpenAI sends no Groq-only extraction fields', () => {
    delete process.env.HOLDFAST_AI_PROVIDER;
    assert.deepEqual(getAiProvider().extractionParams, {});
  });
});

describe('rateLimitWaitMs', () => {
  test('waits as long as the provider asks, plus a 1s buffer', () => {
    assert.equal(rateLimitWaitMs('4'), 5000);
    assert.equal(rateLimitWaitMs('3.7725'), 4773);
  });
  test('a missing header still gets a short wait', () => {
    assert.equal(rateLimitWaitMs(null), 5000);
    assert.equal(rateLimitWaitMs(''), 5000);
  });
});
