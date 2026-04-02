<script lang="ts">
  export interface ContextMenuItem {
    label: string;
    icon?: string;
    action: () => void;
    disabled?: boolean;
    separator?: false;
  }
  export interface ContextMenuSeparator {
    separator: true;
  }
  export type ContextMenuEntry = ContextMenuItem | ContextMenuSeparator;

  let {
    items,
    x,
    y,
    onClose,
  }: {
    items: ContextMenuEntry[];
    x: number;
    y: number;
    onClose: () => void;
  } = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }

  function handleItemClick(item: ContextMenuItem) {
    if (item.disabled) return;
    item.action();
    onClose();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="ctx-backdrop" onclick={onClose} oncontextmenu={(e) => { e.preventDefault(); onClose(); }}>
  <!-- svelte-ignore a11y_interactive_supports_focus -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="ctx-menu"
    style:left="{x}px"
    style:top="{y}px"
    role="menu"
    onclick={(e) => e.stopPropagation()}
  >
    {#each items as entry}
      {#if entry.separator}
        <div class="ctx-sep" role="separator"></div>
      {:else}
        <button
          class="ctx-item"
          class:disabled={entry.disabled}
          role="menuitem"
          disabled={entry.disabled}
          onclick={() => handleItemClick(entry)}
        >
          {#if entry.icon}<span class="ctx-icon">{entry.icon}</span>{/if}
          <span class="ctx-label">{entry.label}</span>
        </button>
      {/if}
    {/each}
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
    background: var(--w98-surface);
    border: 2px solid;
    border-color: var(--w98-shadow-light) var(--w98-shadow-dark) var(--w98-shadow-dark) var(--w98-shadow-light);
    box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    padding: 2px;
    min-width: 140px;
    display: flex;
    flex-direction: column;
  }
  .ctx-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 20px 3px 6px;
    font-size: var(--w98-font-size-base);
    font-family: inherit;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    white-space: nowrap;
    color: var(--w98-text);
  }
  .ctx-item:hover:not(:disabled) {
    background: var(--w98-highlight);
    color: #fff;
  }
  .ctx-item.disabled {
    color: var(--w98-text-disabled);
    cursor: default;
  }
  .ctx-icon {
    width: 16px;
    text-align: center;
    flex-shrink: 0;
  }
  .ctx-label {
    flex: 1;
  }
  .ctx-sep {
    height: 1px;
    background: var(--w98-shadow-808);
    margin: 2px 2px;
  }
</style>
