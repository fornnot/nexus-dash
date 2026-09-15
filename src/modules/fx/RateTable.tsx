import { useState } from 'react';
import { Card, StaleChip } from '@/core/primitives';
import { CURRENCY_NAMES, POPULAR, convert } from './api';
import { fmtNumber } from '@/core/utils';
import type { RatesPayload } from '@/core/types';

export function RateTable({ rates }: { rates: RatesPayload }) {
  const [base, setBase] = useState('USD');
  const codes = POPULAR.filter((c) => rates.rates[c] !== undefined || c === 'USD');

  return (
    <Card className="overflow-hidden">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-200">Cross rates</h3>
        {rates.stale && <StaleChip />}
      </div>

      <div className="flex flex-wrap gap-1.5 pb-3">
        {codes.map((c) => (
          <button
            key={c}
            onClick={() => setBase(c)}
            className={
              c === base
                ? 'rounded-lg bg-cyan-500 px-2.5 py-1 text-xs font-medium text-zinc-950'
                : 'rounded-lg border border-zinc-800 px-2.5 py-1 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
            }
          >
            {c}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <tbody>
            {codes.map((c) => {
              const value = convert(1, base, c, rates.rates);
              return (
                <tr key={c} className="border-t border-zinc-800/60 hover:bg-zinc-800/30">
                  <td className="py-2 pr-3 font-medium text-zinc-200">{c}</td>
                  <td className="py-2 pr-3 text-xs text-zinc-500">{CURRENCY_NAMES[c] ?? c}</td>
                  <td className="py-2 text-right font-mono text-zinc-100">
                    {Number.isFinite(value) ? fmtNumber(value, c === 'BTC' ? 8 : 4) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
