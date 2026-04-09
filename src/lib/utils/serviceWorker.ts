import { browser, dev } from '$app/environment';
import { base } from '$app/paths';

export function getServiceWorkerUrl(basePath = base): string {
  return `${basePath}/service-worker.js`;
}

export function shouldRegisterServiceWorker(): boolean {
  return (
    browser &&
    !dev &&
    'serviceWorker' in navigator &&
    !(typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window)
  );
}

export async function registerAppServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!shouldRegisterServiceWorker()) return null;

  return navigator.serviceWorker.register(getServiceWorkerUrl());
}
