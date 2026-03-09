import { browser } from '$app/environment';
import type { RGB } from '../utils/palettes';

export interface CustomPalette {
  id: string;
  name: string;
  colors: RGB[];
  createdAt: number;
}

const STORAGE_KEY = 'imageToPixel_customPalettes';

function loadFromStorage(): CustomPalette[] {
  if (!browser) return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to parse custom palettes from localStorage', e);
    return [];
  }
}

function saveToStorage(palettes: CustomPalette[]) {
  if (!browser) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(palettes));
}

export function createCustomPaletteStore() {
  let palettes = $state<CustomPalette[]>(loadFromStorage());

  // Watch for changes and save to local storage
  $effect.root(() => {
    $effect(() => {
      saveToStorage(palettes);
    });
  });

  return {
    get palettes() {
      return palettes;
    },
    addPalette(name: string, colors: RGB[]): CustomPalette {
      const newPalette: CustomPalette = {
        id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        name: name || 'Untitled Palette',
        colors: colors.map(c => ({ ...c })),
        createdAt: Date.now()
      };
      palettes = [...palettes, newPalette];
      return newPalette;
    },
    updatePalette(id: string, name: string, colors: RGB[]) {
      palettes = palettes.map(p => 
        p.id === id 
          ? { ...p, name, colors: colors.map(c => ({ ...c })) }
          : p
      );
    },
    deletePalette(id: string) {
      palettes = palettes.filter(p => p.id !== id);
    },
    getPaletteById(id: string): CustomPalette | undefined {
      return palettes.find(p => p.id === id);
    }
  };
}

export const customPaletteStore = createCustomPaletteStore();
