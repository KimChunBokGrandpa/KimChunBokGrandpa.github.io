<script lang="ts">
  import BeforeAfterSlider from '../media/BeforeAfterSlider.svelte';
  import { i18n } from '$lib/i18n/index.svelte';

  export type CompareVariant = 'slider' | 'side-by-side' | 'onion';

  let {
    originalSrc,
    processedSrc,
    renderMode = 'pixelated',
    paletteName = '',
    postFilterCss = '',
    variant = 'slider',
  }: {
    originalSrc: string;
    processedSrc: string;
    renderMode?: string;
    paletteName?: string;
    postFilterCss?: string;
    variant?: CompareVariant;
  } = $props();

  let onionOpacity = $state(0.5);

  let imageRendering = $derived(renderMode === 'bilinear' ? 'auto' : 'pixelated');
</script>

{#if variant === 'slider'}
  <BeforeAfterSlider
    {originalSrc}
    {processedSrc}
    {imageRendering}
    altText="Before/After: {paletteName}"
  />
{:else if variant === 'side-by-side'}
  <div class="side-by-side">
    <div class="sbs-panel">
      <img src={originalSrc} alt={i18n.t('before')} class="sbs-img" style:image-rendering="auto" draggable="false" />
      <span class="sbs-label">{i18n.t('before')}</span>
    </div>
    <div class="sbs-divider"></div>
    <div class="sbs-panel">
      <img src={processedSrc} alt={i18n.t('after')} class="sbs-img" style:image-rendering={imageRendering} style:filter={postFilterCss || 'none'} draggable="false" />
      <span class="sbs-label">{i18n.t('after')}</span>
    </div>
  </div>
{:else}
  <div class="onion-skin">
    <img src={originalSrc} alt={i18n.t('before')} class="onion-img onion-base" style:image-rendering="auto" draggable="false" />
    <img src={processedSrc} alt={i18n.t('after')} class="onion-img onion-overlay" style:opacity={onionOpacity} style:image-rendering={imageRendering} style:filter={postFilterCss || 'none'} draggable="false" />
    <div class="onion-controls">
      <span class="onion-label">{i18n.t('onion_opacity')}</span>
      <input type="range" min="0" max="1" step="0.05" bind:value={onionOpacity} class="onion-slider" />
      <span class="onion-value">{Math.round(onionOpacity * 100)}%</span>
    </div>
  </div>
{/if}

<style>
  /* ===== Side-by-Side Compare ===== */
  .side-by-side {
    display: flex;
    width: 100%;
    height: 100%;
    background: #000;
  }
  .sbs-panel {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    overflow: hidden;
  }
  .sbs-img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
  .sbs-divider {
    width: 2px;
    background: #fff;
    flex-shrink: 0;
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
  }
  .sbs-label {
    position: absolute;
    top: 8px;
    left: 8px;
    font-size: var(--w98-font-size-caption);
    font-weight: bold;
    padding: 2px 6px;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    letter-spacing: 1px;
    pointer-events: none;
    z-index: 4;
  }

  /* ===== Onion Skin Compare ===== */
  .onion-skin {
    position: relative;
    width: 100%;
    height: 100%;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .onion-img {
    position: absolute;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
  .onion-base {
    z-index: 1;
  }
  .onion-overlay {
    z-index: 2;
  }
  .onion-controls {
    position: absolute;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(0, 0, 0, 0.7);
    border: 1px solid var(--w98-shadow-808);
    padding: 4px 10px;
    z-index: 5;
  }
  .onion-label {
    font-size: var(--w98-font-size-sm);
    color: #fff;
    font-weight: bold;
    white-space: nowrap;
  }
  .onion-slider {
    width: 100px;
    accent-color: var(--w98-highlight);
  }
  .onion-value {
    font-size: var(--w98-font-size-sm);
    color: #0f0;
    font-family: 'Courier New', monospace;
    font-weight: bold;
    min-width: 32px;
    text-align: right;
  }

  /* ===== Compare Variant Button ===== */
</style>
