// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { canvasSurfaceToBlob, createCanvasSurface } from './canvasSurface';

const originalOffscreenCanvas = globalThis.OffscreenCanvas;

afterEach(() => {
  vi.restoreAllMocks();
  if (originalOffscreenCanvas) {
    globalThis.OffscreenCanvas = originalOffscreenCanvas;
  } else {
    Reflect.deleteProperty(globalThis, 'OffscreenCanvas');
  }
});

describe('canvasSurface', () => {
  it('uses OffscreenCanvas when available', () => {
    const fakeCtx = { marker: 'offscreen-ctx' } as unknown as OffscreenCanvasRenderingContext2D;

    class FakeOffscreenCanvas {
      width: number;
      height: number;

      constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
      }

      getContext(type: string) {
        return type === '2d' ? fakeCtx : null;
      }
    }

    globalThis.OffscreenCanvas = FakeOffscreenCanvas as unknown as typeof OffscreenCanvas;

    const { canvas, ctx } = createCanvasSurface(64, 48);

    expect(canvas).toBeInstanceOf(FakeOffscreenCanvas);
    expect(ctx).toBe(fakeCtx);
  });

  it('falls back to HTMLCanvasElement when OffscreenCanvas is unavailable', () => {
    Reflect.deleteProperty(globalThis, 'OffscreenCanvas');

    const fakeCtx = { marker: 'dom-ctx' } as unknown as CanvasRenderingContext2D;
    const fakeCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => fakeCtx),
      toBlob: vi.fn(),
    } as unknown as HTMLCanvasElement;

    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return fakeCanvas;
      }
      return originalCreateElement(tagName);
    });

    const { canvas, ctx } = createCanvasSurface(80, 60);

    expect(createElementSpy).toHaveBeenCalledWith('canvas');
    expect(canvas).toBe(fakeCanvas);
    expect((canvas as HTMLCanvasElement).width).toBe(80);
    expect((canvas as HTMLCanvasElement).height).toBe(60);
    expect(ctx).toBe(fakeCtx);
  });

  it('exports a blob through convertToBlob when supported', async () => {
    const blob = new Blob(['retro'], { type: 'image/png' });
    const canvas = {
      convertToBlob: vi.fn(async () => blob),
    } as unknown as OffscreenCanvas;

    await expect(canvasSurfaceToBlob(canvas, 'image/png')).resolves.toBe(blob);
  });

  it('exports a blob through toBlob when using a DOM canvas', async () => {
    const blob = new Blob(['retro'], { type: 'image/png' });
    const canvas = {
      toBlob: vi.fn((callback: BlobCallback) => callback(blob)),
    } as unknown as HTMLCanvasElement;

    await expect(canvasSurfaceToBlob(canvas, 'image/png')).resolves.toBe(blob);
  });
});
