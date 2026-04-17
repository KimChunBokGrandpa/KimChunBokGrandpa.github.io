import { describe, expect, it, vi } from 'vitest';

import { createHandoffBus } from '$lib/handoffs/handoffBus.svelte';
import { launchPosterMakerFromRetroCam } from '$lib/handoffs/retroCamToPosterMakerFlow';
import { createInMemoryProjectStorageAdapter } from '$lib/projects/storageAdapter';

describe('launchPosterMakerFromRetroCam', () => {
  it('does nothing when snapshot file is missing', async () => {
    const openPosterMaker = vi.fn();
    const notify = vi.fn();

    const result = await launchPosterMakerFromRetroCam({
      snapshotFile: null,
      activePresetId: 'clean_pixel',
      projectStorage: createInMemoryProjectStorageAdapter(),
      handoffBus: createHandoffBus(),
      openPosterMaker,
      notify,
      successMessage: 'retrocam_sent_to_poster_maker',
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

    const result = await launchPosterMakerFromRetroCam({
      snapshotFile: new File(['snapshot'], 'retrocam_snapshot.png', { type: 'image/png' }),
      activePresetId: 'crt_pop',
      projectStorage: adapter,
      handoffBus: bus,
      openPosterMaker,
      notify,
      successMessage: 'retrocam_sent_to_poster_maker',
    });

    expect(result).not.toBeNull();
    expect(openPosterMaker).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith('retrocam_sent_to_poster_maker');
    expect(bus.peek()?.toAppId).toBe('poster-maker');
  });
});
