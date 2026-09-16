import { allNewsSources } from '../feed/feeds';

const STORAGE_KEY = 'nexus.news.sources';

/** Outlet ids enabled by default (all of them). */
export const defaultSourceIds = (): Set<string> => new Set(allNewsSources.map((s) => s.id));

/** Reads the persisted outlet preference, intersected with registered outlets. */
export function loadEnabledSources(): Set<string> {
  const known = defaultSourceIds();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return known;
    const ids = JSON.parse(raw) as unknown;
    if (!Array.isArray(ids) || ids.length === 0) return known;
    return new Set(ids.filter((id): id is string => typeof id === 'string' && known.has(id)));
  } catch {
    return known;
  }
}

export function saveEnabledSources(ids: ReadonlySet<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // Private mode / quota — the preference just won't persist.
  }
}
