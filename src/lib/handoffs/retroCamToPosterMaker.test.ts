import { describe, expect, it } from 'vitest';

import { createHandoffBus } from '$lib/handoffs/handoffBus.svelte';
import { sendRetroCamToPosterMaker } from '$lib/handoffs/retroCamToPosterMaker';
import { createInMemoryProjectStorageAdapter } from '$lib/projects/storageAdapter';

describe('sendRetroCamToPosterMaker', () => {
  it('returns null when no snapshot file exists', async () => {
    const adapter = createInMemoryProjectStorageAdapter();
    const bus = createHandoffBus();

    const result = await sendRetroCamToPosterMaker({
      snapshotFile: null,
      activePresetId: 'clean_pixel',
      projectStorage: adapter,
      handoffBus: bus,
    });

    expect(result).toBeNull();
    expect(bus.peek()).toBeNull();
  });

  it('saves capture asset and project, then publishes poster-maker handoff envelope', async () => {
    const adapter = createInMemoryProjectStorageAdapter();
    const bus = createHandoffBus();
    const snapshotFile = new File(['snapshot'], 'retrocam_snapshot.png', { type: 'image/png' });

    const result = await sendRetroCamToPosterMaker({
      snapshotFile,
      activePresetId: 'warm_poster',
      projectStorage: adapter,
      handoffBus: bus,
    });

    expect(result).not.toBeNull();
    expect(result?.envelope.toAppId).toBe('poster-maker');
    expect(result?.envelope.intent).toBe('place_capture_on_canvas');

    const storedAsset = await adapter.resolveAsset(result!.assetId);
    expect(storedAsset?.asset.filename).toBe('retrocam_snapshot.png');
    expect(storedAsset?.asset.originAppId).toBe('retrocam');
    expect(storedAsset?.asset.role).toBe('capture');

    const storedProject = await adapter.loadProject(result!.manifest.projectId);
    expect(storedProject?.appId).toBe('retrocam');
    expect(storedProject?.programState.kind).toBe('retrocam');
    if (storedProject?.programState.kind === 'retrocam') {
      expect(storedProject.programState.fastPresetId).toBe('warm_poster');
      expect(storedProject.programState.lastCaptureAssetId).toBe(result?.assetId);
    }

    const envelope = bus.peek();
    expect(envelope?.sourceProjectId).toBe(result?.manifest.projectId);
    expect(envelope?.payload).toEqual({
      captureOrigin: 'webcam',
      presetId: 'warm_poster',
      placeMode: 'fit-center',
    });
  });
});
