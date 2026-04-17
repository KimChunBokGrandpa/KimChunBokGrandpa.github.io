/**
 * Custom Preset Store — Manages user-created presets persisted in localStorage.
 * Uses the same factory pattern as customPaletteStore.
 */
import { browser } from '$app/environment';
import type { ProcessingSettings } from '$lib/types';

const storageKey = 'retro-pixel-custom-presets';

export interface CustomPreset {
  id: string;
  name: string;
  settings: ProcessingSettings;
  createdAt: number;
}

function loadFromStorage(): CustomPreset[] {
  if (!browser) return [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveToStorage(presets: CustomPreset[]) {
  if (!browser) return;
  try {
    localStorage.setItem(storageKey, JSON.stringify(presets));
  } catch {
    console.error('Failed to save presets to localStorage');
  }
}

function createCustomPresetStore() {
  let presets = $state<CustomPreset[]>(loadFromStorage());

  $effect.root(() => {
    $effect(() => {
      saveToStorage(presets);
    });
  });

  return {
    get presets() {
      return presets;
    },
    addPreset(name: string, settings: ProcessingSettings): CustomPreset {
      const preset: CustomPreset = {
        id: `preset_${crypto.randomUUID()}`,
        name: name.trim() || 'My Preset',
        settings: {
          ...settings,
          glitchFilters: settings.glitchFilters.map(f => ({ ...f })),
          effectLayers: settings.effectLayers?.map(l => ({ ...l })) || [],
        },
        createdAt: Date.now(),
      };
      presets = [...presets, preset];
      return preset;
    },
    removePreset(id: string) {
      presets = presets.filter(p => p.id !== id);
    },
    renamePreset(id: string, newName: string) {
      presets = presets.map(p => p.id === id ? { ...p, name: newName.trim() } : p);
    },
    getPresetById(id: string): CustomPreset | undefined {
      return presets.find(p => p.id === id);
    },
  };
}

export const customPresetStore = createCustomPresetStore();

// Backward-compatible named exports for existing consumers
export function getCustomPresets(): CustomPreset[] {
  return customPresetStore.presets;
}
export function addCustomPreset(name: string, settings: ProcessingSettings): CustomPreset {
  return customPresetStore.addPreset(name, settings);
}
export function removeCustomPreset(id: string) {
  customPresetStore.removePreset(id);
}
export function renameCustomPreset(id: string, newName: string) {
  customPresetStore.renamePreset(id, newName);
}
