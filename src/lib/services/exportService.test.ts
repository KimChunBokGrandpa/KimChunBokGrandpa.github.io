// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies
vi.mock('$lib/utils/svgExporter', () => ({
  imageDataToSvg: vi.fn(() => '<svg></svg>'),
  animatedFramesToSvg: vi.fn(() => '<svg><g></g></svg>'),
  downloadSvg: vi.fn(),
}));

vi.mock('$lib/utils/spritesheetExporter', () => ({
  createSpritesheet: vi.fn().mockResolvedValue(document.createElement('canvas')),
  downloadSpritesheet: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('$lib/utils/gifProcessor', () => ({
  frameToBlobUrl: vi.fn().mockResolvedValue('blob:frame'),
}));

vi.mock('$lib/utils/webpEncoder', () => ({
  encodeAnimatedWebp: vi.fn(() => new Uint8Array([82, 73, 70, 70])),
}));

const { exportSvg, exportSpritesheet, exportAnimatedWebp, exportAnimatedSvg } = await import('./exportService');
const { imageDataToSvg, animatedFramesToSvg, downloadSvg } = await import('$lib/utils/svgExporter');
const { createSpritesheet, downloadSpritesheet } = await import('$lib/utils/spritesheetExporter');
const { frameToBlobUrl } = await import('$lib/utils/gifProcessor');
const { encodeAnimatedWebp } = await import('$lib/utils/webpEncoder');

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

describe('exportAnimatedWebp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:animated-webp');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        const a = origCreate('a');
        a.click = vi.fn();
        return a;
      }
      if (tag === 'canvas') {
        const canvas = origCreate('canvas');
        const mockCtx = {
          clearRect: vi.fn(),
          putImageData: vi.fn(),
        };
        vi.spyOn(canvas, 'getContext').mockReturnValue(mockCtx as unknown as CanvasRenderingContext2D);
        vi.spyOn(canvas, 'toBlob').mockImplementation((cb: BlobCallback) => {
          cb(new Blob(['webp'], { type: 'image/webp' }));
        });
        return canvas;
      }
      return origCreate(tag);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const makeGifInfo = (frameCount = 2) => ({
    width: 16,
    height: 16,
    totalDuration: frameCount * 100,
    frames: Array.from({ length: frameCount }, (_, idx) => ({
      data: new Uint8ClampedArray(Array.from({ length: 16 * 16 * 4 }, (_v, i) => (i % 4 === 3 ? (idx === 0 ? 255 : 120) : idx + 1))),
      delay: 100,
      width: 16,
      height: 16,
    })),
  });

  it('returns a filename with .webp extension', async () => {
    const filename = await exportAnimatedWebp(makeGifInfo());
    expect(filename).toMatch(/^animated-\d+\.webp$/);
  });

  it('calls encodeAnimatedWebp with all frames', async () => {
    const gifInfo = makeGifInfo(3);
    await exportAnimatedWebp(gifInfo);
    expect(encodeAnimatedWebp).toHaveBeenCalledTimes(1);
    expect(vi.mocked(encodeAnimatedWebp).mock.calls[0][0]).toHaveLength(3);
  });

  it('revokes download URL after export', async () => {
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');
    await exportAnimatedWebp(makeGifInfo());
    expect(revokeSpy).toHaveBeenCalledWith('blob:animated-webp');
  });
});

describe('exportAnimatedSvg', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const makeGifInfo = (frameCount = 2) => ({
    width: 16,
    height: 16,
    totalDuration: frameCount * 100,
    frames: Array.from({ length: frameCount }, () => ({
      data: new Uint8ClampedArray(16 * 16 * 4),
      delay: 100,
      width: 16,
      height: 16,
    })),
  });

  it('returns a filename with .svg extension', async () => {
    const filename = await exportAnimatedSvg(makeGifInfo());
    expect(filename).toMatch(/^animated-\d+\.svg$/);
  });

  it('calls animatedFramesToSvg and downloadSvg', async () => {
    await exportAnimatedSvg(makeGifInfo(3));
    expect(animatedFramesToSvg).toHaveBeenCalledTimes(1);
    expect(downloadSvg).toHaveBeenCalledTimes(1);
  });
});
