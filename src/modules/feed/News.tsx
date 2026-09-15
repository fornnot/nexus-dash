import { Badge, Button, Card, Spinner, StaleChip } from '@/core/primitives';
import { Icon } from '@/core/icons';
import { useNews } from './useFeeds';
import { fmtRelativeTime } from '@/core/utils';

export function News() {
  const { page, loading, refresh } = useNews();
  const items = page?.items ?? [];

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
          <Icon.feed className="size-4 text-emerald-300" /> Micro-news
        </h3>
        <span className="flex items-center gap-2">
          {page?.stale && <StaleChip label="demo data" />}
          <Button size="sm" variant="ghost" onClick={() => void refresh()} disabled={loading}>
            {loading ? <Spinner className="size-3.5" /> : <Icon.refresh className="size-3.5" />}
          </Button>
        </span>
      </div>

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
        {items.length === 0 && (
          <li className="flex items-center gap-2 py-6 text-sm text-zinc-500">
            <Spinner className="size-3.5" /> loading headlines…
          </li>
        )}
      </ul>

      <p className="mt-2 text-[10px] text-zinc-600">
        {page?.stale
          ? 'Showing demo data — Hacker News unreachable (offline or blocked)'
          : 'Live from Hacker News · refreshes every 5 minutes'}
      </p>
    </Card>
  );
}
