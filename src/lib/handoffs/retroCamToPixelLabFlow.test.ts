import { describe, expect, it, vi } from 'vitest';

import { createHandoffBus } from '$lib/handoffs/handoffBus.svelte';
import { launchPixelLabFromRetroCam } from '$lib/handoffs/retroCamToPixelLabFlow';
import { createInMemoryProjectStorageAdapter } from '$lib/projects/storageAdapter';

describe('launchPixelLabFromRetroCam', () => {
  it('does nothing when snapshot file is missing', async () => {
    const openPixelLab = vi.fn();
    const notify = vi.fn();

    const result = await launchPixelLabFromRetroCam({
      snapshotFile: null,
      activePresetId: 'clean_pixel',
      projectStorage: createInMemoryProjectStorageAdapter(),
      handoffBus: createHandoffBus(),
      openPixelLab,
      notify,
      successMessage: 'retrocam_sent_to_pixel_lab',
    });

    expect(result).toBeNull();
    expect(openPixelLab).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });

  it('opens pixel lab and notifies after successful handoff', async () => {
    const openPixelLab = vi.fn();
    const notify = vi.fn();
    const adapter = createInMemoryProjectStorageAdapter();
    const bus = createHandoffBus();

    const result = await launchPixelLabFromRetroCam({
      snapshotFile: new File(['snapshot'], 'retrocam_snapshot.png', { type: 'image/png' }),
      activePresetId: 'crt_pop',
      projectStorage: adapter,
      handoffBus: bus,
      openPixelLab,
      notify,
      successMessage: 'retrocam_sent_to_pixel_lab',
    });

    expect(result).not.toBeNull();
    expect(openPixelLab).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith('retrocam_sent_to_pixel_lab');
    expect(bus.peek()?.toAppId).toBe('pixel-lab');
  });
});
