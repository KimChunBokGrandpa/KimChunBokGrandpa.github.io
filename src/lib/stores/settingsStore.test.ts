import { describe, expect, it } from 'vitest';
import type { ProcessingSettings } from '$lib/types';
import { createSettingsStore } from './settingsStore.svelte';

function makeSettings(overrides?: Partial<ProcessingSettings>): ProcessingSettings {
  return {
    pixelSize: 1,
    palette: 'original',
    crtEffect: 'none',
    glitchFilters: [],
    renderMode: 'pixel_perfect',
    glitchSeed: null,
    ditherType: 'none',
    effectLayers: [],
    ...overrides,
  };
}

describe('createSettingsStore', () => {
  it('starts with the default processing settings', () => {
    const store = createSettingsStore();

    expect(store.settings.pixelSize).toBe(1);
    expect(store.settings.palette).toBe('original');
    expect(store.saveFormat).toBe('png');
    expect(store.saveQuality).toBe(0.92);
    expect(store.autoProcess).toBe(true);
    expect(store.hasUnappliedChanges).toBe(false);
  });

  it('replaces settings with cloned values', () => {
    const store = createSettingsStore();
    const next = makeSettings({
      pixelSize: 4,
      glitchFilters: [{ type: 'rgb_split', intensity: 0.5 }],
      effectLayers: [{ id: 'scanlines', type: 'glitch', enabled: true, intensity: 0.4, glitchType: 'interlace' }],
    });

    store.setSettings(next);
    next.glitchFilters[0].intensity = 1;
    next.effectLayers![0].intensity = 1;

    expect(store.settings.pixelSize).toBe(4);
    expect(store.settings.glitchFilters[0].intensity).toBe(0.5);
    expect(store.settings.effectLayers![0].intensity).toBe(0.4);
  });

  it('updates palette and derives a settings hash', () => {
    const store = createSettingsStore();

    store.selectPalette('gameboy');

    expect(store.settings.palette).toBe('gameboy');
    expect(store.settingsHash).toContain('"pal":"gameboy"');
  });

  it('tracks save settings and post-filter css', () => {
    const store = createSettingsStore();

    store.setFormat('jpeg');
    store.setQuality(0.8);
    store.postFilters = {
      brightness: 120,
      contrast: 80,
      saturation: 150,
      hueRotate: 45,
    };

    expect(store.saveFormat).toBe('jpeg');
    expect(store.saveQuality).toBe(0.8);
    expect(store.postFilterCss).toContain('brightness(120%)');
    expect(store.postFilterCss).toContain('contrast(80%)');
    expect(store.postFilterCss).toContain('saturate(150%)');
    expect(store.postFilterCss).toContain('hue-rotate(45deg)');
  });

  it('marks and clears unapplied changes', () => {
    const store = createSettingsStore();

    store.setAutoProcess(false);
    store.markUnappliedChanges();
    expect(store.autoProcess).toBe(false);
    expect(store.hasUnappliedChanges).toBe(true);

    store.clearUnappliedChanges();
    expect(store.hasUnappliedChanges).toBe(false);
  });
});
