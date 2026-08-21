// Deterministic date-expression resolver. Extraction no longer resolves
// dates itself (extraction-prompt.ts V4) — the model returns the speaker's
// own words verbatim in `date_expression`, and this turns that into a real
// ISO date the same way every time. Anything it can't confidently resolve
// returns null rather than guessing; callers must not fall through to a
// default when this returns null for a NON-null expression (that only means
// "couldn't resolve", not "nothing was said" — see persist.ts).
const WEEKDAY_NAMES = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
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

// Next occurrence of `targetDow` strictly after `captureDate` — never today,
// even if today is that weekday, and never in the past.
function nextWeekday(captureDate: Date, targetDow: number): Date {
  const captureDow = captureDate.getUTCDay();
  const offset = ((targetDow - captureDow + 7) % 7) || 7;
  return addDaysUTC(captureDate, offset);
}

// "the 14th": this month if the day hasn't passed yet (including today),
// otherwise the same day next month.
function resolveOrdinal(day: number, captureDate: Date): Date {
  const year = captureDate.getUTCFullYear();
  const monthIndex0 = captureDate.getUTCMonth();
  const captureDay = captureDate.getUTCDate();
  if (day >= captureDay) {
    return new Date(Date.UTC(year, monthIndex0, day));
  }
  const nextMonthIndex0 = (monthIndex0 + 1) % 12;
  const nextMonthYear = monthIndex0 === 11 ? year + 1 : year;
  return new Date(Date.UTC(nextMonthYear, nextMonthIndex0, day));
}

export function resolveDateExpression(
  expression: string | null | undefined,
  captureDate: string,
): string | null {
  if (!expression) return null;

  const capture = parseIsoDateUTC(captureDate);
  const text = expression.trim().toLowerCase();

  if (text.includes('today')) return captureDate;
  if (text.includes('tomorrow')) return formatIsoDateUTC(addDaysUTC(capture, 1));

  if (text.includes('this weekend')) {
    const captureDow = capture.getUTCDay();
    const daysToSaturday = ((6 - captureDow) % 7 + 7) % 7;
    return formatIsoDateUTC(addDaysUTC(capture, daysToSaturday));
  }

  if (text.includes('next week')) {
    return formatIsoDateUTC(addDaysUTC(capture, 7));
  }

  for (let dow = 0; dow < WEEKDAY_NAMES.length; dow++) {
    if (text.includes(WEEKDAY_NAMES[dow])) {
      return formatIsoDateUTC(nextWeekday(capture, dow));
    }
  }

  const ordinalMatch = text.match(/\b(\d{1,2})(st|nd|rd|th)?\b/);
  if (ordinalMatch) {
    const day = parseInt(ordinalMatch[1], 10);
    const daysThisMonth = daysInMonthUTC(capture.getUTCFullYear(), capture.getUTCMonth());
    if (day >= 1 && day <= daysThisMonth) {
      return formatIsoDateUTC(resolveOrdinal(day, capture));
    }
  }

  // Vague/unrecognized phrasing ("sometime after the holidays", "soon"):
  // no confident resolution, so no date. Never guess.
  return null;
}

export function addDaysIso(isoDate: string, days: number): string {
  return formatIsoDateUTC(addDaysUTC(parseIsoDateUTC(isoDate), days));
}

export interface DatedEntry {
  date_expression: string | null;
  resolved_date: string | null;
}

// The final date for a fact or commitment: trust an explicit resolved_date
// if the model supplied one (a full stated date), otherwise resolve the
// verbatim expression in code. Does NOT apply the commitment 3-day default —
// callers that need that (persist.ts, for commitments only) apply it
// themselves when date_expression is null, since null here can mean either
// "nothing was said" or "said but unresolvable" and only the caller knows
// which field it's resolving.
export function resolveFinalDate(entry: DatedEntry, captureDate: string): string | null {
  if (entry.resolved_date != null) return entry.resolved_date;
  return resolveDateExpression(entry.date_expression, captureDate);
}
