// Pure unit tests for the voice capture guardrails (src/lib/limits.ts).
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DAILY_LIMIT_REPLY,
  MAX_NOTES_PER_WINDOW,
  MAX_VOICE_SECONDS,
  TOO_LONG_REPLY,
  isOverDailyLimit,
  isTooLong,
} from '../src/lib/limits';

describe('isTooLong', () => {
  test('a typical 20 second note is fine', () => {
    assert.equal(isTooLong(20), false);
  });
  test('exactly the limit is still fine', () => {
    assert.equal(isTooLong(MAX_VOICE_SECONDS), false);
  });
  test('one second over the limit is rejected', () => {
    assert.equal(isTooLong(MAX_VOICE_SECONDS + 1), true);
  });
  test('missing duration is accepted, not guessed', () => {
    assert.equal(isTooLong(undefined), false);
    assert.equal(isTooLong(null), false);
  });
});

describe('isOverDailyLimit', () => {
  test('no notes yet is fine', () => {
    assert.equal(isOverDailyLimit(0), false);
  });
  test('one under the limit still allows this note', () => {
    assert.equal(isOverDailyLimit(MAX_NOTES_PER_WINDOW - 1), false);
  });
  test('at the limit, this note is rejected', () => {
    assert.equal(isOverDailyLimit(MAX_NOTES_PER_WINDOW), true);
  });
});

describe('replies follow the copy rules', () => {
  for (const [name, reply] of [
    ['TOO_LONG_REPLY', TOO_LONG_REPLY],
    ['DAILY_LIMIT_REPLY', DAILY_LIMIT_REPLY],
  ]) {
    test(`${name} has no em or en dashes`, () => {
      assert.doesNotMatch(reply, /[–—]/);
    });
  }
  test('replies state the real limits', () => {
    assert.match(TOO_LONG_REPLY, /2 minutes/);
    assert.match(DAILY_LIMIT_REPLY, new RegExp(`${MAX_NOTES_PER_WINDOW} voice notes`));
  });
});
