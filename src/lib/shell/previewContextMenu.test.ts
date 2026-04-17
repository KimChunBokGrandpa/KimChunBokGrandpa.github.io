import { describe, expect, it, vi } from 'vitest';

import type { ContextMenuEntry, ContextMenuItem } from '$lib/components/feedback/ContextMenu.svelte';

import { buildPreviewContextMenu } from './previewContextMenu';

function getContextMenuItem(entry: ContextMenuEntry | undefined): ContextMenuItem {
  expect(entry).toBeDefined();
  expect(entry && !entry.separator).toBe(true);
  return entry as ContextMenuItem;
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
        openWith: 'Open With',
        sendToPosterMaker: 'Send to Poster Maker',
      },
      actions,
      canUndo: false,
      canRedo: true,
    });

    expect(items).toHaveLength(8);
    expect(getContextMenuItem(items[0]).label).toBe('💾 Save');
    expect(getContextMenuItem(items[1]).label).toBe('📋 Copy');
    expect(items[2]?.separator).toBe(true);
    expect(items[5]?.separator).toBe(true);
    expect(getContextMenuItem(items[6]).label).toBe('↩ Undo');
    expect(getContextMenuItem(items[6]).disabled).toBe(true);
    expect(getContextMenuItem(items[7]).label).toBe('↪ Redo');
    expect(getContextMenuItem(items[7]).disabled).toBe(false);
  });

  it('adds an Open With section when poster-maker routing is available', () => {
    const onSendToPosterMaker = vi.fn();

    const items = buildPreviewContextMenu({
      strings: {
        save: 'Save',
        copy: 'Copy',
        compare: 'Compare',
        tileMode: 'Tile Mode',
        undo: 'Undo',
        redo: 'Redo',
        openWith: 'Open With',
        sendToPosterMaker: 'Send to Poster Maker',
      },
      actions: {
        onSave: vi.fn(),
        onCopy: vi.fn(),
        onToggleCompare: vi.fn(),
        onToggleTileMode: vi.fn(),
        onUndo: vi.fn(),
        onRedo: vi.fn(),
        onSendToPosterMaker,
      },
      canUndo: true,
      canRedo: true,
    });

    expect(items).toHaveLength(11);
    expect(items[8]?.separator).toBe(true);
    expect(getContextMenuItem(items[9]).label).toBe('Open With');
    expect(getContextMenuItem(items[9]).disabled).toBe(true);
    expect(getContextMenuItem(items[10]).label).toBe('📰 Send to Poster Maker');

    getContextMenuItem(items[10]).action();
    expect(onSendToPosterMaker).toHaveBeenCalledTimes(1);
  });
});
