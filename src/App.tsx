import { Suspense, useEffect, useMemo, useState } from 'react';
import { CommandPalette } from '@/shell/CommandPalette';
import { OfflineBanner, TabBar, TopBar } from '@/shell/Chrome';
import { matchRoute, useHashRoute } from '@/core/router';
import { modules } from '@/modules/registry';
import { Icon } from '@/core/icons';
import { Spinner } from '@/core/primitives';

function useOnline(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  return online;
}

function ModuleFallback() {
  return (
    <div className="flex items-center justify-center gap-3 py-24 text-sm text-zinc-500">
      <Spinner /> loading module…
    </div>
  );
}

function HomePage({ onOpenPalette }: { onOpenPalette: () => void }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-100">Super Dashboard</h1>
        <p className="mt-1 max-w-md text-sm text-zinc-400">
          FX rates, offline utilities and a low-data live feed — in one lightweight, installable app.
        </p>
        <button
          onClick={onOpenPalette}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-sm text-zinc-300 hover:border-cyan-500/40 hover:text-cyan-200"
        >
          <Icon.search className="size-4" /> Open command bar
          <kbd className="ml-2 rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-500">⌘K</kbd>
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {modules.map((m) => (
          <a
            key={m.id}
            href={`#${m.path}`}
            className="group rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
          >
            <div className="flex items-center gap-2">
              <span className={m.accent}>{m.icon}</span>
              <span className="font-medium text-zinc-100">{m.name}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{m.tagline}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs text-zinc-500 group-hover:text-cyan-300">
              Open <Icon.arrow className="size-3.5" />
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const route = useHashRoute();
  const online = useOnline();
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Cmd+K / Ctrl+K hotkey, globally.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const { moduleId } = useMemo(() => matchRoute(route), [route]);
  const active = modules.find((m) => m.id === moduleId);
  const Page = active?.component;

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-200 antialiased">
      <TopBar onOpenPalette={() => setPaletteOpen(true)} online={online} />
      <TabBar route={route} />

      <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-4 sm:pl-20 xl:pl-4 sm:pr-4">
        <OfflineBanner online={online} />
        <div className="mt-4">
          {Page ? (
            <Suspense fallback={<ModuleFallback />}>
              <Page />
            </Suspense>
          ) : (
            <HomePage onOpenPalette={() => setPaletteOpen(true)} />
          )}
        </div>
      </main>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
