import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProjectManifest, createAssetId } from '$lib/projects/schema';
import { createInMemoryProjectStorageAdapter } from '$lib/projects/storageAdapter';
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

  it('keeps the previous stream alive when switching to a failing device', async () => {
    const stop = vi.fn();
    const readyStream = {
      getTracks: () => [{ stop }],
    } as unknown as MediaStream;
    const getUserMedia = vi.fn()
      .mockResolvedValueOnce(readyStream)
      .mockRejectedValueOnce(new DOMException('missing', 'NotFoundError'));

    const store = createRetroCamStore({
      getUserMedia,
      enumerateDevices: vi.fn().mockResolvedValue([
        { kind: 'videoinput', deviceId: 'front-cam', label: 'Front Camera' },
        { kind: 'videoinput', deviceId: 'rear-cam', label: 'Rear Camera' },
      ] as MediaDeviceInfo[]),
    });

    await store.requestCamera();
    const streamBeforeFailure = store.stream;

    await store.selectDevice('rear-cam');

    expect(store.permissionState).toBe('unavailable');
    expect(store.stream).toBe(streamBeforeFailure);
    expect(stop).not.toHaveBeenCalled();
  });

  it('restores the last snapshot from a saved retrocam project', async () => {
    const adapter = createInMemoryProjectStorageAdapter();
    const assetId = createAssetId();
    await adapter.saveAsset({
      asset: {
        assetId,
        role: 'capture',
        mimeType: 'image/png',
        storageKey: `retrocam-captures/${assetId}.png`,
        originAppId: 'retrocam',
        createdAt: new Date().toISOString(),
        filename: 'saved-capture.png',
      },
      blob: new Blob(['capture'], { type: 'image/png' }),
    });
    const manifest = createProjectManifest({
      appId: 'retrocam',
      name: 'Saved RetroCam Capture',
      primaryAssetId: assetId,
      previewAssetId: assetId,
      sourceAssetIds: [assetId],
      derivedAssetIds: [assetId],
      programState: {
        kind: 'retrocam',
        inputMode: 'webcam',
        fastPresetId: 'warm_poster',
        lastCaptureAssetId: assetId,
        captureSettings: {
          mirrored: true,
        },
      },
    });
    await adapter.saveProject(manifest);

    const store = createRetroCamStore(null, adapter);
    const loaded = await store.loadProject(manifest.projectId);
    const recentProjects = await adapter.listRecentProjects({ limit: 1 });

    expect(loaded?.projectId).toBe(manifest.projectId);
    expect(store.lastSnapshotFile?.name).toBe('saved-capture.png');
    expect(store.activePresetId).toBe('warm_poster');
    expect(store.lastSnapshotPresetId).toBe('warm_poster');
    expect(recentProjects[0]?.projectId).toBe(manifest.projectId);
    expect(Date.parse(loaded?.lastOpenedAt ?? '')).toBeGreaterThanOrEqual(Date.parse(manifest.lastOpenedAt));
  });
});
