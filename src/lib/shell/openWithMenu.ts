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
    { label: headingLabel, icon: '📂', heading: true },
    ...destinations.map((destination) => (
      destination.disabled
        ? {
            label: destination.label,
            icon: destination.icon,
            disabled: true as const,
          }
        : {
            label: destination.label,
            icon: destination.icon,
            action: destination.action,
          }
    )),
  ];
}
