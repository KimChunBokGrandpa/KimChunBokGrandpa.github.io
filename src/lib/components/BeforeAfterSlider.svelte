<script lang="ts">
  /**
   * Before/After Slider — Compares original vs processed image
   * with a draggable divider. Supports mouse, touch, and keyboard.
   */
  import { i18n } from '$lib/i18n/index.svelte';

  let {
    originalSrc,
    processedSrc,
    imageRendering = 'pixelated' as string,
    altText = 'Before/After comparison',
  }: {
    originalSrc: string;
    processedSrc: string;
    imageRendering?: string;
    altText?: string;
  } = $props();

  let sliderPosition = $state(50); // 0–100 percentage
  let isDragging = $state(false);
  let containerEl: HTMLDivElement | undefined = $state();

  function updatePosition(clientX: number) {
    if (!containerEl) return;
    const rect = containerEl.getBoundingClientRect();
    const x = clientX - rect.left;
    sliderPosition = Math.max(0, Math.min(100, (x / rect.width) * 100));
  }

  function handleMouseDown(e: MouseEvent) {
    if (e.button !== 0) return;
    isDragging = true;
    updatePosition(e.clientX);
    e.preventDefault();
  }

  function handleTouchStart(e: TouchEvent) {
    if (e.touches.length !== 1) return;
    isDragging = true;
    updatePosition(e.touches[0].clientX);
  }

  $effect(() => {
    if (!isDragging) return;
    const onMouseMove = (e: MouseEvent) => updatePosition(e.clientX);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) updatePosition(e.touches[0].clientX);
    };
    const onEnd = () => { isDragging = false; };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onEnd);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onEnd);
    };
  });

  // Track container width for correct before-image sizing
  let containerWidth = $state(0);
  $effect(() => {
    if (!containerEl) return;
    const ro = new ResizeObserver(([entry]) => {
      containerWidth = entry.contentRect.width;
    });
    ro.observe(containerEl);
    return () => ro.disconnect();
  });

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft') {
      sliderPosition = Math.max(0, sliderPosition - 2);
      e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      sliderPosition = Math.min(100, sliderPosition + 2);
      e.preventDefault();
    } else if (e.key === 'Home') {
      sliderPosition = 0;
      e.preventDefault();
    } else if (e.key === 'End') {
      sliderPosition = 100;
      e.preventDefault();
    }
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="ba-container"
  bind:this={containerEl}
  onmousedown={handleMouseDown}
  ontouchstart={handleTouchStart}
  role="slider"
  aria-label={altText}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuenow={Math.round(sliderPosition)}
  tabindex="0"
  onkeydown={handleKeydown}
>
  <!-- After (processed) — full background -->
  <img
    src={processedSrc}
    alt="After"
    class="ba-img ba-after"
    style:image-rendering={imageRendering}
    draggable="false"
  />

  <!-- Before (original) — clipped -->
  <div class="ba-before" style:width="{sliderPosition}%">
    <img
      src={originalSrc}
      alt="Before"
      class="ba-img ba-before-img"
      style:image-rendering="auto"
      style:width="{containerWidth}px"
      draggable="false"
    />
  </div>

  <!-- Divider line -->
  <div class="ba-divider" style:left="{sliderPosition}%">
    <div class="ba-handle" class:dragging={isDragging}>
      <span class="ba-arrow">◀</span>
      <span class="ba-arrow">▶</span>
    </div>
  </div>

  <!-- Labels -->
  <span class="ba-label ba-label-before">{i18n.t('before')}</span>
  <span class="ba-label ba-label-after">{i18n.t('after')}</span>
</div>

<style>
  .ba-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    cursor: ew-resize;
    user-select: none;
    touch-action: none;
    background: #000;
  }

  .ba-img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
  }

  .ba-after {
    position: absolute;
    inset: 0;
  }

  .ba-before {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    overflow: hidden;
    z-index: 2;
  }

  .ba-before .ba-before-img {
    min-width: 0;
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
  }

  .ba-divider {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 3px;
    margin-left: -1.5px;
    background: #fff;
    z-index: 3;
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.6);
  }

  .ba-handle {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #c0c0c0;
    border: 2px solid;
    border-color: #dfdfdf #808080 #808080 #dfdfdf;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1px;
    box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.5);
    transition: transform 0.1s;
  }

  .ba-handle.dragging {
    transform: translate(-50%, -50%) scale(1.15);
    background: #d0d8e0;
  }

  .ba-arrow {
    font-size: 8px;
    color: #000;
    line-height: 1;
  }

  /* Labels */
  .ba-label {
    position: absolute;
    top: 8px;
    z-index: 4;
    font-size: 9px;
    font-weight: bold;
    padding: 2px 6px;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    letter-spacing: 1px;
    pointer-events: none;
  }
  .ba-label-before { left: 8px; }
  .ba-label-after { right: 8px; }

  .ba-container:focus-visible {
    outline: 2px solid #000080;
    outline-offset: -2px;
  }
</style>
