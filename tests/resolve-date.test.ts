// Pure unit tests for resolveDateExpression (src/lib/resolve-date.ts). No API
// calls — this is the deterministic half of the V4 date contract, and it
// should never need a model call to verify. Every fixture in
// tests/extraction-cases.md that concerns a date has a corresponding case
// below, run against that file's fixed reference date.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveDateExpression } from '../src/lib/resolve-date';

const CAPTURE_DATE = '2026-08-21'; // Friday, per tests/extraction-cases.md

describe('resolveDateExpression', () => {
  describe('no expression at all', () => {
    test('null returns null', () => {
      assert.equal(resolveDateExpression(null, CAPTURE_DATE), null);
    });
    test('undefined returns null', () => {
      assert.equal(resolveDateExpression(undefined, CAPTURE_DATE), null);
    });
    test('empty string returns null', () => {
      assert.equal(resolveDateExpression('', CAPTURE_DATE), null);
    });
  });

  describe('extraction-cases.md case 1: bare weekday', () => {
    test('"Thursday" resolves to the next Thursday, 2026-08-27', () => {
      assert.equal(resolveDateExpression('Thursday', CAPTURE_DATE), '2026-08-27');
    });
  });

  describe('extraction-cases.md case 2: weekday with a time of day', () => {
    test('"Wednesday night" resolves to the next Wednesday, ignoring the time of day', () => {
      assert.equal(resolveDateExpression('Wednesday night', CAPTURE_DATE), '2026-08-26');
    });
  });

  describe('extraction-cases.md case 3: ordinal, forward-rolls past the capture day', () => {
    test('"the 14th" (14 < capture day 21) rolls to next month: 2026-09-14', () => {
      assert.equal(resolveDateExpression('the 14th', CAPTURE_DATE), '2026-09-14');
    });
  });

  describe('extraction-cases.md case 4: relative date "next week"', () => {
    test('"next week" resolves to capture date + 7 days: 2026-08-28', () => {
      assert.equal(resolveDateExpression('next week', CAPTURE_DATE), '2026-08-28');
    });
  });

  describe('extraction-cases.md cases 5 & 6: no timeframe stated', () => {
    test('null date_expression resolves to null (the 3-day default is applied by persist.ts, not here)', () => {
      assert.equal(resolveDateExpression(null, CAPTURE_DATE), null);
    });
  });

  describe('extraction-cases.md case 7: "this weekend"', () => {
    test('"this weekend" resolves to the coming Saturday, 2026-08-22', () => {
      assert.equal(resolveDateExpression('this weekend', CAPTURE_DATE), '2026-08-22');
    });
  });

  describe('extraction-cases.md case 10: fact with no date at all', () => {
    test('null date_expression resolves to null, never defaulted to anything', () => {
      assert.equal(resolveDateExpression(null, CAPTURE_DATE), null);
    });
  });

  describe('extraction-cases.md case 11: stated but vague timeframe', () => {
    test('"sometime after the holidays" is not a confident pattern: resolves to null, not a guess', () => {
      assert.equal(resolveDateExpression('sometime after the holidays', CAPTURE_DATE), null);
    });
  });

  describe('extraction-cases.md case 12: vague "next month" mention', () => {
    test('"next month" is not one of the resolvable patterns: resolves to null rather than guessing', () => {
      assert.equal(resolveDateExpression('next month', CAPTURE_DATE), null);
    });
  });

  describe('today / tomorrow', () => {
    test('"today" resolves to the capture date itself', () => {
      assert.equal(resolveDateExpression('today', CAPTURE_DATE), '2026-08-21');
    });
    test('"tomorrow" resolves to capture date + 1 day', () => {
      assert.equal(resolveDateExpression('tomorrow', CAPTURE_DATE), '2026-08-22');
    });
  });

  describe('weekday resolution never lands on today, even for today\'s own weekday', () => {
    test('"Friday" (same weekday as the capture day) resolves 7 days out, not today', () => {
      assert.equal(resolveDateExpression('Friday', CAPTURE_DATE), '2026-08-28');
    });
    test('every other weekday resolves to its next occurrence within 7 days', () => {
      const expected: Record<string, string> = {
        Saturday: '2026-08-22',
        Sunday: '2026-08-23',
        Monday: '2026-08-24',
        Tuesday: '2026-08-25',
        Wednesday: '2026-08-26',
        Thursday: '2026-08-27',
      };
      for (const [day, date] of Object.entries(expected)) {
        assert.equal(resolveDateExpression(day, CAPTURE_DATE), date, day);
      }
    });
    test('weekday names are case-insensitive', () => {
      assert.equal(resolveDateExpression('thursday', CAPTURE_DATE), '2026-08-27');
      assert.equal(resolveDateExpression('THURSDAY', CAPTURE_DATE), '2026-08-27');
    });
  });

  describe('ordinal boundary: "including today if it matches"', () => {
    test('"the 21st" (same as the capture day) resolves to today, not next month', () => {
      assert.equal(resolveDateExpression('the 21st', CAPTURE_DATE), '2026-08-21');
    });
    test('"the 22nd" (just after the capture day) resolves within this month', () => {
      assert.equal(resolveDateExpression('the 22nd', CAPTURE_DATE), '2026-08-22');
    });
    test('an ordinal works without a "the" prefix', () => {
      assert.equal(resolveDateExpression('22nd', CAPTURE_DATE), '2026-08-22');
    });
    test('ordinal roll-forward crosses a year boundary in December', () => {
      assert.equal(resolveDateExpression('the 5th', '2026-12-21'), '2027-01-05');
    });
  });

  describe('unresolvable phrasing never guesses', () => {
    test('"soon" resolves to null', () => {
      assert.equal(resolveDateExpression('soon', CAPTURE_DATE), null);
    });
    test('"in a couple weeks" resolves to null (not one of the confident patterns)', () => {
      assert.equal(resolveDateExpression('in a couple weeks', CAPTURE_DATE), null);
    });
  });
});
