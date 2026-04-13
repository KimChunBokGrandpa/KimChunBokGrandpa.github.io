// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, fireEvent, waitFor } from '@testing-library/svelte';

const { saveImageMock, shareImageFilesMock } = vi.hoisted(() => ({
  saveImageMock: vi.fn().mockResolvedValue('saved'),
  shareImageFilesMock: vi.fn().mockResolvedValue('image_shared'),
}));

vi.mock('$app/environment', () => ({ browser: true }));

vi.mock('$lib/i18n/index.svelte', () => ({
  i18n: { t: vi.fn((key: string) => key) },
}));

vi.mock('$lib/services/imageProcessor', () => ({
  processorService: {
    processImage: vi.fn().mockResolvedValue('blob:processed'),
    getLastColorCount: vi.fn(() => 16),
    getLastCanvas: vi.fn(() => null),
    clearImageCache: vi.fn(),
  },
}));

vi.mock('$lib/services/saveService', () => ({
  saveImage: saveImageMock,
  shareImageFiles: shareImageFilesMock,
}));

vi.mock('$lib/utils/palettes', () => ({
  getPaletteName: vi.fn((id: string) => id),
}));

vi.mock('$lib/stores/customPaletteStore.svelte', () => ({
  customPaletteStore: {
    getPaletteById: vi.fn(() => null),
  },
}));

import BatchProcessor from '../media/BatchProcessor.svelte';
import type { ProcessingSettings } from '$lib/types';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  saveImageMock.mockClear();
  shareImageFilesMock.mockClear();
});

function makeSettings(): ProcessingSettings {
  return {
    pixelSize: 4,
    palette: 'gameboy',
    crtEffect: 'none',
    glitchFilters: [],
    renderMode: 'pixel_perfect',
    glitchSeed: null,
    ditherType: 'none',
    effectLayers: [],
  };
}

describe('BatchProcessor', () => {
  const defaultProps = () => ({
    settings: makeSettings(),
  });

  it('renders the batch processor container', () => {
    const { container } = render(BatchProcessor, { props: defaultProps() });
    expect(container.innerHTML).toBeTruthy();
  });

  it('renders drop zone for batch files', () => {
    const { container } = render(BatchProcessor, { props: defaultProps() });
    // Look for drop zone or file input area
    const dropZone = container.querySelector('[class*="drop"], [class*="batch"]');
    expect(dropZone).toBeTruthy();
  });

  it('renders with custom save format', () => {
    const props = { ...defaultProps(), saveFormat: 'jpeg' as const, saveQuality: 0.85 };
    const { container } = render(BatchProcessor, { props });
    expect(container.innerHTML).toBeTruthy();
  });

  it('renders empty state with no items', () => {
    const { container } = render(BatchProcessor, { props: defaultProps() });
    // Should show empty state or just the drop zone
    expect(container.innerHTML).toBeTruthy();
  });

  it('saves every processed batch result with unique filenames', async () => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      blob: async () => new Blob(['processed'], { type: 'image/png' }),
    } as Response);

    const { container, getByText } = render(BatchProcessor, { props: defaultProps() });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const fileA = new File(['a'], 'sprite.png', { type: 'image/png' });
    const fileB = new File(['b'], 'sprite.webp', { type: 'image/webp' });

    await fireEvent.change(input, { target: { files: [fileA, fileB] } });
    await fireEvent.click(getByText(/process_all/));

    await waitFor(() => {
      expect(container.textContent).toContain('2 done');
    });

    await fireEvent.click(getByText(/save_all/));
    await vi.runAllTimersAsync();

    expect(saveImageMock).toHaveBeenCalledTimes(2);
    expect(saveImageMock.mock.calls[0][1]).toMatchObject({ filename: 'retro_sprite' });
    expect(saveImageMock.mock.calls[1][1]).toMatchObject({ filename: 'retro_sprite_2' });

    vi.useRealTimers();
  });

  it('shares every processed batch result with unique filenames and forwards success message', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      blob: async () => new Blob(['processed'], { type: 'image/png' }),
    } as Response);

    const onMessage = vi.fn();
    const { container, getByText } = render(BatchProcessor, {
      props: { ...defaultProps(), onMessage },
    });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const fileA = new File(['a'], 'sprite.png', { type: 'image/png' });
    const fileB = new File(['b'], 'sprite.webp', { type: 'image/webp' });

    await fireEvent.change(input, { target: { files: [fileA, fileB] } });
    await fireEvent.click(getByText(/process_all/));

    await waitFor(() => {
      expect(container.textContent).toContain('2 done');
    });

    await fireEvent.click(getByText(/share_all/));

    expect(shareImageFilesMock).toHaveBeenCalledTimes(1);
    expect(shareImageFilesMock.mock.calls[0]?.[0]).toMatchObject([
      { filename: 'retro_sprite' },
      { filename: 'retro_sprite_2' },
    ]);
    expect(onMessage).toHaveBeenCalledWith('image_shared');
  });

  it('does not notify when batch share is aborted', async () => {
    shareImageFilesMock.mockResolvedValueOnce('');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      blob: async () => new Blob(['processed'], { type: 'image/png' }),
    } as Response);

    const onMessage = vi.fn();
    const { container, getByText } = render(BatchProcessor, {
      props: { ...defaultProps(), onMessage },
    });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const fileA = new File(['a'], 'sprite.png', { type: 'image/png' });

    await fireEvent.change(input, { target: { files: [fileA] } });
    await fireEvent.click(getByText(/process_all/));

    await waitFor(() => {
      expect(container.textContent).toContain('1 done');
    });

    await fireEvent.click(getByText(/share_all/));

    expect(onMessage).not.toHaveBeenCalled();
  });

  it('forwards batch share errors to onError', async () => {
    shareImageFilesMock.mockRejectedValueOnce(new Error('share_failed'));
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      blob: async () => new Blob(['processed'], { type: 'image/png' }),
    } as Response);

    const onError = vi.fn();
    const { container, getByText } = render(BatchProcessor, {
      props: { ...defaultProps(), onError },
    });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const fileA = new File(['a'], 'sprite.png', { type: 'image/png' });

    await fireEvent.change(input, { target: { files: [fileA] } });
    await fireEvent.click(getByText(/process_all/));

    await waitFor(() => {
      expect(container.textContent).toContain('1 done');
    });

    await fireEvent.click(getByText(/share_all/));

    expect(onError).toHaveBeenCalledWith('share_failed');
  });
});
