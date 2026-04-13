import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRetroCamStore } from './retroCamStore.svelte';

describe('retroCamStore', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('enters ready state when webcam access succeeds', async () => {
    const stop = vi.fn();
    const stream = {
      getTracks: () => [{ stop }],
    } as unknown as MediaStream;

    const store = createRetroCamStore({
      getUserMedia: vi.fn().mockResolvedValue(stream),
    });

    await store.requestCamera();

    expect(store.permissionState).toBe('ready');
    expect(store.stream).toBe(stream);
    store.stopCamera();
    expect(stop).toHaveBeenCalled();
  });

  it('maps denied permission errors to denied state', async () => {
    const err = new DOMException('denied', 'NotAllowedError');
    const store = createRetroCamStore({
      getUserMedia: vi.fn().mockRejectedValue(err),
    });

    await store.requestCamera();

    expect(store.permissionState).toBe('denied');
  });

  it('falls back to unsupported when media devices are missing', async () => {
    const store = createRetroCamStore(null);

    await store.requestCamera();

    expect(store.permissionState).toBe('unsupported');
  });
});
