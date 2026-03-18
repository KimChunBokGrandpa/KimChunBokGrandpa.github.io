// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { tooltip } from './tooltip';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('tooltip action', () => {
  it('moves title to data-tooltip attribute', () => {
    const el = document.createElement('button');
    el.setAttribute('title', 'Hello');
    document.body.appendChild(el);

    tooltip(el);

    expect(el.getAttribute('data-tooltip')).toBe('Hello');
    expect(el.hasAttribute('title')).toBe(false);
  });

  it('does nothing when no title attribute', () => {
    const el = document.createElement('button');
    document.body.appendChild(el);

    tooltip(el);

    expect(el.hasAttribute('data-tooltip')).toBe(false);
    expect(el.hasAttribute('title')).toBe(false);
  });

  it('syncs when title is updated dynamically', async () => {
    const el = document.createElement('button');
    el.setAttribute('title', 'Initial');
    document.body.appendChild(el);

    tooltip(el);
    expect(el.getAttribute('data-tooltip')).toBe('Initial');

    // Update title dynamically
    el.setAttribute('title', 'Updated');

    // MutationObserver is async, wait a tick
    await new Promise((r) => setTimeout(r, 0));

    expect(el.getAttribute('data-tooltip')).toBe('Updated');
    expect(el.hasAttribute('title')).toBe(false);
  });

  it('returns destroy function', () => {
    const el = document.createElement('button');
    el.setAttribute('title', 'Test');
    document.body.appendChild(el);

    const result = tooltip(el);
    expect(typeof result.destroy).toBe('function');
    expect(() => result.destroy()).not.toThrow();
  });
});
