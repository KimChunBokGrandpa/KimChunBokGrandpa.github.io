import { describe, expect, it } from 'vitest';

import { DEFAULT_POST_FILTERS } from '$lib/types';
import { DEFAULT_PROCESSING_SETTINGS } from '$lib/stores/settingsStore.svelte';
import {
  createAssetId,
  createProjectManifest,
  type LocalAssetRefV1,
  type PixelLabProjectStateV1,
} from '$lib/projects/schema';
import { createInMemoryProjectStorageAdapter } from '$lib/projects/storageAdapter';

function makePixelLabState(): PixelLabProjectStateV1 {
  return {
    kind: 'pixel-lab',
    processingSettings: {
      ...DEFAULT_PROCESSING_SETTINGS,
      glitchFilters: [],
      effectLayers: [],
    },
    postFilters: { ...DEFAULT_POST_FILTERS },
    transformState: {
      rotation: 0,
      cropRect: null,
    },
  };
}

function makeAssetRef(assetId = createAssetId()): LocalAssetRefV1 {
  return {
    assetId,
    role: 'source',
    mimeType: 'image/png',
    storageKey: `assets/${assetId}.png`,
    originAppId: 'pixel-lab',
    createdAt: '2026-04-09T00:00:00.000Z',
    filename: 'test.png',
  };
}

describe('in-memory project storage adapter', () => {
  it('saves and loads project manifests safely', async () => {
    const adapter = createInMemoryProjectStorageAdapter();
    const manifest = createProjectManifest({
      appId: 'pixel-lab',
      name: 'Session A',
      programState: makePixelLabState(),
    });

    const saved = await adapter.saveProject(manifest);
    const loaded = await adapter.loadProject(manifest.projectId);

    expect(saved.projectId).toBe(manifest.projectId);
    expect(loaded?.name).toBe('Session A');

    manifest.name = 'Mutated';
    expect(loaded?.name).toBe('Session A');
  });

  it('returns recent projects sorted by lastOpenedAt descending', async () => {
    const adapter = createInMemoryProjectStorageAdapter();

    await adapter.saveProject(createProjectManifest({
      appId: 'pixel-lab',
      name: 'Older',
      lastOpenedAt: '2026-04-09T09:00:00.000Z',
      programState: makePixelLabState(),
    }));
    await adapter.saveProject(createProjectManifest({
      appId: 'pixel-lab',
      name: 'Newer',
      lastOpenedAt: '2026-04-09T10:00:00.000Z',
      programState: makePixelLabState(),
    }));

    const recent = await adapter.listRecentProjects();
    expect(recent.map((entry) => entry.name)).toEqual(['Newer', 'Older']);
  });

  it('saves, resolves, and deletes assets by explicit project cleanup', async () => {
    const adapter = createInMemoryProjectStorageAdapter();
    const asset = makeAssetRef();
    const blob = new Blob(['pixel'], { type: 'image/png' });

    await adapter.saveAsset({ asset, blob });
    const resolved = await adapter.resolveAsset(asset.assetId);
    expect(resolved?.asset.filename).toBe('test.png');

    const manifest = createProjectManifest({
      appId: 'pixel-lab',
      name: 'Cleanup',
      sourceAssetIds: [asset.assetId],
      programState: makePixelLabState(),
    });
    await adapter.saveProject(manifest);
    await adapter.deleteProject(manifest.projectId, { deleteAssetIds: [asset.assetId] });

    expect(await adapter.loadProject(manifest.projectId)).toBeNull();
    expect(await adapter.resolveAsset(asset.assetId)).toBeNull();
  });
});

