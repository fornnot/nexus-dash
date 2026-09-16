import type { FeedPage, LiveMatch, MatchStatus, NewsItem, Sport } from '@/core/types';

/* ------------------------------ Demo fallback ----------------------------- */

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
    title: 'National grid: power restored across three regions',
    source: 'Demo Wire',
    section: 'nigeria',
    publishedAt: new Date(Date.now() - 3 * HOUR).toISOString(),
    url: '#',
    summary: 'A quiet day, briefly summarised for low-data reading.',
  },
  {
    id: 'demo-n2',
    title: 'CBN holds policy rate as inflation cools',
    source: 'Demo Wire',
    section: 'nigeria',
    publishedAt: new Date(Date.now() - 7 * HOUR).toISOString(),
    url: '#',
    summary: 'Two sentences, zero megabytes.',
  },
  {
    id: 'demo-n3',
    title: 'Markets: central banks diverge on the path of rates',
    source: 'Demo Wire',
    section: 'world',
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

/** Every major league surfaced on the Sport tab. */
export const LEAGUES: Array<{ path: string; sport: Sport; league: string }> = [
  // Football (soccer)
  { path: 'soccer/eng.1', sport: 'soccer', league: 'Premier League' },
  { path: 'soccer/esp.1', sport: 'soccer', league: 'La Liga' },
  { path: 'soccer/ita.1', sport: 'soccer', league: 'Serie A' },
  { path: 'soccer/ger.1', sport: 'soccer', league: 'Bundesliga' },
  { path: 'soccer/fra.1', sport: 'soccer', league: 'Ligue 1' },
  { path: 'soccer/uefa.champions', sport: 'soccer', league: 'Champions League' },
  { path: 'soccer/nga.1', sport: 'soccer', league: 'NPFL' },
  // US major leagues
  { path: 'basketball/nba', sport: 'basketball', league: 'NBA' },
  { path: 'basketball/wnba', sport: 'basketball', league: 'WNBA' },
  { path: 'football/nfl', sport: 'football', league: 'NFL' },
  { path: 'baseball/mlb', sport: 'baseball', league: 'MLB' },
  { path: 'hockey/nhl', sport: 'hockey', league: 'NHL' },
  // College
  { path: 'basketball/mens-college-basketball', sport: 'basketball', league: 'NCAAM' },
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
 * Nigerian-first headlines. Outlets don't send CORS headers, so RSS is pulled
 * through a chain of CORS-open proxies: rss2json first (returns parsed JSON),
 * then allorigins/codetabs raw + DOMParser as fallbacks. Sources are fetched
 * in parallel and one failing source never kills the whole feed.
 *
 * Cloudflare-hardened outlets (Vanguard, The Cable) reject proxy requests, so
 * they carry a Google News RSS mirror as an alternate feed.
 */

export interface NewsSource {
  /** Stable key used by the outlet toggle + localStorage preference. */
  id: string;
  name: string;
  feedUrl: string;
  section: 'nigeria' | 'world';
  /** Alternate feed tried when the primary fails through every proxy. */
  altFeedUrl?: string;
}

const NEWS_SOURCES: NewsSource[] = [
  { id: 'punch', name: 'Punch', feedUrl: 'https://www.punchng.com/feed/', section: 'nigeria' },
  { id: 'premium-times', name: 'Premium Times', feedUrl: 'https://www.premiumtimesng.com/feed', section: 'nigeria' },
  { id: 'channelstv', name: 'Channels TV', feedUrl: 'https://www.channelstv.com/feed/', section: 'nigeria' },
  {
    id: 'vanguard',
    name: 'Vanguard',
    feedUrl: 'https://www.vanguardngr.com/feed/',
    altFeedUrl: 'https://news.google.com/rss/search?q=when:2d+site:vanguardngr.com&hl=en-NG&gl=NG&ceid=NG:en',
    section: 'nigeria',
  },
  {
    id: 'thecable',
    name: 'The Cable',
    feedUrl: 'https://www.thecable.ng/feed',
    altFeedUrl: 'https://news.google.com/rss/search?q=when:2d+site:thecable.ng&hl=en-NG&gl=NG&ceid=NG:en',
    section: 'nigeria',
  },
  { id: 'dailytrust', name: 'Daily Trust', feedUrl: 'https://www.dailytrust.com/feed/', section: 'nigeria' },
  { id: 'bbc', name: 'BBC World', feedUrl: 'https://feeds.bbci.co.uk/news/world/rss.xml', section: 'world' },
  { id: 'aljazeera', name: 'Al Jazeera', feedUrl: 'https://www.aljazeera.com/xml/rss/all.xml', section: 'world' },
];

/** All registered outlets, for building the toggle UI. */
export const allNewsSources = NEWS_SOURCES;

const NIGERIA_LIMIT = 9;
const WORLD_LIMIT = 6;

const RSS2JSON = 'https://api.rss2json.com/v1/api.json?rss_url=';
const ALLORIGINS = 'https://api.allorigins.win/raw?url=';

interface RawRssItem {
  title?: string;
  link?: string;
  pubDate?: string;
  description?: string;
}

/** rss2json emits `YYYY-MM-DD HH:MM:SS` in UTC; raw feeds emit RFC-822. */
function toIso(raw: string | undefined): string {
  if (!raw) return new Date().toISOString();
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw)
    ? `${raw.replace(' ', 'T')}Z`
    : raw;
  const ms = Date.parse(normalized);
  return new Date(Number.isNaN(ms) ? Date.now() : ms).toISOString();
}

const stripHtml = (html: string | undefined): string | undefined =>
  html
    ?.replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150) || undefined;

async function fetchViaRss2Json(feedUrl: string): Promise<RawRssItem[]> {
  const res = await fetch(`${RSS2JSON}${encodeURIComponent(feedUrl)}`);
  if (!res.ok) throw new Error(`rss2json HTTP ${res.status}`);
  const body = (await res.json()) as { status?: string; items?: RawRssItem[] };
  if (body.status !== 'ok' || !body.items?.length) throw new Error('rss2json: empty feed');
  return body.items;
}

function parseRssXml(xml: string): RawRssItem[] {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  if (doc.querySelector('parsererror')) throw new Error('invalid XML');
  return Array.from(doc.querySelectorAll('item, entry'))
    .map((node): RawRssItem => {
      const pick = (sel: string): string | undefined =>
        node.querySelector(sel)?.textContent?.trim() || undefined;
      const link = pick('link') ?? node.querySelector('link[rel="alternate"]')?.getAttribute('href') ?? undefined;
      return {
        title: pick('title'),
        link,
        pubDate: pick('pubDate') ?? pick('published') ?? pick('updated'),
        description: pick('description') ?? pick('summary'),
      };
    })
    .filter((i): i is RawRssItem & { title: string; link: string } => Boolean(i.title && i.link));
}

async function fetchViaAllOrigins(feedUrl: string): Promise<RawRssItem[]> {
  const res = await fetch(`${ALLORIGINS}${encodeURIComponent(feedUrl)}`);
  if (!res.ok) throw new Error(`allorigins HTTP ${res.status}`);
  return parseRssXml(await res.text());
}

const CODETABS = 'https://api.codetabs.com/v1/proxy?quest=';

async function fetchViaCodeTabs(feedUrl: string): Promise<RawRssItem[]> {
  const res = await fetch(`${CODETABS}${encodeURIComponent(feedUrl)}`);
  if (!res.ok) throw new Error(`codetabs HTTP ${res.status}`);
  return parseRssXml(await res.text());
}

const PROXIES = [fetchViaRss2Json, fetchViaAllOrigins, fetchViaCodeTabs];

/** Tries every proxy against the primary feed, then again against the mirror. */
async function fetchSource(src: NewsSource): Promise<NewsItem[]> {
  const feedUrls = [src.feedUrl, src.altFeedUrl].filter((u): u is string => Boolean(u));
  for (const feedUrl of feedUrls) {
    for (const proxy of PROXIES) {
      try {
        const raw = await proxy(feedUrl);
        if (raw.length === 0) continue;
        return raw.slice(0, 4).map((r, i) => ({
          id: r.link ?? `${src.name}-${i}`.toLowerCase().replace(/\s+/g, '-'),
          title: r.title ?? 'Untitled',
          source: src.name,
          section: src.section,
          publishedAt: toIso(r.pubDate),
          url: r.link ?? '#',
          summary: stripHtml(r.description),
        }));
      } catch {
        // Proxy failed — fall through to the next one.
      }
    }
  }
  return [];
}

const byNewest = (a: NewsItem, b: NewsItem): number => Date.parse(b.publishedAt) - Date.parse(a.publishedAt);

export async function fetchNews(enabledIds?: ReadonlySet<string>): Promise<FeedPage<NewsItem>> {
  const sources = enabledIds
    ? NEWS_SOURCES.filter((s) => enabledIds.has(s.id))
    : NEWS_SOURCES;

  const results = await Promise.allSettled(sources.map(fetchSource));
  const items = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));

  const nigeria = items.filter((n) => n.section !== 'world').sort(byNewest).slice(0, NIGERIA_LIMIT);
  const world = items.filter((n) => n.section === 'world').sort(byNewest).slice(0, WORLD_LIMIT);

  // Every enabled source failed → offline or blocked; degrade to demo data.
  if (nigeria.length === 0 && world.length === 0) {
    return { kind: 'news', items: demoNews, fetchedAt: Date.now(), stale: true };
  }
  return { kind: 'news', items: [...nigeria, ...world], fetchedAt: Date.now(), stale: false };
}
