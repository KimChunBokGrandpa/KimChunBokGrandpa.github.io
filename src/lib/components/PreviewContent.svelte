<script lang="ts">
  import ImageDropZone from './ImageDropZone.svelte';
  import BeforeAfterSlider from './BeforeAfterSlider.svelte';
  import CrtDisplay from './CrtDisplay.svelte';
  import { getPaletteName } from '../utils/palettes';
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
  }: {
    zp: any;
    originalImageSrc: string | null;
    processedImageSrc: string | null;
    isProcessing: boolean;
    processingSettings: ProcessingSettings;
    compareMode: boolean;
    onImageSelected: (file: File) => void;
    onError: (msg: string) => void;
    onOpenSettings: () => void;
  } = $props();

  let displayedWidth = $derived(zp.previewImg?.naturalWidth ?? 0);
  let displayedHeight = $derived(zp.previewImg?.naturalHeight ?? 0);
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
  aria-label="Image preview"
>
  {#if !originalImageSrc}
    <ImageDropZone {onImageSelected} {onError} />
  {:else if processedImageSrc}
    {#if compareMode && originalImageSrc}
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
            style:transform="scale({zp.zoomLevel}) translate({zp.panX / zp.zoomLevel}px, {zp.panY / zp.zoomLevel}px)"
            style:transition={zp.isPanning || zp.isTouchPanning ? 'none' : 'transform 0.1s ease'}
            draggable="false"
          />
        {/snippet}
      </CrtDisplay>
    {/if}
    {#if isProcessing}
      <div class="processing-overlay">
        <div class="processing-indicator">
          <div class="progress-container">
            <div class="progress-bar"></div>
          </div>
          <span class="processing-text">Rendering...</span>
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
      {/if}
    </div>
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
  .compare-active {
    background: #000080;
    color: #fff;
    box-shadow: inset -1px -1px #fff, inset 1px 1px #0a0a0a;
  }
</style>
