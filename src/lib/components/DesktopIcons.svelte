<script lang="ts">
  import { WINDOW_CONFIGS } from '$lib/stores/windowStore.svelte';
  import type { WindowId } from '$lib/types';

  let {
    selectedIcon,
    onIconClick,
    onIconDblClick,
  }: {
    selectedIcon: WindowId | null;
    onIconClick: (id: WindowId) => void;
    onIconDblClick: (id: WindowId) => void;
  } = $props();
</script>

<div class="desktop-icons" role="toolbar" aria-label="Desktop shortcuts">
  {#each WINDOW_CONFIGS as cfg}
    <button
      class="desktop-icon"
      class:icon-selected={selectedIcon === cfg.id}
      onclick={(e) => { e.stopPropagation(); onIconClick(cfg.id); }}
      ondblclick={() => onIconDblClick(cfg.id)}
      aria-label="Open {cfg.title}"
    >
      <span class="icon-img" aria-hidden="true">{cfg.icon}</span>
      <span class="icon-label">{cfg.title}</span>
    </button>
  {/each}
</div>

<style>
  .desktop-icons {
    position: absolute;
    top: 8px;
    left: 8px;
    bottom: 38px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    align-content: flex-start;
    flex-wrap: wrap;
    gap: 8px 16px;
    padding: 8px;
    z-index: 1;
  }

  .desktop-icon {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    width: 68px;
    min-height: 64px;
    padding: 6px 2px;
    background: transparent;
    border: 1px dotted transparent;
    cursor: pointer;
    font-family: inherit;
    font-size: 11px;
    color: #fff;
    text-shadow: 1px 1px 1px #000;
  }

  .desktop-icon:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .desktop-icon.icon-selected {
    background: #000080;
    border: 1px dotted #ff0;
  }

  .desktop-icon.icon-selected .icon-label {
    background: #000080;
    color: #fff;
  }

  .icon-img {
    font-size: 32px;
    font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
    color: initial;
    text-shadow: none;
    line-height: 1;
  }

  .icon-label {
    word-break: break-word;
    text-align: center;
    line-height: 1.2;
    padding: 0 4px;
  }

  /* ===== Mobile ===== */
  @media (max-width: 550px) {
    .desktop-icons {
      top: 8px;
      left: 8px;
      flex-direction: row;
      gap: 6px;
    }
    .desktop-icon { width: 56px; }
    .icon-img { font-size: 24px; }
  }
</style>
