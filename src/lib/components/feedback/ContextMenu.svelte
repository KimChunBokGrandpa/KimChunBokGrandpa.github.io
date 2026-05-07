<script lang="ts">
  export interface ContextMenuActionItem {
    label: string;
    icon?: string;
    shortcut?: string;
    action: () => void;
    disabled?: boolean;
    heading?: false;
    separator?: false;
  }
  export interface ContextMenuPassiveItem {
    label: string;
    icon?: string;
    shortcut?: string;
    disabled: true;
    action?: never;
    heading?: false;
    separator?: false;
  }
  export interface ContextMenuHeadingItem {
    label: string;
    icon?: string;
    heading: true;
    action?: never;
    shortcut?: never;
    separator?: false;
  }
  export interface ContextMenuSeparator {
    separator: true;
  }
  export type ContextMenuItem = ContextMenuActionItem | ContextMenuPassiveItem | ContextMenuHeadingItem;
  export type ContextMenuEntry = ContextMenuItem | ContextMenuSeparator;

  let {
    items,
    x,
    y,
    banner = null,
    onClose,
  }: {
    items: ContextMenuEntry[];
    x: number;
    y: number;
    banner?: string | null;
    onClose: () => void;
  } = $props();

  const STRUCTURAL_ICONS = new Set(['⊞', '✕', '▶', '▼', '↺', '↻', '?', '×', '·']);
  let menuEl = $state<HTMLDivElement | null>(null);
  let menuStyle = $state('left:0px; top:0px;');

  function getNavigableButtons(): HTMLButtonElement[] {
    if (!menuEl) return [];
    return Array.from(menuEl.querySelectorAll<HTMLButtonElement>('button.ctx-action')).filter(
      (button) => !button.disabled,
    );
  }

  function focusFirstNavigableItem() {
    const [firstButton] = getNavigableButtons();
    firstButton?.focus();
  }

  function moveFocus(step: number) {
    const buttons = getNavigableButtons();
    if (buttons.length === 0) return;

    const currentIndex = buttons.findIndex((button) => button === document.activeElement);
    const startIndex = currentIndex === -1 ? (step > 0 ? -1 : 0) : currentIndex;
    const nextIndex = (startIndex + step + buttons.length) % buttons.length;
    buttons[nextIndex]?.focus();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveFocus(1);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveFocus(-1);
      return;
    }

    if (e.key === 'Home') {
      e.preventDefault();
      focusFirstNavigableItem();
      return;
    }

    if (e.key === 'End') {
      e.preventDefault();
      const buttons = getNavigableButtons();
      buttons[buttons.length - 1]?.focus();
    }
  }

  function handleItemClick(item: ContextMenuItem) {
    if (item.heading || !isActionItem(item) || item.disabled) return;
    item.action();
    onClose();
  }

  function isHeadingEntry(entry: ContextMenuItem): entry is ContextMenuHeadingItem {
    return !!entry.heading;
  }

  function isActionItem(entry: ContextMenuItem): entry is ContextMenuActionItem {
    return 'action' in entry && typeof entry.action === 'function';
  }

  function isStructuralIcon(icon?: string): boolean {
    return !!icon && STRUCTURAL_ICONS.has(icon);
  }

  function syncMenuPosition() {
    if (!menuEl || typeof window === 'undefined') {
      menuStyle = `left:${x}px; top:${y}px;`;
      return;
    }

    const clampedX = Math.max(4, Math.min(x, window.innerWidth - menuEl.offsetWidth - 4));
    const clampedY = Math.max(4, Math.min(y, window.innerHeight - menuEl.offsetHeight - 4));
    menuStyle = `left:${clampedX}px; top:${clampedY}px;`;
  }

  $effect(() => {
    void x;
    void y;
    void items;
    void banner;
    void menuEl;

    if (typeof requestAnimationFrame !== 'function') {
      syncMenuPosition();
      return;
    }

    const raf = requestAnimationFrame(() => {
      syncMenuPosition();
      focusFirstNavigableItem();
    });
    return () => cancelAnimationFrame(raf);
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="ctx-backdrop" onclick={onClose} oncontextmenu={(e) => { e.preventDefault(); onClose(); }}>
  <!-- svelte-ignore a11y_interactive_supports_focus -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="ctx-menu w98-menu-surface"
    class:ctx-menu--banner={!!banner}
    style={menuStyle}
    bind:this={menuEl}
    role="menu"
    tabindex="-1"
    onclick={(e) => e.stopPropagation()}
  >
    {#if banner}
      <div class="ctx-banner w98-start-menu-banner" aria-hidden="true">{banner}</div>
    {/if}
    <div class="ctx-content">
      {#each items as entry}
        {#if entry.separator}
          <div class="ctx-sep w98-menu-divider" role="separator"></div>
        {:else}
          {#if isHeadingEntry(entry)}
            <div class="ctx-heading-row" role="presentation">
              {#if entry.icon}
                <span
                  class="ctx-icon"
                  class:w98-structural-glyph={isStructuralIcon(entry.icon)}
                  class:w98-emoji={!isStructuralIcon(entry.icon)}
                >
                  {entry.icon}
                </span>
              {/if}
              <span class="ctx-label">{entry.label}</span>
            </div>
          {:else}
            <button
              type="button"
              class="ctx-item ctx-action w98-menu-item"
              class:ctx-disabled={entry.disabled}
              role="menuitem"
              aria-disabled={entry.disabled}
              disabled={entry.disabled}
              onclick={() => handleItemClick(entry)}
            >
              {#if entry.icon}
                <span
                  class="ctx-icon"
                  class:w98-structural-glyph={isStructuralIcon(entry.icon)}
                  class:w98-emoji={!isStructuralIcon(entry.icon)}
                >
                  {entry.icon}
                </span>
              {/if}
              <span class="ctx-label">{entry.label}</span>
              {#if entry.shortcut}<span class="ctx-shortcut w98-menu-shortcut">{entry.shortcut}</span>{/if}
            </button>
          {/if}
        {/if}
      {/each}
    </div>
  </div>
</div>

<style>
  .ctx-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9999;
  }
  .ctx-menu {
    position: fixed;
    min-width: 160px;
    display: flex;
    flex-direction: column;
    max-width: min(240px, calc(100vw - 16px));
  }
  .ctx-menu--banner {
    flex-direction: row;
    align-items: stretch;
    gap: var(--w98-space-2);
    padding-left: 0;
  }
  .ctx-content {
    min-width: 176px;
    display: flex;
    flex-direction: column;
  }
  .ctx-banner {
    align-self: stretch;
  }
  .ctx-item {
    width: 100%;
    white-space: nowrap;
    min-width: 0;
  }
  .ctx-heading-row {
    display: flex;
    align-items: center;
    gap: var(--w98-space-6);
    min-height: 22px;
    padding: 3px 8px;
    cursor: default;
    color: var(--w98-text-hint);
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }
  .ctx-icon {
    width: 16px;
    text-align: center;
    flex-shrink: 0;
  }
  .ctx-label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ctx-shortcut {
    margin-left: auto;
  }
  .ctx-sep {
    flex-shrink: 0;
  }

  @media (max-width: 550px) {
    .ctx-menu--banner {
      max-width: min(240px, calc(100vw - 16px));
    }

    .ctx-content {
      min-width: 0;
      width: 100%;
    }
  }
</style>
