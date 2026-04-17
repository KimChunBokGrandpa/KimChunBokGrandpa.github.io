// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, fireEvent, waitFor } from '@testing-library/svelte';
import { clearHandoffBus, getHandoffBus } from '$lib/handoffs/runtime';
import { getProjectStorageAdapter, resetProjectStorageAdapter } from '$lib/projects/runtime';
import { resetPosterMakerStore, posterMakerStore } from '$lib/stores/posterMakerStore.svelte';
import { createAssetId } from '$lib/projects/schema';
import { createHandoffEnvelope } from '$lib/handoffs/contracts';

const { dialogStore } = vi.hoisted(() => ({
  dialogStore: {
    requestConfirm: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('$lib/i18n/index.svelte', () => ({
  i18n: { t: vi.fn((key: string) => key) },
}));

vi.mock('$lib/stores/dialogStore.svelte', () => ({
  dialogStore,
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
  dialogStore.requestConfirm.mockReset();
  dialogStore.requestConfirm.mockResolvedValue(true);
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
    expect(posterMakerStore.sourceContext?.sourceAppId).toBe('pixel-lab');
  });

  it('consumes RetroCam handoff and keeps retrocam provenance without pixel-lab return action', async () => {
    const assetId = 'retrocam-asset-1';
    const storage = getProjectStorageAdapter();
    const handoffBus = getHandoffBus();
    const onMessage = vi.fn();

    await storage.saveAsset({
      asset: {
        assetId,
        role: 'capture',
        mimeType: 'image/png',
        storageKey: `handoffs/${assetId}.png`,
        originAppId: 'retrocam',
        createdAt: '2026-04-15T00:00:00.000Z',
        filename: 'retrocam-shot.png',
      },
      blob: new File(['snapshot'], 'retrocam-shot.png', { type: 'image/png' }),
    });

    handoffBus.publish(createHandoffEnvelope({
      fromAppId: 'retrocam',
      toAppId: 'poster-maker',
      intent: 'place_capture_on_canvas',
      openMode: 'create_project',
      assetId,
      sourceProjectId: 'retrocam-project-1',
      sourceLabel: 'RetroCam Snapshot',
    }));

    const { queryByTestId } = render(PosterMaker, { props: { onMessage } });

    await waitFor(() => expect(onMessage).toHaveBeenCalledWith('poster_handoff_imported'));
    expect(posterMakerStore.importedAssetId).toBe(assetId);
    expect(posterMakerStore.importedFilename).toBe('retrocam-shot.png');
    expect(posterMakerStore.sourceContext?.sourceAppId).toBe('retrocam');
    expect(queryByTestId('poster-switch-to-pixel-lab')).toBeNull();
  });

  it('shows source context and lets the user switch back to Pixel Lab', async () => {
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
        filename: 'return-path.png',
      },
      blob: new Blob(['pixels'], { type: 'image/png' }),
    });
    getHandoffBus().publish(createHandoffEnvelope({
      fromAppId: 'pixel-lab',
      toAppId: 'poster-maker',
      intent: 'place_processed_asset',
      openMode: 'create_project',
      assetId,
      sourceProjectId: 'project-pixel-source',
      sourceLabel: 'Pixel Lab Transfer',
    }));

    const onSwitchToPixelLab = vi.fn();
    const { getByTestId, getByText } = render(PosterMaker, { props: { onSwitchToPixelLab } });

    await waitFor(() => expect(getByTestId('poster-source-context')).toBeTruthy());
    expect(getByText('poster_source_context')).toBeTruthy();
    expect(getByText('project-pixel-source')).toBeTruthy();

    await fireEvent.click(getByTestId('poster-switch-to-pixel-lab'));
    expect(onSwitchToPixelLab).toHaveBeenCalled();
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
    await waitFor(() => expect(dialogStore.requestConfirm).toHaveBeenCalledWith({
      title: 'dialog_poster_reset_title',
      message: 'dialog_poster_reset_message',
      confirmLabel: 'poster_reset_document',
      cancelLabel: 'cancel',
    }));
    await waitFor(() => expect(posterMakerStore.titleText).toBe('COVER'));
    expect(posterMakerStore.frameStyleId).toBe('classic');

    await fireEvent.click(getByTestId('poster-new-document-button'));
    await waitFor(() => expect(dialogStore.requestConfirm).toHaveBeenCalledWith({
      title: 'dialog_poster_new_document_title',
      message: 'dialog_poster_new_document_message',
      confirmLabel: 'poster_new_document',
      cancelLabel: 'cancel',
    }));
    await waitFor(() => expect(posterMakerStore.importedAssetId).toBeNull());
    expect(posterMakerStore.titleText).toBe('RETRO STUDIO');
  });

  it('does not discard the current poster document when shell confirm is declined', async () => {
    dialogStore.requestConfirm.mockResolvedValue(false);
    await posterMakerStore.importFile(
      new File(['pixels'], 'cover.png', { type: 'image/png' }),
      'poster-maker',
    );
    await posterMakerStore.setTitle('Do Not Remove');

    const { getByTestId } = render(PosterMaker, { props: {} });

    await fireEvent.click(getByTestId('poster-new-document-button'));

    await waitFor(() => expect(dialogStore.requestConfirm).toHaveBeenCalledTimes(1));
    expect(posterMakerStore.importedAssetId).not.toBeNull();
    expect(posterMakerStore.titleText).toBe('Do Not Remove');
  });

  it('shows recent poster projects and reopens a selected project', async () => {
    await posterMakerStore.ensureInitialized();
    await posterMakerStore.setTitle('First Draft');
    await posterMakerStore.createNewDocument();
    await posterMakerStore.setTitle('Second Draft');

    const onMessage = vi.fn();
    const { getByTestId } = render(PosterMaker, { props: { onMessage } });

    const currentProjectId = posterMakerStore.projectId;
    const firstProject = posterMakerStore.recentProjects.find((entry) => entry.projectId !== currentProjectId);
    expect(firstProject).toBeTruthy();

    await fireEvent.click(getByTestId(`poster-recent-project-${firstProject!.projectId}`));

    await waitFor(() => expect(onMessage).toHaveBeenCalledWith('poster_project_reopened'));
    expect(posterMakerStore.currentProjectName()).toBe('First Draft');
  });
});
