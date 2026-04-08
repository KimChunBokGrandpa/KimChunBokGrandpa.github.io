<script lang="ts">
  import EyedropperOverlay from './EyedropperOverlay.svelte';
  import PreviewBottomBar from './PreviewBottomBar.svelte';
  import ImageCanvas from './ImageCanvas.svelte';
  import GifControls from '../media/GifControls.svelte';
  import type { CompareVariant } from './CompareView.svelte';
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
    processingProgress = 0,
    processingStartTime = 0,
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
    onGifExportSequence,
    onGifExportApng,
    onGifExportAnimatedWebp,
    onGifDeleteFrame,
    onGifDuplicateFrame,
    onGifReorderFrame,
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
    processingProgress?: number;
    processingStartTime?: number;
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
    onGifExportSequence?: () => void;
    onGifExportApng?: () => void;
    onGifExportAnimatedWebp?: () => void;
    onGifDeleteFrame?: (frame: number) => void;
    onGifDuplicateFrame?: (frame: number) => void;
    onGifReorderFrame?: (from: number, to: number) => void;
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

  // ─── Crop Mode ───
  let cropModeActive = $state(false);

  // ─── Eyedropper ───
  let eyedropperActive = $state(false);
  let eyedropperOverlay = $state<EyedropperOverlay>();

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
</script>

<ImageCanvas
  {zp}
  {originalImageSrc}
  {processedImageSrc}
  {isProcessing}
  {processingProgress}
  {processingStartTime}
  {processingSettings}
  {compareMode}
  {compareVariant}
  {tileMode}
  bind:cropModeActive
  bind:eyedropperActive
  {eyedropperOverlay}
  {postFilterCss}
  {colorCount}
  {onImageSelected}
  {onError}
  {onCrop}
>
  {#snippet children()}
    <PreviewBottomBar
      {zp}
      bind:compareMode
      {compareVariant}
      {compareVariantIcon}
      bind:cropModeActive
      bind:tileMode
      bind:eyedropperActive
      {eyedropperOverlay}
      {hasCrop}
      {currentRotation}
      {onRotate}
      {onResetTransform}
      {cycleCompareVariant}
      {onOpenSettings}
    />
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
        onExportSequence={onGifExportSequence}
        onExportApng={onGifExportApng}
        onExportAnimatedWebp={onGifExportAnimatedWebp}
        onDeleteFrame={onGifDeleteFrame}
        onDuplicateFrame={onGifDuplicateFrame}
        onReorderFrame={onGifReorderFrame}
      />
    {/if}
  {/snippet}
</ImageCanvas>

