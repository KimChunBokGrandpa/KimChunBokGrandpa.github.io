import { describe, expect, it } from 'vitest';

import { createHandoffEnvelope } from '$lib/handoffs/contracts';
import { createHandoffBus } from '$lib/handoffs/handoffBus.svelte';

describe('handoff contracts and bus', () => {
  it('creates versioned handoff envelopes', () => {
    const envelope = createHandoffEnvelope({
      fromAppId: 'pixel-lab',
      toAppId: 'poster-maker',
      intent: 'place_processed_asset',
      openMode: 'create_project',
      assetId: 'asset-123',
      payload: { placeMode: 'fit-center' },
    });

    expect(envelope.handoffVersion).toBe(1);
    expect(envelope.assetId).toBe('asset-123');
    expect(envelope.payload).toEqual({ placeMode: 'fit-center' });
  });

  it('publishes and consumes envelopes safely', () => {
    const bus = createHandoffBus();
    const envelope = createHandoffEnvelope({
      fromAppId: 'retrocam',
      toAppId: 'pixel-lab',
      intent: 'edit_capture',
      openMode: 'reuse_empty_project',
      assetId: 'asset-capture',
    });

    bus.publish(envelope);

    const peeked = bus.peek();
    expect(peeked?.assetId).toBe('asset-capture');

    const wrongTarget = bus.consume('poster-maker');
    expect(wrongTarget).toBeNull();

    const consumed = bus.consume('pixel-lab');
    expect(consumed?.intent).toBe('edit_capture');
    expect(bus.peek()).toBeNull();
  });
});
