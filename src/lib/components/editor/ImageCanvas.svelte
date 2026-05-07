<script lang="ts">
  import type { Snippet } from 'svelte';
  import { i18n } from '$lib/i18n/index.svelte';
  import { tooltip } from '$lib/utils/tooltip';
  import ImageDropZone from './ImageDropZone.svelte';
  import CrtDisplay from '../media/CrtDisplay.svelte';
  import CompareView, { type CompareVariant } from './CompareView.svelte';
  import CropOverlay from './CropOverlay.svelte';
  import { getPaletteName } from '$lib/utils/palettes';
  import { getPixelGridStyle } from '$lib/utils/previewGrid';
  import type { createZoomPan } from '$lib/stores/zoomPanStore.svelte';
  import type { ProcessingSettings } from '$lib/types';

  let {
    zp,
    originalImageSrc,
    processedImageSrc,
    isProcessing,
    processingProgress = 0,
    processingStartTime = 0,
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
    processingProgress?: number;
    processingStartTime?: number;
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

  let previewContainerEl = $state<HTMLDivElement | null>(null);
  let previewImgEl = $state<HTMLImageElement | null>(null);

  $effect(() => {
    zp.previewContainer = previewContainerEl ?? undefined;
    zp.previewImg = previewImgEl ?? undefined;
  });

  let displayedWidth = $derived(previewImgEl?.naturalWidth ?? 0);
  let displayedHeight = $derived(previewImgEl?.naturalHeight ?? 0);

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
    if (!gridVisible || !previewImgEl || !previewContainerEl) return '';
    return getPixelGridStyle({
      pixelSize: processingSettings.pixelSize,
      zoomLevel: zp.zoomLevel,
      panX: zp.panX,
      panY: zp.panY,
      naturalWidth: previewImgEl.naturalWidth,
      naturalHeight: previewImgEl.naturalHeight,
      containerWidth: previewContainerEl.clientWidth,
      containerHeight: previewContainerEl.clientHeight,
    });
  });

  let hasImage = $derived(!!processedImageSrc);
  let previewAltText = $derived(i18n.t('processed_preview_alt', getPaletteName(processingSettings.palette)));
  let localizedColorCount = $derived(i18n.t('gallery_n_colors', colorCount));
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  class="preview-body"
  class:panning={zp.isPanning}
  class:eyedropper={eyedropperActive}
  bind:this={previewContainerEl}
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
        <span class="tile-label w98-preview-badge">{i18n.t('tile_label')}</span>
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
            bind:this={previewImgEl}
            src={processedImageSrc}
            alt={previewAltText}
            data-testid="processed-preview-image"
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
        imageEl={previewImgEl}
        containerEl={previewContainerEl}
        onApply={(rect) => { onCrop?.(rect); cropModeActive = false; }}
        onCancel={() => { cropModeActive = false; }}
      />
    {/if}
    
    <!-- Processing Overlay -->
    {#if isProcessing}
      {@const pct = Math.round((processingProgress ?? 0) * 100)}
      {@const elapsed = processingStartTime ? (Date.now() - processingStartTime) / 1000 : 0}
      {@const eta = processingProgress > 0.05 ? Math.round(elapsed / processingProgress * (1 - processingProgress)) : 0}
      <div class="processing-overlay" role="status" aria-live="polite">
        <div class="processing-indicator w98-floating-surface">
          <div class="w98-window-card-titlebar">
            <div class="w98-window-card-title">
              <span class="processing-icon w98-emoji" aria-hidden="true">⚙️</span>
              <span>{i18n.t('applying_settings')}</span>
            </div>
          </div>
          <div class="processing-body w98-window-card-body">
            <div class="processing-readouts">
              <span class="w98-readout-chip w98-readout-chip--active">{pct}%</span>
              {#if eta > 0}
                <span class="w98-readout-chip">~{eta}s</span>
              {/if}
            </div>
            <div class="progress-container w98-progress-track">
              <div class="progress-bar-real w98-progress-fill" style="width:{pct}%"></div>
            </div>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Status bar: top-left info -->
    {#if hasImage && !compareMode}
      <div class="status-bar">
        {#if displayedWidth > 0 && displayedHeight > 0}
          <span class="status-item w98-readout-chip" title={i18n.t('image_resolution')} use:tooltip>{displayedWidth}×{displayedHeight}</span>
        {/if}
        {#if colorCount > 0}
          <span
            class="status-item w98-readout-chip w98-readout-chip--accent"
            title={i18n.t('unique_colors')}
            use:tooltip
          >
            <span class="status-item-icon w98-emoji" aria-hidden="true">🎨</span>
            {localizedColorCount}
          </span>
        {/if}
        <span class="status-item w98-readout-chip w98-readout-chip--active">
          <span class="status-item-icon w98-structural-glyph" aria-hidden="true">⊡</span>
          {Math.round(zp.zoomLevel * 100)}%
        </span>
      </div>
    {/if}
    
    {@render children?.()}
    
  {:else if originalImageSrc}
    <div class="initial-processing">
      <div class="processing-indicator processing-indicator--initial w98-floating-surface">
        <div class="w98-window-card-titlebar">
          <div class="w98-window-card-title">
            <span class="processing-icon w98-emoji" aria-hidden="true">🖼️</span>
            <span>{i18n.t('loading_image')}</span>
          </div>
        </div>
        <div class="processing-body w98-window-card-body">
          <div class="progress-container progress-wide w98-progress-track">
            <div class="progress-bar-indeterminate w98-progress-fill"></div>
          </div>
        </div>
      </div>
    </div>
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
    gap: var(--w98-space-2);
    z-index: 6;
    pointer-events: none;
  }
  .status-item {
    pointer-events: auto;
    cursor: default;
  }
  .status-item-icon {
    font-size: var(--w98-font-size-caption);
    line-height: 1;
  }

  .processing-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--w98-dialog-scrim);
    z-index: 5;
    pointer-events: none;
  }
  .processing-indicator {
    display: flex;
    flex-direction: column;
    min-width: 180px;
    overflow: hidden;
    color: var(--w98-text);
  }
  .processing-indicator--initial {
    min-width: 220px;
  }
  .processing-body {
    align-items: stretch;
  }
  .processing-icon {
    font-size: var(--w98-font-size-heading);
    line-height: 1;
  }
  .processing-readouts {
    display: flex;
    align-items: center;
    gap: var(--w98-space-4);
    flex-wrap: wrap;
  }
  .progress-container {
    width: 100%;
    position: relative;
    min-height: 16px;
    align-self: stretch;
  }
  .progress-bar-indeterminate,
  .progress-bar-real {
    position: relative;
  }
  .progress-bar-real {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
  }
  .progress-bar-indeterminate {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 20%;
    width: 60%;
  }
  .progress-wide {
    width: 100%;
  }

  .initial-processing {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    pointer-events: none;
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
    z-index: 4;
  }

  .pixel-grid-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    pointer-events: none;
    z-index: 3;
    transform-origin: center center;
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
