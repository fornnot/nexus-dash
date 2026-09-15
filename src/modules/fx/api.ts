import type { RatesPayload } from '@/core/types';

export const POPULAR = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'INR', 'BRL', 'ZAR', 'BTC'] as const;

/** Currencies supported by Frankfurter (ECB reference rates). */
export const FIAT = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'INR', 'BRL', 'ZAR'] as const;

export const CURRENCY_NAMES: Record<string, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  JPY: 'Japanese Yen',
  CHF: 'Swiss Franc',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
  CNY: 'Chinese Yuan',
  INR: 'Indian Rupee',
  BRL: 'Brazilian Real',
  ZAR: 'South African Rand',
  BTC: 'Bitcoin',
};

const FRANKFURTER = 'https://api.frankfurter.dev/v1/latest?base=USD';
const COINGECKO = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd';

/** All rates expressed as `1 USD = X <currency>`; BTC uses whole-coin rate. */
export async function fetchLatestRates(): Promise<RatesPayload> {
  const [fiatRes, btcRes] = await Promise.allSettled([
    fetch(FRANKFURTER).then((r) => {
      if (!r.ok) throw new Error(`Frankfurter HTTP ${r.status}`);
      return r.json() as Promise<{ date: string; rates: Record<string, number> }>;
    }),
    fetch(COINGECKO).then((r) => {
      if (!r.ok) throw new Error(`CoinGecko HTTP ${r.status}`);
      return r.json() as Promise<{ bitcoin: { usd: number } }>;
    }),
  ]);

  if (fiatRes.status !== 'fulfilled') throw fiatRes.reason;

  const { date, rates } = fiatRes.value;
  const merged: Record<string, number> = { ...rates, USD: 1 };

  if (btcRes.status === 'fulfilled') {
    merged.BTC = 1 / btcRes.value.bitcoin.usd; // USD per BTC → BTC per USD
  }

  return { date, base: 'USD', rates: merged, fetchedAt: Date.now(), stale: false };
}

export function convert(amount: number, from: string, to: string, rates: Record<string, number>): number {
  const fromRate = from === 'USD' ? 1 : rates[from];
  const toRate = to === 'USD' ? 1 : rates[to];
  if (!fromRate || !toRate) return NaN;
  return (amount / fromRate) * toRate;
}
