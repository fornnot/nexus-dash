# NexusDash — Super Dashboard PWA

A single lightweight, installable PWA combining daily search utilities and real-time tracking into one dark, mobile-first dashboard. Everything is reachable from a central command bar (**Cmd+K / Ctrl+K**).

## Modules

| Module | Route | Highlights |
| --- | --- | --- |
| **FX & Finance** | `#/fx` | Live ECB fiat rates (Frankfurter) + BTC (CoinGecko), conversion calculator, cross-rate table. Cached for offline use. |
| **Tools** | `#/tools` | 100% client-side: JSON formatter/minifier, image resizer (canvas), text case/count tools, text→PDF export, and a **PDF Converter** — DOCX/HTML/MD/RTF/TXT, CSV/TSV/XLS/XLSX, JSON, images (PNG/JPG/WEBP/GIF/BMP/AVIF) → PDF, plus PDF merge. Works with zero connectivity. |
| **News** | `#/` (home) | Nigerian-first headlines (Punch, Premium Times, Channels TV, Vanguard, The Cable, Daily Trust) + world (BBC, Al Jazeera) every 5 min, with an outlet toggle and cached fallback when offline. |
| **Sport** | `#/sport` | Low-data scores across 13 leagues (EPL, La Liga, Serie A, Bundesliga, Ligue 1, UCL, NPFL, NBA, WNBA, NFL, MLB, NHL, NCAAM) via ESPN's public API, 60 s poll with cached fallback. |

## Folder structure

```
nexus-dash/
├── index.html                  # App shell (dark theme, SW registration)
├── package.json
├── tsconfig.json               # App sources (src/, excl. sw.ts)
├── tsconfig.sw.json            # Service worker (WebWorker lib)
├── tsconfig.node.json          # Vite config typing
├── vite.config.ts              # React + Tailwind v4 + PWA (injectManifest)
├── eslint.config.js
├── scripts/
│   └── generate-icons.mjs      # Zero-dep PNG icon generator (CRC32/deflate)
├── public/
│   ├── favicon.svg
│   ├── manifest.webmanifest
│   └── icons/icon-192.png · icon-512.png
└── src/
    ├── main.tsx                # React entry
    ├── App.tsx                 # Shell: routing, Cmd+K, Suspense, online state
    ├── styles.css              # Tailwind v4 entry + theme tokens
    ├── sw.ts                   # Workbox SW: precache + SWR runtime cache
    ├── core/                   # Framework-agnostic building blocks
    │   ├── types.ts            # ModuleDefinition, ToolDefinition, LiveMatch,
    │   │                       #   NewsItem, FeedPage, RatesPayload …
    │   ├── router.ts           # Hash router (offline-friendly)
    │   ├── useCachedFetch.ts   # fetch + localStorage write-through cache
    │   ├── utils.ts            # cn/cx, formatters, clipboard, debounce
    │   ├── icons.tsx           # Inline SVG icon set
    │   └── primitives.tsx      # Card, Badge, Button, Spinner, StaleChip …
    ├── shell/                  # Root layout & navigation UI
    │   ├── Chrome.tsx          # TopBar (search + online pill), TabBar
    │   │                       #   (bottom tabs ↔ side rail), OfflineBanner
    │   └── CommandPalette.tsx  # Cmd+K fuzzy palette over the tool registry
    └── modules/                # One isolated directory per module
        ├── registry.tsx        # Central module registry (lazy components)
        ├── fx/
        │   ├── manifest.tsx    # Module identity + searchable tools
        │   ├── api.ts          # Frankfurter + CoinGecko fetchers, convert()
        │   ├── useRates.ts     # Cached rates hook (5 min TTL)
        │   ├── Converter.tsx · RateTable.tsx · FXModule.tsx
        ├── utilities/
        │   ├── manifest.tsx
        │   ├── UtilitiesModule.tsx
        │   ├── tools/          # JsonTool · ImageTool · TextTool · PdfTool ·
        │   │                   #   ConvertPdfTool + convert/ engine
        │   │                   #   (docModel · parsers · render · images · merge)
        ├── news/
        │   ├── manifest.tsx
        │   ├── api.ts → feed/feeds.ts  # RSS proxy chain, source registry, demo fallback
        │   ├── prefs.ts        # Persisted enabled-outlets preference (localStorage)
        │   ├── useNews.ts      # Visibility-aware polling hook
        │   └── News.tsx
        └── sport/
            ├── manifest.tsx
            ├── api.ts → feed/feeds.ts  # ESPN multi-league scoreboard fetcher
            ├── useScores.ts    # Visibility-aware polling hook
            └── Scores.tsx
```

## TypeScript contracts (src/core/types.ts)

- `ModuleDefinition` — id, name, tagline, icon, accent, path, lazy `component`, `tools[]`. The shell depends **only** on this.
- `ToolDefinition` — searchable palette entry (`id`, `title`, `keywords`, `group`, `route`).
- `RatesPayload` — `{ date, base, rates, fetchedAt, stale }`.
- `LiveMatch` / `NewsItem` / `FeedPage<T>` — typed live-feed envelopes with `stale` flags.
- `CachedState<T>` — `{ data, loading, stale, error }` returned by `useCachedFetch`.

## Offline strategy

1. **App shell** — `vite-plugin-pwa` (`injectManifest`) precaches every build asset; navigations are served from the precache via `NavigationRoute`.
2. **Runtime data** — Frankfurter / CoinGecko / proxy requests use a `StaleWhileRevalidate` route capped at 64 entries / 24 h.
3. **App-level cache** — `useCachedFetch` mirrors payloads into `localStorage`, so the last FX snapshot and feeds render instantly, even before the SW is active.
4. **Tools** — pure client-side (canvas, Blob, pdf-lib, mammoth, SheetJS); no network at all. The PDF Converter's pdf-lib (~430 kB) is a separate lazy chunk fetched only on first conversion.

## PDF Converter (Tools → PDF Converter)

Everything converts locally in the browser — no uploads:

| Input | Engine |
| --- | --- |
| DOCX | mammoth → HTML → document model |
| HTML/HTM, MD (marked), RTF, TXT | parsed to the shared document model |
| CSV/TSV, XLS/XLSX (SheetJS), JSON | table model → rendered tables |
| PNG/JPG/WEBP/GIF/BMP/AVIF | canvas rasterize → embedded, multiple images combine into one PDF |
| PDF (+PDF) | pdf-lib copy-pages merge into `merged.pdf` |

Options: page size (A4/Letter), orientation, font size, embed-document-images. Documents convert individually (`name.pdf`); all selected images join one `images.pdf`; PDFs merge into one `merged.pdf`.

## Deploying

**GitHub Pages (primary):** push to GitHub and set Settings → Pages → Source to **GitHub Actions**. The committed workflow runs typecheck + lint, builds with base `/<repo>/`, adds a 404 fallback, and deploys on every push to `main` → `https://<user>.github.io/<repo>/`.

**Render:** a Blueprint (`render.yaml`) is included — pick the repo at https://dashboard.render.com/select-repo?type=blueprint and Render builds/serves `dist/` at a root domain.

## Local setup

```bash
# 1. Install dependencies (Node 20+ recommended)
npm install

# 2. Regenerate PWA icons (only needed if you change the brand params)
npm run icons

# 3. Start the dev server (SW registration is dev-suspended by Vite PWA)
npm run dev            # → http://localhost:5173

# 4. Quality gates
npm run typecheck      # tsc over app / sw / node configs
npm run lint           # eslint
npm run build          # typecheck + production build (emits dist/ + sw.js)

# 5. Verify the full PWA (offline, install prompt) against the real build
npm run preview        # → serves dist/ with the service worker active
```

Test offline: run `npm run preview`, load the app once, then DevTools → Network → Offline — the shell, cached FX data, and all utility tools keep working.

## Extending

Add a tool by creating a component under a module's `tools/`, registering it in that module's `manifest.tsx`, and it automatically appears in the command palette, the module page, and hash-route deep links (`#/utilities#json-format`). A new module is just a directory + `manifest.tsx` + one entry in `src/modules/registry.tsx`.
