export const EXTRACTION_PROMPT_V1 = `
You extract structured memory from a short voice note in which someone
describes an interaction with a person they care about.

The capture happened on {{CAPTURE_DATE}} (ISO 8601). Resolve every relative
date against that. "Next Thursday" must become a real date.

Partial dates ("the 14th") resolve FORWARD to the next occurrence, including
today if it matches. Never resolve a stated date into the past.

Return ONLY valid JSON matching the schema. No prose, no markdown fences.

RULES

1. person_name — the person being talked ABOUT, not the speaker. If no name is
   spoken, return null. Never invent one.

2. facts — things true about that person's life or state.
   type "life_event" : something happening to them (surgery, new job, a move)
   type "state"      : how they seem right now (stressed, elated, low)
   type "detail"     : durable facts (loves cycling, has two kids)
   event_date        : only when a specific date is stated or derivable,
                       otherwise null.

3. commitments — ONLY things the SPEAKER said THEY would do.
   "I said I'd send him a recruiter contact"  -> commitment
   "He's going to send me his CV"             -> NOT a commitment; a fact
   This is the single most important rule here. When in doubt, it is NOT a
   commitment. A missed commitment is a small failure. A wrong one makes the
   product feel broken.

4. description — store the bare action only, starting with the verb. Never
   prefix it with "I said I'd", "I'd", "I will", "I'm going to", or any other
   first-person framing; the app supplies that voice itself. Always name the
   person explicitly in the action; never leave a pronoun (him, her, them)
   in it, and never drop the person out of it entirely.
   "I said I'd send him the recruiter's number" -> "send Marco the
   recruiter's number", never "I'd send him the recruiter's number" and
   never "send the recruiter's number" with the person omitted.

5. due_date — resolve the timeframe if the speaker gave one. If they committed
   with no timeframe, set it to 3 days after the capture date.

6. confidence — 0 to 1. Below 0.6 means you are guessing.

7. Never add information that is not in the transcript.
`;

export const EXTRACTION_PROMPT_V2 = `
You extract structured memory from a short voice note in which someone
describes an interaction with a person they care about.

Today is {{CAPTURE_DATE}} (ISO 8601), a {{CAPTURE_DAY_OF_WEEK}}. Resolve every
relative date against that. "Next Thursday" must become a real date.

Partial dates ("the 14th") resolve FORWARD to the next occurrence, including
today if it matches. Never resolve a stated date into the past.

Bare weekday names ("Thursday", "on Wednesday", "Wednesday night") resolve to
the NEXT occurrence of that weekday after today. Unlike partial dates, this
NEVER includes today, even if today is that weekday, and never resolves into
the past.

Return ONLY valid JSON matching the schema. No prose, no markdown fences.

RULES

1. person_name — the person being talked ABOUT, not the speaker. If no name is
   spoken anywhere in the transcript, return null. Never invent or guess one,
   even from pronouns or context. A null name is expected and correct when the
   speaker never says who they mean; the app will ask the user who it was
   rather than have you guess.

2. facts — things true about that person's life or state.
   type "life_event" : something happening to them (surgery, new job, a move)
   type "state"      : how they seem right now (stressed, elated, low)
   type "detail"     : durable facts (loves cycling, has two kids)
   event_date        : only when a specific date is stated or derivable,
                       otherwise null.

3. commitments — ONLY things the SPEAKER said THEY would do.
   "I said I'd send him a recruiter contact"  -> commitment
   "He's going to send me his CV"             -> NOT a commitment; a fact
   This is the single most important rule here. When in doubt, it is NOT a
   commitment. A missed commitment is a small failure. A wrong one makes the
   product feel broken.

4. due_date — resolve the timeframe if the speaker gave one, including vague
   ones ("this weekend", "soon", "in a couple weeks") using your best
   judgment. The 3-days-after-today default applies ONLY when the speaker
   stated NO timeframe at all for that commitment. If a timeframe was stated
   but is hard to resolve, resolve it as closely as you can from context;
   never let a stated-but-unparsed timeframe silently fall through to the
   3-day default, that default is reserved strictly for "no timeframe given".

5. confidence — 0 to 1. Below 0.6 means you are guessing.

6. Never add information that is not in the transcript.
`;

const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function parseIsoDateUTC(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatIsoDateUTC(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDaysUTC(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function daysInMonthUTC(year: number, monthIndex0: number): number {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
}

function ordinalSuffix(day: number): string {
  const lastTwo = day % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

export function dayOfWeekName(captureDate: string): string {
  return WEEKDAY_NAMES[parseIsoDateUTC(captureDate).getUTCDay()];
}

// Precomputes every date the model would otherwise have to calculate, so V3
// only ever asks it to copy a value out of a table instead of doing calendar
// arithmetic itself. Arithmetic-by-model was the exact failure mode that
// produced "Monday the 24th" for a stated "Thursday" (see
// tests/extraction-cases.md, case 1: 2026-08-21 + "Thursday" should be
// 2026-08-27).
export function buildDateLookupTable(captureDate: string): string {
  const capture = parseIsoDateUTC(captureDate);
  const captureDow = capture.getUTCDay();

  const lines = [
    `Today: ${captureDate} (${WEEKDAY_NAMES[captureDow]})`,
    `Tomorrow: ${formatIsoDateUTC(addDaysUTC(capture, 1))}`,
  ];

  // Every weekday name resolves to its NEXT occurrence strictly after today,
  // so offsets 1..7 cover each name exactly once, including today's own
  // weekday landing 7 days out (never today itself).
  for (let offset = 1; offset <= 7; offset++) {
    const d = addDaysUTC(capture, offset);
    lines.push(`${WEEKDAY_NAMES[d.getUTCDay()]}: ${formatIsoDateUTC(d)}`);
  }

  const daysToSaturday = ((6 - captureDow) % 7 + 7) % 7;
  lines.push(`This weekend (Saturday): ${formatIsoDateUTC(addDaysUTC(capture, daysToSaturday))}`);

  // Ordinal day-of-month ("the 14th") is the other place the model has to do
  // arithmetic instead of copying a value: whether the day number is still
  // ahead this month or has already passed and rolls to next month. Anchor
  // it the same way as weekdays, with two concrete worked examples, instead
  // of leaving the roll-forward-past-today judgment to the model. This is
  // additive to the existing ordinal rule text below, not a replacement.
  const year = capture.getUTCFullYear();
  const monthIndex0 = capture.getUTCMonth();
  const captureDay = capture.getUTCDate();
  const daysThisMonth = daysInMonthUTC(year, monthIndex0);
  const nextMonthIndex0 = (monthIndex0 + 1) % 12;
  const nextMonthYear = monthIndex0 === 11 ? year + 1 : year;

  lines.push(
    `Current month: ${MONTH_NAMES[monthIndex0]} ${year} (${daysThisMonth} days). ` +
      `Next month: ${MONTH_NAMES[nextMonthIndex0]} ${nextMonthYear}.`,
  );

  const aheadDay =
    captureDay + 7 <= daysThisMonth
      ? captureDay + 7
      : captureDay + 1 <= daysThisMonth
        ? captureDay + 1
        : null;
  if (aheadDay != null) {
    const aheadDate = formatIsoDateUTC(new Date(Date.UTC(year, monthIndex0, aheadDay)));
    lines.push('An ordinal still ahead this month resolves to this month:');
    lines.push(`  "the ${ordinalSuffix(aheadDay)}" = ${aheadDate}`);
  }

  const pastDay = captureDay - 16 >= 1 ? captureDay - 16 : captureDay - 1 >= 1 ? captureDay - 1 : null;
  if (pastDay != null) {
    const pastDate = formatIsoDateUTC(new Date(Date.UTC(nextMonthYear, nextMonthIndex0, pastDay)));
    lines.push('An ordinal already passed this month resolves to next month:');
    lines.push(`  "the ${ordinalSuffix(pastDay)}" = ${pastDate}`);
  }

  return lines.join('\n');
}

// Fills every placeholder a prompt version might contain. Placeholders a
// given template doesn't use are simply absent from it, so filling all of
// them unconditionally is safe for V1, V2, and V3 alike.
export function fillPromptTemplate(template: string, captureDate: string): string {
  return template
    .replaceAll('{{CAPTURE_DATE}}', captureDate)
    .replaceAll('{{CAPTURE_DAY_OF_WEEK}}', dayOfWeekName(captureDate))
    .replaceAll('{{DATE_LOOKUP_TABLE}}', buildDateLookupTable(captureDate));
}

export const EXTRACTION_PROMPT_V3 = `
You extract structured memory from a short voice note in which someone
describes an interaction with a person they care about.

Today is {{CAPTURE_DATE}} (ISO 8601), a {{CAPTURE_DAY_OF_WEEK}}. Resolve every
relative date against that.

Partial dates ("the 14th") resolve FORWARD to the next occurrence, including
today if it matches. Never resolve a stated date into the past.

Every weekday name, plus today, tomorrow, and this weekend, is already
resolved to a real date in the table below. Copy the value you need directly
from this table. Never calculate a weekday date yourself.

{{DATE_LOOKUP_TABLE}}

Return ONLY valid JSON matching the schema. No prose, no markdown fences.

RULES

1. person_name — the person being talked ABOUT, not the speaker. If no name is
   spoken anywhere in the transcript, return null. Never invent or guess one,
   even from pronouns or context. A null name is expected and correct when the
   speaker never says who they mean; the app will ask the user who it was
   rather than have you guess.

2. facts — things true about that person's life or state.
   type "life_event" : something happening to them (surgery, new job, a move)
   type "state"      : how they seem right now (stressed, elated, low)
   type "detail"     : durable facts (loves cycling, has two kids)
   event_date        : only when a specific date is stated or derivable,
                       otherwise null.

3. commitments — ONLY things the SPEAKER said THEY would do.
   "I said I'd send him a recruiter contact"  -> commitment
   "He's going to send me his CV"             -> NOT a commitment; a fact
   This is the single most important rule here. When in doubt, it is NOT a
   commitment. A missed commitment is a small failure. A wrong one makes the
   product feel broken.

4. description — store the bare action only, starting with the verb. Never
   prefix it with "I said I'd", "I'd", "I will", "I'm going to", or any other
   first-person framing; the app supplies that voice itself. Always name the
   person explicitly in the action; never leave a pronoun (him, her, them)
   in it, and never drop the person out of it entirely.
   "I said I'd send him the recruiter's number" -> "send Marco the
   recruiter's number", never "I'd send him the recruiter's number" and
   never "send the recruiter's number" with the person omitted.

5. evidence — for every commitment, copy the exact words from the transcript
   where the speaker made that commitment, verbatim. It must be an exact
   substring of the transcript, not a paraphrase or summary. It will be
   checked against the transcript in code and the commitment discarded if it
   doesn't match, so if you cannot point to real words that make the promise,
   do not produce the commitment at all.

6. due_date — resolve the timeframe if the speaker gave one, including vague
   ones ("this weekend", "soon", "in a couple weeks") using your best
   judgment and the lookup table above. The 3-days-after-today default
   applies ONLY when the speaker stated NO timeframe at all for that
   commitment. If a timeframe was stated but is hard to resolve, resolve it
   as closely as you can from context; never let a stated-but-unparsed
   timeframe silently fall through to the 3-day default, that default is
   reserved strictly for "no timeframe given".

7. confidence — 0 to 1. Below 0.6 means you are guessing.

8. Never add information that is not in the transcript.
`;

// V4 changes the contract: the model no longer resolves any date itself.
// V3's lookup table was an attempt to make date resolution reliable by
// giving the model values to copy, but it only works for a closed set
// (7 weekdays) — ordinals range over ~31 possible days, so two worked
// examples taught a pattern the model still had to generalize from, and it
// sometimes just copied the nearest anchor verbatim instead (see the
// 2026-08-28 for "the 14th" failure). V4 removes the table entirely and
// removes the model from date arithmetic altogether: it returns the
// speaker's words verbatim, and resolve-date.ts resolves them in code,
// deterministically, every time.
export const EXTRACTION_PROMPT_V4 = `
You extract structured memory from a short voice note in which someone
describes an interaction with a person they care about.

The capture happened on {{CAPTURE_DATE}} (ISO 8601).

Do NOT resolve any relative or partial date yourself. For every date
mentioned or implied, return the speaker's own words verbatim in
date_expression: "the 14th", "Thursday", "Wednesday night", "next week",
"this weekend", "tomorrow", "sometime after the holidays". If nothing about
timing was said, date_expression is null. All resolution happens in code
afterward, not by you.

resolved_date is separate and stays null in almost every case. Set it to a
real ISO date ONLY when the transcript states a full, unambiguous, explicit
calendar date including a year, e.g. "August 14th 2026". A bare weekday, a
bare day-of-month, "next week", or any other relative phrase is NOT a full
explicit date — leave resolved_date null and put the phrase in
date_expression instead.

Return ONLY valid JSON matching the schema. No prose, no markdown fences.

RULES

1. person_name — the person being talked ABOUT, not the speaker. If no name is
   spoken anywhere in the transcript, return null. Never invent or guess one,
   even from pronouns or context. A null name is expected and correct when the
   speaker never says who they mean; the app will ask the user who it was
   rather than have you guess.

2. facts — things true about that person's life or state.
   type "life_event" : something happening to them (surgery, new job, a move)
   type "state"      : how they seem right now (stressed, elated, low)
   type "detail"     : durable facts (loves cycling, has two kids)
   date_expression   : the speaker's own words for when, verbatim, or null
                       if nothing about timing was said.
   resolved_date     : see above; almost always null.

3. commitments — ONLY things the SPEAKER said THEY would do.
   "I said I'd send him a recruiter contact"  -> commitment
   "He's going to send me his CV"             -> NOT a commitment; a fact
   This is the single most important rule here. When in doubt, it is NOT a
   commitment. A missed commitment is a small failure. A wrong one makes the
   product feel broken.

4. description — store the bare action only, starting with the verb. Never
   prefix it with "I said I'd", "I'd", "I will", "I'm going to", or any other
   first-person framing; the app supplies that voice itself, and also names
   the person elsewhere in the message, so don't worry about naming them
   here or replacing pronouns.
   "I said I'd send him the recruiter's number" -> "send him the
   recruiter's number", never "I'd send him the recruiter's number".

5. evidence — for every commitment, copy the exact words from the transcript
   where the speaker made that commitment, verbatim. It must be an exact
   substring of the transcript, not a paraphrase or summary. It will be
   checked against the transcript in code and the commitment discarded if it
   doesn't match, so if you cannot point to real words that make the promise,
   do not produce the commitment at all.

6. date_expression for a commitment — the speaker's own words for the
   timeframe, verbatim, exactly as in rule 2. null means the speaker gave NO
   timeframe at all for that commitment; that is the only case that defaults
   to 3 days after the capture date, and that default is applied in code,
   not by you. If the speaker DID give a timeframe, even a vague one
   ("sometime after the holidays"), date_expression must hold their words,
   never null, even if you cannot tell what date it resolves to — an
   unresolvable-but-stated timeframe must never collapse to the 3-day
   default, in your output or afterward.

7. confidence — 0 to 1. Below 0.6 means you are guessing.

8. Never add information that is not in the transcript.
`;
