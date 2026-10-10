// Pure unit tests for the failed-audio cleanup rules (src/lib/failed-audio.ts).
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  IN_FLIGHT_GRACE_MS,
  MAX_RETRY_AGE_MS,
  captureAudioPath,
  chooseFailedAudioAction,
  hasNewerFailedNote,
  parseCaptureAudioPath,
} from '../src/lib/failed-audio';

const NOW = Date.UTC(2026, 9, 9, 7, 0, 0);
const HOUR_MS = 60 * 60 * 1000;

describe('captureAudioPath and parseCaptureAudioPath', () => {
  test('round-trips chat id and upload time', () => {
    const path = captureAudioPath(123456789, 42, NOW);
    assert.equal(path, `captures/123456789/42-${NOW}.ogg`);
    assert.deepEqual(parseCaptureAudioPath(path), { path, chatId: 123456789, uploadedAt: NOW });
  });
  test('group chats have negative ids', () => {
    const path = captureAudioPath(-1001234567890, 7, NOW);
    assert.equal(parseCaptureAudioPath(path)?.chatId, -1001234567890);
  });
  test('the old path format without an upload time is not recognised', () => {
    assert.equal(parseCaptureAudioPath('captures/123456789/42.ogg'), null);
  });
  test('anything else is not recognised', () => {
    assert.equal(parseCaptureAudioPath('captures/123456789/42-abc.ogg'), null);
    assert.equal(parseCaptureAudioPath('other/123456789/42-1.ogg'), null);
  });
});

describe('hasNewerFailedNote', () => {
  const chatA = (uploadedAt: number) => ({ path: `a-${uploadedAt}`, chatId: 1, uploadedAt });
  const chatB = (uploadedAt: number) => ({ path: `b-${uploadedAt}`, chatId: 2, uploadedAt });

  test('a later failed note in the same chat counts', () => {
    const older = chatA(NOW - 2 * HOUR_MS);
    assert.equal(hasNewerFailedNote(older, [older, chatA(NOW - HOUR_MS)]), true);
  });
  test('the newest note in a chat has nothing newer', () => {
    const newest = chatA(NOW - HOUR_MS);
    assert.equal(hasNewerFailedNote(newest, [chatA(NOW - 2 * HOUR_MS), newest]), false);
  });
  test('other chats are ignored', () => {
    const mine = chatA(NOW - 2 * HOUR_MS);
    assert.equal(hasNewerFailedNote(mine, [mine, chatB(NOW - HOUR_MS)]), false);
  });
});

describe('chooseFailedAudioAction', () => {
  test('no upload time (old path format) is deleted without a retry', () => {
    assert.equal(chooseFailedAudioAction(null, false, NOW), 'delete');
  });
  test('a file inside the grace period waits, it may still be in use', () => {
    assert.equal(chooseFailedAudioAction(NOW - 5 * 60 * 1000, false, NOW), 'wait');
    assert.equal(chooseFailedAudioAction(NOW - IN_FLIGHT_GRACE_MS + 1, false, NOW), 'wait');
  });
  test('waiting wins even if the user sent a newer note', () => {
    assert.equal(chooseFailedAudioAction(NOW - 5 * 60 * 1000, true, NOW), 'wait');
  });
  test('a file just past the grace period is retried', () => {
    assert.equal(chooseFailedAudioAction(NOW - IN_FLIGHT_GRACE_MS, false, NOW), 'retry');
  });
  test('a day-old file is retried', () => {
    assert.equal(chooseFailedAudioAction(NOW - 24 * HOUR_MS, false, NOW), 'retry');
  });
  test('a newer note from the user means delete, not retry', () => {
    assert.equal(chooseFailedAudioAction(NOW - 24 * HOUR_MS, true, NOW), 'delete');
  });
  test('exactly the max retry age is still retried', () => {
    assert.equal(chooseFailedAudioAction(NOW - MAX_RETRY_AGE_MS, false, NOW), 'retry');
  });
  test('older than the max retry age is deleted without a retry', () => {
    assert.equal(chooseFailedAudioAction(NOW - MAX_RETRY_AGE_MS - 1, false, NOW), 'delete');
  });
});
