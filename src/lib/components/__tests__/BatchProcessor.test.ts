// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';

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
  saveImage: vi.fn().mockResolvedValue('saved'),
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
});
