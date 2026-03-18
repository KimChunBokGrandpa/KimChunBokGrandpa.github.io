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
  onwheel={zp.handleWheel}
  onmousedown={zp.handleMouseDown}
  onmousemove={zp.handleMouseMove}
  onmouseup={zp.handleMouseUp}
  onmouseleave={zp.handleMouseUp}
  ontouchstart={zp.handleTouchStart}
  ontouchmove={zp.handleTouchMove}
  ontouchend={zp.handleTouchEnd}
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
            style:transition={zp.isPanning || zp.isTouchPanning ? 'none' : 'transform 0.1s ease'}
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
    {#if isProcessing}
      <div class="processing-overlay">
        <div class="processing-indicator">
          <div class="progress-container">
            <div class="progress-bar"></div>
          </div>
          <span class="processing-text">{i18n.t('applying_settings')}</span>
          <span class="processing-palette">🎨 {getPaletteName(processingSettings.palette)}</span>
        </div>
      </div>
    {/if}
    <!-- Toolbar: grouped and labeled for clarity -->
    <div class="toolbar-container">
      <!-- Row 1: Settings + Transform + Compare + Info -->
      <div class="toolbar-row toolbar-top">
        <div class="toolbar-group">
          <button
            class="zoom-btn"
            onclick={(e) => { e.stopPropagation(); onOpenSettings(); }}
            title={i18n.t('open_settings')}
            aria-label={i18n.t('btn_open_settings')}
            use:tooltip>⚙️</button>
        </div>
        <div class="toolbar-group" aria-label={i18n.t('toolbar_transform')}>
          <span class="toolbar-group-label">{i18n.t('toolbar_transform')}</span>
          <div class="toolbar-group-buttons">
            <button class="zoom-btn" onclick={() => onRotate?.(-90)} title={i18n.t('rotate_left')} aria-label={i18n.t('btn_rotate_left')} use:tooltip>↺</button>
            <button class="zoom-btn" onclick={() => onRotate?.(90)} title={i18n.t('rotate_right')} aria-label={i18n.t('btn_rotate_right')} use:tooltip>↻</button>
            <button
              class="zoom-btn"
              class:grid-active={cropModeActive}
              onclick={() => { cropModeActive = !cropModeActive; if (cropModeActive) { eyedropperActive = false; eyedropperOverlay?.dismiss(); } }}
              title={cropModeActive ? i18n.t('crop_active') : i18n.t('crop')}
              aria-label={cropModeActive ? i18n.t('crop_active') : i18n.t('crop')}
              aria-pressed={cropModeActive}
              use:tooltip>✂</button>
            {#if currentRotation !== 0 || hasCrop}
              <button
                class="zoom-btn"
                onclick={() => { onResetTransform?.(); cropModeActive = false; }}
                title={i18n.t('reset_transform')}
                aria-label={i18n.t('btn_reset_transform')}
                use:tooltip>⟲</button>
            {/if}
          </div>
        </div>
        <div class="toolbar-group">
          <button
            class="zoom-btn"
            class:compare-active={compareMode}
            onclick={() => { compareMode = !compareMode; }}
            title={compareMode ? i18n.t('exit_compare') : i18n.t('compare_before_after')}
            aria-label={i18n.t('btn_compare_toggle')}
            aria-pressed={compareMode}
            use:tooltip
          >{compareMode ? '🔀' : '⚖️'}</button>
          {#if compareMode}
            <button
              class="zoom-btn compare-variant-btn"
              onclick={cycleCompareVariant}
              title="{i18n.t('compare_mode_cycle')}: {i18n.t(COMPARE_VARIANT_LABELS[compareVariant])}"
              aria-label={i18n.t('btn_compare_variant')}
              use:tooltip
            >{compareVariantIcon}</button>
          {/if}
        </div>
        {#if !compareMode && displayedWidth > 0 && displayedHeight > 0}
          <div class="toolbar-group toolbar-info">
            <div class="zoom-info" title={i18n.t('image_resolution')} use:tooltip>{displayedWidth}×{displayedHeight}</div>
            {#if colorCount > 0}
              <div class="zoom-info color-count" title={i18n.t('unique_colors')} use:tooltip>🎨 {colorCount}</div>
            {/if}
          </div>
        {/if}
      </div>
      <!-- Row 2: Zoom + View tools (only in normal mode) -->
      {#if !compareMode}
        <div class="toolbar-row toolbar-bottom">
          <div class="toolbar-group" aria-label={i18n.t('toolbar_zoom')}>
            <span class="toolbar-group-label">{i18n.t('toolbar_zoom')}</span>
            <div class="toolbar-group-buttons">
              <button class="zoom-btn" onclick={zp.zoomIn} title={i18n.t('zoom_in')} aria-label={i18n.t('btn_zoom_in')} use:tooltip>+</button>
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
              <button class="zoom-btn" onclick={zp.zoomOut} title={i18n.t('zoom_out')} aria-label={i18n.t('btn_zoom_out')} use:tooltip>−</button>
              <button class="zoom-btn" onclick={zp.zoomToFit} title={i18n.t('fit_to_window')} aria-label={i18n.t('btn_fit_to_window')} use:tooltip>⊡</button>
            </div>
          </div>
          <div class="toolbar-group" aria-label={i18n.t('toolbar_view')}>
            <span class="toolbar-group-label">{i18n.t('toolbar_view')}</span>
            <div class="toolbar-group-buttons">
              <button
                class="zoom-btn"
                class:grid-active={zp.showGrid}
                onclick={() => { zp.showGrid = !zp.showGrid; }}
                title={zp.showGrid ? i18n.t('hide_pixel_grid') : i18n.t('show_pixel_grid')}
                aria-label={zp.showGrid ? i18n.t('hide_pixel_grid') : i18n.t('show_pixel_grid')}
                aria-pressed={zp.showGrid}
                use:tooltip>#</button>
              <button
                class="zoom-btn"
                class:grid-active={tileMode}
                onclick={() => { tileMode = !tileMode; }}
                title={tileMode ? i18n.t('exit_tile') : i18n.t('tile_preview')}
                aria-label={tileMode ? i18n.t('exit_tile') : i18n.t('tile_preview')}
                aria-pressed={tileMode}
                use:tooltip>⊞</button>
              <button
                class="zoom-btn"
                class:grid-active={eyedropperActive}
                onclick={() => { eyedropperActive = !eyedropperActive; eyedropperOverlay?.dismiss(); }}
                title={eyedropperActive ? i18n.t('exit_eyedropper') : i18n.t('eyedropper')}
                aria-label={eyedropperActive ? i18n.t('exit_eyedropper') : i18n.t('eyedropper')}
                aria-pressed={eyedropperActive}
                use:tooltip>💧</button>
            </div>
          </div>
        </div>
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
        <span class="initial-spinner">⏳</span>
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
    background-color: #000;
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

  /* ===== Initial Processing ===== */
  .initial-processing {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #0f0;
    font-family: 'Courier New', Courier, monospace;
    font-size: 14px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .initial-spinner {
    font-size: 24px;
    margin-bottom: 8px;
    display: inline-block;
    animation: spin-pulse 1.2s ease-in-out infinite;
  }
  @keyframes spin-pulse {
    0% { transform: rotate(0deg) scale(1); }
    50% { transform: rotate(180deg) scale(1.15); }
    100% { transform: rotate(360deg) scale(1); }
  }
  .progress-wide {
    width: 200px;
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
    gap: 4px;
    background: rgba(0, 0, 128, 0.9);
    border: 2px outset var(--w98-shadow-light);
    padding: 8px 16px;
    color: #fff;
    font-size: var(--w98-font-size-base);
    font-family: 'Courier New', Courier, monospace;
    font-weight: bold;
    text-shadow: 1px 1px 0 #000;
  }
  .progress-container {
    width: 120px;
    height: 12px;
    background: #000;
    border: 2px inset var(--w98-shadow-light);
    position: relative;
    overflow: hidden;
  }
  .progress-bar {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    background: repeating-linear-gradient(
      90deg,
      var(--w98-highlight) 0px,
      var(--w98-highlight) 8px,
      transparent 8px,
      transparent 10px
    );
    animation: progressSlide 1.5s linear infinite;
    width: 200%;
  }

  @keyframes progressSlide {
    from {
      transform: translateX(-50%);
    }
    to {
      transform: translateX(0);
    }
  }

  /* ===== Toolbar Container ===== */
  .toolbar-container {
    position: absolute;
    bottom: 6px;
    right: 6px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    z-index: 6;
    align-items: flex-end;
  }
  .toolbar-row {
    display: flex;
    gap: 2px;
    align-items: center;
  }
  .toolbar-group {
    display: flex;
    gap: 1px;
    align-items: center;
    background: rgba(192, 192, 192, 0.6);
    border-radius: var(--w98-radius-sm);
    padding: 1px;
  }
  .toolbar-group + .toolbar-group {
    margin-left: 3px;
  }
  .toolbar-group-label {
    font-size: var(--w98-font-size-micro);
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 0 3px;
    opacity: 0.7;
    font-weight: bold;
    white-space: nowrap;
  }
  .toolbar-group-buttons {
    display: flex;
    gap: 1px;
    align-items: center;
  }
  .toolbar-info {
    background: transparent;
  }
  .zoom-btn {
    min-width: 22px;
    height: 20px;
    padding: 0 4px;
    font-size: var(--w98-font-size-base);
    font-weight: bold;
    font-family: inherit;
    background: var(--w98-surface);
    border: none;
    cursor: pointer;
    box-shadow: var(--w98-outset-thin);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .zoom-btn:active {
    box-shadow: var(--w98-inset-thin);
    padding: 1px 3px -1px 5px;
  }
  .zoom-info {
    font-size: var(--w98-font-size-base);
    font-family: 'Courier New', Courier, monospace;
    font-weight: bold;
    color: #fff;
    display: flex;
    align-items: center;
    padding: 0 4px;
    background: #000;
    border: 1px inset var(--w98-shadow-light);
  }
  .zoom-input-container {
    display: flex;
    align-items: center;
    background: #fff;
    border: 2px inset var(--w98-shadow-light);
    height: 20px;
    padding: 0 2px 0 4px;
  }
  .zoom-input {
    width: 32px;
    height: 14px;
    border: none;
    font-family: inherit;
    font-size: var(--w98-font-size-base);
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
    font-size: var(--w98-font-size-base);
    font-family: inherit;
    color: #000;
    margin-left: 1px;
  }
  .compare-active,
  .grid-active {
    background: var(--w98-highlight);
    color: #fff;
    box-shadow: var(--w98-inset-thin);
  }

  /* ===== Color Count ===== */
  .color-count {
    background: var(--w98-highlight);
    color: #0f0;
    border-color: var(--w98-highlight);
    font-size: var(--w98-font-size-sm);
    margin-left: 2px;
  }

  /* ===== Compare Variant Button ===== */
  .compare-variant-btn {
    font-size: var(--w98-font-size-caption) !important;
  }

  @media (max-width: 550px) {
    .toolbar-container {
      bottom: 2px;
      left: 2px;
      right: 2px;
      gap: 1px;
      align-items: stretch;
    }
    .toolbar-row {
      overflow-x: auto;
      flex-wrap: nowrap;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }
    .toolbar-row::-webkit-scrollbar {
      display: none;
    }
    .toolbar-group {
      padding: 0;
      flex-shrink: 0;
    }
    .toolbar-group-label {
      display: none;
    }
    .zoom-btn {
      min-width: 32px;
      height: 32px;
      padding: 0 4px;
      font-size: var(--w98-font-size-base);
    }
    .zoom-input-container {
      display: none;
    }
    .zoom-info {
      font-size: var(--w98-font-size-sm);
      height: 32px;
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
    background: rgba(0, 0, 128, 0.8);
    color: #fff;
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
