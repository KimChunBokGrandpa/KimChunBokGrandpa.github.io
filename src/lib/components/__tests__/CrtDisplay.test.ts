// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import CrtDisplay from '../CrtDisplay.svelte';

afterEach(() => cleanup());

describe('CrtDisplay', () => {
  it('renders children content', () => {
    const { container } = render(CrtDisplay, {
      props: { active: false, children: createSnippet('Hello CRT') },
    });
    expect(container.textContent).toContain('Hello CRT');
  });

  it('does not show scanlines/glare when inactive', () => {
    const { container } = render(CrtDisplay, {
      props: { active: false, children: createSnippet('Test') },
    });
    expect(container.querySelector('.scanlines')).toBeNull();
    expect(container.querySelector('.glare')).toBeNull();
  });

  it('shows scanlines and glare when active', () => {
    const { container } = render(CrtDisplay, {
      props: { active: true, children: createSnippet('Test') },
    });
    expect(container.querySelector('.scanlines')).toBeTruthy();
    expect(container.querySelector('.glare')).toBeTruthy();
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
function createSnippet(text: string) {
  return (anchor: Node) => {
    const node = document.createTextNode(text);
    anchor.parentNode?.insertBefore(node, anchor);
    return () => node.remove();
  };
}
