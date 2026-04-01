<script lang="ts">
  import type { Snippet } from 'svelte';
  import { i18n } from '$lib/i18n/index.svelte';
  import { tooltip } from '$lib/utils/tooltip';
  import ImageDropZone from './ImageDropZone.svelte';
  import CrtDisplay from '../media/CrtDisplay.svelte';
  import CompareView, { type CompareVariant } from './CompareView.svelte';
  import CropOverlay from './CropOverlay.svelte';
  import { getPaletteName } from '$lib/utils/palettes';
  import type { createZoomPan } from '$lib/stores/zoomPanStore.svelte';
  import type { ProcessingSettings } from '$lib/types';

  let {
    zp,
    originalImageSrc,
    processedImageSrc,
    isProcessing,
    processingSettings,
    compareMode,
    compareVariant,
    tileMode,
    cropModeActive = $bindable(false),
    eyedropperActive = $bindable(false),
    eyedropperOverlay, // need to dismiss it when pressing escape
    postFilterCss,
    colorCount,
    onImageSelected,
    onError,
    onCrop,
    children
  }: {
    zp: ReturnType<typeof createZoomPan>;
    originalImageSrc: string | null;
    processedImageSrc: string | null;
    isProcessing: boolean;
    processingSettings: ProcessingSettings;
    compareMode: boolean;
    compareVariant: CompareVariant;
    tileMode: boolean;
    cropModeActive: boolean;
    eyedropperActive: boolean;
    eyedropperOverlay: any;
    postFilterCss: string;
    colorCount: number;
    onImageSelected: (file: File) => void;
    onError: (msg: string) => void;
    onCrop?: (rect: { x: number; y: number; w: number; h: number } | null) => void;
    children?: Snippet;
  } = $props();

  let displayedWidth = $derived(zp.previewImg?.naturalWidth ?? 0);
  let displayedHeight = $derived(zp.previewImg?.naturalHeight ?? 0);

  function handlePreviewClick(e: MouseEvent) {
    eyedropperOverlay?.pick(e);
  }

  function handlePreviewKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      if (eyedropperActive) { eyedropperActive = false; eyedropperOverlay?.dismiss(); }
      if (cropModeActive) { cropModeActive = false; }
      return;
    }
    if (e.key === 'e' || e.key === 'E') {
      eyedropperActive = !eyedropperActive;
      eyedropperOverlay?.dismiss();
    }
    if (e.key === 'g' || e.key === 'G') {
      zp.showGrid = !zp.showGrid;
    }
    if (e.key === '+' || e.key === '=') { zp.zoomIn(); }
    if (e.key === '-') { zp.zoomOut(); }
    if (e.key === '0') { zp.zoomToFit(); }
  }

  let gridVisible = $derived(zp.showGrid && zp.zoomLevel >= 2 && processingSettings.pixelSize > 1);

  let gridStyle = $derived.by(() => {
    if (!gridVisible || !zp.previewImg || !zp.previewContainer) return '';
    const px = processingSettings.pixelSize;
    const z = zp.zoomLevel;
    const imgW = zp.previewImg.naturalWidth;
    const imgH = zp.previewImg.naturalHeight;
    const contW = zp.previewContainer.clientWidth;
    const contH = zp.previewContainer.clientHeight;
    if (!imgW || !imgH || !contW || !contH) return '';

    const fitScale = Math.min(contW / imgW, contH / imgH);
    const cellSize = px * fitScale * z;
    if (cellSize < 4) return '';

    const blocksX = Math.floor(imgW / px);
    const blocksY = Math.floor(imgH / px);
    const w = blocksX * cellSize;
    const h = blocksY * cellSize;
    const offsetX = ((imgW - blocksX * px) / 2) * fitScale * z;
    const offsetY = ((imgH - blocksY * px) / 2) * fitScale * z;
    const tx = zp.panX + offsetX;
    const ty = zp.panY + offsetY;
    return (
      `width:${w}px;height:${h}px;` +
      `background-size:${cellSize}px ${cellSize}px;` +
      `transform:translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px));`
    );
  });

  let hasImage = $derived(!!processedImageSrc);
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  class="preview-body"
  class:panning={zp.isPanning}
  class:eyedropper={eyedropperActive}
  bind:this={zp.previewContainer}
  onclick={handlePreviewClick}
  onkeydown={handlePreviewKeydown}
  onwheel={cropModeActive ? undefined : zp.handleWheel}
  onmousedown={cropModeActive ? undefined : zp.handleMouseDown}
  onmousemove={cropModeActive ? undefined : zp.handleMouseMove}
  onmouseup={cropModeActive ? undefined : zp.handleMouseUp}
  onmouseleave={cropModeActive ? undefined : zp.handleMouseUp}
  ontouchstart={cropModeActive ? undefined : zp.handleTouchStart}
  ontouchmove={cropModeActive ? undefined : zp.handleTouchMove}
  ontouchend={cropModeActive ? undefined : zp.handleTouchEnd}
  role="application"
  tabindex="0"
  aria-label={i18n.t('image_preview')}
>
  {#if !originalImageSrc}
    <ImageDropZone {onImageSelected} {onError} />
  {:else if processedImageSrc}
    {#if tileMode && processedImageSrc}
      <div class="tile-preview">
        <div
          class="tile-grid"
          style:background-image="url({processedImageSrc})"
          style:image-rendering={processingSettings.renderMode === 'bilinear'
            ? 'auto'
            : 'pixelated'}
          style:filter={postFilterCss || 'none'}
        ></div>
        <span class="tile-label">{i18n.t('tile_label')}</span>
      </div>
    {:else if compareMode && originalImageSrc}
      <CompareView
        originalSrc={originalImageSrc}
        processedSrc={processedImageSrc}
        renderMode={processingSettings.renderMode}
        paletteName={getPaletteName(processingSettings.palette)}
        {postFilterCss}
        variant={compareVariant}
      />
    {:else}
      <CrtDisplay active={processingSettings.crtEffect !== 'none'} mode={processingSettings.crtEffect}>
        {#snippet children()}
          <img
            bind:this={zp.previewImg}
            src={processedImageSrc}
            alt="Pixel Art - {getPaletteName(processingSettings.palette)}"
            class="preview-image"
            style:image-rendering={processingSettings.renderMode === 'bilinear'
              ? 'auto'
              : 'pixelated'}
            style:filter={postFilterCss || 'none'}
            style:transform="scale({zp.zoomLevel}) translate({zp.panX / zp.zoomLevel}px, {zp.panY /
              zp.zoomLevel}px)"
            draggable="false"
          />
        {/snippet}
      </CrtDisplay>
    {/if}
    
    <!-- Pixel Grid Overlay -->
    {#if gridVisible && gridStyle}
      <div class="pixel-grid-overlay" style={gridStyle}></div>
    {/if}
    
    <!-- Crop Overlay -->
    {#if cropModeActive && processedImageSrc && !compareMode && !tileMode}
      <CropOverlay
        imageEl={zp.previewImg ?? null}
        containerEl={zp.previewContainer ?? null}
        onApply={(rect) => { onCrop?.(rect); cropModeActive = false; }}
        onCancel={() => { cropModeActive = false; }}
      />
    {/if}
    
    <!-- Processing Overlay (simplified) -->
    {#if isProcessing}
      <div class="processing-overlay">
        <div class="processing-indicator">
          <div class="progress-container">
            <div class="progress-bar"></div>
          </div>
          <span class="processing-text">{i18n.t('applying_settings')}</span>
        </div>
      </div>
    {/if}
    
    <!-- Status bar: top-left info -->
    {#if hasImage && !compareMode}
      <div class="status-bar">
        {#if displayedWidth > 0 && displayedHeight > 0}
          <span class="status-item" title={i18n.t('image_resolution')} use:tooltip>{displayedWidth}x{displayedHeight}</span>
        {/if}
        {#if colorCount > 0}
          <span class="status-item status-colors" title={i18n.t('unique_colors')} use:tooltip>{colorCount} colors</span>
        {/if}
        <span class="status-item">{Math.round(zp.zoomLevel * 100)}%</span>
      </div>
    {/if}
    
    {@render children?.()}
    
  {:else if originalImageSrc}
    <div class="initial-processing">
      <div class="processing-indicator">
        <div class="progress-container progress-wide">
          <div class="progress-bar"></div>
        </div>
        <span class="processing-text">{i18n.t('loading_image')}</span>
      </div>
    </div>
  {:else}
    <ImageDropZone {onImageSelected} {onError} />
  {/if}
</div>

<style>
  .preview-body {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--w98-surface-dark);
    overflow: hidden;
    min-height: 0;
    cursor: default;
    touch-action: none;
  }
  .preview-body.panning {
    cursor: grabbing;
  }
  .preview-body.eyedropper {
    cursor: crosshair;
  }
  .preview-body:focus-visible {
    outline: 2px solid var(--w98-highlight);
    outline-offset: -2px;
  }

  .preview-image {
    max-width: 100%;
    max-height: 100%;
    width: 100%;
    height: 100%;
    object-fit: contain;
    transform-origin: center center;
    will-change: transform;
  }

  .status-bar {
    position: absolute;
    top: 6px;
    left: 6px;
    display: flex;
    gap: 1px;
    z-index: 6;
    pointer-events: none;
  }
  .status-item {
    font-size: var(--w98-font-size-sm);
    font-family: 'Courier New', Courier, monospace;
    font-weight: bold;
    color: #ccc;
    padding: 2px 6px;
    background: rgba(0, 0, 0, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.08);
    white-space: nowrap;
    line-height: 1.2;
  }
  .status-colors {
    color: #8f8;
  }

  .processing-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.35);
    z-index: 5;
    pointer-events: none;
  }
  .processing-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    background: var(--w98-surface);
    border: 1px solid var(--w98-shadow-808);
    padding: 10px 20px;
    color: var(--w98-text);
    font-size: var(--w98-font-size-base);
    font-family: 'Courier New', Courier, monospace;
    font-weight: bold;
  }
  .processing-text {
    font-size: var(--w98-font-size-sm);
  }
  .progress-container {
    width: 140px;
    height: 6px;
    background: var(--w98-surface-dim);
    box-shadow: var(--w98-inset-thin);
    position: relative;
    overflow: hidden;
  }
  .progress-bar {
    position: absolute;
    inset: 0;
    background: var(--w98-highlight);
    animation: progressSlide 1.2s linear infinite;
    transform-origin: left;
  }
  .progress-wide {
    width: 200px;
  }

  @keyframes progressSlide {
    0% { transform: scaleX(0); }
    50% { transform: scaleX(1); }
    100% { transform: scaleX(0); }
  }

  .initial-processing {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #ccc;
    font-family: 'Courier New', Courier, monospace;
    font-size: 14px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .tile-preview {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #111;
  }
  .tile-grid {
    width: 100%;
    height: 100%;
    background-size: 33.333% 33.333%;
    background-repeat: repeat;
    background-position: center;
  }
  .tile-label {
    position: absolute;
    top: 8px;
    right: 8px;
    font-size: var(--w98-font-size-caption);
    font-weight: bold;
    padding: 2px 6px;
    background: var(--w98-surface);
    color: var(--w98-text);
    box-shadow: var(--w98-outset-thin);
    letter-spacing: 1px;
    pointer-events: none;
    z-index: 4;
  }

  .pixel-grid-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    pointer-events: none;
    z-index: 3;
    background-image: linear-gradient(to right, rgba(255, 255, 255, 0.3) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.3) 1px, transparent 1px);
    background-position: 0 0;
  }

  /* Mobile Responsive for Status Bar inside ImageCanvas */
  @media (max-width: 550px) {
    .status-bar {
      top: 4px;
      left: 4px;
    }
    .status-item {
      font-size: var(--w98-font-size-caption);
      padding: 1px 4px;
    }
  }
</style>
