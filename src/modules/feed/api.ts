import type { FeedPage, LiveMatch, MatchStatus, NewsItem, Sport } from '@/core/types';

/* ------------------------------ Demo fallback ------------------------------ */

const HOUR = 3600_000;

export const demoMatches: LiveMatch[] = [
  {
    id: 'demo-1',
    sport: 'soccer',
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
    sport: 'soccer',
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
    sport: 'football',
    league: 'NFL',
    home: 'Chiefs',
    away: 'Bills',
    homeScore: 24,
    awayScore: 20,
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

/* --------------------------------- Scores --------------------------------- */

/**
 * ESPN's public site API — no key, CORS-open. Each league below costs one
 * scoreboard request per poll; add/remove entries to taste. The service
 * worker serves these stale-while-revalidate, so repeats are cheap.
 */
const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

const LEAGUES: Array<{ path: string; sport: Sport; league: string }> = [
  { path: 'soccer/eng.1', sport: 'soccer', league: 'Premier League' },
  { path: 'soccer/esp.1', sport: 'soccer', league: 'La Liga' },
  { path: 'basketball/nba', sport: 'basketball', league: 'NBA' },
  { path: 'football/nfl', sport: 'football', league: 'NFL' },
];

interface EspnScoreboard {
  events?: Array<{
    id?: string;
    date?: string;
    competitions?: Array<{
      competitors?: Array<{
        homeAway?: 'home' | 'away';
        score?: string;
        team?: { displayName?: string };
      }>;
      status?: { type?: { state?: string; displayClock?: string; shortDetail?: string } };
    }>;
  }>;
}

const toScore = (raw: string | undefined): number | null => {
  const n = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(n) ? n : null;
};

function mapEspnEvent(
  ev: NonNullable<NonNullable<EspnScoreboard['events']>[number]>,
  sport: Sport,
  league: string,
): LiveMatch | null {
  const comp = ev.competitions?.[0];
  if (!comp) return null;
  const home = comp.competitors?.find((c) => c.homeAway === 'home');
  const away = comp.competitors?.find((c) => c.homeAway === 'away');
  const t = comp.status?.type;
  const state: MatchStatus = t?.state === 'in' ? 'live' : t?.state === 'post' ? 'finished' : 'scheduled';
  const start = new Date(ev.date ?? Date.now()).getTime();

  return {
    id: `espn-${ev.id ?? `${league}-${start}-${home?.team?.displayName}`}`,
    sport,
    league,
    home: home?.team?.displayName ?? '—',
    away: away?.team?.displayName ?? '—',
    homeScore: toScore(home?.score),
    awayScore: toScore(away?.score),
    status: state,
    clock: state === 'live' ? (t?.displayClock || t?.shortDetail || null) : null,
    startTime: Math.floor(start / 1000),
  };
}

const rank = (m: LiveMatch): number => (m.status === 'live' ? 0 : m.status === 'scheduled' ? 1 : 2);

function sortMatches(items: LiveMatch[]): LiveMatch[] {
  return [...items].sort((a, b) => rank(a) - rank(b) || a.startTime - b.startTime);
}

export async function fetchScores(): Promise<FeedPage<LiveMatch>> {
  const results = await Promise.allSettled(
    LEAGUES.map(async ({ path, sport, league }) => {
      const res = await fetch(`${ESPN_BASE}/${path}/scoreboard`);
      if (!res.ok) throw new Error(`ESPN ${league}: HTTP ${res.status}`);
      const board = (await res.json()) as EspnScoreboard;
      return (board.events ?? [])
        .map((ev) => mapEspnEvent(ev, sport, league))
        .filter((m): m is LiveMatch => m !== null);
    }),
  );

  const ok = results.filter((r): r is PromiseFulfilledResult<LiveMatch[]> => r.status === 'fulfilled');

  // Every league failed → offline or blocked; degrade to demo data.
  if (ok.length === 0) {
    return { kind: 'scores', items: demoMatches, fetchedAt: Date.now(), stale: true };
  }

  return {
    kind: 'scores',
    items: sortMatches(ok.flatMap((r) => r.value)),
    fetchedAt: Date.now(),
    stale: false,
  };
}

/* ---------------------------------- News ---------------------------------- */

/**
 * Hacker News front page via the Algolia API — one small request, CORS-open,
 * no key. Micro-news for makers, and perfect for a low-data feed.
 */
const HN_URL = 'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=12';

interface HnHit {
  objectID?: string;
  title?: string;
  url?: string | null;
  author?: string;
  points?: number;
  num_comments?: number;
  created_at?: string;
}

export async function fetchNews(): Promise<FeedPage<NewsItem>> {
  try {
    const res = await fetch(HN_URL);
    if (!res.ok) throw new Error(`HN HTTP ${res.status}`);
    const body = (await res.json()) as { hits?: HnHit[] };

    const items: NewsItem[] = (body.hits ?? [])
      .filter((h) => h.objectID && h.title)
      .map((h) => {
        let host = 'news.ycombinator.com';
        if (h.url) {
          try {
            host = new URL(h.url).hostname.replace(/^www\./, '');
          } catch {
            // keep default host
          }
        }
        const meta: string[] = [];
        if (typeof h.points === 'number') meta.push(`${h.points} pts`);
        if (typeof h.num_comments === 'number') meta.push(`${h.num_comments} comments`);
        if (h.author) meta.push(`by ${h.author}`);

        return {
          id: `hn-${h.objectID}`,
          title: h.title!,
          source: host,
          publishedAt: h.created_at ?? new Date().toISOString(),
          url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
          summary: meta.join(' · ') || undefined,
        } satisfies NewsItem;
      });

    if (items.length === 0) throw new Error('HN returned no usable hits');
    return { kind: 'news', items, fetchedAt: Date.now(), stale: false };
  } catch {
    return { kind: 'news', items: demoNews, fetchedAt: Date.now(), stale: true };
  }
}
