<script lang="ts">
  import ImageDropZone from './ImageDropZone.svelte';
  import CrtDisplay from '../media/CrtDisplay.svelte';
  import GifControls from '../media/GifControls.svelte';
  import CropOverlay from './CropOverlay.svelte';
  import EyedropperOverlay from './EyedropperOverlay.svelte';
  import CompareView, { type CompareVariant } from './CompareView.svelte';
  import { getPaletteName } from '$lib/utils/palettes';
  import { i18n } from '$lib/i18n/index.svelte';
  import type { createZoomPan } from '$lib/stores/zoomPanStore.svelte';
  import type { ProcessingSettings } from '$lib/types';
  import type { TranslationKey } from '$lib/i18n/en';
  import { tooltip } from '$lib/utils/tooltip';

  let {
    zp,
    originalImageSrc,
    processedImageSrc,
    isProcessing,
    processingSettings,
    compareMode = $bindable(false),
    onImageSelected,
    onError,
    onOpenSettings,
    // GIF props
    isGif = false,
    gifCurrentFrame = 0,
    gifFrameCount = 0,
    gifPlaying = false,
    gifIsExporting = false,
    gifExportProgress = 0,
    onGifPlay,
    onGifPause,
    onGifSeek,
    onGifExport,
    onGifCancelExport,
    onGifExportSpritesheet,
    // Color count
    colorCount = 0,
    // Tile mode
    tileMode = $bindable(false),
    // Post-process CSS filter
    postFilterCss = '',
    // Transform
    onRotate,
    onResetTransform,
    onCrop,
    currentRotation = 0,
    hasCrop = false,
  }: {
    zp: ReturnType<typeof createZoomPan>;
    originalImageSrc: string | null;
    processedImageSrc: string | null;
    isProcessing: boolean;
    processingSettings: ProcessingSettings;
    compareMode: boolean;
    onImageSelected: (file: File) => void;
    onError: (msg: string) => void;
    onOpenSettings: () => void;
    // GIF props
    isGif?: boolean;
    gifCurrentFrame?: number;
    gifFrameCount?: number;
    gifPlaying?: boolean;
    gifIsExporting?: boolean;
    gifExportProgress?: number;
    onGifPlay?: () => void;
    onGifPause?: () => void;
    onGifSeek?: (frame: number) => void;
    onGifExport?: () => void;
    onGifCancelExport?: () => void;
    onGifExportSpritesheet?: () => void;
    // Color count
    colorCount?: number;
    // Tile mode
    tileMode?: boolean;
    // Post-process CSS filter
    postFilterCss?: string;
    // Transform
    onRotate?: (degrees: 90 | -90 | 180) => void;
    onResetTransform?: () => void;
    onCrop?: (rect: { x: number; y: number; w: number; h: number } | null) => void;
    currentRotation?: number;
    hasCrop?: boolean;
  } = $props();

  let displayedWidth = $derived(zp.previewImg?.naturalWidth ?? 0);
  let displayedHeight = $derived(zp.previewImg?.naturalHeight ?? 0);

  // ─── Crop Mode ───
  let cropModeActive = $state(false);

  // ─── Eyedropper ───
  let eyedropperActive = $state(false);
  let eyedropperOverlay = $state<EyedropperOverlay>();

  function handlePreviewClick(e: MouseEvent) {
    eyedropperOverlay?.pick(e);
  }

  // ─── Compare Mode ───
  const COMPARE_VARIANTS: CompareVariant[] = ['slider', 'side-by-side', 'onion'];
  const COMPARE_VARIANT_LABELS: Record<CompareVariant, TranslationKey> = {
    'slider': 'compare_slider',
    'side-by-side': 'compare_side_by_side',
    'onion': 'compare_onion',
  };
  let compareVariant = $state<CompareVariant>('slider');

  function cycleCompareVariant() {
    const idx = COMPARE_VARIANTS.indexOf(compareVariant);
    compareVariant = COMPARE_VARIANTS[(idx + 1) % COMPARE_VARIANTS.length];
  }

  let compareVariantIcon = $derived(
    compareVariant === 'slider' ? '↔' : compareVariant === 'side-by-side' ? '⬜⬜' : '🧅'
  );

  // Keyboard handler for preview area accessibility
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

  // Pixel grid: show when grid is on and zoom is high enough to see pixels
  let gridVisible = $derived(zp.showGrid && zp.zoomLevel >= 2 && processingSettings.pixelSize > 1);

  // Compute grid style that matches the image's "object-fit: contain" rendering
  let gridStyle = $derived.by(() => {
    if (!gridVisible || !zp.previewImg || !zp.previewContainer) return '';
    const px = processingSettings.pixelSize;
    const z = zp.zoomLevel;
    const imgW = zp.previewImg.naturalWidth;
    const imgH = zp.previewImg.naturalHeight;
    const contW = zp.previewContainer.clientWidth;
    const contH = zp.previewContainer.clientHeight;
    if (!imgW || !imgH || !contW || !contH) return '';

    // "contain" fit scale at zoom=1
    const fitScale = Math.min(contW / imgW, contH / imgH);
    // Screen-space cell size — use exact pixel count per cell
    const cellSize = px * fitScale * z;
    if (cellSize < 4) return '';

    // Grid dimensions = exact number of pixel blocks × cell size
    // This prevents drift by ensuring grid aligns to block boundaries
    const blocksX = Math.floor(imgW / px);
    const blocksY = Math.floor(imgH / px);
    const w = blocksX * cellSize;
    const h = blocksY * cellSize;
    // Offset: center the grid on the image, accounting for partial blocks
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
    <!-- Toolbar: single row, grouped by dividers -->
    <div class="toolbar">
      <!-- Settings -->
      <button
        class="tb-btn"
        onclick={(e) => { e.stopPropagation(); onOpenSettings(); }}
        title={i18n.t('open_settings')}
        aria-label={i18n.t('btn_open_settings')}
        use:tooltip>⚙️</button>
      <span class="tb-sep"></span>
      <!-- Transform -->
      <button class="tb-btn" onclick={() => onRotate?.(-90)} title={i18n.t('rotate_left')} aria-label={i18n.t('btn_rotate_left')} use:tooltip>↺</button>
      <button class="tb-btn" onclick={() => onRotate?.(90)} title={i18n.t('rotate_right')} aria-label={i18n.t('btn_rotate_right')} use:tooltip>↻</button>
      <button
        class="tb-btn"
        class:tb-active={cropModeActive}
        onclick={() => { cropModeActive = !cropModeActive; if (cropModeActive) { eyedropperActive = false; eyedropperOverlay?.dismiss(); } }}
        title={cropModeActive ? i18n.t('crop_active') : i18n.t('crop')}
        aria-label={cropModeActive ? i18n.t('crop_active') : i18n.t('crop')}
        aria-pressed={cropModeActive}
        use:tooltip>✂</button>
      {#if currentRotation !== 0 || hasCrop}
        <button
          class="tb-btn"
          onclick={() => { onResetTransform?.(); cropModeActive = false; }}
          title={i18n.t('reset_transform')}
          aria-label={i18n.t('btn_reset_transform')}
          use:tooltip>⟲</button>
      {/if}
      <span class="tb-sep"></span>
      <!-- Compare -->
      <button
        class="tb-btn"
        class:tb-active={compareMode}
        onclick={() => { compareMode = !compareMode; }}
        title={compareMode ? i18n.t('exit_compare') : i18n.t('compare_before_after')}
        aria-label={i18n.t('btn_compare_toggle')}
        aria-pressed={compareMode}
        use:tooltip
      >⚖️</button>
      {#if compareMode}
        <button
          class="tb-btn"
          onclick={cycleCompareVariant}
          title="{i18n.t('compare_mode_cycle')}: {i18n.t(COMPARE_VARIANT_LABELS[compareVariant])}"
          aria-label={i18n.t('btn_compare_variant')}
          use:tooltip
        >{compareVariantIcon}</button>
      {/if}
      {#if !compareMode}
        <span class="tb-sep"></span>
        <!-- Zoom -->
        <button class="tb-btn" onclick={zp.zoomOut} title={i18n.t('zoom_out')} aria-label={i18n.t('btn_zoom_out')} use:tooltip>−</button>
        <div class="zoom-input-container">
          <input
            type="number"
            class="zoom-input"
            min="25"
            max="800"
            value={Math.round(zp.zoomLevel * 100)}
            onchange={(e) => {
              const val = parseInt(e.currentTarget.value);
              if (!isNaN(val)) {
                const clamped = Math.max(25, Math.min(800, val));
                zp.setZoom(clamped / 100);
              }
            }}
            title={i18n.t('set_zoom')}
          />
          <span class="zoom-percent">%</span>
        </div>
        <button class="tb-btn" onclick={zp.zoomIn} title={i18n.t('zoom_in')} aria-label={i18n.t('btn_zoom_in')} use:tooltip>+</button>
        <button class="tb-btn" onclick={zp.zoomToFit} title={i18n.t('fit_to_window')} aria-label={i18n.t('btn_fit_to_window')} use:tooltip>⊡</button>
        <span class="tb-sep"></span>
        <!-- View tools -->
        <button
          class="tb-btn"
          class:tb-active={zp.showGrid}
          onclick={() => { zp.showGrid = !zp.showGrid; }}
          title={zp.showGrid ? i18n.t('hide_pixel_grid') : i18n.t('show_pixel_grid')}
          aria-label={zp.showGrid ? i18n.t('hide_pixel_grid') : i18n.t('show_pixel_grid')}
          aria-pressed={zp.showGrid}
          use:tooltip>#</button>
        <button
          class="tb-btn"
          class:tb-active={tileMode}
          onclick={() => { tileMode = !tileMode; }}
          title={tileMode ? i18n.t('exit_tile') : i18n.t('tile_preview')}
          aria-label={tileMode ? i18n.t('exit_tile') : i18n.t('tile_preview')}
          aria-pressed={tileMode}
          use:tooltip>⊞</button>
        <button
          class="tb-btn"
          class:tb-active={eyedropperActive}
          onclick={() => { eyedropperActive = !eyedropperActive; eyedropperOverlay?.dismiss(); }}
          title={eyedropperActive ? i18n.t('exit_eyedropper') : i18n.t('eyedropper')}
          aria-label={eyedropperActive ? i18n.t('exit_eyedropper') : i18n.t('eyedropper')}
          aria-pressed={eyedropperActive}
          use:tooltip>💧</button>
      {/if}
    </div>
    <!-- Eyedropper Color Tooltip -->
    <EyedropperOverlay
      bind:this={eyedropperOverlay}
      bind:active={eyedropperActive}
      previewImg={zp.previewImg ?? null}
      {processedImageSrc}
      isPanning={zp.isPanning}
    />
    <!-- GIF Frame Controls -->
    {#if isGif && gifFrameCount > 1 && onGifPlay && onGifPause && onGifSeek && onGifExport}
      <GifControls
        currentFrame={gifCurrentFrame}
        frameCount={gifFrameCount}
        isPlaying={gifPlaying}
        isExporting={gifIsExporting}
        exportProgress={gifExportProgress}
        onPlay={onGifPlay}
        onPause={onGifPause}
        onSeek={onGifSeek}
        onExport={onGifExport}
        onCancelExport={onGifCancelExport}
        onExportSpritesheet={onGifExportSpritesheet}
      />
    {/if}
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
  /* ===== Preview Body ===== */
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

  /* ===== Preview Image ===== */
  .preview-image {
    max-width: 100%;
    max-height: 100%;
    width: 100%;
    height: 100%;
    object-fit: contain;
    transform-origin: center center;
  }

  /* ===== Status Bar (top-left) ===== */
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

  /* ===== Processing Overlay ===== */
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

  /* ===== Initial Processing ===== */
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

  /* ===== Toolbar (single row, bottom-center) ===== */
  .toolbar {
    position: absolute;
    bottom: 8px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 2px;
    z-index: 6;
    background: var(--w98-surface);
    padding: 2px 4px;
    box-shadow: var(--w98-outset);
  }
  .tb-btn {
    min-width: 24px;
    height: 24px;
    padding: 0 4px;
    font-size: var(--w98-font-size-action);
    font-weight: bold;
    font-family: inherit;
    background: var(--w98-surface);
    border: none;
    cursor: pointer;
    box-shadow: var(--w98-outset-thin);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .tb-btn:hover {
    background: var(--w98-surface-active);
  }
  .tb-btn:active {
    box-shadow: var(--w98-inset-thin);
  }
  .tb-active {
    background: var(--w98-highlight);
    color: #fff;
    box-shadow: var(--w98-inset-thin);
  }
  .tb-active:hover {
    background: color-mix(in srgb, var(--w98-highlight) 80%, #000);
  }
  .tb-sep {
    width: 1px;
    height: 18px;
    background: var(--w98-shadow-808);
    margin: 0 2px;
    flex-shrink: 0;
  }

  /* Zoom input */
  .zoom-input-container {
    display: flex;
    align-items: center;
    background: #fff;
    border: 1px inset var(--w98-shadow-light);
    height: 22px;
    padding: 0 2px 0 4px;
    flex-shrink: 0;
  }
  .zoom-input {
    width: 30px;
    height: 16px;
    border: none;
    font-family: 'Courier New', monospace;
    font-size: var(--w98-font-size-sm);
    text-align: right;
    outline: none;
    background: transparent;
    padding: 0;
  }
  .zoom-input::-webkit-outer-spin-button,
  .zoom-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .zoom-percent {
    font-size: var(--w98-font-size-sm);
    font-family: 'Courier New', monospace;
    color: #666;
    margin-left: 1px;
  }

  /* ===== Mobile ===== */
  @media (max-width: 550px) {
    .toolbar {
      bottom: 4px;
      left: 4px;
      right: 4px;
      transform: none;
      overflow-x: auto;
      flex-wrap: nowrap;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      padding: 3px 4px;
    }
    .toolbar::-webkit-scrollbar {
      display: none;
    }
    .tb-btn {
      min-width: 36px;
      height: 36px;
      font-size: var(--w98-font-size-icon);
    }
    .tb-sep {
      height: 24px;
    }
    .zoom-input-container {
      display: none;
    }
    .status-bar {
      top: 4px;
      left: 4px;
    }
    .status-item {
      font-size: var(--w98-font-size-caption);
      padding: 1px 4px;
    }
  }

  /* ===== Tile Preview ===== */
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

  /* ===== Pixel Grid Overlay ===== */
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
</style>
