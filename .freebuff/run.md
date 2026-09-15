# Run doc — NexusDash (nexus-dash)

## Deploy to Render (production)

A Render Blueprint is committed at `render.yaml` (static site, `npm ci && npm run build`,
publish `./dist`, immutable asset caching + SPA rewrite). To launch:

1. Push this repo to GitHub.
2. Open https://dashboard.render.com/select-repo?type=blueprint and pick the repo —
   Render reads `render.yaml` and provisions everything.

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
  (BTC), `api.allorigins.win` (feed proxy — falls back to demo data on failure).
- Hash-based routing (`#/fx`, `#/utilities`, `#/feed`) — no server rewrites needed.
