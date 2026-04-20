import type { CoverCandidate, CoverDimensions } from '@/types';
import { dimensionCache } from '@/lib/cache';

const MIN_GOOD_WIDTH = 400;
const MIN_GOOD_HEIGHT = 600;
const IDEAL_WIDTH = 800;
const LOW_QUALITY_THRESHOLD = 200;

/**
 * Score and rank cover candidates. Inspects dimensions server-side when possible.
 * Returns sorted candidates with the best one marked as recommended.
 */
export async function rankCovers(candidates: CoverCandidate[]): Promise<CoverCandidate[]> {
  if (!candidates.length) return [];

  // Inspect dimensions in parallel (with concurrency limit)
  const inspected = await inspectDimensionsBatch(candidates, 6);

  // Score each candidate
  const scored = inspected.map((cover) => ({
    ...cover,
    score: computeCoverScore(cover),
  }));

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Deduplicate by similar dimensions (keep higher scored)
  const deduped = deduplicateCovers(scored);

  // Mark best as recommended
  if (deduped.length > 0) {
    deduped[0] = { ...deduped[0], recommended: true };
  }

  return deduped;
}

function computeCoverScore(cover: CoverCandidate): number {
  let score = 0;

  // ── Resolution (highest weight: up to 40 points) ──
  if (cover.width && cover.height) {
    const resScore = Math.min(40, (cover.width / IDEAL_WIDTH) * 40);
    score += resScore;

    // Bonus for good aspect ratio (book-like: roughly 2:3)
    const ratio = cover.height / cover.width;
    if (ratio >= 1.3 && ratio <= 1.7) score += 5;
  } else {
    // Unknown dimensions: modest default
    score += 15;
  }

  // ── Source confidence (up to 10 points) ──
  if (cover.source === 'openLibrary') score += 8;
  if (cover.source === 'googleBooks') score += 7;

  // ── Inspected bonus (we know what we're getting) ──
  if (cover.inspected) score += 5;

  // ── Penalty for very small images ──
  if (cover.width && cover.width < LOW_QUALITY_THRESHOLD) score -= 20;
  if (cover.height && cover.height < LOW_QUALITY_THRESHOLD) score -= 20;

  return Math.max(0, Math.min(100, score));
}

async function inspectDimensionsBatch(
  covers: CoverCandidate[],
  concurrency: number
): Promise<CoverCandidate[]> {
  const results: CoverCandidate[] = [];

  for (let i = 0; i < covers.length; i += concurrency) {
    const batch = covers.slice(i, i + concurrency);
    const inspected = await Promise.all(batch.map(inspectSingleCover));
    results.push(...inspected);
  }

  return results;
}

async function inspectSingleCover(cover: CoverCandidate): Promise<CoverCandidate> {
  // Check cache first
  const cached = dimensionCache.get(cover.url);
  if (cached) {
    return { ...cover, width: cached.width, height: cached.height, inspected: true };
  }

  try {
    // Fetch just enough of the image to read dimensions via our proxy
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/covers/proxy?url=${encodeURIComponent(cover.url)}&inspect=true`,
      { next: { revalidate: 1800 } }
    );

    if (res.ok) {
      const dims: CoverDimensions = await res.json();
      dimensionCache.set(cover.url, { width: dims.width, height: dims.height });
      return { ...cover, width: dims.width, height: dims.height, inspected: true };
    }
  } catch {
    // Inspection failed — not fatal
  }

  return cover;
}

/**
 * Remove near-duplicate covers (same source, similar dimensions).
 */
function deduplicateCovers(covers: CoverCandidate[]): CoverCandidate[] {
  const seen = new Set<string>();
  const result: CoverCandidate[] = [];

  for (const cover of covers) {
    const key = cover.width && cover.height
      ? `${cover.source}-${Math.round(cover.width / 50) * 50}x${Math.round(cover.height / 50) * 50}`
      : cover.id;

    if (!seen.has(key)) {
      seen.add(key);
      result.push(cover);
    }
  }

  return result;
}

/**
 * Returns whether a cover is below the quality threshold.
 */
export function isCoverLowQuality(cover: CoverCandidate): boolean {
  if (!cover.width || !cover.height) return false;
  return cover.width < MIN_GOOD_WIDTH || cover.height < MIN_GOOD_HEIGHT;
}
