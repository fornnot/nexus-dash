# Run doc — NexusDash (nexus-dash)

## Deploy (production)

Two committed options — GitHub Pages is the primary:

**GitHub Pages** (`.github/workflows/deploy.yml`): after pushing to GitHub,
enable Settings → Pages → Source: **GitHub Actions**. Every push to `main`
runs typecheck + lint, builds with base `/<repo>/` (via `GITHUB_PAGES_BASE`
from actions/configure-pages), adds a `404.html` SPA fallback, and deploys.
Local simulation of the subpath build: `MSYS_NO_PATHCONV=1 GITHUB_PAGES_BASE=/nexus-dash/ npm run build`
(the MSYS guard is only needed in Git Bash).

**Render** (`render.yaml` Blueprint): push to GitHub, then open
https://dashboard.render.com/select-repo?type=blueprint and pick the repo —
static site, `npm ci && npm run build`, publishes `./dist` at root with
immutable asset caching.

## Reproduce the artifacts

Fresh checkout needs dependencies installed. There are no secret env files in this project.

```bash
npm install
```

PWA icons are committed under `public/icons/`; only regenerate if the brand
parameters in `scripts/generate-icons.mjs` change:

```bash
npm run icons
```

Quality gates (optional before serving):

```bash
npm run typecheck   # tsc over app / service-worker / node tsconfigs
npm run lint        # eslint
npm run build       # production build → dist/ + sw.js (PWA preview)
```

## Run the server

Development server (HMR, service worker disabled by the Vite PWA `devOptions`):

```bash
npm run dev         # → http://localhost:5173
```

- Default port is 5173 (Vite default; no override in `vite.config.ts`).
- If 5173 is taken, use `npm run dev -- --port <free-port>`.
- Serve the production PWA build instead with `npm run build && npm run preview`
  (serves `dist/` on 4173 by default) — required to test offline behavior and
  the install prompt, since the SW only exists in the production build.

Notes:

- External APIs used at runtime: `api.frankfurter.dev` (fiat FX), `api.coingecko.com`
  (BTC), `site.api.espn.com` (scores — 13 leagues: EPL, La Liga, Serie A,
  Bundesliga, Ligue 1, Champions League, NPFL, NBA, WNBA, NFL, MLB, NHL, NCAAM)
  and RSS news via a
  proxy chain (`api.rss2json.com` primary; `api.allorigins.win`, `api.codetabs.com`
  fallbacks) pulling Punch / Premium Times / Channels TV / Vanguard / The Cable /
  Daily Trust / BBC World / Al Jazeera. Vanguard and The Cable are
  Cloudflare-hardened, so they also carry Google News RSS mirrors as alternate
  feeds. The enabled-outlet set is user-toggleable in the News tab and
  persisted in localStorage (`nexus.news.sources`). All keyless;
  individual source or proxy failures degrade gracefully (per-source skip, then demo data).
- Hash-based routing (`#/news` home, `#/sport`, `#/fx`, `#/tools`) — no server rewrites
  needed; old `#/feed` and `#/utilities` routes redirect to their new homes.
