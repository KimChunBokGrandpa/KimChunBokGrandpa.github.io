<script lang="ts">
  /**
   * CropOverlay — Drag-to-select crop region over the preview image.
   * Renders a darkened mask with a transparent selection window.
   * Reports crop rect in original image pixel coordinates.
   * Supports: draw new selection, move selection, resize via corner handles.
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
  let sx = $state(0); // selection left
  let sy = $state(0); // selection top
  let sw = $state(0); // selection width
  let sh = $state(0); // selection height
  let hasSelection = $state(false);

  // Interaction mode
  type DragMode = 'none' | 'draw' | 'move' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br';
  let dragMode: DragMode = $state('none');
  let dragStartX = 0;
  let dragStartY = 0;
  // Snapshot of selection at drag start (for move/resize)
  let snapSx = 0, snapSy = 0, snapSw = 0, snapSh = 0;

  // Computed selection rect (clamped to positive size)
  let selRect = $derived.by(() => {
    const x = sw >= 0 ? sx : sx + sw;
    const y = sh >= 0 ? sy : sy + sh;
    const w = Math.abs(sw);
    const h = Math.abs(sh);
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

  function isInsideSelection(px: number, py: number): boolean {
    const r = selRect;
    const margin = 6;
    return px > r.x + margin && px < r.x + r.w - margin &&
           py > r.y + margin && py < r.y + r.h - margin;
  }

  function getCornerHandle(px: number, py: number): DragMode {
    const r = selRect;
    const hs = 12; // handle hit area size
    if (Math.abs(px - r.x) < hs && Math.abs(py - r.y) < hs) return 'resize-tl';
    if (Math.abs(px - (r.x + r.w)) < hs && Math.abs(py - r.y) < hs) return 'resize-tr';
    if (Math.abs(px - r.x) < hs && Math.abs(py - (r.y + r.h)) < hs) return 'resize-bl';
    if (Math.abs(px - (r.x + r.w)) < hs && Math.abs(py - (r.y + r.h)) < hs) return 'resize-br';
    return 'none';
  }

  function startDrag(px: number, py: number) {
    dragStartX = px;
    dragStartY = py;
    snapSx = selRect.x;
    snapSy = selRect.y;
    snapSw = selRect.w;
    snapSh = selRect.h;

    if (hasSelection) {
      const corner = getCornerHandle(px, py);
      if (corner !== 'none') {
        dragMode = corner;
        return;
      }
      if (isInsideSelection(px, py)) {
        dragMode = 'move';
        return;
      }
    }

    // New selection
    dragMode = 'draw';
    sx = px;
    sy = py;
    sw = 0;
    sh = 0;
    hasSelection = false;
  }

  function updateDrag(px: number, py: number) {
    if (dragMode === 'none') return;
    const dx = px - dragStartX;
    const dy = py - dragStartY;

    if (dragMode === 'draw') {
      sw = px - sx;
      sh = py - sy;
      if (Math.abs(sw) > 4 || Math.abs(sh) > 4) hasSelection = true;
    } else if (dragMode === 'move') {
      sx = snapSx + dx;
      sy = snapSy + dy;
      sw = snapSw;
      sh = snapSh;
    } else if (dragMode === 'resize-tl') {
      sx = snapSx + dx;
      sy = snapSy + dy;
      sw = snapSw - dx;
      sh = snapSh - dy;
    } else if (dragMode === 'resize-tr') {
      sy = snapSy + dy;
      sw = snapSw + dx;
      sh = snapSh - dy;
    } else if (dragMode === 'resize-bl') {
      sx = snapSx + dx;
      sw = snapSw - dx;
      sh = snapSh + dy;
    } else if (dragMode === 'resize-br') {
      sw = snapSw + dx;
      sh = snapSh + dy;
    }
  }

  function endDrag() {
    if (dragMode === 'none') return;
    // Normalize negative dimensions
    const r = selRect;
    sx = r.x;
    sy = r.y;
    sw = r.w;
    sh = r.h;
    dragMode = 'none';
    if (sw < 8 || sh < 8) hasSelection = false;
  }

  // Mouse handlers
  function handlePointerDown(e: MouseEvent) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const pos = getPointerPos(e);
    startDrag(pos.x, pos.y);
  }

  function handlePointerMove(e: MouseEvent) {
    if (dragMode === 'none') {
      // Update cursor based on hover position
      updateCursor(e);
      return;
    }
    e.preventDefault();
    const pos = getPointerPos(e);
    updateDrag(pos.x, pos.y);
  }

  function handlePointerUp(e: MouseEvent) {
    if (dragMode === 'none') return;
    e.preventDefault();
    endDrag();
  }

  // Cursor management
  let overlayEl: HTMLDivElement | undefined = $state();
  function updateCursor(e: MouseEvent) {
    if (!overlayEl || !hasSelection) return;
    const pos = getPointerPos(e);
    const corner = getCornerHandle(pos.x, pos.y);
    if (corner === 'resize-tl' || corner === 'resize-br') {
      overlayEl.style.cursor = 'nwse-resize';
    } else if (corner === 'resize-tr' || corner === 'resize-bl') {
      overlayEl.style.cursor = 'nesw-resize';
    } else if (isInsideSelection(pos.x, pos.y)) {
      overlayEl.style.cursor = 'move';
    } else {
      overlayEl.style.cursor = 'crosshair';
    }
  }

  // Touch support
  function handleTouchStart(e: TouchEvent) {
    if (e.touches.length !== 1) return;
    e.preventDefault();
    const pos = getPointerPos(e.touches[0]);
    startDrag(pos.x, pos.y);
  }

  function handleTouchMove(e: TouchEvent) {
    if (dragMode === 'none' || e.touches.length !== 1) return;
    e.preventDefault();
    const pos = getPointerPos(e.touches[0]);
    updateDrag(pos.x, pos.y);
  }

  function handleTouchEnd(e: TouchEvent) {
    if (dragMode === 'none') return;
    e.preventDefault();
    endDrag();
  }

  function applyCrop() {
    const layout = getImageLayout();
    if (!layout || !hasSelection) return;

    const { scale, offsetX, offsetY, imgW, imgH } = layout;
    const r = selRect;

    // Convert screen coords to image pixel coords
    const imgX = Math.max(0, Math.round((r.x - offsetX) / scale));
    const imgY = Math.max(0, Math.round((r.y - offsetY) / scale));
    const imgRight = Math.min(imgW, Math.round((r.x + r.w - offsetX) / scale));
    const imgBottom = Math.min(imgH, Math.round((r.y + r.h - offsetY) / scale));
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
  bind:this={overlayEl}
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
  {#if hasSelection || dragMode !== 'none'}
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
      <div class="crop-hint-box">
        <span class="crop-hint-icon">✂</span>
        <span class="crop-hint-text">{i18n.t('crop_drag_hint')}</span>
        <span class="crop-hint-keys">{i18n.t('crop_keyboard_hint')}</span>
      </div>
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

  .crop-hint-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    background: rgba(0, 0, 128, 0.8);
    padding: 10px 18px;
    border: 2px outset var(--w98-shadow-light);
  }
  .crop-hint-icon {
    font-size: 24px;
  }
  .crop-hint-text {
    font-size: var(--w98-font-size-icon);
    font-weight: bold;
    color: #fff;
    text-shadow: 1px 1px 2px #000;
  }
  .crop-hint-keys {
    font-size: var(--w98-font-size-sm);
    color: rgba(255, 255, 255, 0.7);
    font-family: 'Courier New', monospace;
  }

  .crop-selection {
    position: absolute;
    border: 2px dashed #fff;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(0, 0, 0, 0.3);
    pointer-events: none;
  }

  .crop-handle {
    position: absolute;
    width: 10px;
    height: 10px;
    background: #fff;
    border: 1px solid #000;
    pointer-events: none;
  }
  .crop-handle.top-left { top: -5px; left: -5px; cursor: nwse-resize; }
  .crop-handle.top-right { top: -5px; right: -5px; cursor: nesw-resize; }
  .crop-handle.bottom-left { bottom: -5px; left: -5px; cursor: nesw-resize; }
  .crop-handle.bottom-right { bottom: -5px; right: -5px; cursor: nwse-resize; }

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
    font-size: var(--w98-font-size-base);
    font-weight: bold;
    cursor: pointer;
    border: none;
    box-shadow: var(--w98-outset-thin);
  }
  .crop-action-btn:active {
    box-shadow: var(--w98-inset-thin);
  }
  .crop-action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .crop-apply {
    background: var(--w98-surface);
    color: #000;
  }
  .crop-cancel {
    background: var(--w98-surface);
    color: #000;
  }
</style>
