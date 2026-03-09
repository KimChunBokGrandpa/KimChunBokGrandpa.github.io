<script lang="ts">
  import ImageDropZone from './ImageDropZone.svelte';
  import BeforeAfterSlider from './BeforeAfterSlider.svelte';
  import CrtDisplay from './CrtDisplay.svelte';
  import GifControls from './GifControls.svelte';
  import { getPaletteName } from '../utils/palettes';
  import { i18n } from '$lib/i18n/index.svelte';
  import type { createZoomPan } from '../stores/zoomPanStore.svelte';
  import type { ProcessingSettings } from '../types';

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
    // Color count
    colorCount = 0,
    // Tile mode
    tileMode = $bindable(false),
    // Post-process CSS filter
    postFilterCss = '',
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
    // Color count
    colorCount?: number;
    // Tile mode
    tileMode?: boolean;
    // Post-process CSS filter
    postFilterCss?: string;
  } = $props();

  let displayedWidth = $derived(zp.previewImg?.naturalWidth ?? 0);
  let displayedHeight = $derived(zp.previewImg?.naturalHeight ?? 0);

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
    return `width:${w}px;height:${h}px;` +
      `background-size:${cellSize}px ${cellSize}px;` +
      `transform:translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px));`;
  });
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="preview-body"
  class:panning={zp.isPanning}
  bind:this={zp.previewContainer}
  onwheel={zp.handleWheel}
  onmousedown={zp.handleMouseDown}
  onmousemove={zp.handleMouseMove}
  onmouseup={zp.handleMouseUp}
  onmouseleave={zp.handleMouseUp}
  ontouchstart={zp.handleTouchStart}
  ontouchmove={zp.handleTouchMove}
  ontouchend={zp.handleTouchEnd}
  role="img"
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
          style:image-rendering={processingSettings.renderMode === 'bilinear' ? 'auto' : 'pixelated'}
          style:filter={postFilterCss || 'none'}
        ></div>
        <span class="tile-label">{i18n.t('tile_label')}</span>
      </div>
    {:else if compareMode && originalImageSrc}
      <BeforeAfterSlider
        originalSrc={originalImageSrc}
        processedSrc={processedImageSrc}
        imageRendering={processingSettings.renderMode === 'bilinear' ? 'auto' : 'pixelated'}
        altText="Before/After: {getPaletteName(processingSettings.palette)}"
      />
    {:else}
      <CrtDisplay active={processingSettings.crtEffect}>
        {#snippet children()}
          <img
            bind:this={zp.previewImg}
            src={processedImageSrc}
            alt="Pixel Art - {getPaletteName(processingSettings.palette)}"
            class="preview-image"
            style:image-rendering={processingSettings.renderMode === 'bilinear' ? 'auto' : 'pixelated'}
            style:filter={postFilterCss || 'none'}
            style:transform="scale({zp.zoomLevel}) translate({zp.panX / zp.zoomLevel}px, {zp.panY / zp.zoomLevel}px)"
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
    {#if isProcessing}
      <div class="processing-overlay">
        <div class="processing-indicator">
          <div class="progress-container">
            <div class="progress-bar"></div>
          </div>
          <span class="processing-text">{i18n.t('rendering')}</span>
          <span class="processing-palette">🎨 {getPaletteName(processingSettings.palette)}</span>
        </div>
      </div>
    {/if}
    <!-- Zoom Controls -->
    <div class="zoom-controls">
      <button class="zoom-btn" onclick={(e) => { e.stopPropagation(); onOpenSettings(); }} title="Open Settings">⚙️</button>
      <div class="zoom-sep"></div>
      <button
        class="zoom-btn"
        class:compare-active={compareMode}
        onclick={() => { compareMode = !compareMode; }}
        title={compareMode ? 'Exit Compare Mode' : 'Compare Before/After'}
      >{compareMode ? '🔀' : '⚖️'}</button>
      <div class="zoom-sep"></div>
      {#if !compareMode}
        {#if displayedWidth > 0 && displayedHeight > 0}
          <div class="zoom-info" title="Image Resolution">{displayedWidth}×{displayedHeight}</div>
          {#if colorCount > 0}
            <div class="zoom-info color-count" title="Unique Colors">{colorCount}c</div>
          {/if}
          <div class="zoom-sep"></div>
        {/if}
        <button class="zoom-btn" onclick={zp.zoomIn} title="Zoom In">+</button>
        <div class="zoom-input-container">
          <input
            type="number"
            class="zoom-input"
            min="25" max="800"
            value={Math.round(zp.zoomLevel * 100)}
            onchange={(e) => {
              const val = parseInt(e.currentTarget.value);
              if (!isNaN(val)) zp.setZoom(val / 100);
            }}
            title="Set Zoom %"
          />
          <span class="zoom-percent">%</span>
        </div>
        <button class="zoom-btn" onclick={zp.zoomOut} title="Zoom Out">−</button>
        <button class="zoom-btn" onclick={zp.zoomToFit} title="Fit to Window">⊡</button>
        <div class="zoom-sep"></div>
        <button
          class="zoom-btn"
          class:grid-active={zp.showGrid}
          onclick={() => { zp.showGrid = !zp.showGrid; }}
          title={zp.showGrid ? 'Hide Pixel Grid' : 'Show Pixel Grid (zoom ≥2x, pixelSize>1)'}
        >#</button>
        <button
          class="zoom-btn"
          class:grid-active={tileMode}
          onclick={() => { tileMode = !tileMode; }}
          title={tileMode ? 'Exit Tile Preview' : 'Tile Preview (seamless pattern check)'}
        >⊞</button>
      {/if}
    </div>
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
      />
    {/if}
  {:else if originalImageSrc}
    <div class="initial-processing">
      <div class="processing-indicator">
        <span class="initial-spinner">⏳</span>
        <div class="progress-container progress-wide">
          <div class="progress-bar"></div>
        </div>
        <span class="processing-text">Processing image...</span>
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
    top: 50%; left: 50%;
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
  }
  .progress-wide {
    width: 200px;
  }

  /* ===== Processing Overlay ===== */
  .processing-overlay {
    position: absolute;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 128, 0.9);
    border: 2px outset #dfdfdf;
    padding: 6px 12px;
    z-index: 5;
    pointer-events: none;
  }
  .processing-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    color: #fff;
    font-size: 11px;
    font-family: 'Courier New', Courier, monospace;
    font-weight: bold;
    text-shadow: 1px 1px 0 #000;
  }
  .progress-container {
    width: 120px;
    height: 12px;
    background: #000;
    border: 2px inset #dfdfdf;
    position: relative;
    overflow: hidden;
  }
  .progress-bar {
    position: absolute;
    top: 0; left: 0; bottom: 0;
    background: repeating-linear-gradient(
      90deg,
      #000080 0px, #000080 8px,
      transparent 8px, transparent 10px
    );
    animation: progressSlide 1.5s linear infinite;
    width: 200%;
  }

  @keyframes progressSlide {
    from { transform: translateX(-50%); }
    to { transform: translateX(0); }
  }

  /* ===== Zoom Controls ===== */
  .zoom-controls {
    position: absolute;
    bottom: 6px;
    right: 6px;
    display: flex;
    gap: 2px;
    z-index: 6;
  }
  .zoom-btn {
    min-width: 22px;
    height: 20px;
    padding: 0 4px;
    font-size: 11px;
    font-weight: bold;
    font-family: inherit;
    background: #c0c0c0;
    border: none;
    cursor: pointer;
    box-shadow: inset 1px 1px #fff, inset -1px -1px #0a0a0a;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .zoom-btn:active {
    box-shadow: inset -1px -1px #fff, inset 1px 1px #0a0a0a;
    padding: 1px 3px -1px 5px;
  }
  .zoom-info {
    font-size: 11px;
    font-family: 'Courier New', Courier, monospace;
    font-weight: bold;
    color: #fff;
    display: flex;
    align-items: center;
    padding: 0 4px;
    background: #000;
    border: 1px inset #dfdfdf;
  }
  .zoom-input-container {
    display: flex;
    align-items: center;
    background: #fff;
    border: 2px inset #dfdfdf;
    height: 20px;
    padding: 0 2px 0 4px;
  }
  .zoom-input {
    width: 32px;
    height: 14px;
    border: none;
    font-family: inherit;
    font-size: 11px;
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
    font-size: 11px;
    font-family: inherit;
    color: #000;
    margin-left: 1px;
  }
  .zoom-sep {
    width: 4px;
  }
  .compare-active, .grid-active {
    background: #000080;
    color: #fff;
    box-shadow: inset -1px -1px #fff, inset 1px 1px #0a0a0a;
  }

  /* ===== Color Count ===== */
  .color-count {
    background: #000080;
    color: #0f0;
    border-color: #000080;
    font-size: 10px;
    margin-left: 2px;
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
    font-size: 9px;
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
    background-image:
      linear-gradient(to right, rgba(255,255,255,0.3) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255,255,255,0.3) 1px, transparent 1px);
    background-position: 0 0;
  }
</style>
