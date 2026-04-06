<script lang="ts">
  import DesktopIcons from './DesktopIcons.svelte';
  import { i18n } from '$lib/i18n/index.svelte';
  import type { WindowId } from '$lib/types';
  import type { Snippet } from 'svelte';

  let {
    children,
    selectedIcon,
    onIconClick,
    onIconDblClick,
    onDesktopClick,
    onImageDropped
  }: {
    children: Snippet;
    selectedIcon: WindowId | null;
    onIconClick: (id: WindowId) => void;
    onIconDblClick: (id: WindowId) => void;
    onDesktopClick: () => void;
    onImageDropped: (file: File) => void;
  } = $props();

  let dragCounter = $state(0);
  let isDraggingOverDesktop = $state(false);

  function handleDesktopDragEnter(e: DragEvent) {
    e.preventDefault();
    dragCounter++;
    if (dragCounter === 1) isDraggingOverDesktop = true;
  }

  function handleDesktopDragLeave(e: DragEvent) {
    e.preventDefault();
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      isDraggingOverDesktop = false;
    }
  }

  function handleDesktopDrop(e: DragEvent) {
    e.preventDefault();
    dragCounter = 0;
    isDraggingOverDesktop = false;
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      onImageDropped(e.dataTransfer.files[0]);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onDesktopClick();
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<main
  class="desktop"
  onclick={onDesktopClick}
  onkeydown={handleKeydown}
  ondragenter={handleDesktopDragEnter}
  ondragover={(e) => e.preventDefault()}
  ondragleave={handleDesktopDragLeave}
  ondrop={handleDesktopDrop}
  tabindex="-1"
>
  {#if isDraggingOverDesktop}
    <div class="desktop-drop-overlay">
      <div class="desktop-drop-message">
        <span class="desktop-drop-icon">📥</span>
        <span>{i18n.t('drop_image_here')}</span>
      </div>
    </div>
  {/if}

  <DesktopIcons
    {selectedIcon}
    {onIconClick}
    {onIconDblClick}
  />

  {@render children()}
</main>

<style>
  .desktop {
    --taskbar-h: 30px;
    background-color: var(--w98-desktop-bg);
    width: 100vw;
    height: calc(100vh - var(--taskbar-h));
    height: calc(100dvh - var(--taskbar-h));
    position: relative;
    overflow: hidden;
  }

  .desktop-drop-overlay {
    position: absolute;
    inset: 0;
    z-index: 9998;
    background: rgba(0, 0, 128, 0.2);
    border: 3px dashed var(--w98-highlight);
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .desktop-drop-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 16px 32px;
    background: var(--w98-surface);
    border: 2px solid;
    border-color: var(--w98-shadow-light) var(--w98-shadow-808) var(--w98-shadow-808) var(--w98-shadow-light);
    box-shadow: 4px 4px 12px rgba(0, 0, 0, 0.4);
    font-size: 14px;
    font-weight: bold;
    color: var(--w98-highlight);
  }

  .desktop-drop-icon {
    font-size: 32px;
    font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
  }
</style>
