import { Suspense, useEffect, useMemo, useState } from 'react';
import { CommandPalette } from '@/shell/CommandPalette';
import { OfflineBanner, TabBar, TopBar } from '@/shell/Chrome';
import { matchRoute, useHashRoute } from '@/core/router';
import { modules } from '@/modules/registry';
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
  // Home renders the News module — the default tab.
  const active = modules.find((m) => m.id === moduleId) ?? modules[0];
  const Page = active?.component;

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-200 antialiased">
      <TopBar onOpenPalette={() => setPaletteOpen(true)} online={online} />
      <TabBar route={route} />

      <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-4 sm:pl-20 xl:pl-4 sm:pr-4">
        <OfflineBanner online={online} />
        <div className="mt-4">
          <Suspense fallback={<ModuleFallback />}>
            <Page />
          </Suspense>
        </div>
        {/* Keep the old hash routes working so PWA installs and bookmarks survive. */}
        <HashRedirects />
      </main>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

/** One-shot redirects from the pre-restructure routes. */
function HashRedirects() {
  useEffect(() => {
    const redirects: Record<string, string> = {
      '/': '/news',
      '/feed': '/sport',
      '/utilities': '/tools',
    };
    const hash = window.location.hash.replace(/^#/, '') || '/';
    const target = redirects[hash];
    if (target) window.location.replace(`#${target}`);
  }, []);
  return null;
}
