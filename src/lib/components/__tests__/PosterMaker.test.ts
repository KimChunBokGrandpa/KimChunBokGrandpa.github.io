// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, fireEvent, waitFor } from '@testing-library/svelte';
import { clearHandoffBus, getHandoffBus } from '$lib/handoffs/runtime';
import { getProjectStorageAdapter, resetProjectStorageAdapter } from '$lib/projects/runtime';
import { resetPosterMakerStore, posterMakerStore } from '$lib/stores/posterMakerStore.svelte';
import { createAssetId } from '$lib/projects/schema';
import { createHandoffEnvelope } from '$lib/handoffs/contracts';

vi.mock('$lib/i18n/index.svelte', () => ({
  i18n: { t: vi.fn((key: string) => key) },
}));

import PosterMaker from '../poster/PosterMaker.svelte';

const OriginalImage = globalThis.Image;

class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  set src(_value: string) {
    queueMicrotask(() => {
      this.onload?.();
    });
  }
}

beforeEach(() => {
  globalThis.Image = MockImage as unknown as typeof Image;
  resetProjectStorageAdapter();
  clearHandoffBus();
  resetPosterMakerStore();
});

afterEach(() => {
  cleanup();
  clearHandoffBus();
  globalThis.Image = OriginalImage;
});

describe('PosterMaker', () => {
  it('renders preset buttons, document actions, and poster controls', () => {
    const { getByText } = render(PosterMaker, { props: {} });

    expect(getByText('poster_preset_poster')).toBeTruthy();
    expect(getByText('poster_preset_banner')).toBeTruthy();
    expect(getByText('poster_preset_profile')).toBeTruthy();
    expect(getByText(/poster_new_document/)).toBeTruthy();
    expect(getByText(/poster_reset_document/)).toBeTruthy();
    expect(getByText(/poster_open_image/)).toBeTruthy();
    expect(getByText(/poster_export/)).toBeTruthy();
    expect(getByText('poster_frame_label')).toBeTruthy();
    expect(getByText('poster_overlay_label')).toBeTruthy();
    expect(getByText('poster_sticker_label')).toBeTruthy();
  });

  it('consumes Pixel Lab handoff and updates poster document state', async () => {
    const assetId = createAssetId();
    const storage = getProjectStorageAdapter();
    await storage.saveAsset({
      asset: {
        assetId,
        role: 'processed',
        mimeType: 'image/png',
        storageKey: `handoffs/${assetId}.png`,
        originAppId: 'pixel-lab',
        createdAt: new Date().toISOString(),
        filename: 'transfer-shot.png',
      },
      blob: new Blob(['pixels'], { type: 'image/png' }),
    });
    getHandoffBus().publish(createHandoffEnvelope({
      fromAppId: 'pixel-lab',
      toAppId: 'poster-maker',
      intent: 'place_processed_asset',
      openMode: 'create_project',
      assetId,
      sourceLabel: 'Pixel Lab Transfer',
    }));

    const onMessage = vi.fn();
    render(PosterMaker, { props: { onMessage } });

    await waitFor(() => expect(onMessage).toHaveBeenCalledWith('poster_handoff_imported'));
    expect(posterMakerStore.importedAssetId).toBe(assetId);
    expect(posterMakerStore.importedFilename).toBe('transfer-shot.png');
    expect(posterMakerStore.titleText).toBe('TRANSFER-SHOT');
  });

  it('new document and reset layout actions update poster store state', async () => {
    posterMakerStore.resetDocument();
    await posterMakerStore.importFile(
      new File(['pixels'], 'cover.png', { type: 'image/png' }),
      'poster-maker',
    );
    await posterMakerStore.setTitle('Custom Title');
    await posterMakerStore.setSubtitle('Custom Subtitle');
    await posterMakerStore.setFrameStyle('marquee');

    const { getByTestId } = render(PosterMaker, { props: {} });

    await fireEvent.click(getByTestId('poster-reset-document-button'));
    await waitFor(() => expect(posterMakerStore.titleText).toBe('COVER'));
    expect(posterMakerStore.frameStyleId).toBe('classic');

    await fireEvent.click(getByTestId('poster-new-document-button'));
    await waitFor(() => expect(posterMakerStore.importedAssetId).toBeNull());
    expect(posterMakerStore.titleText).toBe('RETRO STUDIO');
  });
});
