import { useMemo, useState } from 'react';
import { Badge, Button, Card } from '@/core/primitives';
import { Icon } from '@/core/icons';
import { fmtNumber } from '@/core/utils';
import { CURRENCY_NAMES, POPULAR, convert } from './api';
import type { RatesPayload } from '@/core/types';

const QUICK_AMOUNTS = [1, 10, 100, 1000];

export function Converter({ rates }: { rates: RatesPayload }) {
  const pairs = useMemo(
    () => POPULAR.filter((c) => rates.rates[c] !== undefined || c === 'USD'),
    [rates],
  );

  const [amount, setAmount] = useState('100');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('EUR');

  const numeric = Number.parseFloat(amount) || 0;
  const result = convert(numeric, from, to, rates.rates);
  const unitRate = convert(1, from, to, rates.rates);

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-200">Converter</h3>
        <Badge tone="cyan">{rates.date}</Badge>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <label className="block">
          <span className="mb-1 block text-xs text-zinc-500">Amount</span>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-lg font-medium text-zinc-100 outline-none focus:border-cyan-500/50"
          />
        </label>

        <Button
          variant="ghost"
          aria-label="Swap currencies"
          className="mx-auto size-9 rounded-full p-0 sm:mb-0.5"
          onClick={() => {
            setFrom(to);
            setTo(from);
          }}
        >
          <Icon.swap className="size-4" />
        </Button>

        <div className="grid grid-cols-2 gap-2 sm:contents">
          <label className="block">
            <span className="mb-1 block text-xs text-zinc-500">From</span>
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-2 text-sm text-zinc-100 outline-none focus:border-cyan-500/50"
            >
              {pairs.map((c) => (
                <option key={c} value={c}>
                  {c} — {CURRENCY_NAMES[c] ?? c}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-zinc-500">To</span>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-2 text-sm text-zinc-100 outline-none focus:border-cyan-500/50"
            >
              {pairs.map((c) => (
                <option key={c} value={c}>
                  {c} — {CURRENCY_NAMES[c] ?? c}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-baseline gap-2 rounded-xl bg-zinc-950/70 p-4">
        <span className="text-2xl font-semibold tracking-tight text-cyan-300">
          {Number.isFinite(result) ? fmtNumber(result, result >= 100 ? 2 : 4) : '—'}
        </span>
        <span className="text-sm text-zinc-400">{to}</span>
        <span className="ml-auto text-xs text-zinc-500">
          {Number.isFinite(unitRate) ? `1 ${from} = ${fmtNumber(unitRate, 4)} ${to}` : ''}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {QUICK_AMOUNTS.map((a) => (
          <Button key={a} size="sm" variant={String(a) === amount ? 'primary' : 'subtle'} onClick={() => setAmount(String(a))}>
            {a}
          </Button>
        ))}
      </div>
    </Card>
  );
}
