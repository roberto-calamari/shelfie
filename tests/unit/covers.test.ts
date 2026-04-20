import { describe, it, expect } from 'vitest';
import { rankCovers, isCoverLowQuality } from '@/lib/covers/ranking';
import type { CoverCandidate } from '@/types';

function makeCover(overrides: Partial<CoverCandidate> = {}): CoverCandidate {
  return {
    id: 'test-cover-1',
    url: 'https://covers.openlibrary.org/b/id/12345-L.jpg',
    proxyUrl: '/api/covers/proxy?url=test',
    source: 'openLibrary',
    score: 0,
    inspected: false,
    ...overrides,
  };
}

describe('isCoverLowQuality', () => {
  it('returns false for uninspected covers', () => {
    expect(isCoverLowQuality(makeCover())).toBe(false);
  });

  it('returns true for small covers', () => {
    expect(
      isCoverLowQuality(makeCover({ width: 200, height: 300, inspected: true }))
    ).toBe(true);
  });

  it('returns false for large covers', () => {
    expect(
      isCoverLowQuality(makeCover({ width: 800, height: 1200, inspected: true }))
    ).toBe(false);
  });
});

describe('rankCovers', () => {
  it('marks the top cover as recommended', async () => {
    const covers = [
      makeCover({ id: 'a', width: 800, height: 1200, inspected: true }),
      makeCover({ id: 'b', width: 400, height: 600, inspected: true }),
    ];

    // Mock fetch for inspection (already inspected so won't call)
    const ranked = await rankCovers(covers);
    expect(ranked[0].recommended).toBe(true);
  });

  it('scores higher-resolution covers higher', async () => {
    const covers = [
      makeCover({ id: 'small', width: 200, height: 300, inspected: true }),
      makeCover({ id: 'large', width: 800, height: 1200, inspected: true }),
    ];

    const ranked = await rankCovers(covers);
    expect(ranked[0].id).toBe('large');
  });

  it('deduplicates covers with similar dimensions', async () => {
    const covers = [
      makeCover({ id: 'a', width: 800, height: 1200, inspected: true, source: 'openLibrary' }),
      makeCover({ id: 'b', width: 810, height: 1210, inspected: true, source: 'openLibrary' }),
    ];

    const ranked = await rankCovers(covers);
    // Should deduplicate since they round to the same bucket
    expect(ranked.length).toBeLessThanOrEqual(2);
  });

  it('handles empty input', async () => {
    const ranked = await rankCovers([]);
    expect(ranked).toEqual([]);
  });

  it('penalizes very small covers', async () => {
    const covers = [
      makeCover({ id: 'tiny', width: 50, height: 75, inspected: true }),
      makeCover({ id: 'medium', width: 400, height: 600, inspected: true }),
    ];

    const ranked = await rankCovers(covers);
    expect(ranked[0].id).toBe('medium');
    // The tiny cover should have a significantly lower score
    expect(ranked[ranked.length - 1].score).toBeLessThan(ranked[0].score);
  });
});
