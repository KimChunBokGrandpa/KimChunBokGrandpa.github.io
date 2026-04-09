import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProcessingSettings } from '$lib/types';

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
  randomUUID: () => `shared-test-${++uuidCounter.value}`,
});

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

import { encodePresetShareCode } from '$lib/utils/presetShare';
import {
  getSharedPresets,
  importSharedPreset,
  markSharedPresetApplied,
  removeSharedPreset,
  sharedPresetStore,
} from './sharedPresetStore.svelte';

describe('sharedPresetStore', () => {
  beforeEach(() => {
    for (const preset of [...sharedPresetStore.presets]) {
      sharedPresetStore.removePreset(preset.id);
    }
    uuidCounter.value = 0;
  });

  it('imports a shared preset into local history', () => {
    const code = encodePresetShareCode(makeSettings({ palette: 'nes' }), 'Inbox Preset');
    const preset = importSharedPreset(code);

    expect(preset.id).toMatch(/^shared_/);
    expect(preset.name).toBe('Inbox Preset');
    expect(preset.settings.palette).toBe('nes');
    expect(getSharedPresets()).toHaveLength(1);
  });

  it('deduplicates by share code and refreshes settings', () => {
    const code = encodePresetShareCode(makeSettings({ palette: 'dmg' }), 'Old Name');
    const first = importSharedPreset(code);
    const second = importSharedPreset(code);

    expect(second.id).toBe(first.id);
    expect(getSharedPresets()).toHaveLength(1);
  });

  it('marks a preset as recently applied', () => {
    const code = encodePresetShareCode(makeSettings(), 'Apply Me');
    const preset = importSharedPreset(code);
    const applied = markSharedPresetApplied(preset.id);

    expect(applied?.id).toBe(preset.id);
    expect(sharedPresetStore.getPresetById(preset.id)?.lastAppliedAt).toBeTypeOf('number');
  });

  it('removes a preset by id', () => {
    const code = encodePresetShareCode(makeSettings(), 'Trash Me');
    const preset = importSharedPreset(code);
    removeSharedPreset(preset.id);

    expect(getSharedPresets()).toHaveLength(0);
  });
});
