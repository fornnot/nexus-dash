import { useCallback, useEffect, useState } from 'react';
import type { FeedPage, LiveMatch, NewsItem } from '@/core/types';
import { fetchNews, fetchScores } from './api';
import { loadEnabledSources, saveEnabledSources } from './prefs';

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

/** News feed bound to the persisted outlet preference. */
export function useNews() {
  const [enabled, setEnabled] = useState<Set<string>>(loadEnabledSources);
  const fetcher = useCallback(() => fetchNews(enabled), [enabled]);
  const feed = usePollingFeed<NewsItem>(fetcher, NEWS_INTERVAL);

  /** Toggles an outlet; refetches immediately and persists the choice. */
  const toggleSource = useCallback((id: string) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      // Keep at least one outlet so the feed is never empty by choice.
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      saveEnabledSources(next);
      return next;
    });
  }, []);

  return { ...feed, enabledSources: enabled, toggleSource };
}
