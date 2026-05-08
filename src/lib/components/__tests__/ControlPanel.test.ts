// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { fireEvent } from '@testing-library/svelte';

// Mock $app/environment
vi.mock('$app/environment', () => ({ browser: true }));

// Mock i18n
vi.mock('$lib/i18n/index.svelte', () => ({
  i18n: {
    t: vi.fn((key: string) => ({
      shortcut_hint_save: 'Save (Ctrl+S)',
      save_no_image: 'Load an image in Preview to save',
      save_as: 'Save As...',
      export_btn: 'Export',
      format: 'Format',
      quality: 'Quality',
      share_image: 'Share',
      export_svg: 'Export SVG',
      send_to_poster_maker: 'Send to Poster Maker',
    }[key] ?? key)),
  },
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

vi.mock('../editor/PresetManager.svelte', async () => ({
  default: (await import('./PresetManagerLazyStub.svelte')).default,
}));

import ControlPanel from '../editor/ControlPanel.svelte';
import type { ProcessingSettings } from '$lib/types';

afterEach(() => cleanup());

function mockNavigatorPlatform(platform: string) {
  Object.defineProperty(window.navigator, 'platform', {
    configurable: true,
    value: platform,
  });
}

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

  it('shows the effects badge from normalized legacy effect fields', () => {
    const props = {
      ...defaultProps(),
      settings: makeSettings({
        glitchFilters: [{ type: 'noise', intensity: 2 }],
        renderMode: 'hqx',
        effectLayers: [],
      }),
    };
    const { container } = render(ControlPanel, { props });

    const effectsBadge = container.querySelector('.cp-tab:nth-child(2) .tab-badge');
    expect(effectsBadge?.textContent).toBe('2');
  });

  it('lazy-loads preset manager when presets tab opens', async () => {
    const { getByRole, findByTestId } = render(ControlPanel, { props: defaultProps() });

    await fireEvent.click(getByRole('tab', { name: 'tab_presets' }));

    expect(await findByTestId('mock-preset-manager')).toBeTruthy();
  });

  it('keeps quick tuning controls on the presets tab', async () => {
    const props = defaultProps();
    const { getByRole, getByTestId } = render(ControlPanel, { props });

    await fireEvent.click(getByRole('tab', { name: 'tab_presets' }));

    expect(getByTestId('preset-tune-strip')).toBeTruthy();

    await fireEvent.click(getByTestId('preset-tune-pixel-increase'));
    expect(props.onChange).toHaveBeenLastCalledWith(expect.objectContaining({ pixelSize: 5 }));

    await fireEvent.click(getByTestId('preset-tune-palette-nes'));
    expect(props.onChange).toHaveBeenLastCalledWith(expect.objectContaining({ palette: 'nes' }));

    await fireEvent.click(getByTestId('preset-tune-dither-ordered'));
    expect(props.onChange).toHaveBeenLastCalledWith(expect.objectContaining({ ditherType: 'ordered' }));

    await fireEvent.click(getByTestId('preset-tune-palette-gallery'));
    expect(props.onOpenGallery).toHaveBeenCalledTimes(1);
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

  it('groups export settings, primary save, and secondary destinations', () => {
    const { getByTestId } = render(ControlPanel, {
      props: {
        ...defaultProps(),
        saveFormat: 'jpeg',
        saveQuality: 0.85,
        hasProcessedImage: true,
        onExportSvg: vi.fn(),
        onSendToPosterMaker: vi.fn(),
      },
    });

    const primaryRow = getByTestId('export-primary-row');
    const saveButton = getByTestId('save-image-button');
    const secondaryActions = getByTestId('export-secondary-actions');

    expect(getByTestId('export-action-bar')).toBeTruthy();
    expect(primaryRow.contains(saveButton)).toBe(true);
    expect(getByTestId('export-format-row').textContent).toContain('Format');
    expect(getByTestId('export-summary-chip').textContent).toContain('JPEG 85%');
    expect(secondaryActions.contains(getByTestId('share-image-button'))).toBe(true);
    expect(secondaryActions.textContent).toContain('SVG');
    expect(secondaryActions.contains(getByTestId('send-to-poster-maker-button'))).toBe(true);
  });

  it('renders send to Poster Maker button when provided', () => {
    const { getByTestId } = render(ControlPanel, {
      props: { ...defaultProps(), onSendToPosterMaker: vi.fn(), hasProcessedImage: true },
    });
    expect(getByTestId('send-to-poster-maker-button')).toBeTruthy();
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

  it('shows a platform-aware save tooltip on Apple platforms', async () => {
    mockNavigatorPlatform('MacIntel');

    const { getByTestId } = render(ControlPanel, { props: defaultProps() });
    const saveButton = getByTestId('save-image-button');
    await fireEvent.mouseEnter(saveButton);

    expect(saveButton.getAttribute('title')).toContain('Cmd+S');
  });
});
