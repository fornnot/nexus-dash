import type { NewsItem } from '@/core/types';
import { Badge, Button, Card, Spinner, StaleChip } from '@/core/primitives';
import { Icon } from '@/core/icons';
import { useNews } from './useFeeds';
import { fmtRelativeTime } from '@/core/utils';

function HeadlineList({ items }: { items: NewsItem[] }) {
  return (
    <ul className="divide-y divide-zinc-800/60">
      {items.map((n) => (
        <li key={n.id} className="py-2.5">
          <a
            href={n.url}
            target="_blank"
            rel="noreferrer"
            className="block text-sm leading-snug text-zinc-200 hover:text-emerald-300"
          >
            {n.title}
          </a>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-500">
            <Badge>{n.source}</Badge>
            <span>{fmtRelativeTime(new Date(n.publishedAt).getTime() / 1000)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function News() {
  const { page, loading, refresh } = useNews();
  const items = page?.items ?? [];
  const nigeria = items.filter((n) => n.section !== 'world');
  const world = items.filter((n) => n.section === 'world');

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
          <Icon.feed className="size-4 text-emerald-300" /> News — Nigeria &amp; World
        </h3>
        <span className="flex items-center gap-2">
          {page?.stale && <StaleChip label="demo data" />}
          <Button size="sm" variant="ghost" onClick={() => void refresh()} disabled={loading}>
            {loading ? <Spinner className="size-3.5" /> : <Icon.refresh className="size-3.5" />}
          </Button>
        </span>
      </div>

      {nigeria.length > 0 && (
        <section className="mb-4">
          <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-300/90">
            Nigeria
          </h4>
          <HeadlineList items={nigeria} />
        </section>
      )}
      {world.length > 0 && (
        <section>
          <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-sky-300/90">
            World
          </h4>
          <HeadlineList items={world} />
        </section>
      )}
      {items.length === 0 && (
        <div className="flex items-center gap-2 py-6 text-sm text-zinc-500">
          <Spinner className="size-3.5" /> loading headlines…
        </div>
      )}

      <p className="mt-3 text-[10px] text-zinc-600">
        {page?.stale
          ? 'Showing demo data — news feeds unreachable (offline or blocked)'
          : 'Live RSS: Punch · Premium Times · Channels TV · BBC · Al Jazeera · refreshes every 5 minutes'}
      </p>
    </Card>
  );
}

/** Compact homepage edition: a few Nigerian + world headlines and a link into the module. */
export function HomeNewsCard() {
  const { page, loading } = useNews();
  const items = page?.items ?? [];
  const top = [
    ...items.filter((n) => n.section !== 'world').slice(0, 3),
    ...items.filter((n) => n.section === 'world').slice(0, 2),
  ];

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
          <Icon.feed className="size-4 text-emerald-300" /> Headlines
        </h3>
        <a
          href="#/feed"
          className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-cyan-300"
        >
          Live Feed <Icon.arrow className="size-3.5" />
        </a>
      </div>

      {loading && top.length === 0 ? (
        <div className="flex items-center gap-2 py-5 text-sm text-zinc-500">
          <Spinner className="size-3.5" /> loading headlines…
        </div>
      ) : (
        <HeadlineList items={top} />
      )}
      {page?.stale && (
        <p className="mt-2 text-[10px] text-zinc-600">
          Showing demo data — news feeds unreachable right now
        </p>
      )}
    </Card>
  );
}
