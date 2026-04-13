import { beforeEach, describe, expect, it } from 'vitest';
import { createHandoffEnvelope } from '$lib/handoffs/contracts';
import { createAssetId } from '$lib/projects/schema';
import { createInMemoryProjectStorageAdapter } from '$lib/projects/storageAdapter';
import { createPosterMakerStore } from '$lib/stores/posterMakerStore.svelte';

describe('posterMakerStore', () => {
  let adapter = createInMemoryProjectStorageAdapter();

  beforeEach(() => {
    adapter = createInMemoryProjectStorageAdapter();
  });

  it('initializes a blank poster-maker project', async () => {
    const store = createPosterMakerStore(adapter);

    await store.ensureInitialized();

    const recentProjects = await adapter.listRecentProjects();
    expect(recentProjects).toHaveLength(1);
    expect(recentProjects[0]?.appId).toBe('poster-maker');
    expect(store.currentProjectName()).toBe('RETRO STUDIO');
    expect(store.frameStyleId).toBe('classic');
    expect(store.overlayStyleId).toBe('sunset');
    expect(store.stickerStyleId).toBe('pixel_lab');
  });

  it('applies a handoff into a fresh poster-maker document', async () => {
    const store = createPosterMakerStore(adapter);
    await store.ensureInitialized();
    const initialProjectId = store.projectId;

    const assetId = createAssetId();
    await adapter.saveAsset({
      asset: {
        assetId,
        role: 'processed',
        mimeType: 'image/png',
        storageKey: `handoffs/${assetId}.png`,
        originAppId: 'pixel-lab',
        createdAt: new Date().toISOString(),
        filename: 'sample-art.png',
      },
      blob: new Blob(['pixel'], { type: 'image/png' }),
    });

    const imported = await store.applyHandoff(createHandoffEnvelope({
      fromAppId: 'pixel-lab',
      toAppId: 'poster-maker',
      intent: 'place_processed_asset',
      openMode: 'create_project',
      assetId,
      sourceLabel: 'Pixel Lab Transfer',
    }));

    expect(imported).toBe(true);
    expect(store.projectId).not.toBe(initialProjectId);
    expect(store.importedAssetId).toBe(assetId);
    expect(store.importedFilename).toBe('sample-art.png');
    expect(store.titleText).toBe('SAMPLE-ART');
  });

  it('persists and restores decor layer selections', async () => {
    const store = createPosterMakerStore(adapter);
    await store.ensureInitialized();

    await store.setFrameStyle('marquee');
    await store.setOverlayStyle('cool');
    await store.setStickerStyle('new_burst');
    await store.setTitle('Poster Draft');
    await store.setSubtitle('Testing restore');

    const restored = createPosterMakerStore(adapter);
    await restored.ensureInitialized();

    expect(restored.frameStyleId).toBe('marquee');
    expect(restored.overlayStyleId).toBe('cool');
    expect(restored.stickerStyleId).toBe('new_burst');
    expect(restored.titleText).toBe('Poster Draft');
    expect(restored.subtitleText).toBe('Testing restore');
  });

  it('resets the current document while keeping the imported asset', async () => {
    const store = createPosterMakerStore(adapter);
    await store.ensureInitialized();

    const file = new File(['poster'], 'launch-cover.png', { type: 'image/png' });
    const asset = await store.importFile(file, 'poster-maker');
    await store.setPreset('banner');
    await store.setTitle('Custom Headline');
    await store.setSubtitle('Custom Subtitle');
    await store.setFrameStyle('marquee');
    await store.setOverlayStyle('cool');
    await store.setStickerStyle('new_burst');

    await store.resetCurrentDocument();

    expect(store.importedAssetId).toBe(asset.assetId);
    expect(store.importedFilename).toBe('launch-cover.png');
    expect(store.activePresetId).toBe('poster');
    expect(store.titleText).toBe('LAUNCH-COVER');
    expect(store.subtitleText).toBe('Client-only poster layout');
    expect(store.frameStyleId).toBe('classic');
    expect(store.overlayStyleId).toBe('sunset');
    expect(store.stickerStyleId).toBe('pixel_lab');
  });
});
