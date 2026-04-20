import type { WorkSearchResult, CoverCandidate } from '@/types';
import { cleanTitle, cleanAuthor, normalizeQuery, looksLikeISBN } from '@/lib/formatting';

const GB_BASE = 'https://www.googleapis.com/books/v1';

function getApiKey(): string | undefined {
  return process.env.GOOGLE_BOOKS_API_KEY;
}

export function isGoogleBooksAvailable(): boolean {
  return !!getApiKey();
}

interface GBVolumeInfo {
  title: string;
  subtitle?: string;
  authors?: string[];
  publishedDate?: string;
  imageLinks?: {
    thumbnail?: string;
    smallThumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
    extraLarge?: string;
  };
  industryIdentifiers?: Array<{ type: string; identifier: string }>;
}

interface GBVolume {
  id: string;
  volumeInfo: GBVolumeInfo;
}

interface GBSearchResponse {
  totalItems: number;
  items?: GBVolume[];
}

export async function searchGoogleBooks(query: string): Promise<WorkSearchResult[]> {
  const apiKey = getApiKey();
  if (!apiKey) return [];

  const isISBN = looksLikeISBN(query);
  const searchQuery = isISBN ? `isbn:${query.replace(/[\s-]/g, '')}` : query;

  const url = `${GB_BASE}/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=15&key=${apiKey}`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return [];

  const data = (await res.json()) as GBSearchResponse;
  if (!data.items?.length) return [];

  const normalized = normalizeQuery(query);

  return data.items.map((vol, index) => {
    const info = vol.volumeInfo;
    const thumbnail = getBestGBThumbnail(info.imageLinks);
    const year = info.publishedDate ? parseInt(info.publishedDate.slice(0, 4), 10) : undefined;

    return {
      id: `gb:${vol.id}`,
      title: cleanTitle(info.title),
      subtitle: info.subtitle,
      authors: (info.authors || []).map(cleanAuthor),
      firstPublishYear: year && !isNaN(year) ? year : undefined,
      thumbnail: thumbnail ? thumbnail.replace('http://', 'https://') : undefined,
      editionCount: 1,
      score: computeGBScore(info, normalized, isISBN, index),
      sources: ['googleBooks'] as const,
      gbVolumeId: vol.id,
    };
  });
}

function getBestGBThumbnail(links?: GBVolumeInfo['imageLinks']): string | undefined {
  if (!links) return undefined;
  return links.medium || links.small || links.thumbnail || links.smallThumbnail;
}

function computeGBScore(
  info: GBVolumeInfo,
  normalizedQuery: string,
  isISBN: boolean,
  rank: number
): number {
  let score = 0;
  const normalizedTitle = normalizeQuery(info.title);
  const queryTokens = normalizedQuery.split(' ').filter(Boolean);

  if (normalizedTitle === normalizedQuery) {
    score += 38;
  } else {
    const matchedTokens = queryTokens.filter(
      (t) => normalizedTitle.includes(t) ||
        (info.authors || []).some((a) => normalizeQuery(a).includes(t))
    );
    score += (matchedTokens.length / queryTokens.length) * 28;
  }

  if (isISBN) {
    const isbns = (info.industryIdentifiers || []).map((i) => i.identifier.replace(/[\s-]/g, ''));
    if (isbns.includes(normalizedQuery.replace(/[\s-]/g, ''))) score += 25;
  }

  if (info.imageLinks) score += 8;
  if (info.authors?.length) score += 5;
  score -= rank * 0.5;

  return Math.max(0, Math.min(100, score));
}

export async function getGoogleBooksCovers(volumeId: string): Promise<CoverCandidate[]> {
  const apiKey = getApiKey();
  if (!apiKey) return [];

  const url = `${GB_BASE}/volumes/${volumeId}?key=${apiKey}`;
  const res = await fetch(url, { next: { revalidate: 600 } });
  if (!res.ok) return [];

  const vol = (await res.json()) as GBVolume;
  const links = vol.volumeInfo.imageLinks;
  if (!links) return [];

  const candidates: CoverCandidate[] = [];
  const sizes: Array<[string, string | undefined]> = [
    ['extraLarge', links.extraLarge],
    ['large', links.large],
    ['medium', links.medium],
    ['small', links.small],
    ['thumbnail', links.thumbnail],
  ];

  for (const [label, rawUrl] of sizes) {
    if (!rawUrl) continue;
    const httpsUrl = rawUrl.replace('http://', 'https://');
    // Remove zoom parameter constraints for higher quality
    const hiResUrl = httpsUrl.replace(/&zoom=\d/, '&zoom=3');

    candidates.push({
      id: `gb-cover-${volumeId}-${label}`,
      url: hiResUrl,
      proxyUrl: `/api/covers/proxy?url=${encodeURIComponent(hiResUrl)}`,
      source: 'googleBooks',
      score: 0,
      inspected: false,
    });
  }

  return candidates;
}
