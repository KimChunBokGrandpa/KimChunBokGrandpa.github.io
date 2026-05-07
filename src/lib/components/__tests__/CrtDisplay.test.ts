// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import CrtDisplay from '../media/CrtDisplay.svelte';

afterEach(() => cleanup());

describe('CrtDisplay', () => {
  it('renders children content', () => {
    const { container } = render(CrtDisplay, {
      props: { active: false, children: createSnippet('Hello CRT') },
    });
    expect(container.textContent).toContain('Hello CRT');
  });

  it('does not show scanlines when inactive', () => {
    const { container } = render(CrtDisplay, {
      props: { active: false, children: createSnippet('Test') },
    });
    expect(container.querySelector('.scanlines')).toBeNull();
  });

  it('shows scanlines when active', () => {
    const { container } = render(CrtDisplay, {
      props: { active: true, children: createSnippet('Test') },
    });
    expect(container.querySelector('.scanlines')).toBeTruthy();
  });

  it('applies active CSS class when active', () => {
    const { container } = render(CrtDisplay, {
      props: { active: true, children: createSnippet('Test') },
    });
    const wrapper = container.querySelector('.crt-wrapper');
    expect(wrapper?.classList.contains('active')).toBe(true);
  });

  it('does not apply active CSS class when inactive', () => {
    const { container } = render(CrtDisplay, {
      props: { active: false, children: createSnippet('Test') },
    });
    const wrapper = container.querySelector('.crt-wrapper');
    expect(wrapper?.classList.contains('active')).toBe(false);
  });

  it('sets --crt-intensity CSS variable when active', () => {
    const { container } = render(CrtDisplay, {
      props: { active: true, intensity: 0.5, children: createSnippet('Test') },
    });
    const wrapper = container.querySelector('.crt-wrapper') as HTMLElement;
    expect(wrapper?.style.cssText).toContain('--crt-intensity: 0.5');
  });

  it('does not set --crt-intensity when inactive', () => {
    const { container } = render(CrtDisplay, {
      props: { active: false, intensity: 0.5, children: createSnippet('Test') },
    });
    const wrapper = container.querySelector('.crt-wrapper') as HTMLElement;
    expect(wrapper?.style.cssText).not.toContain('--crt-intensity');
  });
});

// Helper to create a simple snippet for Svelte 5
// Runtime-compatible mock; Svelte 5 Snippet type is opaque so we use unknown cast
function createSnippet(text: string): import('svelte').Snippet {
  return ((anchor: Node) => {
    const node = document.createTextNode(text);
    anchor.parentNode?.insertBefore(node, anchor);
    return () => node.remove();
  }) as unknown as import('svelte').Snippet;
}
