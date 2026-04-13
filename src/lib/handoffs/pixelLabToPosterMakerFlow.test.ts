import { describe, expect, it, vi } from 'vitest';

import { DEFAULT_POST_FILTERS } from '$lib/types';
import { DEFAULT_PROCESSING_SETTINGS } from '$lib/stores/settingsStore.svelte';
import { createHandoffBus } from '$lib/handoffs/handoffBus.svelte';
import { launchPosterMakerFromPixelLab } from '$lib/handoffs/pixelLabToPosterMakerFlow';
import { createInMemoryProjectStorageAdapter } from '$lib/projects/storageAdapter';

function makeSnapshot() {
  return {
    settings: {
      ...DEFAULT_PROCESSING_SETTINGS,
      glitchFilters: [],
      effectLayers: [],
    },
    postFilters: { ...DEFAULT_POST_FILTERS },
    rotation: 0,
    cropRect: null,
    saveFormat: 'png' as const,
    saveQuality: 0.92,
  };
}

describe('launchPosterMakerFromPixelLab', () => {
  it('does nothing when transfer file creation returns null', async () => {
    const openPosterMaker = vi.fn();
    const notify = vi.fn();

    const result = await launchPosterMakerFromPixelLab({
      createTransferFile: vi.fn().mockResolvedValue(null),
      snapshot: makeSnapshot(),
      projectStorage: createInMemoryProjectStorageAdapter(),
      handoffBus: createHandoffBus(),
      openPosterMaker,
      notify,
      successMessage: 'send_to_poster_maker',
    });

    expect(result).toBeNull();
    expect(openPosterMaker).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });

  it('opens poster maker and notifies after successful handoff', async () => {
    const openPosterMaker = vi.fn();
    const notify = vi.fn();
    const adapter = createInMemoryProjectStorageAdapter();
    const bus = createHandoffBus();

    const result = await launchPosterMakerFromPixelLab({
      createTransferFile: vi.fn().mockResolvedValue(
        new File(['pixels'], 'pixel-lab-poster-input.png', { type: 'image/png' }),
      ),
      snapshot: makeSnapshot(),
      projectStorage: adapter,
      handoffBus: bus,
      openPosterMaker,
      notify,
      successMessage: 'send_to_poster_maker',
    });

    expect(result).not.toBeNull();
    expect(openPosterMaker).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith('send_to_poster_maker');
    expect(bus.peek()?.toAppId).toBe('poster-maker');
  });
});
