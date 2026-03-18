// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies
vi.mock('$lib/utils/svgExporter', () => ({
  imageDataToSvg: vi.fn(() => '<svg></svg>'),
  downloadSvg: vi.fn(),
}));

vi.mock('$lib/utils/spritesheetExporter', () => ({
  createSpritesheet: vi.fn().mockResolvedValue(document.createElement('canvas')),
  downloadSpritesheet: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('$lib/utils/gifProcessor', () => ({
  frameToBlobUrl: vi.fn().mockResolvedValue('blob:frame'),
}));

const { exportSvg, exportSpritesheet } = await import('./exportService');
const { imageDataToSvg, downloadSvg } = await import('$lib/utils/svgExporter');
const { createSpritesheet, downloadSpritesheet } = await import('$lib/utils/spritesheetExporter');
const { frameToBlobUrl } = await import('$lib/utils/gifProcessor');

describe('exportSvg', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Image with onload trigger
    const origImage = globalThis.Image;
    globalThis.Image = class extends origImage {
      constructor() {
        super();
        Object.defineProperty(this, 'src', {
          set: () => { setTimeout(() => this.onload?.(new Event('load')), 0); },
          get: () => '',
          configurable: true,
        });
        Object.defineProperty(this, 'naturalWidth', { get: () => 4, configurable: true });
        Object.defineProperty(this, 'naturalHeight', { get: () => 4, configurable: true });
      }
    } as unknown as typeof Image;

    // Mock canvas with getImageData
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        const canvas = origCreate('canvas');
        const mockCtx = {
          drawImage: vi.fn(),
          getImageData: vi.fn(() => new ImageData(4, 4)),
        };
        vi.spyOn(canvas, 'getContext').mockReturnValue(mockCtx as unknown as CanvasRenderingContext2D);
        return canvas;
      }
      return origCreate(tag);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a filename with .svg extension', async () => {
    const filename = await exportSvg('blob:processed');
    expect(filename).toMatch(/^pixel-art-\d+\.svg$/);
  });

  it('calls imageDataToSvg and downloadSvg', async () => {
    await exportSvg('blob:processed');
    expect(imageDataToSvg).toHaveBeenCalled();
    expect(downloadSvg).toHaveBeenCalled();
  });
});

describe('exportSpritesheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const makeGifInfo = (frameCount = 3) => ({
    width: 32,
    height: 32,
    totalDuration: frameCount * 100,
    frames: Array.from({ length: frameCount }, () => ({
      data: new Uint8ClampedArray(32 * 32 * 4),
      delay: 100,
      disposalType: 0 as const,
      transparentIndex: -1,
      interlaced: false,
      x: 0, y: 0,
      width: 32, height: 32,
    })),
  });

  it('returns a filename with .png extension', async () => {
    const filename = await exportSpritesheet(makeGifInfo());
    expect(filename).toMatch(/^spritesheet-\d+\.png$/);
  });

  it('calls frameToBlobUrl for each frame', async () => {
    const gifInfo = makeGifInfo(3);
    await exportSpritesheet(gifInfo);
    expect(frameToBlobUrl).toHaveBeenCalledTimes(3);
  });

  it('calls createSpritesheet with correct dimensions', async () => {
    const gifInfo = makeGifInfo(2);
    await exportSpritesheet(gifInfo);
    expect(createSpritesheet).toHaveBeenCalledWith(
      expect.any(Array),
      32,
      32,
    );
  });

  it('calls downloadSpritesheet', async () => {
    await exportSpritesheet(makeGifInfo());
    expect(downloadSpritesheet).toHaveBeenCalled();
  });

  it('revokes blob URLs in finally block', async () => {
    const revokeObjUrl = vi.spyOn(URL, 'revokeObjectURL');
    await exportSpritesheet(makeGifInfo(2));
    expect(revokeObjUrl).toHaveBeenCalledTimes(2);
  });

  it('revokes blob URLs even when createSpritesheet fails', async () => {
    vi.mocked(createSpritesheet).mockRejectedValueOnce(new Error('fail'));
    const revokeObjUrl = vi.spyOn(URL, 'revokeObjectURL');

    await expect(exportSpritesheet(makeGifInfo(2))).rejects.toThrow('fail');
    expect(revokeObjUrl).toHaveBeenCalledTimes(2);
  });
});
