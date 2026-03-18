// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { applyCrtEffect } from './crtRenderer';

// jsdom doesn't have a real canvas implementation, so getContext returns null.
// We test the early-return path and mock-based rendering logic.

function createMockCanvas(w: number, h: number) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

describe('applyCrtEffect', () => {
  it('returns source canvas unchanged for mode "none"', () => {
    const source = createMockCanvas(10, 10);
    const result = applyCrtEffect(source, 'none');
    expect(result).toBe(source);
  });

  it('returns source canvas when context is unavailable (jsdom)', () => {
    const source = createMockCanvas(10, 10);
    // In jsdom, getContext('2d') returns null, so applyCrtEffect should
    // return the source canvas as a fallback
    const result = applyCrtEffect(source, 'horizontal');
    expect(result).toBe(source);
  });

  it('returns source canvas for vertical mode when context is unavailable', () => {
    const source = createMockCanvas(8, 8);
    const result = applyCrtEffect(source, 'vertical');
    expect(result).toBe(source);
  });

  it('creates output canvas with correct dimensions when context is available', () => {
    const w = 16;
    const h = 12;
    const source = createMockCanvas(w, h);

    // Mock getContext to return a fake context
    const fakeImageData = {
      data: new Uint8ClampedArray(w * h * 4),
      width: w,
      height: h,
    };

    const fakeCtx = {
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      putImageData: vi.fn(),
      getImageData: vi.fn(() => fakeImageData),
      createRadialGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
      globalCompositeOperation: 'source-over',
      fillStyle: '',
    };

    // Override createElement to return canvas with working getContext
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreate(tag);
      if (tag === 'canvas') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.spyOn(el as any, 'getContext').mockReturnValue(fakeCtx as unknown as CanvasRenderingContext2D);
      }
      return el;
    });

    const result = applyCrtEffect(source, 'horizontal');

    // Should create a new canvas (not return source)
    expect(result).not.toBe(source);
    expect(result.width).toBe(w);
    expect(result.height).toBe(h);

    // Verify scanline processing happened
    expect(fakeCtx.getImageData).toHaveBeenCalledWith(0, 0, w, h);
    expect(fakeCtx.putImageData).toHaveBeenCalled();

    vi.restoreAllMocks();
  });
});
