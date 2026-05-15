<script lang="ts">
  import DesktopIcons from './DesktopIcons.svelte';
  import { i18n } from '$lib/i18n/index.svelte';
  import {
    desktopWindowConfigs,
    getDesktopWindowSummary,
    getWindowTitle,
  } from '$lib/stores/windowStore.svelte';
  import type { WindowId } from '$lib/types';
  import type { Snippet } from 'svelte';

  let {
    children,
    selectedIcon,
    onIconClick,
    onIconDblClick,
    onIconIntent,
    onDesktopClick,
    onImageDropped,
  }: {
    children: Snippet;
    selectedIcon: WindowId | null;
    onIconClick: (id: WindowId) => void;
    onIconDblClick: (id: WindowId) => void;
    onIconIntent?: (id: WindowId) => void;
    onDesktopClick: () => void;
    onImageDropped: (file: File) => void;
  } = $props();

  let dragCounter = $state(0);
  let isDraggingOverDesktop = $state(false);
  const desktopGuideKey = 'retropixel_desktop_guide_dismissed';
  let desktopGuideDismissed = $state(
    (() => {
      try {
        return typeof localStorage !== 'undefined' && localStorage.getItem(desktopGuideKey) === '1';
      } catch {
        return false;
      }
    })(),
  );

  function dismissDesktopGuide() {
    desktopGuideDismissed = true;
    try {
      localStorage.setItem(desktopGuideKey, '1');
    } catch {
      // Ignore localStorage failures and keep the in-memory dismissal state.
    }
  }

  function handleDesktopDragEnter(e: DragEvent) {
    e.preventDefault();
    dragCounter++;
    if (dragCounter === 1) isDraggingOverDesktop = true;
  }

  function handleDesktopDragLeave(e: DragEvent) {
    e.preventDefault();
    if (
      e.currentTarget &&
      (e.currentTarget as HTMLElement).contains(e.relatedTarget as Node | null)
    ) {
      return;
    }
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
    dismissDesktopGuide();
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      onImageDropped(e.dataTransfer.files[0]);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onDesktopClick();
  }

  let selectedDesktopConfig = $derived(
    selectedIcon
      ? (desktopWindowConfigs.find((config) => config.id === selectedIcon) ?? null)
      : null,
  );

  function launchSelectedDesktopProgram() {
    if (!selectedDesktopConfig) return;
    openDesktopProgram(selectedDesktopConfig.id);
  }

  function launchPixelLabFromDesktopGuide() {
    openDesktopProgram('preview');
  }

  function openDesktopProgram(id: WindowId) {
    dismissDesktopGuide();
    onIconDblClick(id);
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
      <div class="desktop-drop-message w98-floating-surface">
        <span class="desktop-drop-icon w98-emoji">📥</span>
        <span>{i18n.t('drop_image_here')}</span>
      </div>
    </div>
  {/if}

  <DesktopIcons {selectedIcon} {onIconClick} onIconDblClick={openDesktopProgram} {onIconIntent} />

  {#if !desktopGuideDismissed}
    <section
      class="desktop-guide-card w98-frame-desktop"
      data-testid="desktop-first-run-guide"
      aria-label={i18n.t('desktop_first_run_title')}
      onclick={(event) => event.stopPropagation()}
      onkeydown={(event) => event.stopPropagation()}
    >
      <div class="desktop-guide-titlebar w98-window-card-titlebar">
        <div class="desktop-guide-title w98-window-card-title">
          <span class="w98-emoji" aria-hidden="true">💡</span>
          <span>{i18n.t('desktop_first_run_title')}</span>
        </div>
        <button
          type="button"
          class="desktop-guide-dismiss w98-window-control-button w98-structural-glyph"
          data-testid="desktop-first-run-dismiss"
          onclick={dismissDesktopGuide}
          aria-label={i18n.t('desktop_first_run_dismiss')}
          title={i18n.t('desktop_first_run_dismiss')}
        >
          ✕
        </button>
      </div>
      <div class="desktop-guide-body w98-window-card-body">
        <p class="desktop-guide-intro w98-quiet-copy">{i18n.t('desktop_first_run_intro')}</p>
        <ul class="desktop-guide-list">
          <li>
            <span class="w98-emoji" aria-hidden="true">🖼️</span><span
              >{i18n.t('desktop_first_run_step_preview')}</span
            >
          </li>
          <li>
            <span class="w98-emoji" aria-hidden="true">📷</span><span
              >{i18n.t('desktop_first_run_step_retrocam')}</span
            >
          </li>
        </ul>
        <div class="desktop-guide-tip w98-note">{i18n.t('desktop_first_run_tip')}</div>
        <div class="desktop-guide-actions w98-action-row">
          <button
            type="button"
            class="desktop-guide-primary w98-button w98-button--primary"
            data-testid="desktop-first-run-open-preview"
            onclick={launchPixelLabFromDesktopGuide}
          >
            <span class="w98-emoji" aria-hidden="true">🖼️</span>
            {i18n.t('desktop_first_run_open_pixel_lab')}
          </button>
          <button
            type="button"
            class="desktop-guide-secondary w98-button"
            onclick={dismissDesktopGuide}
          >
            {i18n.t('desktop_first_run_dismiss')}
          </button>
        </div>
      </div>
    </section>
  {/if}

  {#if selectedDesktopConfig}
    <section
      class="desktop-launch-strip w98-frame-desktop"
      data-testid="desktop-launch-strip"
      aria-label={i18n.t('desktop_launch_selected')}
      onclick={(event) => event.stopPropagation()}
      onkeydown={(event) => event.stopPropagation()}
    >
      <div class="desktop-launch-titlebar w98-window-card-titlebar">
        <div class="w98-window-card-title">
          <span class="w98-emoji" aria-hidden="true">📌</span>
          <span>{i18n.t('desktop_launch_selected')}</span>
        </div>
      </div>
      <div class="desktop-launch-body w98-window-card-body">
        <div class="desktop-launch-icon w98-inset-panel" aria-hidden="true">
          {selectedDesktopConfig.icon}
        </div>
        <div class="desktop-launch-copy">
          <div class="desktop-launch-title">{getWindowTitle(selectedDesktopConfig.id)}</div>
          <div class="desktop-launch-summary w98-quiet-copy">
            {getDesktopWindowSummary(selectedDesktopConfig.id)}
          </div>
          <div class="desktop-launch-hint w98-quiet-copy">{i18n.t('desktop_launch_hint')}</div>
        </div>
        <button
          type="button"
          class="desktop-launch-button w98-button w98-button--primary"
          data-testid="desktop-launch-open-button"
          onclick={launchSelectedDesktopProgram}
        >
          <span class="w98-emoji" aria-hidden="true">{selectedDesktopConfig.icon}</span>
          {i18n.t('desktop_launch_open')}
        </button>
      </div>
    </section>
  {/if}

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
    background: var(--w98-desktop-drop-overlay);
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
    gap: var(--w98-space-6);
    padding: var(--w98-space-16);
    font-size: var(--w98-font-size-heading);
    font-weight: bold;
    color: var(--w98-highlight);
  }

  .desktop-drop-icon {
    font-size: 32px;
  }

  .desktop-launch-strip {
    position: absolute;
    left: var(--w98-space-16);
    right: auto;
    bottom: var(--w98-space-16);
    z-index: 2;
    width: min(420px, calc(100vw - 32px));
    display: flex;
    flex-direction: column;
  }

  .desktop-guide-card {
    position: absolute;
    top: var(--w98-space-16);
    right: var(--w98-space-16);
    z-index: 2;
    width: min(360px, calc(100vw - 32px));
    display: flex;
    flex-direction: column;
    color: var(--w98-text);
  }

  .desktop-guide-title {
    font-weight: bold;
  }

  .desktop-guide-dismiss {
    flex-shrink: 0;
  }

  .desktop-guide-body,
  .desktop-launch-body {
    min-width: 0;
  }

  .desktop-guide-intro,
  .desktop-guide-tip {
    margin: 0;
    font-size: var(--w98-font-size-base);
    line-height: 1.35;
  }

  .desktop-guide-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: var(--w98-space-4);
    font-size: var(--w98-font-size-base);
  }

  .desktop-guide-list li {
    display: inline-flex;
    align-items: center;
    gap: var(--w98-space-6);
  }

  .desktop-guide-actions {
    justify-content: flex-start;
  }

  .desktop-guide-primary,
  .desktop-guide-secondary {
    min-width: 88px;
  }

  .desktop-launch-titlebar {
    flex-shrink: 0;
  }

  .desktop-launch-body {
    display: flex;
    align-items: center;
    gap: var(--w98-space-12);
  }

  .desktop-launch-icon {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    font-size: 28px;
    line-height: 1;
    font-family: var(--w98-emoji-font);
  }

  .desktop-launch-copy {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--w98-space-2);
    flex: 1;
    text-shadow: none;
  }

  .desktop-launch-title {
    font-weight: bold;
    font-size: var(--w98-font-size-action);
  }

  .desktop-launch-summary,
  .desktop-launch-hint {
    font-size: var(--w98-font-size-base);
    line-height: 1.25;
  }

  .desktop-launch-button {
    min-width: 86px;
    flex-shrink: 0;
  }

  .desktop-launch-button:focus-visible {
    outline: 1px dotted #000;
    outline-offset: -4px;
  }

  @media (max-width: 550px) {
    .desktop-guide-card {
      left: 8px;
      right: 8px;
      top: 8px;
      width: auto;
      max-height: calc(100% - 104px);
      overflow: auto;
    }

    .desktop-guide-body,
    .desktop-launch-body {
      padding: var(--w98-space-8);
    }

    .desktop-launch-body {
      align-items: flex-start;
      flex-direction: column;
    }

    .desktop-launch-strip {
      left: 8px;
      right: 8px;
      width: auto;
      bottom: 8px;
      max-width: none;
    }

    .desktop-launch-icon {
      width: 36px;
      height: 36px;
      font-size: 22px;
    }

    .desktop-launch-summary {
      display: none;
    }

    .desktop-launch-hint {
      display: none;
    }

    .desktop-launch-button {
      min-width: 66px;
      padding: 4px 8px;
    }
  }

  @media (max-width: 550px) and (max-height: 780px) {
    .desktop-guide-card {
      max-height: calc(100% - 120px);
    }

    .desktop-guide-list {
      gap: var(--w98-space-2);
    }

    .desktop-guide-actions {
      gap: var(--w98-space-4);
    }
  }
</style>
