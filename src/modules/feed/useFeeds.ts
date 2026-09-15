import { useCallback, useEffect, useState } from 'react';
import type { FeedPage, LiveMatch, NewsItem } from '@/core/types';
import { fetchNews, fetchScores } from './api';

const SCORES_INTERVAL = 60_000;
const NEWS_INTERVAL = 5 * 60_000;

/** Polls a feed while the tab is visible; keeps last good data on failure. */
function usePollingFeed<T>(fetcher: () => Promise<FeedPage<T>>, intervalMs: number) {
  const [page, setPage] = useState<FeedPage<T> | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setPage(await fetcher());
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    void refresh();
    if (document.visibilityState !== 'visible') return;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs]);

  return { page, loading, refresh };
}

export const useScores = () => usePollingFeed<LiveMatch>(fetchScores, SCORES_INTERVAL);
export const useNews = () => usePollingFeed<NewsItem>(fetchNews, NEWS_INTERVAL);
