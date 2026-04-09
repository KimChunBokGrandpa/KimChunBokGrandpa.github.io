import { browser } from '$app/environment';
import type { ProcessingSettings } from '$lib/types';
import { normalizePresetShareInput } from '$lib/utils/presetShare';

const STORAGE_KEY = 'retro-pixel-shared-presets';

export interface SharedPresetRecord {
  id: string;
  name: string;
  shareCode: string;
  settings: ProcessingSettings;
  importedAt: number;
  lastAppliedAt: number;
}

function cloneSettings(settings: ProcessingSettings): ProcessingSettings {
  return {
    ...settings,
    glitchFilters: settings.glitchFilters.map((filter) => ({ ...filter })),
    effectLayers: settings.effectLayers?.map((layer) => ({ ...layer })) ?? [],
  };
}

function loadFromStorage(): SharedPresetRecord[] {
  if (!browser) return [];
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

function saveToStorage(presets: SharedPresetRecord[]) {
  if (!browser) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch {
    console.error('Failed to save shared presets to localStorage');
  }
}

function createSharedPresetStore() {
  let presets = $state<SharedPresetRecord[]>(loadFromStorage());

  $effect.root(() => {
    $effect(() => {
      saveToStorage(presets);
    });
  });

  function moveToFront(record: SharedPresetRecord) {
    presets = [record, ...presets.filter((item) => item.id !== record.id)];
  }

  return {
    get presets() {
      return presets;
    },
    importPreset(input: string): SharedPresetRecord {
      const normalized = normalizePresetShareInput(input);
      const now = Date.now();
      const existing = presets.find((item) => item.shareCode === normalized.code);
      const record: SharedPresetRecord = existing
        ? {
            ...existing,
            name: normalized.payload.name,
            settings: cloneSettings(normalized.payload.settings),
            lastAppliedAt: now,
          }
        : {
            id: `shared_${crypto.randomUUID()}`,
            name: normalized.payload.name,
            shareCode: normalized.code,
            settings: cloneSettings(normalized.payload.settings),
            importedAt: now,
            lastAppliedAt: now,
          };
      moveToFront(record);
      return record;
    },
    markApplied(id: string): SharedPresetRecord | undefined {
      const existing = presets.find((item) => item.id === id);
      if (!existing) return undefined;
      const record = {
        ...existing,
        lastAppliedAt: Date.now(),
      };
      moveToFront(record);
      return record;
    },
    removePreset(id: string) {
      presets = presets.filter((item) => item.id !== id);
    },
    getPresetById(id: string): SharedPresetRecord | undefined {
      return presets.find((item) => item.id === id);
    },
  };
}

export const sharedPresetStore = createSharedPresetStore();

export function getSharedPresets(): SharedPresetRecord[] {
  return sharedPresetStore.presets;
}

export function importSharedPreset(input: string): SharedPresetRecord {
  return sharedPresetStore.importPreset(input);
}

export function markSharedPresetApplied(id: string): SharedPresetRecord | undefined {
  return sharedPresetStore.markApplied(id);
}

export function removeSharedPreset(id: string) {
  sharedPresetStore.removePreset(id);
}
