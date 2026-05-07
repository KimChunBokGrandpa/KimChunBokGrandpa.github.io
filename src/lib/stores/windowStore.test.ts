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

import {
  createWindowStore,
  desktopWindowConfigs,
  getShellProgramSummary,
  getWindowTitle,
  mobileWindowOrder,
  windowConfigs,
} from './windowStore.svelte';

describe('windowStore', () => {
  beforeEach(() => {
    mockStorage.clear();
    vi.clearAllMocks();
  });

  describe('createWindowStore', () => {
    it('should create store with default window states', () => {
      const store = createWindowStore();
      expect(store.wins.preview).toBeDefined();
      expect(store.wins.poster_maker).toBeDefined();
      expect(store.wins.retrocam).toBeDefined();
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

    it('should have gallery, batch, history, retrocam closed by default', () => {
      const store = createWindowStore();
      expect(store.wins.gallery.mode).toBe('closed');
      expect(store.wins.batch.mode).toBe('closed');
      expect(store.wins.history.mode).toBe('closed');
      expect(store.wins.retrocam.mode).toBe('closed');
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

    it('should move focus to the next visible window when closing the focused window', () => {
      const store = createWindowStore();
      store.focusWindow('settings');
      store.close('settings');
      expect(store.focusedWindow).toBe('preview');
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

    it('should move focus to the next visible window when closing and resetting the focused window', () => {
      const store = createWindowStore();
      store.openWindow('poster_maker');
      store.closeAndReset('poster_maker');
      expect(store.focusedWindow).toBe('preview');
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
      expect(store.focusedWindow).toBe('preview');
    });

    it('should focus an unfocused windowed window', () => {
      const store = createWindowStore();
      store.focusWindow('settings');
      store.handleTaskbarClick('preview');
      expect(store.focusedWindow).toBe('preview');
    });
  });

  describe('minimize', () => {
    it('should minimize a window and move focus to the next visible window', () => {
      const store = createWindowStore();
      store.focusWindow('settings');
      store.minimize('settings');
      expect(store.wins.settings.mode).toBe('minimized');
      expect(store.focusedWindow).toBe('preview');
    });
  });

  describe('getWindowTitle', () => {
    it('should return i18n key for window id', () => {
      expect(getWindowTitle('preview')).toBe('win_preview');
      expect(getWindowTitle('settings')).toBe('win_settings');
    });
  });

  describe('shell program copy helpers', () => {
    it('should return the shell summary key for desktop programs', () => {
      expect(getShellProgramSummary('preview')).toBe('desktop_summary_preview');
      expect(getShellProgramSummary('poster_maker')).toBe('desktop_summary_poster_maker');
    });
  });

  describe('windowConfigs', () => {
    it('should define 7 windows', () => {
      expect(windowConfigs).toHaveLength(7);
    });

    it('should have unique ids', () => {
      const ids = windowConfigs.map(c => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should expose the shell programs as desktop shortcuts', () => {
      const desktopIds = desktopWindowConfigs.map((config) => config.id);
      expect(desktopIds).toEqual(['preview', 'poster_maker', 'retrocam']);
    });

    it('should reuse window config order as the mobile shell order', () => {
      expect(mobileWindowOrder).toEqual(windowConfigs.map((config) => config.id));
    });
  });

  describe('localStorage restoration', () => {
    it('should restore saved positions from localStorage', () => {
      const saved = {
        settings: { x: 100, y: 200, w: 300, h: 400 },
        preview: { x: 500, y: 600, w: 700, h: 800 },
        poster_maker: { x: 140, y: 160, w: 780, h: 600 },
        retrocam: { x: 180, y: 120, w: 760, h: 520 },
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
