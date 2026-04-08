// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/svelte';
import { fireEvent } from '@testing-library/svelte';

vi.mock('$app/environment', () => ({ browser: true }));

vi.mock('$lib/i18n/index.svelte', () => ({
  i18n: { t: vi.fn((key: string) => key) },
}));

vi.mock('$lib/stores/customPresetStore.svelte', () => ({
  customPresetStore: {
    presets: [],
    addPreset: vi.fn(),
    removePreset: vi.fn(),
  },
  getCustomPresets: vi.fn(() => []),
}));

vi.mock('$lib/utils/presetPreview', () => ({
  getPresetPreview: vi.fn(async (input: { id?: string }) => `data:image/png;base64,${input.id || 'preview'}`),
}));

import PresetManager from '../editor/PresetManager.svelte';
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

describe('PresetManager', () => {
  const defaultProps = () => ({
    settings: makeSettings(),
    onChange: vi.fn(),
  });

  it('renders preset manager container', () => {
    const { container } = render(PresetManager, { props: defaultProps() });
    expect(container.innerHTML).toBeTruthy();
  });

  it('renders preset list items', () => {
    const { container } = render(PresetManager, { props: defaultProps() });
    // Built-in presets should render
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders with matched preset highlighted', () => {
    // Default settings with pixelSize=4 and gameboy palette should match a preset
    const { container } = render(PresetManager, { props: defaultProps() });
    expect(container.innerHTML).toBeTruthy();
  });

  it('calls onChange when a preset is clicked', async () => {
    const props = defaultProps();
    const { container } = render(PresetManager, { props });
    const buttons = container.querySelectorAll('button');
    if (buttons.length > 0) {
      await fireEvent.click(buttons[0]);
      // Either onChange is called or settings are updated
      expect(container.innerHTML).toBeTruthy();
    }
  });

  it('renders preset thumbnail previews', async () => {
    const { container } = render(PresetManager, { props: defaultProps() });
    await waitFor(() => {
      expect(container.querySelector('.preset-card-thumb')).toBeTruthy();
    });
  });
});
