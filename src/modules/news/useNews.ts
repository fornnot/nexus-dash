import { useCallback, useState } from 'react';
import { fetchNews } from '../feed/feeds';
import { loadEnabledSources, saveEnabledSources } from './prefs';
import { usePollingFeed } from '@/core/usePollingFeed';

const NEWS_INTERVAL = 5 * 60_000;

/** News feed bound to the persisted outlet preference. */
export function useNews() {
  const [enabled, setEnabled] = useState<Set<string>>(loadEnabledSources);
  const fetcher = useCallback(() => fetchNews(enabled), [enabled]);
  // `key` refetches whenever the enabled set changes.
  const feed = usePollingFeed(fetcher, NEWS_INTERVAL, [...enabled].sort().join(','));

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
