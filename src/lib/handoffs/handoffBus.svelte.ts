import {
  cloneHandoffEnvelope,
  type CrossAppHandoffEnvelopeV1,
} from '$lib/handoffs/contracts';
import type { AppId } from '$lib/projects/schema';

/**
 * Legacy app IDs that have been removed from the product.
 * Pending intents targeting these apps are silently discarded at load time.
 */
const legacyDropTargets: readonly string[] = ['poster-maker'];

function isLegacyTarget(envelope: CrossAppHandoffEnvelopeV1): boolean {
  return legacyDropTargets.includes(envelope.toAppId as string);
}

export function createHandoffBus() {
  let current = $state<CrossAppHandoffEnvelopeV1 | null>(null);

  function publish(envelope: CrossAppHandoffEnvelopeV1) {
    // Silently discard envelopes targeting removed apps
    if (isLegacyTarget(envelope)) {
      return null;
    }
    current = cloneHandoffEnvelope(envelope);
    return current;
  }

  function peek() {
    // Guard: if a persisted legacy envelope was loaded, drop it
    if (current && isLegacyTarget(current)) {
      current = null;
    }
    return current ? cloneHandoffEnvelope(current) : null;
  }

  function consume(targetAppId?: AppId) {
    if (!current) return null;
    // Silently discard legacy pending intents
    if (isLegacyTarget(current)) {
      current = null;
      return null;
    }
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
      // Guard: if a persisted legacy envelope was loaded, drop it
      if (current && isLegacyTarget(current)) {
        current = null;
      }
      return current;
    },
    publish,
    peek,
    consume,
    clear,
  };
}

