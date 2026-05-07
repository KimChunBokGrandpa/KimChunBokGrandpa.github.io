// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { getShellShortcutAction, type ShellShortcutEventLike } from './shellShortcuts';

function makeEvent(overrides: Partial<ShellShortcutEventLike>): ShellShortcutEventLike {
  return {
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    key: '',
    target: null,
    ...overrides,
  };
}

describe('getShellShortcutAction', () => {
  it('maps primary modifier plus z to undo', () => {
    const input = document.createElement('div');

    expect(getShellShortcutAction(makeEvent({
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      key: 'z',
      target: input,
    }))).toBe('undo');
  });

  it('maps primary modifier plus shifted z to redo even when the key is uppercase', () => {
    const input = document.createElement('div');

    expect(getShellShortcutAction(makeEvent({
      ctrlKey: true,
      metaKey: false,
      shiftKey: true,
      key: 'Z',
      target: input,
    }))).toBe('redo');
  });

  it('ignores undo shortcuts while typing inside editable fields', () => {
    const input = document.createElement('input');

    expect(getShellShortcutAction(makeEvent({
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      key: 'z',
      target: input,
    }))).toBeNull();
  });

  it('keeps save available as a document-level shortcut outside editable fields', () => {
    const input = document.createElement('div');

    expect(getShellShortcutAction(makeEvent({
      ctrlKey: false,
      metaKey: true,
      shiftKey: false,
      key: 's',
      target: input,
    }))).toBe('save');
  });

  it('ignores save shortcuts while typing inside editable fields', () => {
    const input = document.createElement('textarea');

    expect(getShellShortcutAction(makeEvent({
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      key: 's',
      target: input,
    }))).toBeNull();
  });

  it('maps primary modifier plus c to copy outside editable fields', () => {
    const input = document.createElement('div');

    expect(getShellShortcutAction(makeEvent({
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      key: 'c',
      target: input,
    }))).toBe('copy');
  });

  it('toggles the shortcuts sheet only when focus is outside editable fields', () => {
    const nonEditable = document.createElement('div');
    const editable = document.createElement('textarea');

    expect(getShellShortcutAction(makeEvent({
      ctrlKey: false,
      metaKey: false,
      shiftKey: true,
      key: '?',
      target: nonEditable,
    }))).toBe('toggleShortcuts');

    expect(getShellShortcutAction(makeEvent({
      ctrlKey: false,
      metaKey: false,
      shiftKey: true,
      key: '?',
      target: editable,
    }))).toBeNull();
  });
});
