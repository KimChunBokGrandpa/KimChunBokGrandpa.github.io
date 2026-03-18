import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { GifManagerDeps } from './gifPlaybackManager.svelte';

// ─── Mocks (hoisted) ───
const mockProcessorService = vi.hoisted(() => ({
  processImage: vi.fn().mockResolvedValue('blob:processed-frame'),
  getLastColorCount: vi.fn().mockReturnValue(8),
  evictFromImageCache: vi.fn(),
}));

vi.mock('$lib/services/imageProcessor', () => ({
  processorService: mockProcessorService,
}));

vi.mock('$lib/utils/gifProcessor', () => ({
  decodeGif: vi.fn(),
  frameToBlobUrl: vi.fn().mockResolvedValue('blob:frame'),
}));

vi.mock('$lib/i18n/index.svelte', () => ({
  i18n: { t: (key: string) => key },
}));

vi.mock('$lib/stores/customPaletteStore.svelte', () => ({
  customPaletteStore: {
    palettes: [],
    getPaletteById: vi.fn(),
  },
}));

// Mock URL
const revokedUrls: string[] = [];
vi.stubGlobal('URL', {
  createObjectURL: vi.fn(() => 'blob:object-url'),
  revokeObjectURL: vi.fn((url: string) => revokedUrls.push(url)),
});

import { createGifPlaybackManager } from './gifPlaybackManager.svelte';

function makeDeps(overrides?: Partial<GifManagerDeps>): GifManagerDeps {
  return {
    getSettings: vi.fn(() => ({
      pixelSize: 4,
      palette: 'gameboy',
      crtEffect: 'none' as const,
      glitchFilters: [{ type: 'none' as const, intensity: 1 }],
      renderMode: 'pixel_perfect' as const,
      glitchSeed: null,
      ditherType: 'none' as const,
      effectLayers: [],
    })),
    getSettingsHash: vi.fn(() => 'hash-1'),
    setProcessedImageSrc: vi.fn(),
    setIsProcessing: vi.fn(),
    setColorCount: vi.fn(),
    setLastError: vi.fn(),
    handleDimensionCapped: vi.fn(),
    ...overrides,
  };
}

describe('gifPlaybackManager', () => {
  beforeEach(() => {
    revokedUrls.length = 0;
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should start with isGif false', () => {
      const manager = createGifPlaybackManager(makeDeps());
      expect(manager.isGif).toBe(false);
    });

    it('should start with no gif info', () => {
      const manager = createGifPlaybackManager(makeDeps());
      expect(manager.gifInfo).toBeNull();
      expect(manager.gifFrameCount).toBe(0);
    });

    it('should start with playback inactive', () => {
      const manager = createGifPlaybackManager(makeDeps());
      expect(manager.gifPlaying).toBe(false);
      expect(manager.gifCurrentFrame).toBe(0);
      expect(manager.gifIsExporting).toBe(false);
      expect(manager.gifProcessingProgress).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('should reset all state', () => {
      const manager = createGifPlaybackManager(makeDeps());
      manager.cleanup();
      expect(manager.isGif).toBe(false);
      expect(manager.gifInfo).toBeNull();
      expect(manager.gifPlaying).toBe(false);
      expect(manager.gifCurrentFrame).toBe(0);
      expect(manager.gifIsExporting).toBe(false);
    });
  });

  describe('stopPlayback', () => {
    it('should set gifPlaying to false', () => {
      const manager = createGifPlaybackManager(makeDeps());
      manager.stopPlayback();
      expect(manager.gifPlaying).toBe(false);
    });
  });

  describe('seek', () => {
    it('should stop playback when seeking', () => {
      const manager = createGifPlaybackManager(makeDeps());
      manager.seek(5);
      expect(manager.gifPlaying).toBe(false);
    });
  });

  describe('invalidateCache', () => {
    it('should not throw when called on fresh manager', () => {
      const manager = createGifPlaybackManager(makeDeps());
      expect(() => manager.invalidateCache()).not.toThrow();
    });
  });

  describe('cancelExport', () => {
    it('should not throw when no export is running', () => {
      const manager = createGifPlaybackManager(makeDeps());
      expect(() => manager.cancelExport()).not.toThrow();
    });
  });

  describe('play', () => {
    it('should not start playing without gifInfo', () => {
      const manager = createGifPlaybackManager(makeDeps());
      manager.play();
      expect(manager.gifPlaying).toBe(false);
    });
  });

  describe('pause', () => {
    it('should stop playback', () => {
      const manager = createGifPlaybackManager(makeDeps());
      manager.pause();
      expect(manager.gifPlaying).toBe(false);
    });
  });

  describe('exportGif', () => {
    it('should return null when no gifInfo', async () => {
      const manager = createGifPlaybackManager(makeDeps());
      const result = await manager.exportGif();
      expect(result).toBeNull();
    });
  });
});
