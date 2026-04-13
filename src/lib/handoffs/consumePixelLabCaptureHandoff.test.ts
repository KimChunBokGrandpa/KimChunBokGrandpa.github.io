import { describe, expect, it, vi } from 'vitest';

import { createHandoffBus } from '$lib/handoffs/handoffBus.svelte';
import { consumePixelLabCaptureHandoff } from '$lib/handoffs/consumePixelLabCaptureHandoff';
import { createHandoffEnvelope } from '$lib/handoffs/contracts';
import { createAssetId } from '$lib/projects/schema';
import { createInMemoryProjectStorageAdapter } from '$lib/projects/storageAdapter';

describe('consumePixelLabCaptureHandoff', () => {
  it('returns false when no matching pixel-lab capture handoff exists', async () => {
    const bus = createHandoffBus();
    const loadImage = vi.fn();

    const consumed = await consumePixelLabCaptureHandoff({
      handoffBus: bus,
      projectStorage: createInMemoryProjectStorageAdapter(),
      loadImage,
    });

    expect(consumed).toBe(false);
    expect(loadImage).not.toHaveBeenCalled();
  });

  it('loads capture file into pixel lab when stored asset exists', async () => {
    const adapter = createInMemoryProjectStorageAdapter();
    const bus = createHandoffBus();
    const loadImage = vi.fn();
    const assetId = createAssetId();

    await adapter.saveAsset({
      asset: {
        assetId,
        role: 'capture',
        mimeType: 'image/png',
        storageKey: `retrocam-captures/${assetId}.png`,
        originAppId: 'retrocam',
        createdAt: new Date().toISOString(),
        filename: 'retrocam_snapshot.png',
      },
      blob: new Blob(['snapshot'], { type: 'image/png' }),
    });

    bus.publish(createHandoffEnvelope({
      fromAppId: 'retrocam',
      toAppId: 'pixel-lab',
      intent: 'edit_capture',
      openMode: 'create_project',
      assetId,
    }));

    const consumed = await consumePixelLabCaptureHandoff({
      handoffBus: bus,
      projectStorage: adapter,
      loadImage,
    });

    expect(consumed).toBe(true);
    expect(loadImage).toHaveBeenCalledTimes(1);
    const [file] = loadImage.mock.calls[0] as [File];
    expect(file.name).toBe('retrocam_snapshot.png');
    expect(file.type).toBe('image/png');
    expect(bus.peek()).toBeNull();
  });

  it('notifies when handoff asset is missing', async () => {
    const bus = createHandoffBus();
    const loadImage = vi.fn();
    const notifyMissingAsset = vi.fn();

    bus.publish(createHandoffEnvelope({
      fromAppId: 'retrocam',
      toAppId: 'pixel-lab',
      intent: 'edit_capture',
      openMode: 'create_project',
      assetId: 'missing-asset',
    }));

    const consumed = await consumePixelLabCaptureHandoff({
      handoffBus: bus,
      projectStorage: createInMemoryProjectStorageAdapter(),
      loadImage,
      notifyMissingAsset,
      missingAssetMessage: 'retrocam_open_in_pixel_lab_missing',
    });

    expect(consumed).toBe(true);
    expect(loadImage).not.toHaveBeenCalled();
    expect(notifyMissingAsset).toHaveBeenCalledWith('retrocam_open_in_pixel_lab_missing');
  });
});
