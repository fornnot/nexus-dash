import { useMemo } from 'react';
import type { LiveMatch, Sport } from '@/core/types';
import { Badge, Button, Card, Spinner, StaleChip } from '@/core/primitives';
import { Icon } from '@/core/icons';
import { cx } from '@/core/utils';
import { useScores } from './useScores';

function statusBadge(m: LiveMatch) {
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
      {new Date(m.startTime * (m.startTime < 1e12 ? 1000 : 1)).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}
    </Badge>
  );
}

const SPORT_FILTERS: Array<{ id: Sport | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'soccer', label: 'Football' },
  { id: 'basketball', label: 'Basketball' },
  { id: 'football', label: 'Am. Football' },
  { id: 'baseball', label: 'Baseball' },
  { id: 'hockey', label: 'Hockey' },
];

/** The Sport tab: every major league, filterable by sport. */
export default function SportPage() {
  const { page, loading, refresh, sport, setSport } = useScores();
  const matches = page?.items ?? [];

  const groups = useMemo(() => {
    const filtered = sport === 'all' ? matches : matches.filter((m) => m.sport === sport);
    const byLeague = new Map<string, LiveMatch[]>();
    for (const m of filtered) {
      const list = byLeague.get(m.league) ?? [];
      list.push(m);
      byLeague.set(m.league, list);
    }
    return [...byLeague.entries()];
  }, [matches, sport]);

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-100">Sport</h1>
          <p className="mt-1 text-sm text-zinc-400">
            All major leagues, live — updated every 60 seconds.
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-2 pt-1">
          {page?.stale && <StaleChip label="demo data" />}
          <Button size="sm" variant="ghost" onClick={() => void refresh()} disabled={loading}>
            {loading ? <Spinner className="size-3.5" /> : <Icon.refresh className="size-3.5" />}
          </Button>
        </span>
      </header>

      <div className="flex flex-wrap gap-1.5" aria-label="Sport filter">
        {SPORT_FILTERS.map((f) => {
          const active = sport === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setSport(f.id)}
              aria-pressed={active}
              className={cx(
                'rounded-full border px-2.5 py-1 text-[11px] transition-colors',
                active
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                  : 'border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300',
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {loading && matches.length === 0 ? (
        <ul className="space-y-2.5 py-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <li key={i} className="h-5 w-3/4 animate-pulse rounded bg-zinc-900" />
          ))}
        </ul>
      ) : (
        groups.map(([league, list]) => (
          <Card key={league}>
            <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-zinc-200">
              <Icon.live className="size-4 text-emerald-300" /> {league}
            </h3>
            <ul className="divide-y divide-zinc-800/60">
              {list.map((m) => (
                <li key={m.id} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-zinc-200">
                      <span className="font-medium">{m.home}</span>{' '}
                      <span className="font-mono text-zinc-100">
                        {m.homeScore ?? '–'} : {m.awayScore ?? '–'}
                      </span>{' '}
                      <span className="font-medium">{m.away}</span>
                    </div>
                  </div>
                  {statusBadge(m)}
                </li>
              ))}
            </ul>
          </Card>
        ))
      )}

      {matches.length === 0 && !loading && (
        <p className="py-6 text-sm text-zinc-500">No fixtures right now — try refreshing.</p>
      )}

      <p className={cx('text-[10px]', page?.stale ? 'text-amber-400/80' : 'text-zinc-600')}>
        {page?.stale
          ? 'Showing demo data — live score endpoints unreachable (offline or blocked)'
          : 'Live via ESPN · updates every 60s while the tab is open'}
      </p>
    </div>
  );
}
