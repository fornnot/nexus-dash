import { useEffect, useState } from 'react';
import { Icon } from '@/core/icons';
import { cx } from '@/core/utils';
import { modules } from '@/modules/registry';
import { navigate } from '@/core/router';

/** Top bar: brand, global search trigger, online indicator. */
export function TopBar({ onOpenPalette, online }: { onOpenPalette: () => void; online: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
        <a href="#/news" className="flex items-center gap-2 font-semibold tracking-tight text-zinc-100">
          <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 text-[13px] font-bold text-zinc-950">
            N
          </span>
          <span className="hidden sm:block">Nexus</span>
        </a>

        <button
          onClick={onOpenPalette}
          className="ml-auto flex h-9 flex-1 max-w-md items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 text-sm text-zinc-500 hover:border-zinc-700 hover:text-zinc-400"
        >
          <Icon.search className="size-4" />
          <span className="flex-1 text-left">Search tools…</span>
          <kbd className="hidden rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] sm:block">⌘K</kbd>
        </button>

        <span
          className={cx('ml-1 flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px]', online ? 'text-emerald-300' : 'text-amber-300')}
          title={online ? 'Online' : 'Offline — tools still work'}
        >
          {online ? <Icon.wifi className="size-4" /> : <Icon.wifiOff className="size-4" />}
          <span className="hidden sm:block">{online ? 'online' : 'offline'}</span>
        </span>
      </div>
    </header>
  );
}

/** Bottom tab bar (mobile) / left rail (sm+). Home tab = News. */
export function TabBar({ route }: { route: string }) {
  const isActive = (path: string) =>
    route === path || route.startsWith(`${path}/`) || route.startsWith(`${path}#`);

  const items = [
    { path: '/news', label: 'News', icon: <Icon.feed className="size-5" /> },
    ...modules.slice(1).map((m) => ({ path: m.path, label: m.name, icon: m.icon })),
  ];

  return (
    <>
      {/* Mobile bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800/80 bg-zinc-950/90 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
        <div className="grid grid-cols-4">
          {items.map((it) => (
            <button
              key={it.path}
              onClick={() => navigate(it.path)}
              className={cx(
                'flex flex-col items-center gap-1 py-2 text-[10px]',
                isActive(it.path) ? 'text-cyan-300' : 'text-zinc-500 hover:text-zinc-300',
              )}
            >
              {it.icon}
              {it.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Desktop side rail */}
      <nav className="fixed left-0 top-14 z-30 hidden h-[calc(100vh-3.5rem)] w-16 flex-col items-center gap-1 border-r border-zinc-800/80 py-4 sm:flex xl:w-52 xl:items-stretch xl:px-3">
        {items.map((it) => {
          const active = isActive(it.path);
          return (
            <button
              key={it.path}
              onClick={() => navigate(it.path)}
              className={cx(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm',
                active ? 'bg-zinc-800/80 text-cyan-200' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200',
                'xl:w-full',
              )}
              title={it.label}
            >
              {it.icon}
              <span className="hidden xl:block">{it.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

/** Slim banner when the device is offline. */
export function OfflineBanner({ online }: { online: boolean }) {
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    if (online) setDismissed(false);
  }, [online]);
  if (online || dismissed) return null;
  return (
    <div className="mx-auto mt-2 flex max-w-3xl items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
      <Icon.wifiOff className="size-4 shrink-0" />
      <span className="flex-1">You're offline — tools work fully, feeds show cached data.</span>
      <button onClick={() => setDismissed(true)} className="text-amber-300/80 hover:text-amber-100">
        ✕
      </button>
    </div>
  );
}
