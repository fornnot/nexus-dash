import type { ComponentType, ReactNode } from 'react';

/* ----------------------------- Module registry ---------------------------- */

export type ModuleId = 'fx' | 'utilities' | 'feed';

/** Everything the shell needs to mount a module. */
export interface ModuleDefinition {
  id: ModuleId;
  name: string;
  /** Short tagline shown in the home dashboard cards. */
  tagline: string;
  /** Drawn from src/core/icons. */
  icon: ReactNode;
  /** Tailwind accent classes (text + bg) used in cards and the palette. */
  accent: string;
  /** Root route of the module, e.g. `/fx`. */
  path: `/${ModuleId}`;
  /** Lazily loaded module page. */
  component: ComponentType;
  /** Flat list of searchable tools exposed to the command palette. */
  tools: ToolDefinition[];
}

/** A single searchable utility/command surfaced in the Cmd+K palette. */
export interface ToolDefinition {
  /** Stable id, e.g. `utilities.json-format`. */
  id: string;
  title: string;
  description: string;
  keywords: string[];
  /** Palette grouping. */
  group: 'FX' | 'Utilities' | 'Feed' | 'Navigate';
  icon: ReactNode;
  /** In-module deep link (hash route, e.g. `/utilities#json-format`). */
  route: string;
  action?: CommandAction;
}

/** Extra palette commands that are not tools (e.g. "Install app"). */
export interface CommandAction {
  run: () => void;
}

/* ------------------------------ Live feed data ---------------------------- */

export type Sport = 'football' | 'basketball' | 'tennis';

export type MatchStatus = 'scheduled' | 'live' | 'finished';

export interface LiveMatch {
  id: string;
  sport: Sport;
  league: string;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  /** Minute, set, quarter... rendered next to LIVE. */
  clock: string | null;
  /** Unix seconds of kickoff. */
  startTime: number;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  /** ISO date string. */
  publishedAt: string;
  url: string;
  /** Optional 1-line summary kept tiny for low-data mode. */
  summary?: string;
}

export type FeedKind = 'scores' | 'news';

export interface FeedPage<T> {
  kind: FeedKind;
  items: T[];
  /** Unix ms when this payload was fetched. */
  fetchedAt: number;
  /** True when served from cache/demo because the network failed. */
  stale: boolean;
}

/* --------------------------------- FX data -------------------------------- */

export interface RatesPayload {
  /** ISO date of the rates snapshot, e.g. `2026-09-14`. */
  date: string;
  base: string;
  rates: Record<string, number>;
  fetchedAt: number;
  stale: boolean;
}
