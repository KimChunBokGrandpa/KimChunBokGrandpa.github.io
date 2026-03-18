// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock env (non-Tauri)
vi.mock('$lib/utils/env', () => ({ isTauri: false }));

// Mock i18n
vi.mock('$lib/i18n/index.svelte', () => ({
  i18n: { t: vi.fn((key: string) => key) },
}));

const { saveImage } = await import('./saveService');

describe('saveImage', () => {
  let appendChildSpy: ReturnType<typeof vi.spyOn>;
  let removeChildSpy: ReturnType<typeof vi.spyOn>;
  let clickSpy: ReturnType<typeof vi.fn<() => void>>;
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    clickSpy = vi.fn();
    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-download');

    // Mock createElement for anchor tag
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        const a = origCreate('a');
        a.click = clickSpy;
        return a;
      }
      if (tag === 'canvas') {
        const canvas = origCreate('canvas');
        const mockCtx = {
          drawImage: vi.fn(),
          filter: '',
        };
        vi.spyOn(canvas, 'getContext').mockReturnValue(mockCtx as unknown as CanvasRenderingContext2D);
        vi.spyOn(canvas, 'toBlob').mockImplementation((cb: BlobCallback) => {
          cb(new Blob(['img'], { type: 'image/png' }));
        });
        return canvas;
      }
      return origCreate(tag);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('downloads image in web mode and returns i18n key', async () => {
    // Provide a sourceCanvas to avoid Image loading
    const mockCanvas = document.createElement('canvas');
    const result = await saveImage('blob:src', { format: 'png', quality: 0.92 }, mockCanvas);

    expect(clickSpy).toHaveBeenCalled();
    expect(result).toBe('image_downloaded');
  });

  it('uses correct file extension for jpeg', async () => {
    const mockCanvas = document.createElement('canvas');
    await saveImage('blob:src', { format: 'jpeg', quality: 0.85 }, mockCanvas);

    expect(clickSpy).toHaveBeenCalled();
    // Verify the anchor download attribute has jpg extension
    expect(appendChildSpy).toHaveBeenCalled();
    const anchor = appendChildSpy.mock.calls[0][0] as HTMLAnchorElement;
    expect(anchor.download).toMatch(/\.jpg$/);
  });

  it('uses correct file extension for webp', async () => {
    const mockCanvas = document.createElement('canvas');
    await saveImage('blob:src', { format: 'webp', quality: 0.9 }, mockCanvas);

    const anchor = appendChildSpy.mock.calls[0][0] as HTMLAnchorElement;
    expect(anchor.download).toMatch(/\.webp$/);
  });

  it('applies CSS filter when provided with sourceCanvas', async () => {
    const mockCanvas = document.createElement('canvas');
    const result = await saveImage('blob:src', { format: 'png', quality: 0.92 }, mockCanvas, 'brightness(120%)');

    expect(result).toBe('image_downloaded');
    expect(clickSpy).toHaveBeenCalled();
  });

  it('revokes blob URL after download', async () => {
    const mockCanvas = document.createElement('canvas');
    await saveImage('blob:src', { format: 'png', quality: 0.92 }, mockCanvas);

    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-download');
  });

  it('cleans up anchor element after download', async () => {
    const mockCanvas = document.createElement('canvas');
    await saveImage('blob:src', { format: 'png', quality: 0.92 }, mockCanvas);

    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
  });
});
