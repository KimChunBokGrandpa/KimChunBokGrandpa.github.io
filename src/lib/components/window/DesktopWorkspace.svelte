<script lang="ts">
  import DesktopIcons from './DesktopIcons.svelte';
  import { i18n } from '$lib/i18n/index.svelte';
  import { desktopWindowConfigs, getDesktopWindowSummary, getWindowTitle } from '$lib/stores/windowStore.svelte';
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
  const desktopGuideKey = 'retropixel_desktop_guide_dismissed';
  let desktopGuideDismissed = $state((() => {
    try {
      return typeof localStorage !== 'undefined' && localStorage.getItem(desktopGuideKey) === '1';
    } catch {
      return false;
    }
  })());

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
    selectedIcon ? desktopWindowConfigs.find((config) => config.id === selectedIcon) ?? null : null,
  );

  function launchSelectedDesktopProgram() {
    if (!selectedDesktopConfig) return;
    dismissDesktopGuide();
    onIconDblClick(selectedDesktopConfig.id);
  }

  function launchPixelLabFromDesktopGuide() {
    dismissDesktopGuide();
    onIconDblClick('preview');
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

  {#if !desktopGuideDismissed}
    <section
      class="desktop-guide-card"
      data-testid="desktop-first-run-guide"
      aria-label={i18n.t('desktop_first_run_title')}
      onclick={(event) => event.stopPropagation()}
      onkeydown={(event) => event.stopPropagation()}
    >
      <div class="desktop-guide-titlebar">
        <strong>{i18n.t('desktop_first_run_title')}</strong>
        <button
          class="desktop-guide-dismiss"
          data-testid="desktop-first-run-dismiss"
          onclick={dismissDesktopGuide}
          aria-label={i18n.t('desktop_first_run_dismiss')}
          title={i18n.t('desktop_first_run_dismiss')}
        >
          ✕
        </button>
      </div>
      <p class="desktop-guide-intro">{i18n.t('desktop_first_run_intro')}</p>
      <ul class="desktop-guide-list">
        <li>🖼️ {i18n.t('desktop_first_run_step_preview')}</li>
        <li>📰 {i18n.t('desktop_first_run_step_poster')}</li>
        <li>📷 {i18n.t('desktop_first_run_step_retrocam')}</li>
      </ul>
      <p class="desktop-guide-tip">{i18n.t('desktop_first_run_tip')}</p>
      <div class="desktop-guide-actions">
        <button
          class="desktop-guide-primary"
          data-testid="desktop-first-run-open-preview"
          onclick={launchPixelLabFromDesktopGuide}
        >
          {i18n.t('desktop_first_run_open_pixel_lab')}
        </button>
        <button class="desktop-guide-secondary" onclick={dismissDesktopGuide}>
          {i18n.t('desktop_first_run_dismiss')}
        </button>
      </div>
    </section>
  {/if}

  {#if selectedDesktopConfig}
    <section
      class="desktop-launch-strip"
      data-testid="desktop-launch-strip"
      aria-label={i18n.t('desktop_launch_selected')}
      onclick={(event) => event.stopPropagation()}
      onkeydown={(event) => event.stopPropagation()}
    >
      <div class="desktop-launch-icon" aria-hidden="true">{selectedDesktopConfig.icon}</div>
      <div class="desktop-launch-copy">
        <div class="desktop-launch-title">{getWindowTitle(selectedDesktopConfig.id)}</div>
        <div class="desktop-launch-summary">{getDesktopWindowSummary(selectedDesktopConfig.id)}</div>
        <div class="desktop-launch-hint">{i18n.t('desktop_launch_hint')}</div>
      </div>
      <button
        class="desktop-launch-button"
        data-testid="desktop-launch-open-button"
        onclick={launchSelectedDesktopProgram}
      >
        {i18n.t('desktop_launch_open')}
      </button>
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

  .desktop-launch-strip {
    position: absolute;
    left: 18px;
    right: auto;
    bottom: 18px;
    z-index: 2;
    width: min(420px, calc(100vw - 36px));
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    background: linear-gradient(180deg, #d8e3f3 0%, #bccadf 100%);
    border: 2px solid;
    border-color: var(--w98-shadow-light) var(--w98-shadow-808) var(--w98-shadow-808) var(--w98-shadow-light);
    box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.25);
  }

  .desktop-guide-card {
    position: absolute;
    top: 18px;
    right: 18px;
    z-index: 2;
    width: min(360px, calc(100vw - 36px));
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px 12px 12px;
    background: linear-gradient(180deg, #f0f2df 0%, #d7dcc0 100%);
    border: 2px solid;
    border-color: var(--w98-shadow-light) var(--w98-shadow-808) var(--w98-shadow-808) var(--w98-shadow-light);
    box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.25);
    color: #1e2b18;
  }

  .desktop-guide-titlebar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-size: 13px;
  }

  .desktop-guide-dismiss {
    min-width: 24px;
    height: 24px;
    border: none;
    box-shadow: var(--w98-outset-thin);
    background: var(--w98-surface);
    font: inherit;
    cursor: pointer;
  }

  .desktop-guide-dismiss:active,
  .desktop-guide-primary:active,
  .desktop-guide-secondary:active {
    box-shadow: var(--w98-inset-thin);
  }

  .desktop-guide-intro,
  .desktop-guide-tip {
    margin: 0;
    font-size: 12px;
    line-height: 1.35;
  }

  .desktop-guide-list {
    margin: 0;
    padding-left: 18px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
  }

  .desktop-guide-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .desktop-guide-primary,
  .desktop-guide-secondary {
    border: none;
    box-shadow: var(--w98-outset-thin);
    background: var(--w98-surface);
    padding: 4px 10px;
    font: inherit;
    cursor: pointer;
  }

  .desktop-launch-icon {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    font-size: 28px;
    line-height: 1;
    background: rgba(255, 255, 255, 0.38);
    border: 1px solid rgba(0, 0, 0, 0.16);
    font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
  }

  .desktop-launch-copy {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    color: #10233d;
    text-shadow: none;
  }

  .desktop-launch-title {
    font-weight: bold;
    font-size: 13px;
  }

  .desktop-launch-summary,
  .desktop-launch-hint {
    font-size: 12px;
    line-height: 1.25;
  }

  .desktop-launch-hint {
    color: #29435f;
  }

  .desktop-launch-button {
    min-width: 78px;
    padding: 5px 10px;
    background: var(--w98-surface);
    border: none;
    box-shadow: var(--w98-outset);
    font: inherit;
    cursor: pointer;
    flex-shrink: 0;
  }

  .desktop-launch-button:active {
    box-shadow: var(--w98-inset);
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
      padding: 8px 10px 10px;
      gap: 8px;
    }

    .desktop-launch-strip {
      left: 8px;
      right: 8px;
      width: auto;
      bottom: 10px;
      gap: 8px;
      padding: 8px 10px;
    }

    .desktop-launch-icon {
      width: 36px;
      height: 36px;
      font-size: 22px;
    }

    .desktop-launch-summary {
      display: none;
    }

    .desktop-launch-button {
      min-width: 66px;
      padding: 4px 8px;
    }
  }
</style>
