import { describe, expect, it, vi } from 'vitest';

import type {
  ContextMenuActionItem,
  ContextMenuEntry,
  ContextMenuItem,
  ContextMenuPassiveItem,
} from '$lib/components/feedback/ContextMenu.svelte';
import { buildShortcutLabel } from '$lib/utils/platformShortcuts';

import { buildPreviewContextMenu } from './previewContextMenu';

function getContextMenuItem(entry: ContextMenuEntry | undefined): ContextMenuItem {
  expect(entry).toBeDefined();
  expect(entry && !entry.separator).toBe(true);
  return entry as ContextMenuItem;
}

function getNonHeadingItem(entry: ContextMenuEntry | undefined): ContextMenuActionItem | ContextMenuPassiveItem {
  const item = getContextMenuItem(entry);
  expect(item.heading).not.toBe(true);
  return item as ContextMenuActionItem | ContextMenuPassiveItem;
}

describe('buildPreviewContextMenu', () => {
  it('builds the base preview actions with undo and redo state', () => {
    const actions = {
      onSave: vi.fn(),
      onCopy: vi.fn(),
      onToggleCompare: vi.fn(),
      onToggleTileMode: vi.fn(),
      onUndo: vi.fn(),
      onRedo: vi.fn(),
    };

    const items = buildPreviewContextMenu({
      strings: {
        save: 'Save',
        copy: 'Copy',
        compare: 'Compare',
        tileMode: 'Tile Mode',
        undo: 'Undo',
        redo: 'Redo',
      },
      actions,
      canUndo: false,
      canRedo: true,
      canCopy: true,
    });

    expect(items).toHaveLength(8);
    expect(getContextMenuItem(items[0]).label).toBe('Save');
    expect(getContextMenuItem(items[0]).icon).toBe('💾');
    expect(getContextMenuItem(items[0]).shortcut).toBe(buildShortcutLabel(['Primary', 'S']));
    expect(getContextMenuItem(items[1]).label).toBe('Copy');
    expect(getContextMenuItem(items[1]).icon).toBe('📋');
    expect(items[2]?.separator).toBe(true);
    expect(getContextMenuItem(items[3]).label).toBe('Compare');
    expect(getContextMenuItem(items[3]).icon).toBe('⚖️');
    expect(getContextMenuItem(items[4]).label).toBe('Tile Mode');
    expect(getContextMenuItem(items[4]).icon).toBe('⊞');
    expect(items[5]?.separator).toBe(true);
    expect(getNonHeadingItem(items[6]).label).toBe('Undo');
    expect(getNonHeadingItem(items[6]).icon).toBe('↺');
    expect(getNonHeadingItem(items[6]).disabled).toBe(true);
    expect(getNonHeadingItem(items[7]).label).toBe('Redo');
    expect(getNonHeadingItem(items[7]).icon).toBe('↻');
    expect(getNonHeadingItem(items[7]).disabled).toBe(false);
  });

  it('disables Copy when image clipboard support is unavailable', () => {
    const items = buildPreviewContextMenu({
      strings: {
        save: 'Save',
        copy: 'Copy',
        compare: 'Compare',
        tileMode: 'Tile Mode',
        undo: 'Undo',
        redo: 'Redo',
      },
      actions: {
        onSave: vi.fn(),
        onCopy: vi.fn(),
        onToggleCompare: vi.fn(),
        onToggleTileMode: vi.fn(),
        onUndo: vi.fn(),
        onRedo: vi.fn(),
      },
      canUndo: true,
      canRedo: true,
      canCopy: false,
    });

    expect(getNonHeadingItem(items[1]).label).toBe('Copy');
    expect(getNonHeadingItem(items[1]).disabled).toBe(true);
  });
});
