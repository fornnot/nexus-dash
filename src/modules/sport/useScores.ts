import { useCallback, useState } from 'react';
import { fetchScores } from '../feed/feeds';
import { usePollingFeed } from '@/core/usePollingFeed';
import type { Sport } from '@/core/types';

const SCORES_INTERVAL = 60_000;

const ALL: Sport | 'all' = 'all';

/** Scores feed with a sport filter (persisted lightly via the module state). */
export function useScores() {
  const [sport, setSport] = useState<Sport | 'all'>(ALL);
  const fetcher = useCallback(() => fetchScores(), []);
  return { ...usePollingFeed(fetcher, SCORES_INTERVAL), sport, setSport };
}
