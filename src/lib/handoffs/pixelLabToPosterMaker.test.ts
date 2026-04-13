import { describe, expect, it } from 'vitest';

import { DEFAULT_POST_FILTERS } from '$lib/types';
import { DEFAULT_PROCESSING_SETTINGS } from '$lib/stores/settingsStore.svelte';
import { createHandoffBus } from '$lib/handoffs/handoffBus.svelte';
import { sendPixelLabToPosterMaker } from '$lib/handoffs/pixelLabToPosterMaker';
import { createInMemoryProjectStorageAdapter } from '$lib/projects/storageAdapter';

describe('sendPixelLabToPosterMaker', () => {
  it('returns null when no transfer file exists', async () => {
    const adapter = createInMemoryProjectStorageAdapter();
    const bus = createHandoffBus();

    const result = await sendPixelLabToPosterMaker({
      transferFile: null,
      projectStorage: adapter,
      handoffBus: bus,
      snapshot: {
        settings: {
          ...DEFAULT_PROCESSING_SETTINGS,
          glitchFilters: [],
          effectLayers: [],
        },
        postFilters: { ...DEFAULT_POST_FILTERS },
        rotation: 0,
        cropRect: null,
        saveFormat: 'png',
        saveQuality: 0.92,
      },
    });

    expect(result).toBeNull();
    expect(bus.peek()).toBeNull();
  });

  it('saves asset and project, then publishes poster-maker handoff envelope', async () => {
    const adapter = createInMemoryProjectStorageAdapter();
    const bus = createHandoffBus();
    const transferFile = new File(['pixels'], 'pixel-lab-poster-input.png', { type: 'image/png' });

    const result = await sendPixelLabToPosterMaker({
      transferFile,
      projectStorage: adapter,
      handoffBus: bus,
      snapshot: {
        settings: {
          ...DEFAULT_PROCESSING_SETTINGS,
          palette: 'gameboy',
          glitchFilters: [],
          effectLayers: [],
        },
        postFilters: {
          ...DEFAULT_POST_FILTERS,
          brightness: 120,
        },
        rotation: 90,
        cropRect: { x: 4, y: 5, w: 80, h: 60 },
        saveFormat: 'webp',
        saveQuality: 0.81,
      },
    });

    expect(result).not.toBeNull();
    expect(result?.envelope.toAppId).toBe('poster-maker');
    expect(result?.envelope.intent).toBe('place_processed_asset');

    const storedAsset = await adapter.resolveAsset(result!.assetId);
    expect(storedAsset?.asset.filename).toBe('pixel-lab-poster-input.png');
    expect(storedAsset?.asset.originAppId).toBe('pixel-lab');

    const storedProject = await adapter.loadProject(result!.manifest.projectId);
    expect(storedProject?.appId).toBe('pixel-lab');
    expect(storedProject?.programState.kind).toBe('pixel-lab');
    if (storedProject?.programState.kind === 'pixel-lab') {
      expect(storedProject.programState.processingSettings.palette).toBe('gameboy');
      expect(storedProject.programState.postFilters.brightness).toBe(120);
      expect(storedProject.programState.transformState.rotation).toBe(90);
      expect(storedProject.programState.exportDefaults?.format).toBe('webp');
      expect(storedProject.programState.exportDefaults?.quality).toBe(0.81);
    }

    const envelope = bus.peek();
    expect(envelope?.assetId).toBe(result?.assetId);
    expect(envelope?.sourceProjectId).toBe(result?.manifest.projectId);
    expect(envelope?.payload).toEqual({ placeMode: 'fit-center' });
  });
});
