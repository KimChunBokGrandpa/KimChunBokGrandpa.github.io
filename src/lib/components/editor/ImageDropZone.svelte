<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
  import { canvasSurfaceToBlob, createCanvasSurface } from '$lib/utils/canvasSurface';
  import { replacePrimaryModifierShortcutLabel } from '$lib/utils/platformShortcuts';
  import {
    ACCEPTED_IMAGE_TYPES,
    validateImageFile,
  } from '$lib/utils/imageFileValidation';

  let { onImageSelected, onError }: {
    onImageSelected: (file: File) => void;
    onError?: (message: string) => void;
  } = $props();

  let isDragging = $state(false);
  let fileInputEl = $state<HTMLInputElement | null>(null);

  // Onboarding: show quick start guide for first-time users
  const onboardingKey = 'retropixel_onboarding_dismissed';
  let onboardingDismissed = $state((() => {
    try {
      return typeof localStorage !== 'undefined' && localStorage.getItem(onboardingKey) === '1';
    } catch { return false; }
  })());

  function dismissOnboarding() {
    onboardingDismissed = true;
    try { localStorage.setItem(onboardingKey, '1'); }
    catch { /* localStorage unavailable or full */ }
  }

  const acceptedTypes = [...ACCEPTED_IMAGE_TYPES];
  let pasteHint = $derived(replacePrimaryModifierShortcutLabel(i18n.t('paste_hint')));

  function handleValidatedImage(file: File, invalidTypeKey: 'drop_image_error' | 'unsupported_format' = 'unsupported_format') {
    const validation = validateImageFile(file);
    if (!validation.ok) {
      onError?.(i18n.t(validation.reason === 'size' ? 'image_too_large' : invalidTypeKey));
      return false;
    }

    dismissOnboarding();
    onImageSelected(file);
    return true;
  }

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
      handleValidatedImage(e.dataTransfer.files[0], 'drop_image_error');
    }
  }

  function handleFileInput(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      handleValidatedImage(input.files[0]);
    }
    // Reset so the same file can be selected again
    input.value = '';
  }

  function openFilePicker() {
    fileInputEl?.click();
  }

  /** Generate a simple gradient sample image for first-time users */
  async function loadSampleImage() {
    try {
      const w = 320;
      const h = 240;
      const { canvas, ctx } = createCanvasSurface(w, h);

      // Sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, h * 0.6);
      sky.addColorStop(0, '#1a1a4e');
      sky.addColorStop(0.5, '#e06040');
      sky.addColorStop(1, '#f0c060');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h * 0.6);

      // Ground
      ctx.fillStyle = '#2a5e2a';
      ctx.fillRect(0, h * 0.6, w, h * 0.4);

      // Sun
      ctx.fillStyle = '#ffe080';
      ctx.beginPath();
      ctx.arc(w * 0.7, h * 0.35, 30, 0, Math.PI * 2);
      ctx.fill();

      // Mountains
      ctx.fillStyle = '#3a3a6e';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.6);
      ctx.lineTo(80, h * 0.3);
      ctx.lineTo(160, h * 0.55);
      ctx.lineTo(220, h * 0.25);
      ctx.lineTo(320, h * 0.5);
      ctx.lineTo(320, h * 0.6);
      ctx.closePath();
      ctx.fill();

      const blob = await canvasSurfaceToBlob(canvas, 'image/png');
      const file = new File([blob], 'sample-landscape.png', { type: 'image/png' });
      handleValidatedImage(file);
    } catch (error) {
      console.error('Failed to create sample image', error);
      onError?.(i18n.t('error_canvas_context'));
    }
  }

  function handlePaste(e: ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items || items.length === 0) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          handleValidatedImage(file);
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
  <div class="title-bar w98-shell-titlebar">
    <div class="title-bar-text w98-shell-title">
      <span class="w98-emoji" aria-hidden="true">🖼️</span>
      <span>{i18n.t('win_preview')}</span>
    </div>
  </div>
  <div
    class="window-body dropzone"
    class:dragging={isDragging}
    ondragenter={handleDragEnter}
    ondragover={(e) => e.preventDefault()}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
    role="group"
    aria-label={i18n.t('drag_drop_image')}
  >
    <div class="drop-content">
      <div class="drop-target-shell w98-frame">
        <button
          class="drop-target-button"
          data-testid="drop-target-button"
          onclick={openFilePicker}
          type="button"
        >
          <span class="drop-app-name w98-kicker">
            <span class="w98-emoji" aria-hidden="true">{isDragging ? '📥' : '🖼️'}</span>
            <span>{i18n.t('win_preview')}</span>
          </span>
          <span class="drop-icon w98-emoji">{isDragging ? '📥' : '🖼️'}</span>
          <span class="drop-title">{isDragging ? i18n.t('drop_here') : i18n.t('drag_drop_image')}</span>
          <span class="drop-subtitle w98-quiet-copy">{i18n.t('pixel_lab_subtitle')}</span>
        </button>
      </div>
      <div class="field-row drop-actions">
        <input
          bind:this={fileInputEl}
          type="file"
          accept={acceptedTypes.join(',')}
          onchange={handleFileInput}
          style="display: none;"
        />
        <button type="button" class="browse-btn w98-button" data-testid="browse-image-button" onclick={openFilePicker}><span class="w98-emoji">📂</span> {i18n.t('open_image')}</button>
        <button type="button" class="browse-btn sample-btn w98-button" data-testid="try-sample-button" onclick={loadSampleImage}><span class="w98-emoji">🖼️</span> {i18n.t('try_sample')}</button>
      </div>
      <div class="drop-guidance w98-note">
        <p class="drop-hint">{pasteHint}</p>
        <p class="drop-formats">{i18n.t('supported_formats')}</p>
      </div>
    </div>
    <!-- Onboarding Quick Start -->
    {#if !onboardingDismissed}
      <div class="onboarding-guide w98-frame">
        <div class="onboarding-header w98-window-card-titlebar">
          <div class="onboarding-title w98-window-card-title"><span class="w98-emoji">💡</span> {i18n.t('onboarding_title')}</div>
          <button type="button" class="onboarding-dismiss w98-window-control-button w98-structural-glyph" onclick={dismissOnboarding} title={i18n.t('onboarding_dont_show')} aria-label={i18n.t('onboarding_dont_show')}>✕</button>
        </div>
        <div class="onboarding-body w98-window-card-body">
          <div class="onboarding-steps">
            <div class="onboarding-step">
              <span class="step-icon w98-emoji">📐</span>
              <div class="step-text">
                <span class="step-title">{i18n.t('onboarding_step1_title')}</span>
                <span class="step-desc">{i18n.t('onboarding_step1_desc')}</span>
              </div>
            </div>
            <div class="onboarding-arrow">→</div>
            <div class="onboarding-step">
              <span class="step-icon w98-emoji">🎨</span>
              <div class="step-text">
                <span class="step-title">{i18n.t('onboarding_step2_title')}</span>
                <span class="step-desc">{i18n.t('onboarding_step2_desc')}</span>
              </div>
            </div>
            <div class="onboarding-arrow">→</div>
            <div class="onboarding-step">
              <span class="step-icon w98-emoji">💾</span>
              <div class="step-text">
                <span class="step-title">{i18n.t('onboarding_step3_title')}</span>
                <span class="step-desc">{i18n.t('onboarding_step3_desc')}</span>
              </div>
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
    background: var(--w98-surface);
  }
  .dropzone {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border: 2px dashed var(--w98-shadow-808);
    margin: var(--w98-space-8);
    background-color: var(--w98-surface-white);
    box-shadow: var(--w98-inset);
    overflow: hidden;
    cursor: pointer;
  }

  .dropzone.dragging {
    background-color: var(--w98-highlight-alpha);
    border-color: var(--w98-highlight);
    border-width: 3px;
    box-shadow: var(--w98-inset-thin);
  }

  .dropzone.dragging .drop-target-button {
    border-color: var(--w98-highlight);
    background: var(--w98-highlight-alpha);
  }

  .drop-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--w98-space-8);
    width: min(100%, 460px);
    padding: 0 var(--w98-space-12);
  }

  .drop-target-shell {
    width: min(100%, 360px);
    padding: var(--w98-space-8);
  }

  .drop-target-button {
    all: unset;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--w98-space-4);
    cursor: pointer;
    text-align: center;
    width: 100%;
    min-height: 156px;
    border: 2px dashed var(--w98-shadow-808);
    background: var(--w98-surface-subtle);
    box-shadow: var(--w98-inset-thin);
    padding: var(--w98-space-12) var(--w98-space-16);
    box-sizing: border-box;
  }

  .drop-target-button:focus-visible {
    border-color: var(--w98-highlight);
    outline: 1px dotted var(--w98-text);
    outline-offset: 2px;
  }

  .drop-icon {
    font-size: 32px;
  }

  .drop-title {
    font-size: var(--w98-font-size-heading);
    font-weight: bold;
    margin: var(--w98-space-4) 0;
    color: var(--w98-text);
  }

  .drop-app-name {
    display: inline-flex;
    align-items: center;
    gap: var(--w98-space-4);
    margin: 0;
    color: var(--w98-highlight);
  }

  .drop-subtitle {
    margin: 0;
    max-width: 340px;
    text-align: center;
    font-size: var(--w98-font-size-base);
    color: var(--w98-text-secondary);
    line-height: 1.35;
  }

  .browse-btn {
    font-size: var(--w98-font-size-action);
  }

  .drop-actions {
    justify-content: center;
    gap: var(--w98-space-6);
  }

  .drop-guidance {
    width: min(100%, 360px);
    text-align: center;
  }

  .drop-hint {
    margin: 0;
  }

  .drop-formats {
    font-size: var(--w98-font-size-caption);
    color: var(--w98-text-hint);
    margin: var(--w98-space-4) 0 0;
  }

  /* ===== Onboarding Guide ===== */
  .onboarding-guide {
    margin-top: var(--w98-space-12);
    max-width: 340px;
    width: 90%;
  }
  .onboarding-title {
    font-weight: bold;
  }
  .onboarding-dismiss {
    flex-shrink: 0;
  }
  .onboarding-body {
    min-width: 0;
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
    font-size: var(--w98-font-size-sm);
    font-weight: bold;
    color: var(--w98-text);
    white-space: nowrap;
  }
  .step-desc {
    font-size: var(--w98-font-size-caption);
    color: var(--w98-text-hint);
    line-height: 1.2;
  }
  .onboarding-arrow {
    font-size: var(--w98-font-size-action);
    color: var(--w98-highlight);
    font-weight: bold;
    flex-shrink: 0;
  }

  /* Mobile: larger browse button, hide drag hint */
  @media (max-width: 550px) {
    .browse-btn {
      padding: var(--w98-space-8) var(--w98-space-16);
      font-size: var(--w98-font-size-action);
    }
    .drop-hint {
      display: none;
    }
    .drop-title {
      font-size: var(--w98-font-size-action);
    }
  }
</style>
