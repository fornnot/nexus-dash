/** Cached module pages still need their deps bundled; these helpers are used by more than one module. */

/** Number formatting shared by FX + feed modules. */
export function fmtNumber(value: number, digits = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function fmtRelativeTime(unixSeconds: number): string {
  const diff = Date.now() / 1000 - unixSeconds;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function fmtClock(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Tiny event bus so the palette can tell the shell to open/install things. */
type Handler = (payload?: unknown) => void;
const handlers = new Map<string, Set<Handler>>();

export const bus = {
  on(event: string, fn: Handler): () => void {
    const set = handlers.get(event) ?? new Set<Handler>();
    set.add(fn);
    handlers.set(event, set);
    return () => set.delete(fn);
  },
  emit(event: string, payload?: unknown): void {
    handlers.get(event)?.forEach((fn) => fn(payload));
  },
};

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
