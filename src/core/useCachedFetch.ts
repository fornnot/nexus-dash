import { useCallback, useEffect, useRef, useState } from 'react';

export interface CachedFetchOptions<T> {
  /** Max age in ms before a revalidate is attempted on next mount. */
  maxAgeMs: number;
  /** localStorage key; defaults to the URL. */
  cacheKey?: string;
  /** Parse a raw JSON body fetched from `url`. */
  parse?: (raw: unknown) => T;
  /**
   * Custom loader for multi-endpoint payloads (e.g. FX = fiat + crypto).
   * When provided, `url` acts only as the cache label and is not fetched.
   */
  fetcher?: () => Promise<T>;
}

export interface CachedState<T> {
  data: T | null;
  loading: boolean;
  /** True when the value came from cache because the network failed. */
  stale: boolean;
  error: string | null;
}

interface CacheEntry<T> {
  at: number;
  data: T;
}

function readCache<T>(key: string): CacheEntry<T> | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as CacheEntry<T>) : null;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, entry: CacheEntry<T>): void {
  try {
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Quota exceeded — fine, cache is best-effort.
  }
}

const inflight = new Map<string, Promise<unknown>>();

/**
 * Fetch with a localStorage write-through cache: returns the cached value
 * immediately (if any), then revalidates in the background. If the network
 * fails, cached data stays visible and `stale` flips to true.
 *
 * Two modes:
 *  - pass `parse` to fetch `url` as JSON and transform it;
 *  - pass `fetcher` for full control (multi-endpoint, custom headers…).
 */
export function useCachedFetch<T>(
  url: string | null,
  { maxAgeMs, cacheKey, parse, fetcher }: CachedFetchOptions<T>,
): CachedState<T> {
  const key = cacheKey ?? `nexus:cache:${url}`;
  const [entry, setEntry] = useState<CacheEntry<T> | null>(() => readCache<T>(key));
  const [loading, setLoading] = useState(false);
  const [stale, setStale] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const parseRef = useRef(parse);
  const fetcherRef = useRef(fetcher);
  parseRef.current = parse;
  fetcherRef.current = fetcher;

  const revalidate = useCallback(async () => {
    if (!url || inflight.has(key)) return;
    setLoading(true);
    setError(null);
    const promise = (async () => {
      try {
        let data: T;
        if (fetcherRef.current) {
          data = await fetcherRef.current();
        } else {
          const res = await fetch(url, { headers: { Accept: 'application/json' } });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          data = parseRef.current!((await res.json()) as unknown);
        }
        const fresh = { at: Date.now(), data };
        writeCache(key, fresh);
        setEntry(fresh);
        setStale(false);
      } catch (e) {
        setStale(entry !== null);
        if (entry === null) setError(e instanceof Error ? e.message : 'Network error');
      } finally {
        setLoading(false);
      }
    })();
    inflight.set(key, promise);
    try {
      await promise;
    } finally {
      inflight.delete(key);
    }
    // `entry` intentionally omitted: failure handling reads the latest render's value.
  }, [url, key]);

  useEffect(() => {
    if (!url) return;
    const cached = readCache<T>(key);
    setEntry(cached);
    if (!cached || Date.now() - cached.at > maxAgeMs) void revalidate();
  }, [url, key, maxAgeMs, revalidate]);

  return { data: entry?.data ?? null, loading, stale, error };
}
