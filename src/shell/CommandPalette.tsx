import { useEffect, useMemo, useRef, useState } from 'react';
import type { ToolDefinition } from '@/core/types';
import { allTools, modules } from '@/modules/registry';
import { Icon } from '@/core/icons';
import { navigate } from '@/core/router';
import { bus, cx } from '@/core/utils';

interface Item {
  key: string;
  title: string;
  description?: string;
  group: ToolDefinition['group'];
  icon: React.ReactNode;
  go: () => void;
}

const navCommands: Item[] = [
  {
    key: 'nav-news',
    title: 'Go to News',
    description: 'Home tab — Nigerian + world headlines',
    group: 'Navigate',
    icon: <Icon.feed className="size-4" />,
    go: () => navigate('/news'),
  },
  ...modules.slice(1).map((m) => ({
    key: `nav-${m.id}`,
    title: `Go to ${m.name}`,
    description: m.tagline,
    group: 'Navigate' as const,
    icon: m.icon,
    go: () => navigate(m.path),
  })),
];

function score(query: string, item: { title: string; description?: string; keywords?: string[] }): number {
  if (!query) return 1;
  const q = query.toLowerCase();
  const t = item.title.toLowerCase();
  if (t.startsWith(q)) return 3;
  if (t.includes(q)) return 2;
  if ((item.keywords ?? []).some((k) => k.includes(q))) return 2;
  if (item.description?.toLowerCase().includes(q)) return 1;
  return 0;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo<Item[]>(() => {
    const toolItems: Item[] = allTools.map((t) => ({
      key: t.id,
      title: t.title,
      description: t.description,
      group: t.group,
      icon: t.icon,
      go: () => {
        navigate(t.route);
        t.action?.run();
      },
    }));
    const all = [...toolItems, ...navCommands];
    const scored = all
      .map((item) => ({ item, s: score(query, item) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s);
    return query ? scored.map((x) => x.item) : all;
  }, [query]);

  useEffect(() => setActive(0), [query, open]);

  useEffect(() => {
    if (open) {
      setQuery('');
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((a) => Math.min(a + 1, items.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        items[active]?.go();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, items, active, onClose]);

  if (!open) return null;

  let lastGroup = '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-zinc-800 px-4">
          <Icon.search className="size-4 shrink-0 text-zinc-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search news, scores, tools…"
            className="h-12 w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none"
          />
          <kbd className="hidden rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-400 sm:block">ESC</kbd>
        </div>

        <ul className="max-h-[46vh] overflow-y-auto overscroll-contain p-2">
          {items.length === 0 && <li className="px-3 py-6 text-center text-sm text-zinc-500">No matching tools</li>}
          {items.map((item, i) => {
            const showGroup = item.group !== lastGroup;
            lastGroup = item.group;
            return (
              <li key={item.key}>
                {showGroup && (
                  <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                    {item.group}
                  </div>
                )}
                <button
                  className={cx(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm',
                    i === active ? 'bg-cyan-500/10 text-cyan-100' : 'text-zinc-300 hover:bg-zinc-800/60',
                  )}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => {
                    item.go();
                    onClose();
                  }}
                >
                  <span className={cx('shrink-0', i === active ? 'text-cyan-300' : 'text-zinc-500')}>{item.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{item.title}</span>
                    {item.description && <span className="block truncate text-xs text-zinc-500">{item.description}</span>}
                  </span>
                  {i === active && <Icon.arrow className="size-3.5 shrink-0 text-cyan-400" />}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-2 text-[10px] text-zinc-600">
          <span>↑↓ navigate · ↵ open · esc close</span>
          <button className="hover:text-zinc-400" onClick={() => bus.emit('palette:install-hint')}>
            install app
          </button>
        </div>
      </div>
    </div>
  );
}
