import {
  cloneHandoffEnvelope,
  type CrossAppHandoffEnvelopeV1,
} from '$lib/handoffs/contracts';
import type { AppId } from '$lib/projects/schema';

export function createHandoffBus() {
  let current = $state<CrossAppHandoffEnvelopeV1 | null>(null);

  function publish(envelope: CrossAppHandoffEnvelopeV1) {
    current = cloneHandoffEnvelope(envelope);
    return current;
  }

  function peek() {
    return current ? cloneHandoffEnvelope(current) : null;
  }

  function consume(targetAppId?: AppId) {
    if (!current) return null;
    if (targetAppId && current.toAppId !== targetAppId) return null;
    const envelope = cloneHandoffEnvelope(current);
    current = null;
    return envelope;
  }

  function clear() {
    current = null;
  }

  return {
    get current() {
      return current;
    },
    publish,
    peek,
    consume,
    clear,
  };
}

