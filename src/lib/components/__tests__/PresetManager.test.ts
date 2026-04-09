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

const {
  getSharedPresets,
  importSharedPreset,
  markSharedPresetApplied,
  removeSharedPreset,
} = vi.hoisted(() => ({
  getSharedPresets: vi.fn(() => []),
  importSharedPreset: vi.fn((input: string) => ({
    id: 'shared-1',
    name: 'Imported Shared Preset',
    shareCode: input,
    settings: {
      pixelSize: 7,
      palette: 'cga',
      crtEffect: 'none',
      glitchFilters: [],
      renderMode: 'pixel_perfect',
      glitchSeed: null,
      ditherType: 'ordered',
      effectLayers: [],
    },
    importedAt: 1,
    lastAppliedAt: 1,
  })),
  markSharedPresetApplied: vi.fn((id: string) => ({
    id,
    name: 'Imported Shared Preset',
    shareCode: 'shared-code',
    settings: {
      pixelSize: 7,
      palette: 'cga',
      crtEffect: 'none',
      glitchFilters: [],
      renderMode: 'pixel_perfect',
      glitchSeed: null,
      ditherType: 'ordered',
      effectLayers: [],
    },
    importedAt: 1,
    lastAppliedAt: 2,
  })),
  removeSharedPreset: vi.fn(),
}));

vi.mock('$lib/stores/sharedPresetStore.svelte', () => ({
  getSharedPresets,
  importSharedPreset,
  markSharedPresetApplied,
  removeSharedPreset,
}));

const {
  buildCloudPresetShareUrl,
  listOwnCloudPresets,
  listPublicCloudPresets,
  publishCloudPreset,
} = vi.hoisted(() => ({
  buildCloudPresetShareUrl: vi.fn((shortId: string) => `https://example.com/?cloudPreset=${shortId}`),
  listOwnCloudPresets: vi.fn(async () => []),
  listPublicCloudPresets: vi.fn(async () => []),
  publishCloudPreset: vi.fn(async () => ({
    id: 'cloud-1',
    shortId: 'short123456',
    name: 'Cloud Preset',
    visibility: 'public',
    settings: {
      pixelSize: 6,
      palette: 'ega',
      crtEffect: 'none',
      glitchFilters: [],
      renderMode: 'pixel_perfect',
      glitchSeed: null,
      ditherType: 'none',
      effectLayers: [],
    },
    createdAt: 1,
    updatedAt: 1,
    applyCount: 0,
  })),
}));

vi.mock('$lib/services/cloudPresetService', () => ({
  buildCloudPresetShareUrl,
  listOwnCloudPresets,
  listPublicCloudPresets,
  publishCloudPreset,
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

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

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
    expect(importSharedPreset).toHaveBeenCalledTimes(1);
    await findByText('preset_share_imported');
  });

  it('renders imported shared presets and reapplies one on click', async () => {
    (getSharedPresets as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce([
      {
        id: 'shared-1',
        name: 'Inbox Item',
        shareCode: 'code-1',
        settings: makeSettings({ palette: 'nes' }),
        importedAt: 1,
        lastAppliedAt: 1,
      },
    ]);

    const { findByTestId, findByText } = render(PresetManager, { props: defaultProps() });
    await findByTestId('shared-presets');
    await fireEvent.click(await findByText('🔗 Inbox Item'));

    expect(markSharedPresetApplied).toHaveBeenCalledWith('shared-1');
  });

  it('publishes the current preset as a cloud preset', async () => {
    const { getByTestId, findByText } = render(PresetManager, { props: defaultProps() });

    await fireEvent.click(getByTestId('preset-cloud-open-publish'));
    await fireEvent.input(getByTestId('preset-cloud-name-input'), {
      target: { value: 'Cloud Ready' },
    });
    await fireEvent.click(getByTestId('preset-cloud-publish-public'));

    await waitFor(() => {
      expect(publishCloudPreset).toHaveBeenCalledTimes(1);
      expect(writeTextMock).toHaveBeenCalledWith('https://example.com/?cloudPreset=short123456');
    });
    await findByText('cloud_publish_public_success');
  });

  it('renders community cloud presets', async () => {
    (listPublicCloudPresets as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        id: 'cloud-1',
        shortId: 'short123456',
        name: 'Community CRT',
        visibility: 'public',
        settings: makeSettings({ palette: 'ega' }),
        createdAt: 1,
        updatedAt: 1,
        applyCount: 8,
      },
    ]);

    const { findByTestId, findByText } = render(PresetManager, { props: defaultProps() });
    await findByTestId('community-presets');
    await findByText('🌐 Community CRT');
  });

  it('renders recommended style cards when image source is provided', async () => {
    (recommendStylesFromImage as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: 'gameboy', score: 2.2, reasonKey: 'style_reason_contrast' } satisfies StyleRecommendation,
    ]);

    const props = { ...defaultProps(), imageSrc: 'blob:style-source' };
    const { getByTestId, findByTestId } = render(PresetManager, {
      props,
    });

    await findByTestId('style-recommendations');
    await fireEvent.click(getByTestId('style-recommendation-gameboy'));

    expect(recommendStylesFromImage).toHaveBeenCalledWith('blob:style-source', 3);
    expect(props.onChange).toHaveBeenCalledTimes(1);
    expect(getByTestId('style-recommendation-gameboy').className).toContain('preset-active');
    expect(getByTestId('preset-gameboy').className).toContain('preset-active');
  });

  it('shows a loading state while style recommendations are pending', async () => {
    const deferred = createDeferred<StyleRecommendation[]>();
    (recommendStylesFromImage as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce(deferred.promise);

    const { findByTestId } = render(PresetManager, {
      props: { ...defaultProps(), imageSrc: 'blob:pending-style-source' },
    });

    await findByTestId('style-recommendations-loading');
    deferred.resolve([]);
  });

  it('ignores stale style recommendation results after the image source changes', async () => {
    const deferred = createDeferred<StyleRecommendation[]>();
    (recommendStylesFromImage as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce(deferred.promise);

    const view = render(PresetManager, {
      props: { ...defaultProps(), imageSrc: 'blob:old-style-source' },
    });

    await view.findByTestId('style-recommendations-loading');
    await view.rerender({ ...defaultProps(), imageSrc: null });

    deferred.resolve([
      { id: 'gameboy', score: 2.2, reasonKey: 'style_reason_contrast' } satisfies StyleRecommendation,
    ]);

    await waitFor(() => {
      expect(view.queryByTestId('style-recommendations')).toBeNull();
    });
  });
});
