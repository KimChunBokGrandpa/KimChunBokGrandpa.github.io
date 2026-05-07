// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { fireEvent } from '@testing-library/svelte';

vi.mock('$lib/i18n/index.svelte', () => ({
  i18n: {
    t: vi.fn((key: string) => ({
      preview_output_summary: 'Output summary',
      open_settings: 'Open Settings',
      btn_open_settings: 'Open Settings',
      rotate_left: 'Rotate Left',
      btn_rotate_left: 'Rotate Left',
      rotate_right: 'Rotate Right',
      btn_rotate_right: 'Rotate Right',
      crop: 'Crop',
      crop_active: 'Crop Active',
      btn_compare_toggle: 'Toggle Compare',
      shortcut_hint_compare: 'Compare (Ctrl+C)',
      btn_zoom_out: 'Zoom Out',
      shortcut_hint_zoom_out: 'Zoom Out (Ctrl+-)',
      btn_zoom_in: 'Zoom In',
      shortcut_hint_zoom_in: 'Zoom In (Ctrl++)',
      btn_fit_to_window: 'Fit to Window',
      shortcut_hint_fit: 'Fit (Ctrl+0)',
      show_pixel_grid: 'Show Pixel Grid',
      hide_pixel_grid: 'Hide Pixel Grid',
      btn_grid_toggle: 'Toggle Grid',
      tile_preview: 'Tile Preview',
      exit_tile: 'Exit Tile',
      btn_tile_toggle: 'Toggle Tile',
      eyedropper: 'Eyedropper',
      exit_eyedropper: 'Exit Eyedropper',
      btn_eyedropper_toggle: 'Toggle Eyedropper',
      set_zoom: 'Set Zoom',
      pixel_size: 'Pixelation Size',
      palette: 'Palette',
      dithering: 'Dithering',
      dither_none: 'None',
      dither_fs: 'Floyd-Steinberg',
      dither_ordered: 'Ordered',
      dither_atkinson: 'Atkinson',
      unique_colors: 'Unique Colors',
      gallery_n_colors: '12 colors',
      compare_mode_cycle: 'Cycle Compare Mode',
    }[key] ?? key)),
  },
}));

vi.mock('$lib/utils/palettes', () => ({
  getPaletteName: vi.fn((id: string) => id === 'nes' ? 'NES Standard' : id),
}));

import PreviewBottomBar from '../editor/PreviewBottomBar.svelte';
import type { ProcessingSettings } from '$lib/types';

afterEach(() => cleanup());

function mockNavigatorPlatform(platform: string) {
  Object.defineProperty(window.navigator, 'platform', {
    configurable: true,
    value: platform,
  });
}

function makeZoomPan() {
  return {
    zoomLevel: 1,
    showGrid: false,
    zoomOut: vi.fn(),
    zoomIn: vi.fn(),
    zoomToFit: vi.fn(),
    setZoom: vi.fn(),
  };
}

function makeSettings(overrides?: Partial<ProcessingSettings>): ProcessingSettings {
  return {
    pixelSize: 6,
    palette: 'nes',
    crtEffect: 'none',
    glitchFilters: [],
    renderMode: 'pixel_perfect',
    glitchSeed: null,
    ditherType: 'ordered',
    effectLayers: [],
    ...overrides,
  };
}

describe('PreviewBottomBar', () => {
  it('shows platform-aware compare and fit shortcut hints on Apple platforms', async () => {
    mockNavigatorPlatform('MacIntel');

    const { getByTestId, getByLabelText } = render(PreviewBottomBar, {
      props: {
        zp: makeZoomPan() as any,
        compareMode: false,
        compareVariantIcon: '↔',
        cropModeActive: false,
        tileMode: false,
        eyedropperActive: false,
        eyedropperOverlay: { dismiss: vi.fn() },
        hasCrop: false,
        currentRotation: 0,
        cycleCompareVariant: vi.fn(),
        onOpenSettings: vi.fn(),
      },
    });

    const compareButton = getByTestId('toggle-compare-button');
    const fitButton = getByLabelText('Fit to Window');

    await fireEvent.mouseEnter(compareButton);
    await fireEvent.mouseEnter(fitButton);

    expect(compareButton.getAttribute('data-tooltip')).toContain('Cmd+C');
    expect(fitButton.getAttribute('data-tooltip')).toContain('Cmd+0');
  });

  it('shows a compact output summary above preview actions', () => {
    const { getByTestId } = render(PreviewBottomBar, {
      props: {
        zp: makeZoomPan() as any,
        compareMode: false,
        compareVariantIcon: '↔',
        cropModeActive: false,
        tileMode: false,
        eyedropperActive: false,
        eyedropperOverlay: { dismiss: vi.fn() },
        hasCrop: false,
        currentRotation: 0,
        processingSettings: makeSettings(),
        colorCount: 12,
        cycleCompareVariant: vi.fn(),
        onOpenSettings: vi.fn(),
      },
    });

    const summary = getByTestId('preview-output-summary');
    expect(summary.textContent).toContain('6px');
    expect(summary.textContent).toContain('NES Standard');
    expect(summary.textContent).toContain('Ordered');
    expect(summary.textContent).toContain('12 colors');
  });
});
