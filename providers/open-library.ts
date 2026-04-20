import type { WorkSearchResult, CoverCandidate } from '@/types';
import { cleanTitle, cleanAuthor, normalizeQuery, looksLikeISBN } from '@/lib/formatting';

const OL_BASE = 'https://openlibrary.org';
const OL_COVERS = 'https://covers.openlibrary.org';
const USER_AGENT = 'Shelfie/1.0 (https://github.com/shelfie/shelfie; hello@shelfie.app)';

async function olFetch(path: string): Promise<unknown> {
  const res = await fetch(`${OL_BASE}${path}`, {
    headers: { 'User-Agent': USER_AGENT },
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Open Library ${res.status}: ${path}`);
  return res.json();
}

interface OLSearchDoc {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  edition_count?: number;
  isbn?: string[];
  subtitle?: string;
}

interface OLSearchResponse {
  docs: OLSearchDoc[];
  numFound: number;
}

/**
 * Search Open Library for works matching the query.
 */
export async function searchOpenLibrary(query: string): Promise<WorkSearchResult[]> {
  const normalized = normalizeQuery(query);
  const isISBN = looksLikeISBN(query);

  let searchPath: string;
  if (isISBN) {
    const isbn = query.replace(/[\s-]/g, '');
    searchPath = `/search.json?isbn=${isbn}&limit=10&fields=key,title,author_name,first_publish_year,cover_i,edition_count,isbn,subtitle`;
  } else {
    searchPath = `/search.json?q=${encodeURIComponent(normalized)}&limit=20&fields=key,title,author_name,first_publish_year,cover_i,edition_count,isbn,subtitle`;
  }

  const data = (await olFetch(searchPath)) as OLSearchResponse;

  return data.docs.map((doc, index) => {
    const workKey = doc.key; // e.g. "/works/OL12345W"
    const coverUrl = doc.cover_i
      ? `${OL_COVERS}/b/id/${doc.cover_i}-M.jpg`
      : undefined;

    return {
      id: `ol:${workKey}`,
      title: cleanTitle(doc.title),
      subtitle: doc.subtitle,
      authors: (doc.author_name || []).map(cleanAuthor).filter(Boolean),
      firstPublishYear: doc.first_publish_year,
      thumbnail: coverUrl,
      editionCount: doc.edition_count || 1,
      score: computeOLScore(doc, normalized, isISBN, index),
      sources: ['openLibrary'] as const,
      olWorkKey: workKey,
    };
  });
}

function computeOLScore(
  doc: OLSearchDoc,
  normalizedQuery: string,
  isISBN: boolean,
  rank: number
): number {
  let score = 0;
  const normalizedTitle = normalizeQuery(doc.title);
  const queryTokens = normalizedQuery.split(' ').filter(Boolean);

  // Exact title match (big boost)
  if (normalizedTitle === normalizedQuery) {
    score += 40;
  } else {
    // Token coverage
    const matchedTokens = queryTokens.filter(
      (t) => normalizedTitle.includes(t) ||
        (doc.author_name || []).some((a) => normalizeQuery(a).includes(t))
    );
    score += (matchedTokens.length / queryTokens.length) * 30;
  }

  // ISBN exact match boost
  if (isISBN && doc.isbn?.some((i) => i.replace(/[\s-]/g, '') === normalizedQuery.replace(/[\s-]/g, ''))) {
    score += 25;
  }

  // Has cover (quality signal)
  if (doc.cover_i) score += 10;

  // Edition count (popularity proxy)
  score += Math.min((doc.edition_count || 0) / 10, 10);

  // Has authors
  if (doc.author_name?.length) score += 5;

  // Rank penalty (OL's own relevance ordering has value)
  score -= rank * 0.5;

  return Math.max(0, Math.min(100, score));
}

interface OLEdition {
  key: string;
  title: string;
  covers?: number[];
  authors?: { key: string }[];
  isbn_13?: string[];
  isbn_10?: string[];
  publishers?: string[];
  publish_date?: string;
}

interface OLEditionsResponse {
  entries: OLEdition[];
}

/**
 * Get cover candidates for a specific Open Library work.
 */
export async function getOpenLibraryCovers(workKey: string): Promise<CoverCandidate[]> {
  // Fetch editions to find all cover IDs
  const data = (await olFetch(
    `${workKey}/editions.json?limit=50&offset=0`
  )) as OLEditionsResponse;

  const seenCoverIds = new Set<number>();
  const candidates: CoverCandidate[] = [];

  for (const edition of data.entries) {
    if (!edition.covers?.length) continue;

    for (const coverId of edition.covers) {
      if (coverId <= 0 || seenCoverIds.has(coverId)) continue;
      seenCoverIds.add(coverId);

      const url = `${OL_COVERS}/b/id/${coverId}-L.jpg`;
      candidates.push({
        id: `ol-cover-${coverId}`,
        url,
        proxyUrl: `/api/covers/proxy?url=${encodeURIComponent(url)}`,
        source: 'openLibrary',
        score: 0, // Will be scored after inspection
        inspected: false,
      });
    }
  }

  return candidates;
}
