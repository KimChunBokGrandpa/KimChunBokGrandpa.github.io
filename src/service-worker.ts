/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;

// Cache name with version for cache busting on deploy
const CACHE_NAME = `retro-pixel-${version}`;

// Assets to precache: built JS/CSS + static files
const PRECACHE_ASSETS = [
  ...build,  // built JS/CSS chunks
  ...files,  // static assets from /static
];

// Install: precache all app assets
sw.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  // Activate immediately without waiting for old SW to finish
  sw.skipWaiting();
});

// Activate: clean up old caches
sw.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  // Take control of all clients immediately
  sw.clients.claim();
});

// Fetch: cache-first for precached assets, network-first for others
sw.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests and cross-origin requests
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== sw.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      // Network fallback with cache-on-success
      return fetch(request).then((response) => {
        // Only cache successful responses
        if (response.ok && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback for navigation requests → SPA index.html
        if (request.mode === 'navigate') {
          return caches.match('/index.html') as Promise<Response>;
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
