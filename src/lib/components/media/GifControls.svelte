<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
  import { tooltip } from '$lib/utils/tooltip';

  let {
    currentFrame,
    frameCount,
    isPlaying,
    isExporting,
    exportProgress,
    onPlay,
    onPause,
    onSeek,
    onExport,
    onCancelExport,
    onExportSpritesheet,
    onExportSequence,
    onExportApng,
    onExportAnimatedWebp,
    onDeleteFrame,
    onDuplicateFrame,
    onReorderFrame,
  }: {
    currentFrame: number;
    frameCount: number;
    isPlaying: boolean;
    isExporting: boolean;
    exportProgress: number;
    onPlay: () => void;
    onPause: () => void;
    onSeek: (frame: number) => void;
    onExport: () => void;
    onCancelExport?: () => void;
    onExportSpritesheet?: () => void;
    onExportSequence?: () => void;
    onExportApng?: () => void;
    onExportAnimatedWebp?: () => void;
    onDeleteFrame?: (frame: number) => void;
    onDuplicateFrame?: (frame: number) => void;
    onReorderFrame?: (from: number, to: number) => void;
  } = $props();

  let dragFrameIndex = $state<number | null>(null);
  let dropFrameIndex = $state<number | null>(null);

  function clearDragState() {
    dragFrameIndex = null;
    dropFrameIndex = null;
  }

  function handleFrameDragStart(frameIndex: number, e: DragEvent) {
    if (isExporting || !onReorderFrame || frameCount <= 1) return;
    dragFrameIndex = frameIndex;
    e.dataTransfer?.setData('text/plain', String(frameIndex));
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
  }

  function handleFrameDragOver(frameIndex: number, e: DragEvent) {
    if (isExporting || !onReorderFrame || dragFrameIndex === null) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    dropFrameIndex = frameIndex;
  }

  function handleFrameDragLeave(frameIndex: number, e: DragEvent) {
    const related = e.relatedTarget as Node | null;
    const current = e.currentTarget as HTMLElement | null;
    if (current && related && current.contains(related)) return;
    if (dropFrameIndex === frameIndex) dropFrameIndex = null;
  }

  function handleFrameDrop(frameIndex: number, e: DragEvent) {
    if (isExporting || !onReorderFrame || dragFrameIndex === null) return;
    e.preventDefault();
    if (dragFrameIndex !== frameIndex) {
      onReorderFrame(dragFrameIndex, frameIndex);
    }
    clearDragState();
  }

  function handleFrameDragEnd() {
    clearDragState();
  }
</script>

<div class="gif-controls" aria-busy={isExporting}>
  <div class="gif-controls-row">
    <button
      class="gif-btn"
      onclick={() => isPlaying ? onPause() : onPlay()}
      title={isPlaying ? i18n.t('pause') : i18n.t('play')}
      disabled={isExporting}
      use:tooltip
    >
      {isPlaying ? '⏸' : '▶'}
    </button>
    <button
      class="gif-btn"
      onclick={() => onSeek(0)}
      title={i18n.t('first_frame')}
      disabled={isExporting}
      use:tooltip
    >⏮</button>
    <button
      class="gif-btn"
      onclick={() => onSeek(Math.max(0, currentFrame - 1))}
      title={i18n.t('prev_frame')}
      disabled={isExporting}
      use:tooltip
    >◀</button>
    <span class="gif-frame-info">{currentFrame + 1}/{frameCount}</span>
    {#if onDeleteFrame}
      <button
        class="gif-btn"
        onclick={() => onDeleteFrame(currentFrame)}
        title={i18n.t('delete_frame')}
        disabled={isExporting || frameCount <= 1}
        use:tooltip
      >🗑</button>
    {/if}
    {#if onDuplicateFrame}
      <button
        class="gif-btn"
        onclick={() => onDuplicateFrame(currentFrame)}
        title={i18n.t('duplicate_frame')}
        disabled={isExporting}
        use:tooltip
      >📋</button>
    {/if}
    {#if onReorderFrame}
      <button
        class="gif-btn"
        onclick={() => onReorderFrame(currentFrame, currentFrame - 1)}
        title={i18n.t('move_frame_left')}
        disabled={isExporting || currentFrame === 0}
        use:tooltip
      >⬅</button>
      <button
        class="gif-btn"
        onclick={() => onReorderFrame(currentFrame, currentFrame + 1)}
        title={i18n.t('move_frame_right')}
        disabled={isExporting || currentFrame >= frameCount - 1}
        use:tooltip
      >➡</button>
    {/if}
    <button
      class="gif-btn"
      onclick={() => onSeek(Math.min(frameCount - 1, currentFrame + 1))}
      title={i18n.t('next_frame')}
      disabled={isExporting}
      use:tooltip
    >▶</button>
    <button
      class="gif-btn"
      onclick={() => onSeek(frameCount - 1)}
      title={i18n.t('last_frame')}
      disabled={isExporting}
      use:tooltip
    >⏭</button>
    <div class="gif-sep"></div>
    {#if isExporting}
      <span class="gif-export-status">
        {Math.round(exportProgress * 100)}% ({Math.min(Math.ceil(exportProgress * frameCount), frameCount)}/{frameCount})
      </span>
      {#if onCancelExport}
        <button
          class="gif-btn gif-cancel-btn"
          onclick={onCancelExport}
          title={i18n.t('cancel')}
          aria-label={i18n.t('cancel')}
          use:tooltip
        >✕</button>
      {/if}
    {:else}
      <button
        class="gif-btn gif-export-btn"
        onclick={onExport}
        title={i18n.t('export_gif')}
        use:tooltip
      >
        💾 {i18n.t('gif_btn')}
      </button>
    {/if}
    {#if onExportSpritesheet}
      <button
        class="gif-btn gif-export-btn"
        onclick={onExportSpritesheet}
        disabled={isExporting}
        title={i18n.t('export_spritesheet')}
        use:tooltip
      >
        🧩
      </button>
    {/if}
    {#if onExportSequence}
      <button
        class="gif-btn gif-export-btn"
        onclick={onExportSequence}
        disabled={isExporting}
        title={i18n.t('export_sequence_desc')}
        use:tooltip
      >
        📁
      </button>
    {/if}
    {#if onExportApng}
      <button
        class="gif-btn gif-export-btn"
        onclick={onExportApng}
        disabled={isExporting}
        title={i18n.t('export_apng_desc')}
        use:tooltip
      >
        🖼 APNG
      </button>
    {/if}
    {#if onExportAnimatedWebp}
      <button
        class="gif-btn gif-export-btn"
        onclick={onExportAnimatedWebp}
        disabled={isExporting}
        title={i18n.t('export_animated_webp_desc')}
        use:tooltip
      >
        🎞 WebP
      </button>
    {/if}
  </div>
  <div class="gif-slider-row">
    <input
      type="range"
      class="gif-slider"
      min="0"
      max={frameCount - 1}
      value={currentFrame}
      oninput={(e) => onSeek(parseInt((e.target as HTMLInputElement).value))}
      disabled={isExporting}
    />
  </div>
  {#if onReorderFrame && frameCount > 1}
    <div class="gif-frame-strip-section">
      <div class="gif-frame-strip-label">{i18n.t('drag_frames_reorder')}</div>
      <div class="gif-frame-strip" role="list" aria-label={i18n.t('drag_frames_reorder')}>
        {#each Array.from({ length: frameCount }, (_, idx) => idx) as frameIndex}
          <button
            class="gif-frame-chip"
            class:active={frameIndex === currentFrame}
            class:drag-source={frameIndex === dragFrameIndex}
            class:drag-target={frameIndex === dropFrameIndex && dragFrameIndex !== frameIndex}
            draggable={!isExporting}
            disabled={isExporting}
            aria-label={i18n.t('frame', frameIndex + 1)}
            title={i18n.t('frame', frameIndex + 1)}
            onclick={() => onSeek(frameIndex)}
            ondragstart={(e) => handleFrameDragStart(frameIndex, e)}
            ondragover={(e) => handleFrameDragOver(frameIndex, e)}
            ondragleave={(e) => handleFrameDragLeave(frameIndex, e)}
            ondrop={(e) => handleFrameDrop(frameIndex, e)}
            ondragend={handleFrameDragEnd}
            use:tooltip
          >
            {frameIndex + 1}
          </button>
        {/each}
      </div>
    </div>
  {/if}
  {#if isExporting}
    <div class="gif-export-progress">
      <div class="gif-export-bar" style="width:{exportProgress * 100}%"></div>
    </div>
  {/if}
</div>

<style>
  .gif-controls {
    position: absolute;
    bottom: 42px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--w98-surface);
    border: none;
    padding: 4px 8px;
    z-index: 7;
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 220px;
    max-width: calc(100% - 16px);
    box-sizing: border-box;
    box-shadow: var(--w98-outset);
  }

  .gif-controls-row {
    display: flex;
    align-items: center;
    gap: 2px;
    justify-content: center;
  }

  .gif-btn {
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
  .gif-btn:active {
    box-shadow: var(--w98-inset-thin);
  }
  .gif-btn:disabled {
    color: var(--w98-text-disabled);
    cursor: not-allowed;
  }

  .gif-export-btn {
    padding: 0 8px;
    font-size: var(--w98-font-size-sm);
  }

  .gif-export-status {
    font-size: var(--w98-font-size-sm);
    font-family: 'Courier New', Courier, monospace;
    font-weight: bold;
    color: var(--w98-color-success);
    padding: 0 4px;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  .gif-cancel-btn {
    background: var(--w98-color-error);
    color: var(--w98-surface-white);
    font-size: var(--w98-font-size-sm);
    padding: 0 6px;
  }
  .gif-cancel-btn:active {
    background: color-mix(in srgb, var(--w98-color-error) 80%, #000);
  }

  .gif-frame-info {
    font-size: var(--w98-font-size-base);
    font-family: 'Courier New', Courier, monospace;
    font-weight: bold;
    color: var(--w98-text);
    padding: 0 6px;
    min-width: fit-content;
    text-align: center;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  .gif-sep {
    width: 6px;
  }

  .gif-slider-row {
    display: flex;
    align-items: center;
  }

  .gif-slider {
    width: 100%;
    height: 12px;
    cursor: pointer;
    accent-color: var(--w98-highlight);
  }

  .gif-export-progress {
    height: 8px;
    background: #000;
    border: 1px inset var(--w98-shadow-light);
    overflow: hidden;
  }

  .gif-export-bar {
    height: 100%;
    background: var(--w98-highlight);
  }

  .gif-frame-strip-section {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .gif-frame-strip-label {
    font-size: var(--w98-font-size-caption);
    color: var(--w98-shadow-808);
    text-align: center;
  }

  .gif-frame-strip {
    display: flex;
    gap: 3px;
    overflow-x: auto;
    padding: 1px;
  }

  .gif-frame-chip {
    min-width: 24px;
    height: 22px;
    padding: 0 6px;
    font-size: var(--w98-font-size-sm);
    font-family: 'Courier New', Courier, monospace;
    font-variant-numeric: tabular-nums;
    background: var(--w98-surface);
    border: none;
    cursor: grab;
    box-shadow: var(--w98-outset-thin);
    flex: 0 0 auto;
  }

  .gif-frame-chip.active {
    background: var(--w98-highlight);
    color: var(--w98-surface-white);
  }

  .gif-frame-chip.drag-source {
    opacity: 0.6;
    cursor: grabbing;
  }

  .gif-frame-chip.drag-target {
    box-shadow: 0 0 0 2px var(--w98-color-success);
  }

  .gif-frame-chip:disabled {
    color: var(--w98-text-disabled);
    cursor: not-allowed;
  }

  @media (max-width: 550px) {
    .gif-controls {
      min-width: 0;
      width: calc(100% - 16px);
    }
    .gif-controls-row {
      flex-wrap: wrap;
    }
  }
</style>
