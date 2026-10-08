// Pure tests for waitlist email copy (src/lib/waitlist-emails.ts). No sends.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { WELCOME_SUBJECT, WELCOME_TEXT, welcomeEmail } from '../src/lib/waitlist-emails';

describe('welcome email copy', () => {
  const all = `${WELCOME_SUBJECT}\n${WELCOME_TEXT}`;

  test('no em or en dashes (CLAUDE.md copy rules)', () => {
    assert.doesNotMatch(all, /[–—]/);
  });
  test('no exclamation marks', () => {
    assert.doesNotMatch(all, /!/);
  });
  test('none of the banned CRM words', () => {
    assert.doesNotMatch(all, /\b(contact|lead|pipeline|manage)\b/i);
  });
  test('tells them what happens next and how to opt out', () => {
    assert.match(WELCOME_TEXT, /email you a link/);
    assert.match(WELCOME_TEXT, /Telegram/);
    assert.match(WELCOME_TEXT, /^https:\/\/telegram\.org\/apps$/m);
    assert.match(WELCOME_TEXT, /take you off the list/);
  });
});

describe('welcomeEmail', () => {
  test('same address gives the same idempotency key', () => {
    assert.equal(
      welcomeEmail('a@example.com').idempotencyKey,
      welcomeEmail('a@example.com').idempotencyKey,
    );
  });
  test('different addresses give different keys', () => {
    assert.notEqual(
      welcomeEmail('a@example.com').idempotencyKey,
      welcomeEmail('b@example.com').idempotencyKey,
    );
  });
  test('key stays under the 256-character limit for the longest valid email', () => {
    const longest = `${'a'.repeat(242)}@example.com`;
    assert.ok(welcomeEmail(longest).idempotencyKey.length <= 256);
  });
  test('the key does not contain the address itself', () => {
    assert.doesNotMatch(welcomeEmail('a@example.com').idempotencyKey, /example/);
  });
});
