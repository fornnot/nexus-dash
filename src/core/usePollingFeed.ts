import { useCallback, useEffect, useRef, useState } from 'react';
import type { FeedPage } from './types';

/**
 * Polls a feed while the tab is visible and keeps the last good data on
 * failure. Pass a `key` to refetch whenever the request inputs change
 * (e.g. the set of enabled news outlets).
 */
export function usePollingFeed<T>(
  fetcher: () => Promise<FeedPage<T>>,
  intervalMs: number,
  key?: string,
) {
  const [page, setPage] = useState<FeedPage<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchRef = useRef(fetcher);
  fetchRef.current = fetcher;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setPage(await fetchRef.current());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    if (document.visibilityState !== 'visible') return;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, intervalMs);
    return () => clearInterval(id);
    // `key` covers fetcher-input changes; the ref keeps the callback stable.
  }, [refresh, intervalMs, key]);

  return { page, loading, refresh };
}
