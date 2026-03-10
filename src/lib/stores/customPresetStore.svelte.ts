/**
 * Custom Preset Store — Manages user-created presets persisted in localStorage.
 */
import type { ProcessingSettings } from '$lib/types';

const STORAGE_KEY = 'retro-pixel-custom-presets';

export interface CustomPreset {
  id: string;
  name: string;
  settings: ProcessingSettings;
  createdAt: number;
}

function loadFromStorage(): CustomPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveToStorage(presets: CustomPreset[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

let presets = $state<CustomPreset[]>(loadFromStorage());

export function getCustomPresets(): CustomPreset[] {
  return presets;
}

export function addCustomPreset(name: string, settings: ProcessingSettings): CustomPreset {
  const preset: CustomPreset = {
    id: `preset_${crypto.randomUUID()}`,
    name: name.trim() || 'My Preset',
    settings: {
      ...settings,
      glitchFilters: settings.glitchFilters.map(f => ({ ...f })),
    },
    createdAt: Date.now(),
  };
  presets = [...presets, preset];
  saveToStorage(presets);
  return preset;
}

export function removeCustomPreset(id: string) {
  presets = presets.filter(p => p.id !== id);
  saveToStorage(presets);
}

export function renameCustomPreset(id: string, newName: string) {
  presets = presets.map(p => p.id === id ? { ...p, name: newName.trim() } : p);
  saveToStorage(presets);
}
