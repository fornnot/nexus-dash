import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchLatestRates } from '../fx/api';
import type { RatesPayload } from '@/core/types';

const FIVE_MINUTES = 5 * 60 * 1000;

/**
 * FX rates with a three-tier cache: service-worker stale-while-revalidate,
 * then localStorage mirror (survives SW eviction), then network. Rates don't
 * change intra-day, so a 5-minute TTL keeps polls nearly free.
 */
export function useRates() {
  const [data, setData] = useState<RatesPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchRef = useRef(fetchLatestRates);
  fetchRef.current = fetchLatestRates;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchRef.current();
      setData(payload);
      if (!payload.stale) {
        try {
          localStorage.setItem('nexus:fx:latest', JSON.stringify(payload));
        } catch {
          // Private mode / quota — the mirror just won't persist.
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load rates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Hydrate from the localStorage mirror immediately, then refresh.
    try {
      const raw = localStorage.getItem('nexus:fx:latest');
      if (raw) {
        const cached = JSON.parse(raw) as RatesPayload;
        if (cached?.rates) {
          setData(cached);
          setLoading(false);
        }
      }
    } catch {
      // Ignore malformed cache.
    }
    void refresh();
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, FIVE_MINUTES);
    return () => clearInterval(id);
  }, [refresh]);

  return { data, loading, stale: data?.stale ?? false, error, refresh };
}
