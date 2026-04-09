/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, prerendered, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;

// Cache name with version for cache busting on deploy
const CACHE_NAME = `retro-pixel-${version}`;
const BASE_PATH = sw.location.pathname.replace(/\/service-worker\.js$/, '');
const APP_SHELL_URL = `${BASE_PATH || ''}/index.html`;

// Assets to precache: built JS/CSS + static files + prerendered shell
const PRECACHE_ASSETS = [
  ...build,
  ...files,
  ...prerendered,
];

// Install: precache all app assets
sw.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([...new Set(PRECACHE_ASSETS)]))
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

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && response.type === 'basic') {
            const clone = response.clone();
            void caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          return (
            (await caches.match(request)) ??
            (await caches.match(APP_SHELL_URL)) ??
            new Response('Offline', { status: 503 })
          );
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const clone = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
