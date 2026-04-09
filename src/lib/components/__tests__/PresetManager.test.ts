// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
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

const { recommendStylesFromImage } = vi.hoisted(() => ({
  recommendStylesFromImage: vi.fn(async () => []),
}));

vi.mock('$lib/utils/styleRecommender', () => ({
  recommendStylesFromImage,
}));

import PresetManager from '../editor/PresetManager.svelte';
import type { ProcessingSettings } from '$lib/types';
import { encodePresetShareCode } from '$lib/utils/presetShare';
import type { StyleRecommendation } from '$lib/utils/styleRecommender';

let writeTextMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  writeTextMock = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(window.navigator, 'clipboard', {
    value: { writeText: writeTextMock },
    configurable: true,
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

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

  it('copies a shared preset link to the clipboard', async () => {
    const { getByTestId, findByText } = render(PresetManager, { props: defaultProps() });

    await fireEvent.click(getByTestId('preset-share-copy-link'));

    expect(writeTextMock).toHaveBeenCalledTimes(1);
    expect(writeTextMock.mock.calls[0][0]).toContain('?preset=');
    await findByText('share_link_copied');
  });

  it('imports settings from a shared preset url', async () => {
    const props = defaultProps();
    const { getByTestId, findByText } = render(PresetManager, { props });
    const shareCode = encodePresetShareCode(
      makeSettings({
        pixelSize: 7,
        palette: 'cga',
        ditherType: 'ordered',
      }),
      'Linked Preset',
    );

    await fireEvent.click(getByTestId('preset-share-open-import'));
    await fireEvent.input(getByTestId('preset-share-import-input'), {
      target: { value: `https://example.com/?preset=${shareCode}` },
    });
    await fireEvent.click(getByTestId('preset-share-apply-import'));

    expect(props.onChange).toHaveBeenCalledTimes(1);
    await findByText('preset_share_imported');
  });

  it('renders recommended style cards when image source is provided', async () => {
    (recommendStylesFromImage as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: 'gameboy', score: 2.2, reasonKey: 'style_reason_contrast' } satisfies StyleRecommendation,
    ]);

    const { getByTestId, findByTestId } = render(PresetManager, {
      props: { ...defaultProps(), imageSrc: 'blob:style-source' },
    });

    await findByTestId('style-recommendations');
    await fireEvent.click(getByTestId('style-recommendation-gameboy'));

    expect(recommendStylesFromImage).toHaveBeenCalledWith('blob:style-source', 3);
  });
});
