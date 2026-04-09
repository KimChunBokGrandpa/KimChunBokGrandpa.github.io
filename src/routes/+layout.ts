// This app is intentionally client-only in both the web build and the Tauri shell.
// We use adapter-static with an index.html fallback to keep the app in SPA mode.
// See: https://svelte.dev/docs/kit/single-page-apps
// See: https://v2.tauri.app/start/frontend/sveltekit/ for more info
export const ssr = false;
