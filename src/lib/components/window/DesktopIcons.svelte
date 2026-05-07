<script lang="ts">
  import { desktopWindowConfigs, getWindowTitle } from '$lib/stores/windowStore.svelte';
  import type { WindowId } from '$lib/types';
  import { i18n } from '$lib/i18n/index.svelte';

  let {
    selectedIcon,
    onIconClick,
    onIconDblClick,
    onIconIntent,
  }: {
    selectedIcon: WindowId | null;
    onIconClick: (id: WindowId) => void;
    onIconDblClick: (id: WindowId) => void;
    onIconIntent?: (id: WindowId) => void;
  } = $props();
</script>

<div class="desktop-icons" role="toolbar" aria-label={i18n.t('desktop_shortcuts')}>
  {#each desktopWindowConfigs as cfg}
    <button
      type="button"
      class="desktop-icon w98-desktop-shortcut"
      class:icon-selected={selectedIcon === cfg.id}
      class:w98-desktop-shortcut--selected={selectedIcon === cfg.id}
      onclick={(e) => { e.stopPropagation(); onIconClick(cfg.id); }}
      ondblclick={(e) => { e.stopPropagation(); onIconDblClick(cfg.id); }}
      onfocus={() => onIconIntent?.(cfg.id)}
      onmouseenter={() => onIconIntent?.(cfg.id)}
      onkeydown={(e) => {
        if (e.key === 'Enter') {
          e.stopPropagation();
          onIconDblClick(cfg.id);
          e.preventDefault();
        }
        else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          const next = (e.currentTarget as HTMLElement).nextElementSibling as HTMLElement | null;
          if (next) { next.focus(); e.preventDefault(); }
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          const prev = (e.currentTarget as HTMLElement).previousElementSibling as HTMLElement | null;
          if (prev) { prev.focus(); e.preventDefault(); }
        }
      }}
      aria-label={i18n.t('desktop_open_program', getWindowTitle(cfg.id))}
      aria-pressed={selectedIcon === cfg.id}
      title={getWindowTitle(cfg.id)}
    >
      <span class="icon-img w98-emoji w98-desktop-shortcut-icon" aria-hidden="true">{cfg.icon}</span>
      <span class="icon-label w98-desktop-shortcut-label">{getWindowTitle(cfg.id)}</span>
    </button>
  {/each}
</div>

<style>
  .desktop-icons {
    position: absolute;
    top: var(--w98-space-8);
    left: var(--w98-space-8);
    bottom: 38px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    align-content: flex-start;
    flex-wrap: wrap;
    gap: var(--w98-space-4) var(--w98-space-12);
    padding: var(--w98-space-8);
    z-index: 1;
  }

  .desktop-icon {
    font-size: var(--w98-font-size-sm);
  }

  .icon-img {
    flex-shrink: 0;
  }

  .icon-label {
    min-width: 0;
  }

  /* ===== Mobile ===== */
  @media (max-width: 550px) {
    .desktop-icons {
      top: 8px;
      left: 8px;
      flex-direction: row;
      gap: 4px;
    }
    .desktop-icon { width: 56px; }
    .icon-img { font-size: 24px; }
  }
</style>
