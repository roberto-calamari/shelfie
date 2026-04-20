// ─── Date Formatting ───────────────────────────────────────────

const ORDINAL_SUFFIXES: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' };

function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  return `${n}${ORDINAL_SUFFIXES[n % 10] || 'th'}`;
}

/**
 * Formats a date as "Finished Reading on Friday April 17th, 2026"
 */
export function formatFinishedDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00'); // Avoid timezone shift
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const day = ordinal(date.getDate());
  const year = date.getFullYear();
  return `Finished Reading on ${weekday} ${month} ${day}, ${year}`;
}

/**
 * Returns today as YYYY-MM-DD
 */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── Author Formatting ─────────────────────────────────────────

/**
 * Formats author list for story card display.
 * "by Author" / "by A & B" / "by A et al."
 */
export function formatAuthors(authors: string[]): string {
  if (!authors.length) return '';
  if (authors.length === 1) return `by ${authors[0]}`;
  if (authors.length === 2) return `by ${authors[0]} & ${authors[1]}`;
  return `by ${authors[0]} et al.`;
}

// ─── Title Cleanup ─────────────────────────────────────────────

const NOISE_PATTERNS = [
  /\s*\(?\s*anniversary\s+edition\s*\)?\s*/gi,
  /\s*\(?\s*collector'?s?\s+edition\s*\)?\s*/gi,
  /\s*\(?\s*deluxe\s+edition\s*\)?\s*/gi,
  /\s*\(?\s*special\s+edition\s*\)?\s*/gi,
  /\s*\(?\s*movie\s+tie[- ]?in\s*(edition)?\s*\)?\s*/gi,
  /\s*\(?\s*now\s+a\s+(major\s+)?motion\s+picture\s*\)?\s*/gi,
  /\s*\(?\s*now\s+a\s+(major\s+)?(netflix|hbo|amazon|hulu|disney)\s+series\s*\)?\s*/gi,
  /\s*\(?\s*box\s*set\s*\)?\s*/gi,
  /\s*\(?\s*boxed\s*set\s*\)?\s*/gi,
  /\s*\(?\s*audiobook\s*\)?\s*/gi,
  /\s*\(?\s*unabridged\s*\)?\s*/gi,
  /\s*\(?\s*illustrated\s+edition\s*\)?\s*/gi,
  /\s*\(?\s*mass\s+market\s+paperback\s*\)?\s*/gi,
  /\s*\(?\s*trade\s+paperback\s*\)?\s*/gi,
  /\s*\(?\s*\d+th\s+anniversary\s*(edition)?\s*\)?\s*/gi,
  /\s*\(?\s*\d+st\s+anniversary\s*(edition)?\s*\)?\s*/gi,
];

/**
 * Strips edition/promotional noise from titles.
 */
export function cleanTitle(raw: string): string {
  let title = raw;
  for (const pattern of NOISE_PATTERNS) {
    title = title.replace(pattern, ' ');
  }
  // Remove trailing colons/dashes left from stripping
  title = title.replace(/\s*[:\-–—]\s*$/, '');
  // Collapse whitespace
  title = title.replace(/\s+/g, ' ').trim();
  return title;
}

/**
 * Cleans author name of role annotations like "[Editor]", "(Illustrator)", etc.
 */
export function cleanAuthor(raw: string): string {
  return raw
    .replace(/\s*\[.*?\]\s*/g, '')
    .replace(/\s*\(.*?\)\s*/g, '')
    .trim();
}

// ─── Query Normalization ───────────────────────────────────────

/**
 * Normalizes a search query for consistent matching.
 */
export function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detects if a query looks like an ISBN.
 */
export function looksLikeISBN(query: string): boolean {
  const cleaned = query.replace(/[\s-]/g, '');
  return /^\d{10}$/.test(cleaned) || /^\d{13}$/.test(cleaned);
}
