// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({ browser: true }));

vi.mock('$lib/stores/customPaletteStore.svelte', () => ({
  customPaletteStore: {
    getPaletteById: vi.fn(() => undefined),
  },
}));

import { clearPresetPreviewCache, getPresetPreview, getPresetPreviewCacheKey } from './presetPreview';

function mockCanvas() {
  return {
    width: 0,
    height: 0,
    toDataURL: vi.fn(() => 'data:image/png;base64,mock'),
    getContext: vi.fn(() => ({
      fillStyle: '',
      imageSmoothingEnabled: false,
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      drawImage: vi.fn(),
      putImageData: vi.fn(),
      createImageData: vi.fn((w = 1, h = 1) => new ImageData(w, h)),
      getImageData: vi.fn(() => new ImageData(56, 40)),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      globalCompositeOperation: 'source-over',
    })),
  };
}

describe('presetPreview cache', () => {
  beforeEach(() => {
    clearPresetPreviewCache();
    vi.restoreAllMocks();
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return mockCanvas() as unknown as HTMLCanvasElement;
      }
      return document.createElementNS('http://www.w3.org/1999/xhtml', tagName) as HTMLElement;
    });
  });

  it('returns stable cache key for same settings', () => {
    const input = {
      id: 'preset-1',
      settings: {
        pixelSize: 4,
        palette: 'dmg',
        crtEffect: 'none' as const,
        glitchFilters: [],
        renderMode: 'pixel_perfect' as const,
        glitchSeed: null,
        ditherType: 'none' as const,
        effectLayers: [],
      },
    };

    expect(getPresetPreviewCacheKey(input)).toBe(getPresetPreviewCacheKey(input));
  });

  it('reuses cached preview promise for same preset input', async () => {
    const input = {
      id: 'preset-1',
      settings: {
        pixelSize: 4,
        palette: 'dmg',
        crtEffect: 'none' as const,
        glitchFilters: [],
        renderMode: 'pixel_perfect' as const,
        glitchSeed: null,
        ditherType: 'none' as const,
        effectLayers: [],
      },
    };

    const first = getPresetPreview(input);
    const second = getPresetPreview(input);

    expect(first).toBe(second);
    await expect(first).resolves.toMatch(/^data:image\/png/);
  });

  it('creates new preview promise after cache clear', () => {
    const input = {
      id: 'preset-1',
      settings: {
        pixelSize: 4,
        palette: 'dmg',
        crtEffect: 'none' as const,
        glitchFilters: [],
        renderMode: 'pixel_perfect' as const,
        glitchSeed: null,
        ditherType: 'none' as const,
        effectLayers: [],
      },
    };

    const first = getPresetPreview(input);
    clearPresetPreviewCache();
    const second = getPresetPreview(input);

    expect(first).not.toBe(second);
  });
});

