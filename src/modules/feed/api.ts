import type { FeedPage, LiveMatch, NewsItem } from '@/core/types';

/* ------------------------------ Demo fallback ------------------------------ */

const HOUR = 3600_000;

export const demoMatches: LiveMatch[] = [
  {
    id: 'demo-1',
    sport: 'football',
    league: 'Premier League',
    home: 'Arsenal',
    away: 'Chelsea',
    homeScore: 2,
    awayScore: 1,
    status: 'live',
    clock: "67'",
    startTime: Date.now() - 67 * 60_000,
  },
  {
    id: 'demo-2',
    sport: 'football',
    league: 'La Liga',
    home: 'Sevilla',
    away: 'Betis',
    homeScore: null,
    awayScore: null,
    status: 'scheduled',
    clock: null,
    startTime: Date.now() + 2 * HOUR,
  },
  {
    id: 'demo-3',
    sport: 'basketball',
    league: 'NBA',
    home: 'Lakers',
    away: 'Celtics',
    homeScore: 88,
    awayScore: 91,
    status: 'live',
    clock: 'Q3 4:12',
    startTime: Date.now() - 95 * 60_000,
  },
  {
    id: 'demo-4',
    sport: 'tennis',
    league: 'ATP Masters',
    home: 'Alcaraz',
    away: 'Sinner',
    homeScore: 1,
    awayScore: 2,
    status: 'live',
    clock: 'Set 4',
    startTime: Date.now() - 110 * 60_000,
  },
  {
    id: 'demo-5',
    sport: 'football',
    league: 'Serie A',
    home: 'Inter',
    away: 'Milan',
    homeScore: 1,
    awayScore: 1,
    status: 'finished',
    clock: null,
    startTime: Date.now() - 26 * HOUR,
  },
];

export const demoNews: NewsItem[] = [
  {
    id: 'demo-n1',
    title: 'Transfer window: the five moves that actually happened',
    source: 'Demo Wire',
    publishedAt: new Date(Date.now() - 3 * HOUR).toISOString(),
    url: '#',
    summary: 'A quiet deadline day, briefly summarised for low-data reading.',
  },
  {
    id: 'demo-n2',
    title: 'Markets: central banks hold rates as inflation cools',
    source: 'Demo Wire',
    publishedAt: new Date(Date.now() - 7 * HOUR).toISOString(),
    url: '#',
    summary: 'Two sentences, zero megabytes.',
  },
  {
    id: 'demo-n3',
    title: 'Weekend preview: three derbies worth setting an alarm for',
    source: 'Demo Wire',
    publishedAt: new Date(Date.now() - 20 * HOUR).toISOString(),
    url: '#',
  },
];

/* ------------------------------ Live fetching ------------------------------ */

const SCORES_URL = 'https://api.allorigins.win/get?url=' + encodeURIComponent('https://example.com/scores.json');
const NEWS_URL = 'https://api.allorigins.win/get?url=' + encodeURIComponent('https://example.com/news.json');

/**
 * Real deployment: point these at any low-data JSON endpoint (or a tiny
 * worker you control). Parsers below tolerate partial payloads so a flaky
 * upstream degrades to cached/demo data instead of a blank screen.
 */
export async function fetchScores(): Promise<FeedPage<LiveMatch>> {
  try {
    const res = await fetch(SCORES_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as { contents?: string };
    const parsed = JSON.parse(body.contents ?? '{}') as Partial<LiveMatch>[];
    const items: LiveMatch[] = parsed.map((m, i) => ({
      id: String(m.id ?? i),
      sport: m.sport ?? 'football',
      league: m.league ?? '',
      home: m.home ?? '',
      away: m.away ?? '',
      homeScore: m.homeScore ?? null,
      awayScore: m.awayScore ?? null,
      status: m.status ?? 'scheduled',
      clock: m.clock ?? null,
      startTime: m.startTime ?? Math.floor(Date.now() / 1000),
    }));
    return { kind: 'scores', items, fetchedAt: Date.now(), stale: false };
  } catch {
    return { kind: 'scores', items: demoMatches, fetchedAt: Date.now(), stale: true };
  }
}

export async function fetchNews(): Promise<FeedPage<NewsItem>> {
  try {
    const res = await fetch(NEWS_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as { contents?: string };
    const parsed = JSON.parse(body.contents ?? '[]') as Partial<NewsItem>[];
    const items: NewsItem[] = parsed.map((n, i) => ({
      id: String(n.id ?? i),
      title: n.title ?? '',
      source: n.source ?? '',
      publishedAt: n.publishedAt ?? new Date().toISOString(),
      url: n.url ?? '#',
      summary: n.summary,
    }));
    return { kind: 'news', items, fetchedAt: Date.now(), stale: false };
  } catch {
    return { kind: 'news', items: demoNews, fetchedAt: Date.now(), stale: true };
  }
}
