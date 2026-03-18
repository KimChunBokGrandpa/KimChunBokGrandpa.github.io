/**
 * Svelte action that converts `title` into a CSS-only visual tooltip.
 * Moves the native title to `data-tooltip` to prevent the browser's
 * default tooltip from showing alongside the styled one.
 *
 * Usage: <button title="Zoom in" use:tooltip>+</button>
 */
export function tooltip(node: HTMLElement) {
  function sync() {
    const title = node.getAttribute('title');
    if (title) {
      node.setAttribute('data-tooltip', title);
      node.removeAttribute('title');
    }
  }

  sync();

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'attributes' && m.attributeName === 'title') {
        sync();
      }
    }
  });
  observer.observe(node, { attributes: true, attributeFilter: ['title'] });

  return {
    destroy() {
      observer.disconnect();
    },
  };
}
