import { LRUCache } from 'lru-cache';

/** Generic in-memory cache with TTL. No database needed. */
const caches = new Map<string, LRUCache<string, unknown>>();

function getOrCreateCache(namespace: string, maxSize = 200, ttlMs = 5 * 60 * 1000) {
  if (!caches.has(namespace)) {
    caches.set(
      namespace,
      new LRUCache<string, unknown>({ max: maxSize, ttl: ttlMs })
    );
  }
  return caches.get(namespace)!;
}

export function cacheGet<T>(namespace: string, key: string): T | undefined {
  const cache = getOrCreateCache(namespace);
  return cache.get(key) as T | undefined;
}

export function cacheSet<T>(namespace: string, key: string, value: T, ttlMs?: number): void {
  const cache = getOrCreateCache(namespace);
  cache.set(key, value, ttlMs ? { ttl: ttlMs } : undefined);
}

/** Search results cache: 5 min TTL */
export const searchCache = {
  get: (query: string) => cacheGet<unknown>('search', query.toLowerCase().trim()),
  set: (query: string, data: unknown) => cacheSet('search', query.toLowerCase().trim(), data),
};

/** Cover candidates cache: 10 min TTL */
export const coverCache = {
  get: (workId: string) => cacheGet<unknown>('covers', workId),
  set: (workId: string, data: unknown) => cacheSet('covers', workId, data, 10 * 60 * 1000),
};

/** Image dimensions cache: 30 min TTL */
export const dimensionCache = {
  get: (url: string) => cacheGet<{ width: number; height: number }>('dimensions', url),
  set: (url: string, dims: { width: number; height: number }) =>
    cacheSet('dimensions', url, dims, 30 * 60 * 1000),
};
