import { describe, it, expect } from 'vitest';
import { searchRequestSchema, storySceneSchema, exportRequestSchema } from '@/lib/validation';

describe('searchRequestSchema', () => {
  it('accepts valid query', () => {
    expect(searchRequestSchema.safeParse({ query: 'The Great Gatsby' }).success).toBe(true);
  });

  it('rejects empty query', () => {
    expect(searchRequestSchema.safeParse({ query: '' }).success).toBe(false);
  });

  it('rejects missing query', () => {
    expect(searchRequestSchema.safeParse({}).success).toBe(false);
  });

  it('rejects excessively long query', () => {
    expect(searchRequestSchema.safeParse({ query: 'a'.repeat(201) }).success).toBe(false);
  });
});

describe('storySceneSchema', () => {
  const validScene = {
    coverUrl: 'https://example.com/cover.jpg',
    coverWidth: 600,
    coverHeight: 900,
    title: 'The Secret History',
    author: 'by Donna Tartt',
    rating: 4.5,
    finishedDate: '2026-04-17',
    style: 'dreamy',
    palette: {
      dominant: '#3B7DD8',
      vibrant: '#4A8DE0',
      muted: '#2A5790',
      darkMuted: '#182F56',
      lightMuted: '#C4D8F2',
      textColor: '#FFFFFF',
      textSecondary: 'rgba(255,255,255,0.7)',
    },
    showBranding: false,
  };

  it('accepts a valid scene', () => {
    expect(storySceneSchema.safeParse(validScene).success).toBe(true);
  });

  it('allows optional rating', () => {
    const { rating, ...noRating } = validScene;
    expect(storySceneSchema.safeParse(noRating).success).toBe(true);
  });

  it('allows optional finishedDate', () => {
    const { finishedDate, ...noDate } = validScene;
    expect(storySceneSchema.safeParse(noDate).success).toBe(true);
  });

  it('rejects invalid style', () => {
    expect(
      storySceneSchema.safeParse({ ...validScene, style: 'neon' }).success
    ).toBe(false);
  });

  it('rejects rating > 5', () => {
    expect(
      storySceneSchema.safeParse({ ...validScene, rating: 6 }).success
    ).toBe(false);
  });

  it('rejects negative cover dimensions', () => {
    expect(
      storySceneSchema.safeParse({ ...validScene, coverWidth: -1 }).success
    ).toBe(false);
  });
});

describe('exportRequestSchema', () => {
  it('wraps scene in export request', () => {
    const validScene = {
      coverUrl: 'https://example.com/cover.jpg',
      coverWidth: 600,
      coverHeight: 900,
      title: 'Test',
      author: 'Test Author',
      style: 'retro',
      palette: {
        dominant: '#000',
        vibrant: '#111',
        muted: '#222',
        darkMuted: '#333',
        lightMuted: '#EEE',
        textColor: '#FFF',
        textSecondary: '#999',
      },
      showBranding: true,
    };

    expect(exportRequestSchema.safeParse({ scene: validScene }).success).toBe(true);
  });
});
