import { browser, dev } from '$app/environment';
import { base } from '$app/paths';
import { isTauriRuntime } from '$lib/utils/env';

export function getServiceWorkerUrl(basePath = base): string {
  return `${basePath}/service-worker.js`;
}

export function shouldRegisterServiceWorker(): boolean {
  return (
    browser &&
    !dev &&
    'serviceWorker' in navigator &&
    !isTauriRuntime()
  );
}

export async function registerAppServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!shouldRegisterServiceWorker()) return null;

  return navigator.serviceWorker.register(getServiceWorkerUrl());
}
