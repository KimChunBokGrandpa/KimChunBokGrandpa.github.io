// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, screen } from '@testing-library/svelte';

// Mock all transitive dependencies
vi.mock('$lib/i18n/index.svelte', () => ({
  i18n: {
    t: vi.fn((key: string, ...args: Array<string | number>) => {
      const translations: Record<string, string> = {
        image_preview: 'Image preview',
        processed_preview_alt: 'Pixel art preview - {0}',
        gallery_n_colors: '{0} colors',
      };
      let value = translations[key] ?? key;
      for (let i = 0; i < args.length; i += 1) {
        value = value.replace(`{${i}}`, String(args[i]));
      }
      return value;
    }),
  },
}));

vi.mock('$lib/utils/palettes', () => ({
  getPaletteName: vi.fn((id: string) => id),
}));

vi.mock('$lib/utils/tooltip', () => ({
  tooltip: vi.fn(() => ({ destroy() {} })),
}));

import PreviewContent from '../editor/PreviewContent.svelte';
import type { ProcessingSettings } from '$lib/types';

afterEach(() => cleanup());

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

// Minimal mock of zoom/pan store — cast to expected type
function makeZoomPan(): ReturnType<typeof import('$lib/stores/zoomPanStore.svelte').createZoomPan> {
  return {
    zoomLevel: 1,
    panX: 0,
    panY: 0,
    isPanning: false,
    isTouchPanning: false,
    showGrid: false,
    previewContainer: undefined,
    previewImg: undefined,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    reset: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    startPan: vi.fn(),
    pan: vi.fn(),
    endPan: vi.fn(),
    handleWheel: vi.fn(),
    handleTouchStart: vi.fn(),
    handleTouchMove: vi.fn(),
    handleTouchEnd: vi.fn(),
    canZoomIn: true,
    canZoomOut: true,
    setZoom: vi.fn(),
  } as any;
}

describe('PreviewContent', () => {
  const defaultProps = () => ({
    zp: makeZoomPan(),
    originalImageSrc: null as string | null,
    processedImageSrc: null as string | null,
    isProcessing: false,
    processingSettings: makeSettings(),
    compareMode: false,
    onImageSelected: vi.fn(),
    onError: vi.fn(),
    onOpenSettings: vi.fn(),
  });

  it('renders without images (shows drop zone)', () => {
    const { container } = render(PreviewContent, { props: defaultProps() });
    expect(container.innerHTML).toBeTruthy();
  });

  it('renders with processed image', () => {
    const props = { ...defaultProps(), processedImageSrc: 'blob:test', originalImageSrc: 'blob:orig' };
    const { container } = render(PreviewContent, { props });
    expect(container.innerHTML).toBeTruthy();
  });

  it('localizes the processed preview alt text and color count badge', () => {
    const props = {
      ...defaultProps(),
      processedImageSrc: 'blob:test',
      originalImageSrc: 'blob:orig',
      colorCount: 12,
    };

    render(PreviewContent, { props });

    expect(screen.getByAltText('Pixel art preview - gameboy')).toBeTruthy();
    expect(screen.getByText('12 colors')).toBeTruthy();
  });

  it('shows processing state', () => {
    const props = { ...defaultProps(), isProcessing: true, originalImageSrc: 'blob:orig' };
    const { container } = render(PreviewContent, { props });
    expect(container.innerHTML).toBeTruthy();
  });

  it('renders GIF controls when isGif', () => {
    const props = {
      ...defaultProps(),
      originalImageSrc: 'blob:gif',
      processedImageSrc: 'blob:processed',
      isGif: true,
      gifCurrentFrame: 0,
      gifFrameCount: 10,
      gifPlaying: false,
      gifIsExporting: false,
      gifExportProgress: 0,
      onGifPlay: vi.fn(),
      onGifPause: vi.fn(),
      onGifSeek: vi.fn(),
      onGifExport: vi.fn(),
      onGifCancelExport: vi.fn(),
      onGifExportSpritesheet: vi.fn(),
    };
    const { container } = render(PreviewContent, { props });
    expect(container.innerHTML).toBeTruthy();
  });

  it('renders with post filter CSS', () => {
    const props = { ...defaultProps(), postFilterCss: 'brightness(120%)' };
    const { container } = render(PreviewContent, { props });
    expect(container.innerHTML).toBeTruthy();
  });

  it('renders preview toolbar buttons with stable action labels', () => {
    const props = { ...defaultProps(), processedImageSrc: 'blob:test', originalImageSrc: 'blob:orig' };
    render(PreviewContent, { props });

    expect(screen.getByLabelText('btn_grid_toggle')).toBeTruthy();
    expect(screen.getByLabelText('btn_tile_toggle')).toBeTruthy();
    expect(screen.getByLabelText('btn_eyedropper_toggle')).toBeTruthy();
  });
});
