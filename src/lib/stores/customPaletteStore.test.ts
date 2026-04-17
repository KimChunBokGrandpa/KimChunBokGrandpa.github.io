import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Must set up localStorage BEFORE module import — use vi.hoisted
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

// Mock crypto.randomUUID
const uuidCounter = vi.hoisted(() => ({ value: 0 }));
vi.stubGlobal('crypto', {
  randomUUID: () => `test-uuid-${++uuidCounter.value}`,
});

import { createCustomPaletteStore } from './customPaletteStore.svelte';

describe('customPaletteStore', () => {
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    mockStorage.clear();
    uuidCounter.value = 0;
    consoleErrorSpy.mockClear();
  });

  afterEach(() => {
    consoleErrorSpy.mockClear();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('initial state', () => {
    it('should start with empty palettes when no localStorage', () => {
      const store = createCustomPaletteStore();
      expect(store.palettes).toEqual([]);
    });

    it('should load palettes from localStorage', () => {
      const saved = [
        { id: 'custom_abc', name: 'Test', colors: [{ r: 255, g: 0, b: 0 }], createdAt: 1000 },
      ];
      mockStorage.set('imageToPixel_customPalettes', JSON.stringify(saved));
      const store = createCustomPaletteStore();
      expect(store.palettes).toHaveLength(1);
      expect(store.palettes[0].name).toBe('Test');
    });

    it('should handle corrupted localStorage gracefully', () => {
      mockStorage.set('imageToPixel_customPalettes', '{not-valid');
      const store = createCustomPaletteStore();
      expect(store.palettes).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to parse custom palettes from localStorage',
        expect.anything(),
      );
    });
  });

  describe('addPalette', () => {
    it('should add a palette with custom_ prefix id', () => {
      const store = createCustomPaletteStore();
      const palette = store.addPalette('My Palette', [{ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }]);
      expect(palette.id).toMatch(/^custom_/);
      expect(palette.name).toBe('My Palette');
      expect(palette.colors).toHaveLength(2);
      expect(store.palettes).toHaveLength(1);
    });

    it('should default name to "Untitled Palette" when empty', () => {
      const store = createCustomPaletteStore();
      const palette = store.addPalette('', [{ r: 0, g: 0, b: 0 }]);
      expect(palette.name).toBe('Untitled Palette');
    });

    it('should deep-clone colors', () => {
      const store = createCustomPaletteStore();
      const original = [{ r: 100, g: 200, b: 50 }];
      const palette = store.addPalette('Test', original);
      original[0].r = 0;
      expect(palette.colors[0].r).toBe(100);
    });
  });

  describe('updatePalette', () => {
    it('should update name and colors', () => {
      const store = createCustomPaletteStore();
      const palette = store.addPalette('Old', [{ r: 0, g: 0, b: 0 }]);
      store.updatePalette(palette.id, 'New Name', [{ r: 255, g: 0, b: 0 }]);
      expect(store.palettes[0].name).toBe('New Name');
      expect(store.palettes[0].colors[0].r).toBe(255);
    });

    it('should not modify other palettes', () => {
      const store = createCustomPaletteStore();
      const p1 = store.addPalette('First', [{ r: 0, g: 0, b: 0 }]);
      store.addPalette('Second', [{ r: 255, g: 255, b: 255 }]);
      store.updatePalette(p1.id, 'Updated', [{ r: 128, g: 128, b: 128 }]);
      expect(store.palettes[1].name).toBe('Second');
    });
  });

  describe('deletePalette', () => {
    it('should remove palette by id', () => {
      const store = createCustomPaletteStore();
      const palette = store.addPalette('Delete Me', [{ r: 0, g: 0, b: 0 }]);
      store.deletePalette(palette.id);
      expect(store.palettes).toHaveLength(0);
    });

    it('should keep other palettes intact', () => {
      const store = createCustomPaletteStore();
      const p1 = store.addPalette('Keep', [{ r: 0, g: 0, b: 0 }]);
      const p2 = store.addPalette('Delete', [{ r: 255, g: 0, b: 0 }]);
      store.deletePalette(p2.id);
      expect(store.palettes).toHaveLength(1);
      expect(store.palettes[0].id).toBe(p1.id);
    });
  });

  describe('getPaletteById', () => {
    it('should return palette by id', () => {
      const store = createCustomPaletteStore();
      const palette = store.addPalette('Find Me', [{ r: 0, g: 0, b: 0 }]);
      expect(store.getPaletteById(palette.id)?.name).toBe('Find Me');
    });

    it('should return undefined for non-existent id', () => {
      const store = createCustomPaletteStore();
      expect(store.getPaletteById('nonexistent')).toBeUndefined();
    });
  });
});
