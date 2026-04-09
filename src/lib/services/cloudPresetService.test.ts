// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ProcessingSettings } from '$lib/types';
import {
  applyCloudPresetByShortId,
  buildCloudPresetShareUrl,
  listOwnCloudPresets,
  listPublicCloudPresets,
  publishCloudPreset,
  resetCloudPresetRepository,
} from './cloudPresetService';

function makeSettings(overrides: Partial<ProcessingSettings> = {}): ProcessingSettings {
  return {
    pixelSize: 4,
    palette: 'dmg',
    crtEffect: 'none',
    glitchFilters: [],
    renderMode: 'pixel_perfect',
    glitchSeed: null,
    ditherType: 'none',
    effectLayers: [],
    ...overrides,
  };
}

describe('cloudPresetService', () => {
  beforeEach(() => {
    localStorage.clear();
    resetCloudPresetRepository();
  });

  afterEach(() => {
    localStorage.clear();
    resetCloudPresetRepository();
  });

  it('publishes a public preset into the local cloud repository', async () => {
    const record = await publishCloudPreset({
      name: 'CRT Feed Preset',
      settings: makeSettings({ palette: 'win256' }),
      visibility: 'public',
    });

    expect(record.id).toMatch(/^cloud_/);
    expect(record.shortId).toHaveLength(10);

    const publicPresets = await listPublicCloudPresets();
    expect(publicPresets).toHaveLength(1);
    expect(publicPresets[0].name).toBe('CRT Feed Preset');
  });

  it('keeps unlisted presets out of the public feed', async () => {
    await publishCloudPreset({
      name: 'Hidden Preset',
      settings: makeSettings(),
      visibility: 'unlisted',
    });

    expect(await listPublicCloudPresets()).toHaveLength(0);
    expect(await listOwnCloudPresets()).toHaveLength(1);
  });

  it('applies a cloud preset by short id and increments apply count', async () => {
    const record = await publishCloudPreset({
      name: 'Popular Preset',
      settings: makeSettings({ palette: 'nes' }),
      visibility: 'public',
    });

    const applied = await applyCloudPresetByShortId(record.shortId);

    expect(applied?.shortId).toBe(record.shortId);
    expect(applied?.applyCount).toBe(1);
  });

  it('builds a short cloud preset share url', () => {
    expect(buildCloudPresetShareUrl('abc123', 'https://example.com', '/retro'))
      .toBe('https://example.com/retro/?cloudPreset=abc123');
  });
});
