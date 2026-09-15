/// <reference lib="webworker" />
import { clientsClaim, setCacheNameDetails } from 'workbox-core';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare let self: ServiceWorkerGlobalScope;

setCacheNameDetails({ prefix: 'nexus' });
self.skipWaiting();
clientsClaim();

// App shell: precached build assets, answered cache-first.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));

// Runtime data (FX rates, feeds): stale-while-revalidate, capped.
registerRoute(
  ({ url }) =>
    url.hostname === 'api.frankfurter.app' ||
    url.hostname === 'api.frankfurter.dev' ||
    url.hostname === 'api.coingecko.com' ||
    url.hostname === 'site.api.espn.com' ||
    url.hostname === 'hn.algolia.com' ||
    url.hostname === 'api.allorigins.win',
  new StaleWhileRevalidate({
    cacheName: 'nexus-runtime-data',
    plugins: [
      new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 24 * 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
);
