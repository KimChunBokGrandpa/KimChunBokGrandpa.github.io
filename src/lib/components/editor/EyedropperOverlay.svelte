<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';

  let {
    active = $bindable(false),
    previewImg,
    processedImageSrc,
    isPanning = false,
  }: {
    active: boolean;
    previewImg: HTMLImageElement | null;
    processedImageSrc: string | null;
    isPanning?: boolean;
  } = $props();

  let pickedColor = $state<{ r: number; g: number; b: number; hex: string } | null>(null);
  let pickedColorPos = $state<{ x: number; y: number }>({ x: 0, y: 0 });
  let colorCopied = $state(false);
  let colorCopiedTimer: ReturnType<typeof setTimeout> | null = null;
  let eyedropperCanvas: HTMLCanvasElement | null = null;
  let eyedropperCtx: CanvasRenderingContext2D | null = null;
  let eyedropperCachedSrc: string | null = null;

  /** Called by parent on preview click to pick a color */
  export function pick(e: MouseEvent) {
    if (!active || !previewImg || !processedImageSrc) return;
    if (isPanning) return;

    const img = previewImg;
    const rect = img.getBoundingClientRect();
    const scale = Math.min(rect.width / img.naturalWidth, rect.height / img.naturalHeight);
    const renderedW = img.naturalWidth * scale;
    const renderedH = img.naturalHeight * scale;
    const offsetX = (rect.width - renderedW) / 2;
    const offsetY = (rect.height - renderedH) / 2;

    const imgX = Math.floor((e.clientX - rect.left - offsetX) / scale);
    const imgY = Math.floor((e.clientY - rect.top - offsetY) / scale);

    if (imgX < 0 || imgY < 0 || imgX >= img.naturalWidth || imgY >= img.naturalHeight) return;

    // Read pixel from a cached canvas (reuse across clicks for same image)
    if (!eyedropperCanvas || eyedropperCachedSrc !== processedImageSrc) {
      eyedropperCanvas = document.createElement('canvas');
      eyedropperCanvas.width = img.naturalWidth;
      eyedropperCanvas.height = img.naturalHeight;
      eyedropperCtx = eyedropperCanvas.getContext('2d')!;
      eyedropperCtx.drawImage(img, 0, 0);
      eyedropperCachedSrc = processedImageSrc;
    }
    const pixel = eyedropperCtx!.getImageData(imgX, imgY, 1, 1).data;

    const r = pixel[0],
      g = pixel[1],
      b = pixel[2];
    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    pickedColor = { r, g, b, hex };
    pickedColorPos = { x: e.clientX, y: e.clientY };
  }

  /** Dismiss the color tooltip */
  export function dismiss() {
    pickedColor = null;
  }

  function copyColor() {
    if (pickedColor) {
      navigator.clipboard.writeText(pickedColor.hex).then(() => {
        colorCopied = true;
        if (colorCopiedTimer) clearTimeout(colorCopiedTimer);
        colorCopiedTimer = setTimeout(() => { colorCopied = false; }, 1500);
      }).catch((err) => {
        console.warn('Clipboard write failed:', err);
      });
    }
  }

  function dismissColor() {
    pickedColor = null;
  }
</script>

{#if pickedColor}
  <div class="color-tooltip" style="left:{pickedColorPos.x}px;top:{pickedColorPos.y}px;">
    <div class="color-swatch" style="background:{pickedColor.hex};"></div>
    <div class="color-info">
      <span class="color-hex">{pickedColor.hex.toUpperCase()}</span>
      <span class="color-rgb">RGB({pickedColor.r}, {pickedColor.g}, {pickedColor.b})</span>
    </div>
    <div class="color-actions">
      <button class="color-action-btn" onclick={copyColor} title={i18n.t('copy_color')} aria-label={i18n.t('btn_copy_color')}
        >{colorCopied ? '✅' : '📋'}</button
      >
      <button class="color-action-btn" onclick={dismissColor} aria-label={i18n.t('btn_dismiss_color')}>✕</button>
    </div>
  </div>
{/if}

<style>
  .color-tooltip {
    position: fixed;
    z-index: 100;
    transform: translate(8px, -100%);
    background: var(--w98-surface);
    border: 2px solid;
    border-color: var(--w98-shadow-light) var(--w98-shadow-808) var(--w98-shadow-808) var(--w98-shadow-light);
    padding: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
    box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    pointer-events: auto;
  }
  .color-swatch {
    width: 24px;
    height: 24px;
    border: 1px solid #000;
    flex-shrink: 0;
  }
  .color-info {
    display: flex;
    flex-direction: column;
    font-size: var(--w98-font-size-sm);
    font-family: 'Courier New', monospace;
    font-weight: bold;
  }
  .color-hex {
    color: var(--w98-highlight);
  }
  .color-rgb {
    color: #444;
  }
  .color-actions {
    display: flex;
    gap: 2px;
  }
  .color-action-btn {
    min-width: 20px;
    height: 20px;
    padding: 0 3px;
    font-size: var(--w98-font-size-base);
    background: var(--w98-surface);
    border: none;
    cursor: pointer;
    box-shadow: var(--w98-outset-thin);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .color-action-btn:active {
    box-shadow: var(--w98-inset-thin);
  }
</style>
