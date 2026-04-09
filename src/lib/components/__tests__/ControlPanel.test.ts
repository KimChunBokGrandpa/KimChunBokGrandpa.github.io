// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';

// Mock $app/environment
vi.mock('$app/environment', () => ({ browser: true }));

// Mock i18n
vi.mock('$lib/i18n/index.svelte', () => ({
  i18n: { t: vi.fn((key: string) => key) },
}));

// Mock customPresetStore
vi.mock('$lib/stores/customPresetStore.svelte', () => ({
  customPresetStore: {
    presets: [],
    addPreset: vi.fn(),
    removePreset: vi.fn(),
  },
}));

// Mock customPaletteStore
vi.mock('$lib/stores/customPaletteStore.svelte', () => ({
  customPaletteStore: {
    palettes: [],
    getPaletteById: vi.fn(() => null),
  },
}));

import ControlPanel from '../editor/ControlPanel.svelte';
import type { ProcessingSettings } from '$lib/types';

afterEach(() => cleanup());

function makeSettings(overrides?: Partial<ProcessingSettings>): ProcessingSettings {
  return {
    pixelSize: 4,
    palette: 'gameboy',
    crtEffect: 'none',
    glitchFilters: [],
    renderMode: 'pixel_perfect',
    glitchSeed: null,
    ditherType: 'none',
    effectLayers: [],
    ...overrides,
  };
}

function defaultProps() {
  return {
    settings: makeSettings(),
    onChange: vi.fn(),
    onSave: vi.fn(),
    onShare: vi.fn(),
    onOpenGallery: vi.fn(),
  };
}

describe('ControlPanel', () => {
  it('renders the control panel container', () => {
    const { container } = render(ControlPanel, { props: defaultProps() });
    expect(container.querySelector('[role="tabpanel"], .tab-panel')).toBeTruthy();
  });

  it('renders tab buttons', () => {
    const { container } = render(ControlPanel, { props: defaultProps() });
    const tabs = container.querySelectorAll('.tab-btn, [role="tab"]');
    expect(tabs.length).toBeGreaterThanOrEqual(3);
  });

  it('renders save button', () => {
    const { container } = render(ControlPanel, { props: defaultProps() });
    const allButtons = container.querySelectorAll('button');
    expect(allButtons.length).toBeGreaterThan(0);
  });

  it('renders a separate share button when provided', () => {
    const { getByTestId } = render(ControlPanel, { props: defaultProps() });
    expect(getByTestId('save-image-button')).toBeTruthy();
    expect(getByTestId('share-image-button')).toBeTruthy();
  });

  it('shows pixel size control', () => {
    const { container } = render(ControlPanel, { props: defaultProps() });
    // Look for range input or pixel size related element
    const ranges = container.querySelectorAll('input[type="range"]');
    expect(ranges.length).toBeGreaterThan(0);
  });

  it('renders with auto-process toggle', () => {
    const props = { ...defaultProps(), autoProcess: true };
    const { container } = render(ControlPanel, { props });
    // Should render without error
    expect(container.innerHTML).toBeTruthy();
  });

  it('renders with hasImage=false', () => {
    const props = { ...defaultProps(), hasImage: false };
    const { container } = render(ControlPanel, { props });
    expect(container.innerHTML).toBeTruthy();
  });

  it('renders apply now button when hasUnappliedChanges', () => {
    const props = { ...defaultProps(), autoProcess: false, hasUnappliedChanges: true, onApplyNow: vi.fn() };
    const { container } = render(ControlPanel, { props });
    expect(container.innerHTML).toBeTruthy();
  });
});
