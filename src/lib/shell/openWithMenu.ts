import type { ContextMenuEntry } from '$lib/components/feedback/ContextMenu.svelte';

export interface OpenWithDestination {
  label: string;
  icon?: string;
  action: () => void;
  disabled?: boolean;
}

export function buildOpenWithSection(
  headingLabel: string,
  destinations: OpenWithDestination[],
): ContextMenuEntry[] {
  if (destinations.length === 0) return [];

  return [
    { separator: true },
    { label: headingLabel, icon: '🗂️', action: () => {}, disabled: true },
    ...destinations.map((destination) => ({
      label: destination.icon ? `${destination.icon} ${destination.label}` : destination.label,
      icon: '',
      action: destination.action,
      disabled: destination.disabled,
    })),
  ];
}
