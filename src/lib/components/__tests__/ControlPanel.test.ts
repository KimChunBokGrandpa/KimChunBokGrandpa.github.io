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
  getCustomPresets: vi.fn(() => []),
  addCustomPreset: vi.fn(),
  removeCustomPreset: vi.fn(),
  renameCustomPreset: vi.fn(),
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

vi.mock('$lib/components/editor/PresetManager.svelte', async () => ({
  default: (await import('./PresetManagerLazyStub.svelte')).default,
}));

import ControlPanel from '../editor/ControlPanel.svelte';
import type { ProcessingSettings } from '$lib/types';
import type { Snippet } from 'svelte';

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
    onOpenGallery: vi.fn(),
  };
}

// Helper to create a simple snippet for Svelte 5
function createSnippet(text: string): Snippet {
  return ((anchor: Node) => {
    const node = document.createTextNode(text);
    anchor.parentNode?.insertBefore(node, anchor);
    return () => node.remove();
  }) as unknown as Snippet;
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

  it('renders export snippet slot when provided', () => {
    const props = {
      ...defaultProps(),
      export: createSnippet('export-slot-content'),
    };
    const { container } = render(ControlPanel, { props });
    expect(container.textContent).toContain('export-slot-content');
  });

  it('renders without error when no export snippet is provided', () => {
    const { container } = render(ControlPanel, { props: defaultProps() });
    expect(container.querySelector('.cp-root')).toBeTruthy();
    // No export snippet content should be present
    expect(container.textContent).not.toContain('export-slot-content');
  });

  it('uses presets as the recommendation-first default tab', () => {
    const { getAllByRole, getByTestId } = render(ControlPanel, { props: defaultProps() });
    const tabs = getAllByRole('tab');

    expect(tabs[0]?.textContent).toContain('tab_presets');
    expect(tabs[1]?.textContent).toContain('tab_basic');
    expect(tabs[0]?.getAttribute('aria-selected')).toBe('true');
    expect(getByTestId('preset-tune-strip')).toBeTruthy();
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

    const effectsTab = Array.from(container.querySelectorAll('[role="tab"]'))
      .find((tab) => tab.getAttribute('aria-label') === 'tab_effects');
    const effectsBadge = effectsTab?.querySelector('.tab-badge');
    expect(effectsBadge?.textContent).toBe('2');
  });

  it('shows the current palette family in the panel summary and picker', () => {
    const { container, getByTestId } = render(ControlPanel, {
      props: {
        ...defaultProps(),
        settings: makeSettings({ palette: 'cyberpunk16' }),
      },
    });

    expect(getByTestId('palette-family-summary').textContent).toContain('preset_family_retro_treatment');
    expect(container.querySelector('.palette-btn')?.textContent).toContain('preset_family_retro_treatment');
  });

  it('keeps the preset manager slot on the presets tab', async () => {
    const { getByRole, getByTestId, queryByTestId } = render(ControlPanel, { props: defaultProps() });

    await fireEvent.click(getByRole('tab', { name: 'tab_basic' }));
    await fireEvent.click(getByRole('tab', { name: 'tab_presets' }));

    expect(getByTestId('preset-tune-strip')).toBeTruthy();
    expect(queryByTestId('mock-preset-manager') ?? queryByTestId('preset-manager-loading')).toBeTruthy();
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

  it('groups detailed Basic tuning into compact fieldsets', async () => {
    const { getByRole, getByTestId } = render(ControlPanel, { props: defaultProps() });

    await fireEvent.click(getByRole('tab', { name: 'tab_basic' }));

    const tuningGrid = getByTestId('basic-tuning-grid');
    const pixelFieldset = getByTestId('basic-pixel-fieldset');
    const colorFieldset = getByTestId('basic-color-fieldset');
    const colorSpaceRow = getByTestId('basic-color-space-row');

    expect(tuningGrid.contains(pixelFieldset)).toBe(true);
    expect(tuningGrid.contains(colorFieldset)).toBe(true);
    expect(colorFieldset.contains(colorSpaceRow)).toBe(true);
  });

  it('groups effects and post filters into detailed tuning fieldsets', async () => {
    const { getByRole, getByTestId } = render(ControlPanel, { props: defaultProps() });

    await fireEvent.click(getByRole('tab', { name: 'tab_effects' }));
    expect(getByTestId('effect-display-fieldset')).toBeTruthy();
    expect(getByTestId('effect-render-fieldset')).toBeTruthy();
    expect(getByTestId('effect-stack-fieldset')).toBeTruthy();

    await fireEvent.click(getByRole('tab', { name: 'tab_adjust' }));
    expect(getByTestId('adjust-filter-fieldset')).toBeTruthy();
  });

  it('renders buttons', () => {
    const { container } = render(ControlPanel, { props: defaultProps() });
    const allButtons = container.querySelectorAll('button');
    expect(allButtons.length).toBeGreaterThan(0);
  });

  it('shows pixel size control', async () => {
    const { container, getByRole } = render(ControlPanel, { props: defaultProps() });
    await fireEvent.click(getByRole('tab', { name: 'tab_basic' }));
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
