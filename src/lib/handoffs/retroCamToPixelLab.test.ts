import { describe, expect, it } from 'vitest';

import { createHandoffBus } from '$lib/handoffs/handoffBus.svelte';
import { sendRetroCamToPixelLab } from '$lib/handoffs/retroCamToPixelLab';
import { createInMemoryProjectStorageAdapter } from '$lib/projects/storageAdapter';

describe('sendRetroCamToPixelLab', () => {
  it('returns null when no snapshot file exists', async () => {
    const adapter = createInMemoryProjectStorageAdapter();
    const bus = createHandoffBus();

    const result = await sendRetroCamToPixelLab({
      snapshotFile: null,
      activePresetId: 'clean_pixel',
      projectStorage: adapter,
      handoffBus: bus,
    });

    expect(result).toBeNull();
    expect(bus.peek()).toBeNull();
  });

  it('saves capture asset and project, then publishes pixel-lab handoff envelope', async () => {
    const adapter = createInMemoryProjectStorageAdapter();
    const bus = createHandoffBus();
    const snapshotFile = new File(['snapshot'], 'retrocam_snapshot.png', { type: 'image/png' });

    const result = await sendRetroCamToPixelLab({
      snapshotFile,
      activePresetId: 'game_boy',
      projectStorage: adapter,
      handoffBus: bus,
    });

    expect(result).not.toBeNull();
    expect(result?.envelope.toAppId).toBe('pixel-lab');
    expect(result?.envelope.intent).toBe('edit_capture');

    const storedAsset = await adapter.resolveAsset(result!.assetId);
    expect(storedAsset?.asset.filename).toBe('retrocam_snapshot.png');
    expect(storedAsset?.asset.originAppId).toBe('retrocam');
    expect(storedAsset?.asset.role).toBe('capture');
    expect(storedAsset?.asset.byteSize).toBe(snapshotFile.size);

    const storedProject = await adapter.loadProject(result!.manifest.projectId);
    expect(storedProject?.appId).toBe('retrocam');
    expect(storedProject?.programState.kind).toBe('retrocam');
    if (storedProject?.programState.kind === 'retrocam') {
      expect(storedProject.programState.fastPresetId).toBe('game_boy');
      expect(storedProject.programState.lastCaptureAssetId).toBe(result?.assetId);
      expect(storedProject.programState.captureSettings?.mirrored).toBe(true);
    }

    const envelope = bus.peek();
    expect(envelope?.sourceProjectId).toBe(result?.manifest.projectId);
    expect(envelope?.payload).toEqual({
      captureOrigin: 'webcam',
      presetId: 'game_boy',
    });
  });
});
