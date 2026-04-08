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
import { decodeGif } from '$lib/utils/gifProcessor';

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

function makeGifInfo(frameCount: number = 3) {
  return {
    width: 2,
    height: 2,
    totalDuration: frameCount * 100,
    frames: Array.from({ length: frameCount }, (_, idx) => ({
      data: new Uint8ClampedArray([idx + 1, 0, 0, 255, idx + 1, 0, 0, 255, idx + 1, 0, 0, 255, idx + 1, 0, 0, 255]),
      delay: 100,
      width: 2,
      height: 2,
    })),
  };
}

async function loadMultiFrameGif(manager: ReturnType<typeof createGifPlaybackManager>, frameCount: number = 3) {
  vi.mocked(decodeGif).mockReturnValue(makeGifInfo(frameCount));
  const file = new File([new Uint8Array([71, 73, 70])], 'test.gif', { type: 'image/gif' });
  const setOriginalSrc = vi.fn();
  const result = await manager.loadGifFile(file, setOriginalSrc);
  expect(result).toBe(true);
  expect(setOriginalSrc).toHaveBeenCalled();
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

  describe('frame manipulation', () => {
    it('deletes selected frame and updates frame count', async () => {
      const manager = createGifPlaybackManager(makeDeps());
      await loadMultiFrameGif(manager, 3);

      manager.seek(1);
      manager.deleteFrame(1);

      expect(manager.gifFrameCount).toBe(2);
      expect(manager.gifInfo?.frames[0].data[0]).toBe(1);
      expect(manager.gifInfo?.frames[1].data[0]).toBe(3);
      expect(manager.gifCurrentFrame).toBe(1);
    });

    it('duplicates selected frame after source index', async () => {
      const manager = createGifPlaybackManager(makeDeps());
      await loadMultiFrameGif(manager, 2);

      manager.duplicateFrame(0);

      expect(manager.gifFrameCount).toBe(3);
      expect(manager.gifInfo?.frames[0].data[0]).toBe(1);
      expect(manager.gifInfo?.frames[1].data[0]).toBe(1);
      expect(manager.gifInfo?.frames[2].data[0]).toBe(2);
      expect(manager.gifInfo?.frames[1].data).not.toBe(manager.gifInfo?.frames[0].data);
    });

    it('reorders frame and keeps moved frame selected', async () => {
      const manager = createGifPlaybackManager(makeDeps());
      await loadMultiFrameGif(manager, 3);

      manager.reorderFrame(0, 2);

      expect(manager.gifFrameCount).toBe(3);
      expect(manager.gifInfo?.frames.map((frame) => frame.data[0])).toEqual([2, 3, 1]);
      expect(manager.gifCurrentFrame).toBe(2);
    });
  });
});
