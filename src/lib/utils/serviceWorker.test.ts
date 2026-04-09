import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('serviceWorker utils', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('builds service worker URL with base path', async () => {
    vi.doMock('$app/environment', () => ({ browser: true }));
    vi.doMock('$app/paths', () => ({ base: '/retro' }));

    const { getServiceWorkerUrl } = await import('./serviceWorker');

    expect(getServiceWorkerUrl()).toBe('/retro/service-worker.js');
  });

  it('returns null when service worker should not register', async () => {
    vi.doMock('$app/environment', () => ({ browser: false }));
    vi.doMock('$app/paths', () => ({ base: '' }));

    const { registerAppServiceWorker } = await import('./serviceWorker');

    await expect(registerAppServiceWorker()).resolves.toBeNull();
  });
});
