import type { ContextMenuEntry } from '$lib/components/feedback/ContextMenu.svelte';
import { buildOpenWithSection } from '$lib/shell/openWithMenu';

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
}

export function buildPreviewContextMenu(input: BuildPreviewContextMenuInput): ContextMenuEntry[] {
  const { strings, actions, canUndo, canRedo } = input;

  const items: ContextMenuEntry[] = [
    { label: `💾 ${strings.save}`, icon: '', action: actions.onSave },
    { label: `📋 ${strings.copy}`, icon: '', action: actions.onCopy },
    { separator: true },
    { label: `↔ ${strings.compare}`, icon: '', action: actions.onToggleCompare },
    { label: `🔲 ${strings.tileMode}`, icon: '', action: actions.onToggleTileMode },
    { separator: true },
    { label: `↩ ${strings.undo}`, icon: '', action: actions.onUndo, disabled: !canUndo },
    { label: `↪ ${strings.redo}`, icon: '', action: actions.onRedo, disabled: !canRedo },
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
