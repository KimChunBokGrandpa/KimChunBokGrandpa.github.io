import { describe, expect, it } from 'vitest';

import { defaultPostFilters } from '$lib/types';
import { defaultProcessingSettings } from '$lib/stores/settingsStore.svelte';
import {
  createProjectManifest,
  createRecentProjectEntry,
  normalizeProjectName,
  type PosterMakerProjectStateV1,
  type PixelLabProjectStateV1,
} from '$lib/projects/schema';

function makePixelLabState(): PixelLabProjectStateV1 {
  return {
    kind: 'pixel-lab',
    processingSettings: {
      ...defaultProcessingSettings,
      glitchFilters: [],
      effectLayers: [],
    },
    postFilters: { ...defaultPostFilters },
    transformState: {
      rotation: 0,
      cropRect: null,
    },
    exportDefaults: {
      format: 'png',
      quality: 0.92,
    },
  };
}

function makePosterMakerState(): PosterMakerProjectStateV1 {
  return {
    kind: 'poster-maker',
    documentPresetId: 'poster',
    canvas: {
      width: 1080,
      height: 1350,
    },
    layers: [],
  };
}

describe('project schema', () => {
  it('normalizes default project names by app', () => {
    expect(normalizeProjectName(undefined, 'pixel-lab')).toBe('Pixel Lab Project');
    expect(normalizeProjectName(undefined, 'poster-maker')).toBe('Poster Maker Project');
    expect(normalizeProjectName(undefined, 'retrocam')).toBe('RetroCam Capture');
  });

  it('localizes poster-maker default names when a locale is provided', () => {
    expect(normalizeProjectName(undefined, 'poster-maker', 'ko')).toBe('Poster Maker 프로젝트');
    expect(normalizeProjectName(undefined, 'poster-maker', 'ja')).toBe('Poster Maker プロジェクト');
  });

  it('creates a manifest with schema version and cloned state', () => {
    const programState = makePixelLabState();
    const manifest = createProjectManifest({
      appId: 'pixel-lab',
      programState,
      sourceAssetIds: ['asset-1'],
    });

    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.name).toBe('Pixel Lab Project');
    expect(manifest.sourceAssetIds).toEqual(['asset-1']);

    programState.processingSettings.pixelSize = 8;
    expect(manifest.programState.kind).toBe('pixel-lab');
    if (manifest.programState.kind !== 'pixel-lab') {
      throw new Error('Expected pixel-lab state');
    }
    expect(manifest.programState.processingSettings.pixelSize).toBe(1);
  });

  it('creates recent project entries from manifests', () => {
    const manifest = createProjectManifest({
      appId: 'pixel-lab',
      name: 'My Lab Session',
      previewAssetId: 'asset-preview',
      programState: makePixelLabState(),
      lastOpenedAt: '2026-04-09T10:00:00.000Z',
    });

    expect(createRecentProjectEntry(manifest)).toEqual({
      projectId: manifest.projectId,
      appId: 'pixel-lab',
      name: 'My Lab Session',
      lastOpenedAt: '2026-04-09T10:00:00.000Z',
      previewAssetId: 'asset-preview',
    });
  });

  it('creates a localized poster manifest when locale is provided', () => {
    const manifest = createProjectManifest({
      appId: 'poster-maker',
      locale: 'ko',
      programState: makePosterMakerState(),
    });

    expect(manifest.name).toBe('Poster Maker 프로젝트');
  });
});
