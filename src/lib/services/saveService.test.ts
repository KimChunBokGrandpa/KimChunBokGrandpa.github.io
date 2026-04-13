// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock env (non-Tauri)
vi.mock('$lib/utils/env', () => ({ isTauri: false }));

// Mock i18n
vi.mock('$lib/i18n/index.svelte', () => ({
  i18n: { t: vi.fn((key: string) => key) },
}));

const { createExportFile, saveImage } = await import('./saveService');
const { shareImage, shareImageFiles } = await import('./saveService');

describe('saveImage', () => {
  let appendChildSpy: ReturnType<typeof vi.spyOn>;
  let removeChildSpy: ReturnType<typeof vi.spyOn>;
  let clickSpy: ReturnType<typeof vi.fn<() => void>>;
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let navigatorShareSpy: ReturnType<typeof vi.fn>;
  let navigatorCanShareSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    clickSpy = vi.fn();
    navigatorShareSpy = vi.fn().mockResolvedValue(undefined);
    navigatorCanShareSpy = vi.fn().mockReturnValue(true);
    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-download');
    Object.defineProperty(navigator, 'share', { configurable: true, value: navigatorShareSpy });
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: navigatorCanShareSpy });

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
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('downloads image in web mode and returns i18n key', async () => {
    // Provide a sourceCanvas to avoid Image loading
    const mockCanvas = document.createElement('canvas');
    const result = await saveImage('blob:src', { format: 'png', quality: 0.92 }, mockCanvas);

    expect(clickSpy).toHaveBeenCalled();
    expect(navigatorShareSpy).not.toHaveBeenCalled();
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

  it('creates export files with requested filename and mime type', async () => {
    const mockCanvas = document.createElement('canvas');
    const file = await createExportFile(
      'blob:src',
      { format: 'webp', quality: 0.9, filename: 'poster-draft' },
      mockCanvas,
    );

    expect(file.name).toBe('poster-draft.webp');
    expect(file.type).toBe('image/webp');
  });

  it('revokes blob URL after download', async () => {
    vi.useFakeTimers();
    const mockCanvas = document.createElement('canvas');
    await saveImage('blob:src', { format: 'png', quality: 0.92 }, mockCanvas);
    await vi.runAllTimersAsync();

    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-download');
    vi.useRealTimers();
  });

  it('cleans up anchor element after download', async () => {
    const mockCanvas = document.createElement('canvas');
    await saveImage('blob:src', { format: 'png', quality: 0.92 }, mockCanvas);

    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
  });

  it('shares a single image when explicitly requested', async () => {
    const mockCanvas = document.createElement('canvas');
    const result = await shareImage('blob:src', { format: 'png', quality: 0.92 }, mockCanvas);

    expect(navigatorShareSpy).toHaveBeenCalledTimes(1);
    expect(clickSpy).not.toHaveBeenCalled();
    expect(result).toBe('image_shared');
  });

  it('shares multiple files when explicitly requested', async () => {
    const firstCanvas = document.createElement('canvas');
    const secondCanvas = document.createElement('canvas');
    const result = await shareImageFiles([
      { processedImageSrc: 'blob:1', filename: 'one', sourceCanvas: firstCanvas },
      { processedImageSrc: 'blob:2', filename: 'two', sourceCanvas: secondCanvas },
    ], { format: 'png', quality: 0.92 });

    expect(navigatorShareSpy).toHaveBeenCalledTimes(1);
    const sharedPayload = navigatorShareSpy.mock.calls[0][0] as { files: File[] };
    expect(sharedPayload.files.map((file) => file.name)).toEqual(['one.png', 'two.png']);
    expect(result).toBe('image_shared');
  });

  it('returns empty string when multi-file share is aborted by the user', async () => {
    navigatorShareSpy.mockRejectedValueOnce(Object.assign(new Error('cancelled'), { name: 'AbortError' }));
    const firstCanvas = document.createElement('canvas');

    const result = await shareImageFiles([
      { processedImageSrc: 'blob:1', filename: 'one', sourceCanvas: firstCanvas },
    ], { format: 'png', quality: 0.92 });

    expect(result).toBe('');
  });

  it('throws a translated error when file sharing is unsupported', async () => {
    navigatorCanShareSpy.mockReturnValue(false);
    const mockCanvas = document.createElement('canvas');

    await expect(shareImage('blob:src', { format: 'png', quality: 0.92 }, mockCanvas))
      .rejects.toThrow('share_not_supported');
  });
});
