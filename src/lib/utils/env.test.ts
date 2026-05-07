// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

function setTauriSentinel(key: '__TAURI__' | '__TAURI_INTERNALS__', value: object | undefined) {
  if (value) {
    Object.defineProperty(window, key, {
      configurable: true,
      value,
      writable: true,
    });
    return;
  }

  delete (window as Window & { __TAURI__?: object; __TAURI_INTERNALS__?: object })[key];
}

describe('env', () => {
  afterEach(() => {
    setTauriSentinel('__TAURI__', undefined);
    setTauriSentinel('__TAURI_INTERNALS__', undefined);
    vi.resetModules();
  });

  it('detects Tauri through the legacy __TAURI__ sentinel', async () => {
    setTauriSentinel('__TAURI__', {});

    const { isTauriRuntime } = await import('./env');

    expect(isTauriRuntime()).toBe(true);
  });

  it('detects Tauri through the __TAURI_INTERNALS__ sentinel', async () => {
    setTauriSentinel('__TAURI_INTERNALS__', {});

    const { isTauriRuntime } = await import('./env');

    expect(isTauriRuntime()).toBe(true);
  });
});
