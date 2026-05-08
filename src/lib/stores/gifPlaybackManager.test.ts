// @vitest-environment jsdom
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

const mockPoolSubmit = vi.hoisted(() => vi.fn(async (message: {
  width: number;
  height: number;
  renderMode?: string;
  effectLayers?: { type: string; enabled: boolean }[];
}) => {
  const hasHqx = message.renderMode === 'hqx'
    || message.effectLayers?.some((layer) => layer.type === 'hqx' && layer.enabled);
  const width = hasHqx ? message.width * 2 : message.width;
  const height = hasHqx ? message.height * 2 : message.height;
  return new ImageData(new Uint8ClampedArray(width * height * 4), width, height);
}));

const mockPoolDestroy = vi.hoisted(() => vi.fn());

vi.mock('$lib/utils/workerPool', () => ({
  ImageWorkerPool: vi.fn().mockImplementation(function ImageWorkerPoolMock() {
    return {
    submit: mockPoolSubmit,
    destroy: mockPoolDestroy,
    };
  }),
}));

// Mock URL
const revokedUrls: string[] = [];
const NativeURL = globalThis.URL;
class MockURL extends NativeURL {}
Object.defineProperty(MockURL, 'createObjectURL', {
  configurable: true,
  value: vi.fn(() => 'blob:object-url'),
});
Object.defineProperty(MockURL, 'revokeObjectURL', {
  configurable: true,
  value: vi.fn((url: string) => revokedUrls.push(url)),
});
vi.stubGlobal('URL', MockURL);

const gifEncodeMessages: unknown[] = [];
class MockGifEncodeWorker {
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: ((e: ErrorEvent) => void) | null = null;
  terminate = vi.fn();
  postMessage = vi.fn((message: unknown) => {
    gifEncodeMessages.push(message);
    queueMicrotask(() => {
      this.onmessage?.({
        data: { gifData: new Uint8Array([71, 73, 70]).buffer },
      } as MessageEvent);
    });
  });
}
vi.stubGlobal('Worker', MockGifEncodeWorker);

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
    gifEncodeMessages.length = 0;
    vi.clearAllMocks();
    Object.defineProperty(HTMLAnchorElement.prototype, 'click', {
      configurable: true,
      value: vi.fn(),
    });
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

    it('exports HQx GIF frames through the same effect-layer resize and worker payload boundary', async () => {
      const createImageBitmapMock = vi.fn(async (_source: ImageData, options?: ImageBitmapOptions) => ({
        width: options?.resizeWidth ?? 1,
        height: options?.resizeHeight ?? 1,
        close: vi.fn(),
      }));
      vi.stubGlobal('createImageBitmap', createImageBitmapMock);

      vi.mocked(decodeGif).mockReturnValue({
        width: 1501,
        height: 1,
        totalDuration: 200,
        frames: Array.from({ length: 2 }, (_, idx) => ({
          data: new Uint8ClampedArray(1501 * 4).fill(idx + 1),
          delay: 100,
          width: 1501,
          height: 1,
        })),
      });

      const hqxLayer = { id: 'hqx-1', type: 'hqx' as const, enabled: true };
      const deps = makeDeps({
        getSettings: vi.fn(() => ({
          pixelSize: 2,
          palette: 'win256',
          crtEffect: 'none' as const,
          glitchFilters: [],
          renderMode: 'pixel_perfect' as const,
          glitchSeed: 0.25,
          ditherType: 'ordered' as const,
          useOklab: true,
          effectLayers: [hqxLayer],
        })),
      });
      const manager = createGifPlaybackManager(deps);
      const file = new File([new Uint8Array([71, 73, 70])], 'large.gif', { type: 'image/gif' });

      await manager.loadGifFile(file, vi.fn());
      const result = await manager.exportGif();

      expect(result).toBe('gif_exported');
      expect(createImageBitmapMock).toHaveBeenCalledWith(
        expect.any(ImageData),
        expect.objectContaining({ resizeWidth: 1024, resizeHeight: 1 }),
      );
      expect(mockPoolSubmit).toHaveBeenCalledTimes(2);

      const [message] = mockPoolSubmit.mock.calls[0];
      expect(message).toEqual(expect.objectContaining({
        width: 1024,
        height: 1,
        pixelSize: 2,
        palette: 'win256',
        ditherType: 'ordered',
        useOklab: true,
        glitchSeed: 0.25,
        renderMode: 'pixel_perfect',
        effectLayers: [hqxLayer],
      }));
      expect(gifEncodeMessages[0]).toEqual(expect.objectContaining({
        width: 2048,
        height: 2,
      }));
      expect(mockPoolDestroy).toHaveBeenCalledTimes(1);
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
