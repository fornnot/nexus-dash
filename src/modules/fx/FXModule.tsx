import { Converter } from './Converter';
import { RateTable } from './RateTable';
import { useRates } from './useRates';
import { Card, Section, Spinner, StaleChip } from '@/core/primitives';

export default function FXModule() {
  const { data, loading, stale, error } = useRates();

  if (loading && !data) {
    return (
      <div className="flex items-center gap-3 py-16 text-sm text-zinc-500">
        <Spinner /> fetching latest rates…
      </div>
    );
  }

  if (error && !data) {
    return (
      <Card className="text-sm text-red-300">
        Couldn't load rates{error ? ` (${error})` : ''}. Check your connection and retry — the converter will work again
        once rates are cached.
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <Section
        title="Financial & FX"
        right={
          stale ? <StaleChip label={`cached · ${new Date(data.fetchedAt).toLocaleTimeString()}`} /> : <span className="text-xs text-zinc-500">live</span>
        }
      >
        <Converter rates={data} />
      </Section>
      <Section title="Rates">{<RateTable rates={data} />}</Section>
    </div>
  );
}
