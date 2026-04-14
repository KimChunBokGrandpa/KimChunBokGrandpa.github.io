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

  it('loads available camera devices after successful permission grant', async () => {
    const store = createRetroCamStore({
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: vi.fn() }],
      } as unknown as MediaStream),
      enumerateDevices: vi.fn().mockResolvedValue([
        { kind: 'videoinput', deviceId: 'front-cam', label: 'Front Camera' },
        { kind: 'videoinput', deviceId: 'rear-cam', label: 'Rear Camera' },
      ] as MediaDeviceInfo[]),
    });

    await store.requestCamera();

    expect(store.availableDevices).toHaveLength(2);
    expect(store.availableDevices[0].label).toBe('Front Camera');
    expect(store.selectedDeviceId).toBe('auto');
  });

  it('requests selected device by exact deviceId when user switches camera', async () => {
    const getUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    } as unknown as MediaStream);
    const store = createRetroCamStore({
      getUserMedia,
      enumerateDevices: vi.fn().mockResolvedValue([
        { kind: 'videoinput', deviceId: 'front-cam', label: 'Front Camera' },
      ] as MediaDeviceInfo[]),
    });

    await store.selectDevice('front-cam');

    expect(getUserMedia).toHaveBeenCalledWith({
      video: { deviceId: { exact: 'front-cam' } },
      audio: false,
    });
    expect(store.selectedDeviceId).toBe('front-cam');
  });
});
