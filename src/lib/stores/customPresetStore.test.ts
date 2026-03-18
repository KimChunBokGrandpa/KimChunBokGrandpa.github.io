import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ProcessingSettings } from '$lib/types';

// Must set up localStorage BEFORE module import
const mockStorage = vi.hoisted(() => new Map<string, string>());

vi.hoisted(() => {
  const storage = {
    getItem: (key: string) => mockStorage.get(key) ?? null,
    setItem: (key: string, value: string) => mockStorage.set(key, value),
    removeItem: (key: string) => mockStorage.delete(key),
    clear: () => mockStorage.clear(),
    get length() { return mockStorage.size; },
    key: () => null,
  };
  Object.defineProperty(globalThis, 'localStorage', { value: storage, writable: true, configurable: true });
});

const uuidCounter = vi.hoisted(() => ({ value: 0 }));
vi.stubGlobal('crypto', {
  randomUUID: () => `test-uuid-${++uuidCounter.value}`,
});

function makeSettings(overrides: Partial<ProcessingSettings> = {}): ProcessingSettings {
  return {
    pixelSize: 4,
    palette: 'gameboy',
    crtEffect: 'none',
    glitchFilters: [{ type: 'none', intensity: 1 }],
    renderMode: 'pixel_perfect',
    glitchSeed: null,
    ditherType: 'none',
    effectLayers: [],
    ...overrides,
  } as ProcessingSettings;
}

// customPresetStore.svelte.ts does NOT export createCustomPresetStore
// We test via the exported singleton + backward-compat functions
import {
  customPresetStore,
  getCustomPresets,
  addCustomPreset,
  removeCustomPreset,
  renameCustomPreset,
} from './customPresetStore.svelte';

describe('customPresetStore', () => {
  beforeEach(() => {
    // Clean up presets added in previous tests
    for (const p of [...customPresetStore.presets]) {
      customPresetStore.removePreset(p.id);
    }
    uuidCounter.value = 0;
  });

  describe('initial state', () => {
    it('should have presets array', () => {
      expect(Array.isArray(customPresetStore.presets)).toBe(true);
    });
  });

  describe('addPreset', () => {
    it('should add preset with preset_ prefix id', () => {
      const preset = customPresetStore.addPreset('My Preset', makeSettings());
      expect(preset.id).toMatch(/^preset_/);
      expect(preset.name).toBe('My Preset');
    });

    it('should default name to "My Preset" when whitespace only', () => {
      const preset = customPresetStore.addPreset('  ', makeSettings());
      expect(preset.name).toBe('My Preset');
    });

    it('should deep-clone glitchFilters and effectLayers', () => {
      const settings = makeSettings({
        glitchFilters: [{ type: 'rgb_split', intensity: 2 }],
        effectLayers: [{ id: 'l1', type: 'glitch', enabled: true, glitchType: 'noise', intensity: 1 }],
      });
      const preset = customPresetStore.addPreset('Clone Test', settings);
      settings.glitchFilters[0].intensity = 3;
      settings.effectLayers![0].enabled = false;
      expect(preset.settings.glitchFilters[0].intensity).toBe(2);
      expect(preset.settings.effectLayers![0].enabled).toBe(true);
    });
  });

  describe('removePreset', () => {
    it('should remove preset by id', () => {
      const preset = customPresetStore.addPreset('Remove Me', makeSettings());
      const countBefore = customPresetStore.presets.length;
      customPresetStore.removePreset(preset.id);
      expect(customPresetStore.presets.length).toBe(countBefore - 1);
    });
  });

  describe('renamePreset', () => {
    it('should rename preset', () => {
      const preset = customPresetStore.addPreset('Old', makeSettings());
      customPresetStore.renamePreset(preset.id, 'New Name');
      expect(customPresetStore.getPresetById(preset.id)?.name).toBe('New Name');
    });

    it('should trim whitespace', () => {
      const preset = customPresetStore.addPreset('Test', makeSettings());
      customPresetStore.renamePreset(preset.id, '  Trimmed  ');
      expect(customPresetStore.getPresetById(preset.id)?.name).toBe('Trimmed');
    });
  });

  describe('getPresetById', () => {
    it('should find existing preset', () => {
      const preset = customPresetStore.addPreset('Find Me', makeSettings());
      expect(customPresetStore.getPresetById(preset.id)?.name).toBe('Find Me');
    });

    it('should return undefined for unknown id', () => {
      expect(customPresetStore.getPresetById('nonexistent')).toBeUndefined();
    });
  });

  describe('backward-compat exports', () => {
    it('getCustomPresets should return same as .presets', () => {
      expect(getCustomPresets()).toBe(customPresetStore.presets);
    });

    it('addCustomPreset should delegate to store', () => {
      const preset = addCustomPreset('Compat', makeSettings());
      expect(preset.name).toBe('Compat');
    });

    it('removeCustomPreset should delegate to store', () => {
      const preset = addCustomPreset('ToRemove', makeSettings());
      const count = customPresetStore.presets.length;
      removeCustomPreset(preset.id);
      expect(customPresetStore.presets.length).toBe(count - 1);
    });

    it('renameCustomPreset should delegate to store', () => {
      const preset = addCustomPreset('OldName', makeSettings());
      renameCustomPreset(preset.id, 'Renamed');
      expect(customPresetStore.getPresetById(preset.id)?.name).toBe('Renamed');
    });
  });
});
