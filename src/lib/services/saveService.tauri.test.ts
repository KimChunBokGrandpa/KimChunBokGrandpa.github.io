// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const saveMock = vi.fn();
const writeFileMock = vi.fn();

vi.mock('$lib/utils/env', () => ({ isTauri: true }));
vi.mock('$lib/i18n/index.svelte', () => ({
  i18n: { t: vi.fn((key: string) => key) },
}));
vi.mock('@tauri-apps/plugin-dialog', () => ({
  save: saveMock,
}));
vi.mock('@tauri-apps/plugin-fs', () => ({
  writeFile: writeFileMock,
}));

const { saveImage } = await import('./saveService');

describe('saveImage (tauri)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const element = originalCreateElement(tag);
      if (tag === 'canvas') {
        const canvas = element as HTMLCanvasElement;
        vi.spyOn(canvas, 'toBlob').mockImplementation((callback: BlobCallback) => {
          callback(new Blob(['native-image'], { type: 'image/png' }));
        });
      }
      return element;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses native save dialog defaultPath and writes file bytes on success', async () => {
    saveMock.mockResolvedValue('/tmp/poster-draft.png');
    writeFileMock.mockResolvedValue(undefined);

    const canvas = document.createElement('canvas') as HTMLCanvasElement;
    const result = await saveImage(
      'blob:src',
      { format: 'png', quality: 0.92, filename: 'poster-draft' },
      canvas,
    );

    expect(saveMock).toHaveBeenCalledWith({
      filters: [{ name: 'Image', extensions: ['png'] }],
      defaultPath: 'poster-draft.png',
    });
    expect(writeFileMock).toHaveBeenCalledTimes(1);
    expect(writeFileMock.mock.calls[0][0]).toBe('/tmp/poster-draft.png');
    expect(writeFileMock.mock.calls[0][1]).toBeInstanceOf(Uint8Array);
    expect(result).toBe('file_saved');
  });

  it('returns empty string when the native save dialog is cancelled', async () => {
    saveMock.mockResolvedValue(null);

    const canvas = document.createElement('canvas') as HTMLCanvasElement;
    const result = await saveImage(
      'blob:src',
      { format: 'png', quality: 0.92, filename: 'poster-draft' },
      canvas,
    );

    expect(writeFileMock).not.toHaveBeenCalled();
    expect(result).toBe('');
  });

  it('throws a wrapped error when native writeFile fails', async () => {
    saveMock.mockResolvedValue('/tmp/poster-draft.png');
    writeFileMock.mockRejectedValue(new Error('disk full'));

    const canvas = document.createElement('canvas') as HTMLCanvasElement;

    await expect(
      saveImage(
        'blob:src',
        { format: 'png', quality: 0.92, filename: 'poster-draft' },
        canvas,
      ),
    ).rejects.toThrow('Failed to write file: disk full');
  });

  it('uses generated default filename when custom filename is omitted', async () => {
    saveMock.mockResolvedValue('/tmp/retro_pixel_auto.jpg');
    writeFileMock.mockResolvedValue(undefined);
    vi.spyOn(Date, 'now').mockReturnValue(1_715_000_000_000);

    const canvas = document.createElement('canvas') as HTMLCanvasElement;
    await saveImage(
      'blob:src',
      { format: 'jpeg', quality: 0.85 },
      canvas,
    );

    expect(saveMock).toHaveBeenCalledWith({
      filters: [{ name: 'Image', extensions: ['jpg'] }],
      defaultPath: 'retro_pixel_1715000000000.jpg',
    });
  });
});
