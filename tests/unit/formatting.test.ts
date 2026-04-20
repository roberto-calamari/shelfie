import { describe, it, expect } from 'vitest';
import {
  formatFinishedDate,
  formatAuthors,
  cleanTitle,
  cleanAuthor,
  normalizeQuery,
  looksLikeISBN,
  todayISO,
} from '@/lib/formatting';

describe('formatFinishedDate', () => {
  it('formats a date with ordinal suffix and weekday', () => {
    const result = formatFinishedDate('2026-04-17');
    expect(result).toBe('Finished Reading on Friday April 17th, 2026');
  });

  it('handles 1st correctly', () => {
    const result = formatFinishedDate('2026-05-01');
    expect(result).toContain('1st');
  });

  it('handles 2nd correctly', () => {
    const result = formatFinishedDate('2026-05-02');
    expect(result).toContain('2nd');
  });

  it('handles 3rd correctly', () => {
    const result = formatFinishedDate('2026-05-03');
    expect(result).toContain('3rd');
  });

  it('handles 11th correctly (special teen case)', () => {
    const result = formatFinishedDate('2026-05-11');
    expect(result).toContain('11th');
  });

  it('handles 12th correctly', () => {
    const result = formatFinishedDate('2026-05-12');
    expect(result).toContain('12th');
  });

  it('handles 13th correctly', () => {
    const result = formatFinishedDate('2026-05-13');
    expect(result).toContain('13th');
  });

  it('handles 21st correctly', () => {
    const result = formatFinishedDate('2026-05-21');
    expect(result).toContain('21st');
  });
});

describe('formatAuthors', () => {
  it('returns empty string for no authors', () => {
    expect(formatAuthors([])).toBe('');
  });

  it('formats single author', () => {
    expect(formatAuthors(['Donna Tartt'])).toBe('by Donna Tartt');
  });

  it('formats two authors with ampersand', () => {
    expect(formatAuthors(['Neil Gaiman', 'Terry Pratchett'])).toBe(
      'by Neil Gaiman & Terry Pratchett'
    );
  });

  it('formats three+ authors with et al', () => {
    expect(formatAuthors(['A', 'B', 'C'])).toBe('by A et al.');
  });
});

describe('cleanTitle', () => {
  it('strips Anniversary Edition', () => {
    expect(cleanTitle('The Great Gatsby (Anniversary Edition)')).toBe('The Great Gatsby');
  });

  it('strips Collector\'s Edition', () => {
    expect(cleanTitle("Dune: Collector's Edition")).toBe('Dune');
  });

  it('strips movie tie-in', () => {
    expect(cleanTitle('Normal People (Movie Tie-In Edition)')).toBe('Normal People');
  });

  it('strips "Now a major motion picture"', () => {
    expect(cleanTitle('Where the Crawdads Sing (Now a Major Motion Picture)')).toBe(
      'Where the Crawdads Sing'
    );
  });

  it('strips streaming service promos', () => {
    expect(cleanTitle('The Queen\'s Gambit (Now a Netflix Series)')).toBe("The Queen's Gambit");
  });

  it('strips boxed set language', () => {
    expect(cleanTitle('Harry Potter Box Set')).toBe('Harry Potter');
  });

  it('strips audiobook badges', () => {
    expect(cleanTitle('Project Hail Mary (Audiobook)')).toBe('Project Hail Mary');
  });

  it('strips numbered anniversary editions', () => {
    expect(cleanTitle('To Kill a Mockingbird (50th Anniversary Edition)')).toBe(
      'To Kill a Mockingbird'
    );
  });

  it('preserves clean titles', () => {
    expect(cleanTitle('The Secret History')).toBe('The Secret History');
  });

  it('collapses whitespace', () => {
    expect(cleanTitle('Dune   Special  Edition')).toBe('Dune');
  });
});

describe('cleanAuthor', () => {
  it('strips [Editor] annotations', () => {
    expect(cleanAuthor('John Smith [Editor]')).toBe('John Smith');
  });

  it('strips (Illustrator) annotations', () => {
    expect(cleanAuthor('Jane Doe (Illustrator)')).toBe('Jane Doe');
  });

  it('preserves clean names', () => {
    expect(cleanAuthor('Donna Tartt')).toBe('Donna Tartt');
  });
});

describe('normalizeQuery', () => {
  it('lowercases and strips punctuation', () => {
    expect(normalizeQuery("The Hitchhiker's Guide")).toBe('the hitchhiker s guide');
  });

  it('collapses whitespace', () => {
    expect(normalizeQuery('  hello   world  ')).toBe('hello world');
  });
});

describe('looksLikeISBN', () => {
  it('detects 10-digit ISBN', () => {
    expect(looksLikeISBN('0140283331')).toBe(true);
  });

  it('detects 13-digit ISBN', () => {
    expect(looksLikeISBN('978-0140283334')).toBe(true);
  });

  it('detects ISBN with spaces', () => {
    expect(looksLikeISBN('978 0140283334')).toBe(true);
  });

  it('rejects regular text', () => {
    expect(looksLikeISBN('The Great Gatsby')).toBe(false);
  });

  it('rejects short numbers', () => {
    expect(looksLikeISBN('12345')).toBe(false);
  });
});

describe('todayISO', () => {
  it('returns YYYY-MM-DD format', () => {
    const result = todayISO();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
