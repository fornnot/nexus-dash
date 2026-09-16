import type { NewsItem } from '@/core/types';
import { Badge, Button, Spinner, StaleChip } from '@/core/primitives';
import { Icon } from '@/core/icons';
import { useNews } from './useNews';
import { allNewsSources } from '../feed/feeds';
import { fmtRelativeTime, cx } from '@/core/utils';

/** One story: headline, summary and source line — the full reading experience. */
function Story({ n }: { n: NewsItem }) {
  return (
    <li className="py-3.5">
      <a href={n.url} target="_blank" rel="noreferrer" className="group block">
        <p className="text-[15px] font-medium leading-snug text-zinc-100 group-hover:text-emerald-300">
          {n.title}
        </p>
        {n.summary && (
          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-zinc-500">{n.summary}</p>
        )}
        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-zinc-500">
          <Badge>{n.source}</Badge>
          <span>{fmtRelativeTime(new Date(n.publishedAt).getTime() / 1000)}</span>
        </div>
      </a>
    </li>
  );
}

/** Toggleable chip per registered outlet; shared state lives in the prefs hook. */
function OutletToggles({
  enabled,
  onToggle,
}: {
  enabled: ReadonlySet<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label="News outlets">
      {allNewsSources.map((s) => {
        const active = enabled.has(s.id);
        return (
          <button
            key={s.id}
            onClick={() => onToggle(s.id)}
            aria-pressed={active}
            title={active ? `Hide ${s.name}` : `Show ${s.name}`}
            className={cx(
              'rounded-full border px-2.5 py-1 text-[11px] transition-colors',
              active
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                : 'border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300',
            )}
          >
            {s.name}
          </button>
        );
      })}
    </div>
  );
}

function Section({
  title,
  accent,
  items,
}: {
  title: string;
  accent: string;
  items: NewsItem[];
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <h4 className={`mb-1 text-[11px] font-semibold uppercase tracking-wider ${accent}`}>{title}</h4>
      <ul className="divide-y divide-zinc-800/60">
        {items.map((n) => (
          <Story key={n.id} n={n} />
        ))}
      </ul>
    </section>
  );
}

/** The home surface: a long, low-data scroll of Nigerian + world headlines. */
export default function NewsPage() {
  const { page, loading, refresh, enabledSources, toggleSource } = useNews();
  const items = page?.items ?? [];
  const nigeria = items.filter((n) => n.section !== 'world');
  const world = items.filter((n) => n.section === 'world');
  const activeNames = allNewsSources
    .filter((s) => enabledSources.has(s.id))
    .map((s) => s.name)
    .join(' · ');

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-100">News</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Nigerian and world headlines — low-data, cached for offline reading.
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-2 pt-1">
          {page?.stale && <StaleChip label="demo data" />}
          <Button size="sm" variant="ghost" onClick={() => void refresh()} disabled={loading}>
            {loading ? <Spinner className="size-3.5" /> : <Icon.refresh className="size-3.5" />}
          </Button>
        </span>
      </header>

      <OutletToggles enabled={enabledSources} onToggle={toggleSource} />

      {loading && items.length === 0 ? (
        <div className="space-y-3 py-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-4/5 animate-pulse rounded bg-zinc-900" />
              <div className="h-3 w-2/5 animate-pulse rounded bg-zinc-900/70" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <Section title="Nigeria" accent="text-emerald-300/90" items={nigeria} />
          <Section title="World" accent="text-sky-300/90" items={world} />
        </>
      )}

      {items.length === 0 && !loading && (
        <p className="py-6 text-sm text-zinc-500">No headlines right now — try refreshing.</p>
      )}

      <p className="text-[10px] text-zinc-600">
        {page?.stale
          ? 'Showing demo data — news feeds unreachable (offline or blocked)'
          : `Live RSS: ${activeNames} · refreshes every 5 minutes`}
      </p>
    </div>
  );
}
