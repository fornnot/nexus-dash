import { Badge, Button, Card, Spinner, StaleChip } from '@/core/primitives';
import { Icon } from '@/core/icons';
import { cx } from '@/core/utils';
import { useScores } from './useFeeds';

function statusBadge(m: { status: string; clock: string | null; startTime: number }) {
  if (m.status === 'live') {
    return (
      <Badge tone="red">
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex size-1.5 rounded-full bg-red-500" />
        </span>
        LIVE {m.clock ?? ''}
      </Badge>
    );
  }
  if (m.status === 'finished') return <Badge>FT</Badge>;
  return (
    <Badge tone="cyan">
      {new Date(m.startTime * (m.startTime < 1e12 ? 1000 : 1)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </Badge>
  );
}

export function Scores() {
  const { page, loading, refresh } = useScores();
  const matches = page?.items ?? [];

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
          <Icon.live className="size-4 text-emerald-300" /> Scores
        </h3>
        <span className="flex items-center gap-2">
          {page?.stale && <StaleChip label="demo data" />}
          <Button size="sm" variant="ghost" onClick={() => void refresh()} disabled={loading}>
            {loading ? <Spinner className="size-3.5" /> : <Icon.refresh className="size-3.5" />}
          </Button>
        </span>
      </div>

      <ul className="divide-y divide-zinc-800/60">
        {matches.map((m) => (
          <li key={m.id} className="flex items-center gap-3 py-2.5">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm text-zinc-200">
                <span className="font-medium">{m.home}</span>{' '}
                <span className="font-mono text-zinc-100">
                  {m.homeScore ?? '–'} : {m.awayScore ?? '–'}
                </span>{' '}
                <span className="font-medium">{m.away}</span>
              </div>
              <div className="truncate text-[11px] text-zinc-500">{m.league}</div>
            </div>
            {statusBadge(m)}
          </li>
        ))}
        {matches.length === 0 && (
          <li className="flex items-center gap-2 py-6 text-sm text-zinc-500">
            <Spinner className="size-3.5" /> loading scores…
          </li>
        )}
      </ul>

      <p className={cx('mt-2 text-[10px]', page?.stale ? 'text-amber-400/80' : 'text-zinc-600')}>
        {page?.stale
          ? 'Showing demo data — connect a scores endpoint in src/modules/feed/api.ts'
          : 'Updates every 60s while the tab is open'}
      </p>
    </Card>
  );
}
