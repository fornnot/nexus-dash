import { useCachedFetch } from '@/core/useCachedFetch';
import { fetchLatestRates } from './api';
import type { RatesPayload } from '@/core/types';

const FIVE_MINUTES = 5 * 60 * 1000;

export function useRates() {
  return useCachedFetch<RatesPayload>('nexus:fx:latest', {
    maxAgeMs: FIVE_MINUTES,
    cacheKey: 'nexus:fx:latest',
    fetcher: fetchLatestRates,
  });
}
