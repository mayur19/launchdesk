/**
 * Calendar-date helpers (PRD FR-04: overdue is computed in the project time
 * zone, timestamps are stored in UTC). Local dates are ISO `YYYY-MM-DD`
 * strings; arithmetic uses integer day numbers, never floating hours.
 */
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

/** Calendar date of `instant` as seen in `timeZone`. Throws RangeError for unknown zones. */
export function localDateInZone(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const byType: Readonly<Record<string, string>> = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${byType.year}-${byType.month}-${byType.day}`;
}

/** Whole days since 1970-01-01 for an ISO local date; throws on malformed input. */
export function toDayNumber(localDate: string): number {
  const match = ISO_DATE.exec(localDate);
  if (!match) throw new Error(`Invalid local date: ${localDate}`);
  const utc = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (new Date(utc).toISOString().slice(0, 10) !== localDate) {
    throw new Error(`Invalid local date: ${localDate}`);
  }
  return utc / MS_PER_DAY;
}

/** Signed number of calendar days from `from` to `to`. */
export function daysBetween(from: string, to: string): number {
  return toDayNumber(to) - toDayNumber(from);
}
