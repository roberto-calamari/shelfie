import { describe, it, expect } from 'vitest';

/**
 * Integration tests for API routes.
 *
 * These tests require the Next.js dev server to be running.
 * Run with: npm run dev & sleep 3 && npm test
 *
 * In CI, use the integration test script or Playwright.
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

describe.skip('GET /api/search', () => {
  it('returns results for a known book', async () => {
    const res = await fetch(`${BASE_URL}/api/search?q=The+Great+Gatsby`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.results).toBeDefined();
    expect(data.results.length).toBeGreaterThan(0);
    expect(data.results[0].title).toBeTruthy();
    expect(data.results[0].authors).toBeDefined();
  });

  it('returns 400 for empty query', async () => {
    const res = await fetch(`${BASE_URL}/api/search?q=`);
    expect(res.status).toBe(400);
  });

  it('handles ISBN queries', async () => {
    const res = await fetch(`${BASE_URL}/api/search?q=9780140283334`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.results.length).toBeGreaterThan(0);
  });
});

describe.skip('POST /api/work/covers', () => {
  it('returns covers for a known work', async () => {
    const work = {
      id: 'ol:/works/OL23919A',
      title: 'The Great Gatsby',
      authors: ['F. Scott Fitzgerald'],
      olWorkKey: '/works/OL23919A',
      score: 90,
      sources: ['openLibrary'],
      editionCount: 10,
    };

    const res = await fetch(`${BASE_URL}/api/work/covers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ work }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.covers).toBeDefined();
    expect(data.covers.length).toBeGreaterThan(0);
    // First cover should be recommended
    expect(data.covers[0].recommended).toBe(true);
  });
});

describe.skip('GET /api/covers/proxy', () => {
  it('proxies an Open Library cover', async () => {
    const coverUrl = 'https://covers.openlibrary.org/b/id/8225261-L.jpg';
    const res = await fetch(
      `${BASE_URL}/api/covers/proxy?url=${encodeURIComponent(coverUrl)}`
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('image');
  });

  it('returns dimensions in inspect mode', async () => {
    const coverUrl = 'https://covers.openlibrary.org/b/id/8225261-L.jpg';
    const res = await fetch(
      `${BASE_URL}/api/covers/proxy?url=${encodeURIComponent(coverUrl)}&inspect=true`
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.width).toBeGreaterThan(0);
    expect(data.height).toBeGreaterThan(0);
  });

  it('rejects disallowed hosts', async () => {
    const res = await fetch(
      `${BASE_URL}/api/covers/proxy?url=${encodeURIComponent('https://evil.com/hack.jpg')}`
    );
    expect(res.status).toBe(403);
  });
});

describe.skip('POST /api/export', () => {
  it('generates a PNG from a valid scene', async () => {
    const scene = {
      coverUrl: 'https://covers.openlibrary.org/b/id/8225261-L.jpg',
      coverWidth: 600,
      coverHeight: 900,
      title: 'The Great Gatsby',
      author: 'by F. Scott Fitzgerald',
      rating: 4.5,
      finishedDate: '2026-04-17',
      style: 'dreamy',
      palette: {
        dominant: '#2C5F8A',
        vibrant: '#3B7DD8',
        muted: '#1E4060',
        darkMuted: '#122638',
        lightMuted: '#B8D4EE',
        textColor: '#FFFFFF',
        textSecondary: 'rgba(255,255,255,0.7)',
      },
      showBranding: false,
    };

    const res = await fetch(`${BASE_URL}/api/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scene }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');

    const buffer = await res.arrayBuffer();
    expect(buffer.byteLength).toBeGreaterThan(1000);
  });

  it('rejects invalid scene data', async () => {
    const res = await fetch(`${BASE_URL}/api/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scene: { title: '' } }),
    });

    expect(res.status).toBe(400);
  });
});
