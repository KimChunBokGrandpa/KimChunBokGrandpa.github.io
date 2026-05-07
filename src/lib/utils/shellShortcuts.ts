export type ShellShortcutEventLike = Pick<KeyboardEvent, 'ctrlKey' | 'metaKey' | 'shiftKey' | 'key' | 'target'>;

export type ShellShortcutAction = 'undo' | 'redo' | 'save' | 'copy' | 'toggleShortcuts';

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  return target instanceof HTMLInputElement
    || target instanceof HTMLTextAreaElement
    || target instanceof HTMLSelectElement
    || target.isContentEditable;
}

export function getShellShortcutAction(event: ShellShortcutEventLike): ShellShortcutAction | null {
  const key = event.key.toLowerCase();
  const isPrimaryModifier = event.ctrlKey || event.metaKey;
  const editableTarget = isEditableTarget(event.target);

  if (isPrimaryModifier && key === 'z') {
    if (editableTarget) return null;
    return event.shiftKey ? 'redo' : 'undo';
  }

  if (isPrimaryModifier && key === 's') {
    if (editableTarget) return null;
    return 'save';
  }

  if (isPrimaryModifier && key === 'c') {
    if (editableTarget) return null;
    return 'copy';
  }

  if (!isPrimaryModifier && event.key === '?') {
    if (editableTarget) return null;
    return 'toggleShortcuts';
  }

  return null;
}
