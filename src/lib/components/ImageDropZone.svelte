<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';

  let { onImageSelected, onError }: {
    onImageSelected: (file: File) => void;
    onError?: (message: string) => void;
  } = $props();

  let isDragging = $state(false);

  // Onboarding: show quick start guide for first-time users
  const ONBOARDING_KEY = 'retropixel_onboarding_dismissed';
  let onboardingDismissed = $state((() => {
    try {
      return typeof localStorage !== 'undefined' && localStorage.getItem(ONBOARDING_KEY) === '1';
    } catch { return false; }
  })());

  function dismissOnboarding() {
    onboardingDismissed = true;
    try { localStorage.setItem(ONBOARDING_KEY, '1'); }
    catch { /* localStorage unavailable or full */ }
  }

  const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/bmp', 'image/webp'];
  const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50MB

  function handleDragEnter(e: DragEvent) {
    e.preventDefault();
    isDragging = true;
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    // Ignore events from child elements (prevents flicker)
    if (e.currentTarget && (e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      return;
    }
    isDragging = false;
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;

    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (!ACCEPTED_TYPES.includes(file.type)) {
        onError?.(i18n.t('drop_image_error'));
      } else if (file.size > MAX_IMAGE_SIZE) {
        onError?.(i18n.t('image_too_large'));
      } else {
        onImageSelected(file);
      }
    }
  }

  function handleFileInput(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      onImageSelected(input.files[0]);
    }
    // Reset so the same file can be selected again
    input.value = '';
  }

  function handlePaste(e: ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items || items.length === 0) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          if (file.size > MAX_IMAGE_SIZE) {
            onError?.(i18n.t('image_too_large'));
          } else {
            onImageSelected(file);
          }
          return;
        }
      }
    }
    // Clipboard had items but none were images
    onError?.(i18n.t('not_an_image'));
  }
</script>

<svelte:window onpaste={handlePaste} />

<div
  class="window dropzone-wrapper"
>
  <div class="title-bar">
    <div class="title-bar-text">{i18n.t('open_image')}</div>
  </div>
  <div
    class="window-body dropzone"
    class:dragging={isDragging}
    ondragenter={handleDragEnter}
    ondragover={(e) => e.preventDefault()}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
    role="button"
    tabindex="0"
  >
    <div class="drop-content">
      <span class="drop-icon">{isDragging ? '📥' : '🖼️'}</span>
      <p class="drop-title">{isDragging ? i18n.t('drop_here') : i18n.t('drag_drop_image')}</p>
      <p class="drop-or">{i18n.t('or')}</p>
      <div class="field-row">
        <input type="file" accept={ACCEPTED_TYPES.join(',')} id="file-upload" onchange={handleFileInput} style="display: none;" />
        <button class="browse-btn" onclick={() => document.getElementById('file-upload')?.click()}>📂 {i18n.t('browse')}</button>
      </div>
      <p class="drop-hint">{i18n.t('paste_hint')}</p>
      <p class="drop-formats">{i18n.t('supported_formats')}</p>
    </div>
    <!-- Onboarding Quick Start -->
    {#if !onboardingDismissed}
      <div class="onboarding-guide">
        <div class="onboarding-header">
          <span class="onboarding-title">💡 {i18n.t('onboarding_title')}</span>
          <button class="onboarding-dismiss" onclick={dismissOnboarding} title={i18n.t('onboarding_dont_show')}>✕</button>
        </div>
        <div class="onboarding-steps">
          <div class="onboarding-step">
            <span class="step-icon">📐</span>
            <div class="step-text">
              <span class="step-title">{i18n.t('onboarding_step1_title')}</span>
              <span class="step-desc">{i18n.t('onboarding_step1_desc')}</span>
            </div>
          </div>
          <div class="onboarding-arrow">→</div>
          <div class="onboarding-step">
            <span class="step-icon">🎨</span>
            <div class="step-text">
              <span class="step-title">{i18n.t('onboarding_step2_title')}</span>
              <span class="step-desc">{i18n.t('onboarding_step2_desc')}</span>
            </div>
          </div>
          <div class="onboarding-arrow">→</div>
          <div class="onboarding-step">
            <span class="step-icon">💾</span>
            <div class="step-text">
              <span class="step-title">{i18n.t('onboarding_step3_title')}</span>
              <span class="step-desc">{i18n.t('onboarding_step3_desc')}</span>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .dropzone-wrapper {
    margin: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    overflow: hidden;
  }
  .dropzone {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border: 2px dashed #808080;
    margin: 8px;
    background-color: #fff;
    overflow: hidden;
    transition: all 0.2s ease;
    cursor: pointer;
  }

  .dropzone.dragging {
    background-color: #d0d8e0;
    border-color: #000080;
    border-width: 3px;
    box-shadow: inset 0 0 20px rgba(0, 0, 128, 0.08);
  }

  .drop-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .drop-icon {
    font-size: 40px;
    font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
    color: initial;
    transition: transform 0.2s ease;
  }

  .dragging .drop-icon {
    transform: scale(1.2);
    animation: bounce 0.5s ease infinite alternate;
  }

  .drop-title {
    font-size: 14px;
    font-weight: bold;
    margin: 4px 0;
    color: #000;
  }

  .drop-or {
    font-size: 11px;
    color: #808080;
    margin: 2px 0;
  }

  .browse-btn {
    font-weight: bold;
    padding: 4px 16px;
    font-size: 12px;
  }

  .drop-hint {
    font-size: 10px;
    color: #808080;
    margin: 6px 0 0 0;
    font-style: italic;
  }

  .drop-formats {
    font-size: 10px;
    color: #a0a0a0;
    margin: 2px 0 0 0;
  }

  @keyframes bounce {
    from { transform: scale(1.2) translateY(0); }
    to { transform: scale(1.2) translateY(-6px); }
  }

  /* ===== Onboarding Guide ===== */
  .onboarding-guide {
    margin-top: 12px;
    padding: 8px 12px;
    background: #f0f0e8;
    border: 1px solid #c0c0c0;
    border-radius: 0;
    max-width: 340px;
    width: 90%;
    box-shadow: inset 1px 1px #fff;
  }
  .onboarding-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  .onboarding-title {
    font-size: 11px;
    font-weight: bold;
    color: #000080;
  }
  .onboarding-dismiss {
    font-size: 10px;
    background: none;
    border: none;
    cursor: pointer;
    color: #808080;
    padding: 0 2px;
    line-height: 1;
  }
  .onboarding-dismiss:hover {
    color: #c00;
  }
  .onboarding-steps {
    display: flex;
    align-items: center;
    gap: 6px;
    justify-content: center;
  }
  .onboarding-step {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 1;
    min-width: 0;
  }
  .step-icon {
    font-size: 16px;
    flex-shrink: 0;
  }
  .step-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .step-title {
    font-size: 9px;
    font-weight: bold;
    color: #333;
    white-space: nowrap;
  }
  .step-desc {
    font-size: 8px;
    color: #808080;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .onboarding-arrow {
    font-size: 12px;
    color: #000080;
    font-weight: bold;
    flex-shrink: 0;
  }

  /* Mobile: larger browse button, hide drag hint */
  @media (max-width: 550px) {
    .browse-btn {
      padding: 10px 24px;
      font-size: 14px;
    }
    .drop-hint, .drop-or {
      display: none;
    }
    .drop-title {
      font-size: 12px;
    }
  }
</style>
