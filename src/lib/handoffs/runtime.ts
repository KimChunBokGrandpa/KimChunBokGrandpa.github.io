import { createHandoffBus } from '$lib/handoffs/handoffBus.svelte';

const handoffBus = createHandoffBus();

export function getHandoffBus() {
  return handoffBus;
}

export function clearHandoffBus() {
  handoffBus.clear();
}
