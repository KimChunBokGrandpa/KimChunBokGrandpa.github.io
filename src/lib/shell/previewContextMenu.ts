import type { ContextMenuEntry } from '$lib/components/feedback/ContextMenu.svelte';
import { buildOpenWithSection } from '$lib/shell/openWithMenu';
import { buildShortcutLabel } from '$lib/utils/platformShortcuts';

export interface PreviewContextMenuStrings {
  save: string;
  copy: string;
  compare: string;
  tileMode: string;
  undo: string;
  redo: string;
  openWith: string;
  sendToPosterMaker: string;
}

export interface PreviewContextMenuActions {
  onSave: () => void;
  onCopy: () => void;
  onToggleCompare: () => void;
  onToggleTileMode: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSendToPosterMaker?: () => void;
}

export interface BuildPreviewContextMenuInput {
  strings: PreviewContextMenuStrings;
  actions: PreviewContextMenuActions;
  canUndo: boolean;
  canRedo: boolean;
  canCopy: boolean;
}

export function buildPreviewContextMenu(input: BuildPreviewContextMenuInput): ContextMenuEntry[] {
  const { strings, actions, canUndo, canRedo, canCopy } = input;

  const items: ContextMenuEntry[] = [
    { label: strings.save, icon: '💾', shortcut: buildShortcutLabel(['Primary', 'S']), action: actions.onSave },
    { label: strings.copy, icon: '📋', shortcut: buildShortcutLabel(['Primary', 'C']), action: actions.onCopy, disabled: !canCopy },
    { separator: true },
    { label: strings.compare, icon: '⚖️', action: actions.onToggleCompare },
    { label: strings.tileMode, icon: '⊞', action: actions.onToggleTileMode },
    { separator: true },
    { label: strings.undo, icon: '↺', shortcut: buildShortcutLabel(['Primary', 'Z']), action: actions.onUndo, disabled: !canUndo },
    { label: strings.redo, icon: '↻', shortcut: buildShortcutLabel(['Primary', 'Shift', 'Z']), action: actions.onRedo, disabled: !canRedo },
  ];

  if (actions.onSendToPosterMaker) {
    items.push(...buildOpenWithSection(strings.openWith, [
      {
        label: strings.sendToPosterMaker,
        icon: '📰',
        action: actions.onSendToPosterMaker,
      },
    ]));
  }

  return items;
}
