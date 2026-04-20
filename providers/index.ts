import type { WorkSearchResult, CoverCandidate } from '@/types';
import { searchOpenLibrary, getOpenLibraryCovers } from './open-library';
import { searchGoogleBooks, getGoogleBooksCovers, isGoogleBooksAvailable } from './google-books';
import { normalizeQuery } from '@/lib/formatting';

export { isGoogleBooksAvailable };

/**
 * Search across all available providers and merge results by work.
 */
export async function searchAllProviders(query: string): Promise<WorkSearchResult[]> {
  const promises: Promise<WorkSearchResult[]>[] = [searchOpenLibrary(query)];

  if (isGoogleBooksAvailable()) {
    promises.push(searchGoogleBooks(query));
  }

  const results = await Promise.allSettled(promises);
  const allResults: WorkSearchResult[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allResults.push(...result.value);
    }
  }

  return mergeAndRankResults(allResults, query);
}

/**
 * Merge results from multiple providers, grouping by likely same work.
 * Uses normalized title + first author as the merge key.
 */
function mergeAndRankResults(results: WorkSearchResult[], query: string): WorkSearchResult[] {
  const groups = new Map<string, WorkSearchResult[]>();

  for (const result of results) {
    const key = getMergeKey(result);
    const existing = groups.get(key) || [];
    existing.push(result);
    groups.set(key, existing);
  }

  const merged: WorkSearchResult[] = [];

  for (const [, group] of groups) {
    if (group.length === 1) {
      merged.push(group[0]);
      continue;
    }

    // Merge: pick best metadata from each source
    const primary = group.reduce((best, curr) => (curr.score > best.score ? curr : best));
    const allSources = [...new Set(group.flatMap((r) => r.sources))];
    const bestThumbnail = group.find((r) => r.thumbnail)?.thumbnail;

    merged.push({
      ...primary,
      sources: allSources as WorkSearchResult['sources'],
      thumbnail: primary.thumbnail || bestThumbnail,
      // Boost score for multi-source confirmation
      score: Math.min(100, primary.score + (allSources.length > 1 ? 8 : 0)),
      editionCount: Math.max(...group.map((r) => r.editionCount)),
      // Carry both IDs for cover fetching
      olWorkKey: group.find((r) => r.olWorkKey)?.olWorkKey,
      gbVolumeId: group.find((r) => r.gbVolumeId)?.gbVolumeId,
    });
  }

  // Sort by score descending
  merged.sort((a, b) => b.score - a.score);

  return merged.slice(0, 15);
}

function getMergeKey(result: WorkSearchResult): string {
  const title = normalizeQuery(result.title).slice(0, 60);
  const author = result.authors.length
    ? normalizeQuery(result.authors[0]).slice(0, 30)
    : 'unknown';
  return `${title}::${author}`;
}

/**
 * Get all cover candidates for a work from all available providers.
 */
export async function getAllCovers(work: WorkSearchResult): Promise<CoverCandidate[]> {
  const promises: Promise<CoverCandidate[]>[] = [];

  if (work.olWorkKey) {
    promises.push(getOpenLibraryCovers(work.olWorkKey));
  }

  if (isGoogleBooksAvailable() && work.gbVolumeId) {
    promises.push(getGoogleBooksCovers(work.gbVolumeId));
  }

  const results = await Promise.allSettled(promises);
  const allCovers: CoverCandidate[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allCovers.push(...result.value);
    }
  }

  return allCovers;
}
