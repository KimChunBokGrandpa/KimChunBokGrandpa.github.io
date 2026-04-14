// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ProcessingSettings } from '$lib/types';

const mockInvoke = vi.fn();

// ─── Mock $app/environment (required by customPaletteStore) ───
vi.mock('$app/environment', () => ({
  browser: true,
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}));

// ─── Mock Web Worker ───
class MockWorker {
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: ((e: ErrorEvent) => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  dispatchEvent = vi.fn(() => false);
}

vi.stubGlobal('Worker', MockWorker);

// Mock customPaletteStore
vi.mock('$lib/stores/customPaletteStore.svelte', () => ({
  customPaletteStore: {
    getPaletteById: vi.fn(() => null),
  },
}));

const { processorService } = await import('./imageProcessor');

function makeSettings(overrides?: Partial<ProcessingSettings>): ProcessingSettings {
  return {
    pixelSize: 4,
    palette: 'gameboy',
    crtEffect: 'none',
    glitchFilters: [],
    renderMode: 'pixel_perfect',
    glitchSeed: null,
    ditherType: 'none',
    effectLayers: [],
    ...overrides,
  };
}

describe('ImageProcessorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    processorService.clearImageCache();
  });

  // ─── Cache Management ───

  describe('image cache', () => {
    it('clearImageCache does not throw', () => {
      expect(() => processorService.clearImageCache()).not.toThrow();
    });

    it('evictFromImageCache does not throw for unknown key', () => {
      expect(() => processorService.evictFromImageCache('nonexistent')).not.toThrow();
    });
  });

  // ─── Last Canvas / Color Count ───

  describe('getLastCanvas', () => {
    it('returns null initially', () => {
      expect(processorService.getLastCanvas()).toBeNull();
    });
  });

  describe('getLastColorCount', () => {
    it('returns 0 initially', () => {
      expect(processorService.getLastColorCount()).toBe(0);
    });
  });

  // ─── processImage — early return (no processing needed) ───

  describe('processImage — no-worker path', () => {
    it('returns blob URL for original settings (pixelSize=1, palette=original)', async () => {
      // jsdom has Image, but we need to trigger onload
      const origImage = globalThis.Image;
      globalThis.Image = class extends origImage {
        constructor() {
          super();
          Object.defineProperty(this, 'src', {
            set: () => { setTimeout(() => this.onload?.(new Event('load')), 0); },
            get: () => '',
          });
          Object.defineProperty(this, 'width', { get: () => 100, configurable: true });
          Object.defineProperty(this, 'height', { get: () => 100, configurable: true });
        }
      } as unknown as typeof Image;

      // Mock canvas for blob creation
      const mockCtx = { drawImage: vi.fn() };
      const mockCanvas = {
        width: 0, height: 0,
        getContext: vi.fn(() => mockCtx),
        toBlob: vi.fn((cb: (b: Blob | null) => void) => {
          cb(new Blob(['png'], { type: 'image/png' }));
        }),
      };
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
        return document.createElementNS('http://www.w3.org/1999/xhtml', tag) as HTMLElement;
      });

      const settings = makeSettings({ pixelSize: 1, palette: 'original' });
      const result = await processorService.processImage('blob:test-image', settings);

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');

      globalThis.Image = origImage;
      vi.restoreAllMocks();
    });
  });

  // ─── processImage — stale request cancellation ───

  describe('processImage — request cancellation', () => {
    it('returns null for stale requests when overridden by new call', async () => {
      const origImage = globalThis.Image;
      globalThis.Image = class extends origImage {
        constructor() {
          super();
          Object.defineProperty(this, 'src', {
            set: () => { setTimeout(() => this.onload?.(new Event('load')), 10); },
            get: () => '',
          });
          Object.defineProperty(this, 'width', { get: () => 100, configurable: true });
          Object.defineProperty(this, 'height', { get: () => 100, configurable: true });
        }
      } as unknown as typeof Image;

      const mockBitmap = { width: 100, height: 100, close: vi.fn() };
      vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(mockBitmap));

      const settings = makeSettings({ pixelSize: 4 });

      // First call — will be stale
      const p1 = processorService.processImage('blob:img1', settings);
      // Second call cancels first
      const p2 = processorService.processImage('blob:img2', settings);

      const result1 = await p1;
      expect(result1).toBeNull();

      // Cleanup pending
      processorService.destroy();
      await p2.catch(() => {});

      globalThis.Image = origImage;
      vi.restoreAllMocks();
    });
  });

  // ─── Dimension capping ───

  describe('dimension capping', () => {
    it('calls onDimensionCapped for large images', async () => {
      const origImage = globalThis.Image;
      globalThis.Image = class extends origImage {
        constructor() {
          super();
          Object.defineProperty(this, 'src', {
            set: () => { setTimeout(() => this.onload?.(new Event('load')), 0); },
            get: () => '',
          });
          Object.defineProperty(this, 'width', { get: () => 4096, configurable: true });
          Object.defineProperty(this, 'height', { get: () => 4096, configurable: true });
        }
      } as unknown as typeof Image;

      const mockBitmap = { width: 2048, height: 2048, close: vi.fn() };
      vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(mockBitmap));

      const onCapped = vi.fn();
      const settings = makeSettings({ pixelSize: 4 });

      const promise = processorService.processImage('blob:large', settings, onCapped);

      // Wait for onCapped to be called
      await vi.waitFor(() => {
        expect(onCapped).toHaveBeenCalled();
      }, { timeout: 2000 });

      const [original, capped] = onCapped.mock.calls[0];
      expect(original.w).toBe(4096);
      expect(capped.w).toBeLessThanOrEqual(2048);

      processorService.destroy();
      await promise.catch(() => {});

      globalThis.Image = origImage;
      vi.restoreAllMocks();
    });

    it('uses stricter limit for HQx render mode', async () => {
      const origImage = globalThis.Image;
      globalThis.Image = class extends origImage {
        constructor() {
          super();
          Object.defineProperty(this, 'src', {
            set: () => { setTimeout(() => this.onload?.(new Event('load')), 0); },
            get: () => '',
          });
          Object.defineProperty(this, 'width', { get: () => 1500, configurable: true });
          Object.defineProperty(this, 'height', { get: () => 1500, configurable: true });
        }
      } as unknown as typeof Image;

      const mockBitmap = { width: 1024, height: 1024, close: vi.fn() };
      vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(mockBitmap));

      const onCapped = vi.fn();
      const settings = makeSettings({ pixelSize: 4, renderMode: 'hqx' });

      const promise = processorService.processImage('blob:hqx', settings, onCapped);

      await vi.waitFor(() => {
        expect(onCapped).toHaveBeenCalled();
      }, { timeout: 2000 });

      const [, capped] = onCapped.mock.calls[0];
      expect(capped.w).toBeLessThanOrEqual(1024);

      processorService.destroy();
      await promise.catch(() => {});

      globalThis.Image = origImage;
      vi.restoreAllMocks();
    });
  });

  describe('palette normalization', () => {
    it('normalizes legacy palette ids before posting work to the worker', async () => {
      const origImage = globalThis.Image;
      globalThis.Image = class extends origImage {
        constructor() {
          super();
          Object.defineProperty(this, 'src', {
            set: () => { setTimeout(() => this.onload?.(new Event('load')), 0); },
            get: () => '',
          });
          Object.defineProperty(this, 'width', { get: () => 64, configurable: true });
          Object.defineProperty(this, 'height', { get: () => 64, configurable: true });
        }
      } as unknown as typeof Image;

      const mockBitmap = { width: 64, height: 64, close: vi.fn() };
      vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(mockBitmap));

      const settings = makeSettings({ palette: 'gameboy' });
      const promise = processorService.processImage('blob:legacy-palette', settings);

      await vi.waitFor(() => {
        const worker = (processorService as unknown as { worker: MockWorker | null }).worker;
        expect(worker?.postMessage).toHaveBeenCalled();
      }, { timeout: 2000 });

      const worker = (processorService as unknown as { worker: MockWorker | null }).worker;
      const [message] = worker!.postMessage.mock.calls[0];
      expect(message.palette).toBe('dmg');

      processorService.destroy();
      await promise.catch(() => {});

      globalThis.Image = origImage;
      vi.restoreAllMocks();
    });
  });

  describe('Tauri processing payload', () => {
    it('includes use_oklab in the Rust invoke request', async () => {
      const origImage = globalThis.Image;
      const originalTauriInternals = (window as Window & { __TAURI_INTERNALS__?: object }).__TAURI_INTERNALS__;

      globalThis.Image = class extends origImage {
        constructor() {
          super();
          Object.defineProperty(this, 'src', {
            set: () => { setTimeout(() => this.onload?.(new Event('load')), 0); },
            get: () => '',
          });
          Object.defineProperty(this, 'width', { get: () => 32, configurable: true });
          Object.defineProperty(this, 'height', { get: () => 32, configurable: true });
        }
      } as unknown as typeof Image;

      (window as Window & { __TAURI_INTERNALS__?: object }).__TAURI_INTERNALS__ = {};
      mockInvoke.mockResolvedValue(new Uint8Array(32 * 32 * 4));

      const mockCtx = {
        drawImage: vi.fn(),
        getImageData: vi.fn(() => ({
          data: new Uint8ClampedArray(32 * 32 * 4),
        })),
        putImageData: vi.fn(),
      };
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => mockCtx),
        toBlob: vi.fn((cb: (b: Blob | null) => void) => {
          cb(new Blob(['png'], { type: 'image/png' }));
        }),
      };
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
        return document.createElementNS('http://www.w3.org/1999/xhtml', tag) as HTMLElement;
      });

      const result = await processorService.processImage(
        'blob:tauri-use-oklab',
        makeSettings({ palette: 'dmg', useOklab: true }),
      );

      expect(result).toBeTruthy();
      expect(mockInvoke).toHaveBeenCalledWith('process_image_rs', expect.objectContaining({
        req: expect.objectContaining({
          use_oklab: true,
          dither_type: 'none',
        }),
      }));

      globalThis.Image = origImage;
      if (originalTauriInternals === undefined) {
        delete (window as Window & { __TAURI_INTERNALS__?: object }).__TAURI_INTERNALS__;
      } else {
        (window as Window & { __TAURI_INTERNALS__?: object }).__TAURI_INTERNALS__ = originalTauriInternals;
      }
      vi.restoreAllMocks();
    });
  });

  // ─── Destroy ───

  describe('destroy', () => {
    it('does not throw', () => {
      expect(() => processorService.destroy()).not.toThrow();
    });

    it('returns null canvas after destroy', () => {
      processorService.destroy();
      expect(processorService.getLastCanvas()).toBeNull();
    });

    it('returns 0 color count is preserved after destroy', () => {
      processorService.destroy();
      // Color count state is not reset by destroy — this just verifies no crash
      expect(typeof processorService.getLastColorCount()).toBe('number');
    });
  });
});
