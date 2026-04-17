import { describe, expect, it, vi } from 'vitest';

import type { ContextMenuEntry, ContextMenuItem } from '$lib/components/feedback/ContextMenu.svelte';

import { buildOpenWithSection } from './openWithMenu';

function getMenuItem(entry: ContextMenuEntry | undefined): ContextMenuItem {
  expect(entry).toBeDefined();
  expect(entry && !entry.separator).toBe(true);
  return entry as ContextMenuItem;
}

describe('buildOpenWithSection', () => {
  it('returns an empty array when no destinations are available', () => {
    expect(buildOpenWithSection('Open With', [])).toEqual([]);
  });

  it('builds a heading plus destination items', () => {
    const action = vi.fn();

    const items = buildOpenWithSection('Open With', [
      { label: 'Open in Pixel Lab', icon: '🖼️', action },
      { label: 'Use in Poster Maker', icon: '📰', action: vi.fn() },
    ]);

    expect(items).toHaveLength(4);
    expect(items[0]).toEqual({ separator: true });
    expect(getMenuItem(items[1]).label).toBe('Open With');
    expect(getMenuItem(items[1]).disabled).toBe(true);
    expect(getMenuItem(items[2]).label).toBe('🖼️ Open in Pixel Lab');
    expect(getMenuItem(items[3]).label).toBe('📰 Use in Poster Maker');

    getMenuItem(items[2]).action();
    expect(action).toHaveBeenCalledTimes(1);
  });
});
