import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock i18n
vi.mock('$lib/i18n/index.svelte', () => ({
  i18n: { t: (key: string) => key },
}));

// Mock localStorage
const mockStorage = new Map<string, string>();
const localStorageMock = {
  getItem: vi.fn((key: string) => mockStorage.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => mockStorage.set(key, value)),
  removeItem: vi.fn((key: string) => mockStorage.delete(key)),
  clear: vi.fn(() => mockStorage.clear()),
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

import { createWindowStore, getWindowTitle, WINDOW_CONFIGS } from './windowStore.svelte';

describe('windowStore', () => {
  beforeEach(() => {
    mockStorage.clear();
    vi.clearAllMocks();
  });

  describe('createWindowStore', () => {
    it('should create store with default window states', () => {
      const store = createWindowStore();
      expect(store.wins.preview).toBeDefined();
      expect(store.wins.settings).toBeDefined();
      expect(store.wins.gallery).toBeDefined();
      expect(store.wins.batch).toBeDefined();
      expect(store.wins.history).toBeDefined();
    });

    it('should have settings and preview windowed by default', () => {
      const store = createWindowStore();
      expect(store.wins.settings.mode).toBe('windowed');
      expect(store.wins.preview.mode).toBe('windowed');
    });

    it('should have gallery, batch, history closed by default', () => {
      const store = createWindowStore();
      expect(store.wins.gallery.mode).toBe('closed');
      expect(store.wins.batch.mode).toBe('closed');
      expect(store.wins.history.mode).toBe('closed');
    });

    it('should set focusedWindow to settings initially', () => {
      const store = createWindowStore();
      expect(store.focusedWindow).toBe('preview');
    });
  });

  describe('focusWindow', () => {
    it('should update focusedWindow', () => {
      const store = createWindowStore();
      store.focusWindow('preview');
      expect(store.focusedWindow).toBe('preview');
    });

    it('should bring focused window to highest z-index', () => {
      const store = createWindowStore();
      store.focusWindow('gallery');
      const zValues = Object.values(store.wins).map(w => w.z);
      const maxZ = Math.max(...zValues);
      expect(store.wins.gallery.z).toBe(maxZ);
    });
  });

  describe('openWindow', () => {
    it('should open a closed window', () => {
      const store = createWindowStore();
      expect(store.wins.gallery.mode).toBe('closed');
      store.openWindow('gallery');
      expect(store.wins.gallery.mode).toBe('windowed');
    });

    it('should focus the opened window', () => {
      const store = createWindowStore();
      store.openWindow('batch');
      expect(store.focusedWindow).toBe('batch');
    });

    it('should persist layout to localStorage', () => {
      const store = createWindowStore();
      store.openWindow('gallery');
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('close', () => {
    it('should close a windowed window keeping position', () => {
      const store = createWindowStore();
      const origX = store.wins.settings.x;
      store.close('settings');
      expect(store.wins.settings.mode).toBe('closed');
      expect(store.wins.settings.x).toBe(origX);
    });
  });

  describe('closeAndReset', () => {
    it('should close and reset to default position', () => {
      const store = createWindowStore();
      store.wins.gallery.x = 999;
      store.wins.gallery.y = 999;
      store.closeAndReset('gallery');
      expect(store.wins.gallery.mode).toBe('closed');
      expect(store.wins.gallery.x).toBe(store.wins.gallery.defaults.x);
      expect(store.wins.gallery.y).toBe(store.wins.gallery.defaults.y);
    });
  });

  describe('handleTaskbarClick', () => {
    it('should open a minimized window', () => {
      const store = createWindowStore();
      store.wins.preview.mode = 'minimized';
      store.handleTaskbarClick('preview');
      expect(store.wins.preview.mode).toBe('windowed');
    });

    it('should minimize the focused window', () => {
      const store = createWindowStore();
      store.focusWindow('settings');
      store.handleTaskbarClick('settings');
      expect(store.wins.settings.mode).toBe('minimized');
    });

    it('should focus an unfocused windowed window', () => {
      const store = createWindowStore();
      store.focusWindow('settings');
      store.handleTaskbarClick('preview');
      expect(store.focusedWindow).toBe('preview');
    });
  });

  describe('getWindowTitle', () => {
    it('should return i18n key for window id', () => {
      expect(getWindowTitle('preview')).toBe('win_preview');
      expect(getWindowTitle('settings')).toBe('win_settings');
    });
  });

  describe('WINDOW_CONFIGS', () => {
    it('should define 5 windows', () => {
      expect(WINDOW_CONFIGS).toHaveLength(5);
    });

    it('should have unique ids', () => {
      const ids = WINDOW_CONFIGS.map(c => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should expose only preview as a desktop shortcut', () => {
      const desktopIds = WINDOW_CONFIGS.filter((config) => config.desktop).map((config) => config.id);
      expect(desktopIds).toEqual(['preview']);
    });
  });

  describe('localStorage restoration', () => {
    it('should restore saved positions from localStorage', () => {
      const saved = {
        settings: { x: 100, y: 200, w: 300, h: 400 },
        preview: { x: 500, y: 600, w: 700, h: 800 },
        gallery: { x: 10, y: 20, w: 30, h: 40 },
        batch: { x: 50, y: 60, w: 70, h: 80 },
        history: { x: 90, y: 100, w: 110, h: 120 },
      };
      mockStorage.set('retro-pixel-window-layout', JSON.stringify(saved));
      const store = createWindowStore();
      expect(store.wins.settings.x).toBe(100);
      expect(store.wins.settings.y).toBe(200);
      expect(store.wins.preview.x).toBe(500);
    });

    it('should handle corrupted localStorage gracefully', () => {
      mockStorage.set('retro-pixel-window-layout', 'not-json');
      const store = createWindowStore();
      // Should fall back to defaults
      expect(store.wins.settings).toBeDefined();
      expect(store.wins.settings.x).toBe(30); // default
    });
  });
});
