// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';

import ContextMenu from '../feedback/ContextMenu.svelte';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderMenu(onClose = vi.fn()) {
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());

  return {
    onClose,
    ...render(ContextMenu, {
      props: {
        items: [
          { label: 'Programs', icon: '⊞', heading: true },
          { label: 'Open Pixel Lab', icon: '🖼️', action: vi.fn() },
          { separator: true },
          { label: 'Unavailable', icon: '·', disabled: true },
          { label: 'Open Poster Maker', icon: '📰', action: vi.fn() },
        ],
        x: 20,
        y: 24,
        onClose,
      },
    }),
  };
}

describe('ContextMenu', () => {
  it('focuses the first actionable menu item on open', () => {
    renderMenu();

    const firstAction = screen.getByText('Open Pixel Lab').closest('button');
    expect(document.activeElement).toBe(firstAction);
  });

  it('supports arrow key navigation between actionable items', async () => {
    renderMenu();

    const firstAction = screen.getByText('Open Pixel Lab').closest('button');
    const lastAction = screen.getByText('Open Poster Maker').closest('button');

    expect(document.activeElement).toBe(firstAction);

    await fireEvent.keyDown(window, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(lastAction);

    await fireEvent.keyDown(window, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(firstAction);
  });

  it('closes on escape', async () => {
    const onClose = vi.fn();
    renderMenu(onClose);

    await fireEvent.keyDown(window, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not treat headings as actionable items', async () => {
    const { container } = renderMenu();

    const heading = screen.getByText('Programs').closest('.ctx-heading-row');
    expect(heading?.getAttribute('role')).toBe('presentation');
    expect(container.querySelectorAll('button.ctx-action')).toHaveLength(3);
    expect(document.activeElement).not.toBe(heading);
  });
});
