import { describe, expect, it } from 'vitest';

import {
  buildShortcutLabel,
  getPrimaryModifierLabel,
  replacePrimaryModifierShortcutLabel,
} from './platformShortcuts';

describe('platformShortcuts', () => {
  it('uses Cmd on Apple platforms', () => {
    expect(getPrimaryModifierLabel({ platform: 'MacIntel' })).toBe('Cmd');
    expect(getPrimaryModifierLabel({ platform: 'iPhone' })).toBe('Cmd');
  });

  it('uses Ctrl on non-Apple platforms', () => {
    expect(getPrimaryModifierLabel({ platform: 'Win32' })).toBe('Ctrl');
    expect(getPrimaryModifierLabel({ platform: 'Linux x86_64' })).toBe('Ctrl');
  });

  it('builds shortcut labels from a primary modifier token', () => {
    expect(buildShortcutLabel(['Primary', 'Shift', 'Z'], 'Cmd')).toBe('Cmd+Shift+Z');
    expect(buildShortcutLabel(['Primary', 'S'], 'Ctrl')).toBe('Ctrl+S');
  });

  it('replaces inline Ctrl shortcut copy with the active primary modifier', () => {
    expect(replacePrimaryModifierShortcutLabel('Ctrl+V to paste', 'Cmd')).toBe('Cmd+V to paste');
  });
});
