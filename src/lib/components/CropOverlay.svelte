<script lang="ts">
  /**
   * CropOverlay — Drag-to-select crop region over the preview image.
   * Renders a darkened mask with a transparent selection window.
   * Reports crop rect in original image pixel coordinates.
   */
  import { i18n } from '$lib/i18n/index.svelte';

  let {
    imageEl,
    containerEl,
    onApply,
    onCancel,
  }: {
    imageEl: HTMLImageElement | null;
    containerEl: HTMLElement | null;
    onApply: (rect: { x: number; y: number; w: number; h: number }) => void;
    onCancel: () => void;
  } = $props();

  // Selection in screen coordinates (relative to container)
  let selecting = $state(false);
  let startX = $state(0);
  let startY = $state(0);
  let endX = $state(0);
  let endY = $state(0);
  let hasSelection = $state(false);

  // Compute the selection rect (normalized: top-left origin)
  let selRect = $derived.by(() => {
    const x = Math.min(startX, endX);
    const y = Math.min(startY, endY);
    const w = Math.abs(endX - startX);
    const h = Math.abs(endY - startY);
    return { x, y, w, h };
  });

  // Map from image's object-fit:contain rendering to the overlay coordinate space
  function getImageLayout() {
    if (!imageEl || !containerEl) return null;
    const contRect = containerEl.getBoundingClientRect();
    const imgW = imageEl.naturalWidth;
    const imgH = imageEl.naturalHeight;
    if (!imgW || !imgH) return null;

    const scale = Math.min(contRect.width / imgW, contRect.height / imgH);
    const renderedW = imgW * scale;
    const renderedH = imgH * scale;
    const offsetX = (contRect.width - renderedW) / 2;
    const offsetY = (contRect.height - renderedH) / 2;

    return { scale, renderedW, renderedH, offsetX, offsetY, imgW, imgH, contRect };
  }

  function getPointerPos(e: MouseEvent | Touch): { x: number; y: number } {
    if (!containerEl) return { x: 0, y: 0 };
    const rect = containerEl.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handlePointerDown(e: MouseEvent) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const pos = getPointerPos(e);
    startX = pos.x;
    startY = pos.y;
    endX = pos.x;
    endY = pos.y;
    selecting = true;
    hasSelection = false;
  }

  function handlePointerMove(e: MouseEvent) {
    if (!selecting) return;
    e.preventDefault();
    const pos = getPointerPos(e);
    endX = pos.x;
    endY = pos.y;
    if (Math.abs(endX - startX) > 4 || Math.abs(endY - startY) > 4) {
      hasSelection = true;
    }
  }

  function handlePointerUp(e: MouseEvent) {
    if (!selecting) return;
    e.preventDefault();
    selecting = false;
    if (selRect.w < 8 || selRect.h < 8) {
      hasSelection = false;
    }
  }

  // Touch support
  function handleTouchStart(e: TouchEvent) {
    if (e.touches.length !== 1) return;
    e.preventDefault();
    const pos = getPointerPos(e.touches[0]);
    startX = pos.x;
    startY = pos.y;
    endX = pos.x;
    endY = pos.y;
    selecting = true;
    hasSelection = false;
  }

  function handleTouchMove(e: TouchEvent) {
    if (!selecting || e.touches.length !== 1) return;
    e.preventDefault();
    const pos = getPointerPos(e.touches[0]);
    endX = pos.x;
    endY = pos.y;
    if (Math.abs(endX - startX) > 4 || Math.abs(endY - startY) > 4) {
      hasSelection = true;
    }
  }

  function handleTouchEnd(e: TouchEvent) {
    if (!selecting) return;
    e.preventDefault();
    selecting = false;
    if (selRect.w < 8 || selRect.h < 8) {
      hasSelection = false;
    }
  }

  function applyCrop() {
    const layout = getImageLayout();
    if (!layout || !hasSelection) return;

    const { scale, offsetX, offsetY, imgW, imgH } = layout;

    // Convert screen coords to image pixel coords
    const imgX = Math.max(0, Math.round((selRect.x - offsetX) / scale));
    const imgY = Math.max(0, Math.round((selRect.y - offsetY) / scale));
    const imgRight = Math.min(imgW, Math.round((selRect.x + selRect.w - offsetX) / scale));
    const imgBottom = Math.min(imgH, Math.round((selRect.y + selRect.h - offsetY) / scale));
    const cropW = imgRight - imgX;
    const cropH = imgBottom - imgY;

    if (cropW < 2 || cropH < 2) return;

    onApply({ x: imgX, y: imgY, w: cropW, h: cropH });
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Enter' && hasSelection) {
      e.preventDefault();
      applyCrop();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="crop-overlay"
  onmousedown={handlePointerDown}
  onmousemove={handlePointerMove}
  onmouseup={handlePointerUp}
  onmouseleave={handlePointerUp}
  ontouchstart={handleTouchStart}
  ontouchmove={handleTouchMove}
  ontouchend={handleTouchEnd}
  role="application"
  aria-label={i18n.t('crop_drag_hint')}
>
  {#if hasSelection || selecting}
    <!-- Dark mask with transparent crop window using clip-path -->
    <div class="crop-mask"
      style="clip-path: polygon(
        0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
        {selRect.x}px {selRect.y}px,
        {selRect.x}px {selRect.y + selRect.h}px,
        {selRect.x + selRect.w}px {selRect.y + selRect.h}px,
        {selRect.x + selRect.w}px {selRect.y}px,
        {selRect.x}px {selRect.y}px
      );"
    ></div>
    <!-- Selection border -->
    <div
      class="crop-selection"
      style="left:{selRect.x}px;top:{selRect.y}px;width:{selRect.w}px;height:{selRect.h}px;"
    >
      <div class="crop-handle top-left"></div>
      <div class="crop-handle top-right"></div>
      <div class="crop-handle bottom-left"></div>
      <div class="crop-handle bottom-right"></div>
    </div>
  {:else}
    <!-- Full overlay with hint text -->
    <div class="crop-hint-overlay">
      <span class="crop-hint-text">{i18n.t('crop_drag_hint')}</span>
    </div>
  {/if}

  <!-- Action buttons -->
  <div class="crop-actions">
    <button
      class="crop-action-btn crop-apply"
      disabled={!hasSelection}
      onclick={(e) => { e.stopPropagation(); applyCrop(); }}
    >✓ {i18n.t('crop_apply')}</button>
    <button
      class="crop-action-btn crop-cancel"
      onclick={(e) => { e.stopPropagation(); onCancel(); }}
    >✕ {i18n.t('crop_cancel')}</button>
  </div>
</div>

<style>
  .crop-overlay {
    position: absolute;
    inset: 0;
    z-index: 8;
    cursor: crosshair;
    touch-action: none;
  }

  .crop-mask {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    pointer-events: none;
  }

  .crop-hint-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .crop-hint-text {
    font-size: 13px;
    font-weight: bold;
    color: #fff;
    text-shadow: 1px 1px 2px #000;
    background: rgba(0, 0, 128, 0.7);
    padding: 6px 14px;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .crop-selection {
    position: absolute;
    border: 2px dashed #fff;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(0, 0, 0, 0.3);
    pointer-events: none;
  }

  .crop-handle {
    position: absolute;
    width: 8px;
    height: 8px;
    background: #fff;
    border: 1px solid #000;
    pointer-events: none;
  }
  .crop-handle.top-left { top: -4px; left: -4px; }
  .crop-handle.top-right { top: -4px; right: -4px; }
  .crop-handle.bottom-left { bottom: -4px; left: -4px; }
  .crop-handle.bottom-right { bottom: -4px; right: -4px; }

  .crop-actions {
    position: absolute;
    bottom: 8px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 4px;
    z-index: 10;
    pointer-events: auto;
  }

  .crop-action-btn {
    padding: 4px 12px;
    font-size: 11px;
    font-weight: bold;
    cursor: pointer;
    border: none;
    box-shadow: inset 1px 1px #fff, inset -1px -1px #0a0a0a;
  }
  .crop-action-btn:active {
    box-shadow: inset -1px -1px #fff, inset 1px 1px #0a0a0a;
  }
  .crop-action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .crop-apply {
    background: #c0c0c0;
    color: #000;
  }
  .crop-cancel {
    background: #c0c0c0;
    color: #000;
  }
</style>
