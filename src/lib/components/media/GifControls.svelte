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

<div class="gif-controls w98-floating-surface" aria-busy={isExporting}>
  <div class="gif-controls-row">
    <button
      class="gif-btn w98-inline-button w98-button--thin"
      onclick={() => (isPlaying ? onPause() : onPlay())}
      title={isPlaying ? i18n.t('pause') : i18n.t('play')}
      disabled={isExporting}
      use:tooltip
    >
      <span class="w98-structural-glyph" aria-hidden="true">{isPlaying ? '⏸' : '▶'}</span>
    </button>
    <button
      class="gif-btn w98-inline-button w98-button--thin"
      onclick={() => onSeek(0)}
      title={i18n.t('first_frame')}
      disabled={isExporting}
      use:tooltip><span class="w98-structural-glyph" aria-hidden="true">⏮</span></button
    >
    <button
      class="gif-btn w98-inline-button w98-button--thin"
      onclick={() => onSeek(Math.max(0, currentFrame - 1))}
      title={i18n.t('prev_frame')}
      disabled={isExporting}
      use:tooltip><span class="w98-structural-glyph" aria-hidden="true">◀</span></button
    >
    <span class="gif-frame-info w98-chip">{currentFrame + 1}/{frameCount}</span>
    {#if onDeleteFrame}
      <button
        class="gif-btn w98-inline-button w98-button--thin"
        onclick={() => onDeleteFrame(currentFrame)}
        title={i18n.t('delete_frame')}
        disabled={isExporting || frameCount <= 1}
        use:tooltip><span class="w98-emoji" aria-hidden="true">🗑️</span></button
      >
    {/if}
    {#if onDuplicateFrame}
      <button
        class="gif-btn w98-inline-button w98-button--thin"
        onclick={() => onDuplicateFrame(currentFrame)}
        title={i18n.t('duplicate_frame')}
        disabled={isExporting}
        use:tooltip><span class="w98-emoji" aria-hidden="true">📋</span></button
      >
    {/if}
    {#if onReorderFrame}
      <button
        class="gif-btn w98-inline-button w98-button--thin"
        onclick={() => onReorderFrame(currentFrame, currentFrame - 1)}
        title={i18n.t('move_frame_left')}
        disabled={isExporting || currentFrame === 0}
        use:tooltip><span class="w98-structural-glyph" aria-hidden="true">⬅</span></button
      >
      <button
        class="gif-btn w98-inline-button w98-button--thin"
        onclick={() => onReorderFrame(currentFrame, currentFrame + 1)}
        title={i18n.t('move_frame_right')}
        disabled={isExporting || currentFrame >= frameCount - 1}
        use:tooltip><span class="w98-structural-glyph" aria-hidden="true">➡</span></button
      >
    {/if}
    <button
      class="gif-btn w98-inline-button w98-button--thin"
      onclick={() => onSeek(Math.min(frameCount - 1, currentFrame + 1))}
      title={i18n.t('next_frame')}
      disabled={isExporting}
      use:tooltip><span class="w98-structural-glyph" aria-hidden="true">▶</span></button
    >
    <button
      class="gif-btn w98-inline-button w98-button--thin"
      onclick={() => onSeek(frameCount - 1)}
      title={i18n.t('last_frame')}
      disabled={isExporting}
      use:tooltip><span class="w98-structural-glyph" aria-hidden="true">⏭</span></button
    >
  </div>
  <div class="gif-slider-row">
    <input
      type="range"
      class="gif-slider w98-range"
      min="0"
      max={frameCount - 1}
      value={currentFrame}
      oninput={(e) => onSeek(parseInt((e.target as HTMLInputElement).value))}
      disabled={isExporting}
    />
  </div>
  {#if onReorderFrame && frameCount > 1}
    <div class="gif-frame-strip-section">
      <div class="gif-frame-strip-label w98-kicker">{i18n.t('drag_frames_reorder')}</div>
      <div class="gif-frame-strip" role="list" aria-label={i18n.t('drag_frames_reorder')}>
        {#each Array.from({ length: frameCount }, (_, idx) => idx) as frameIndex}
          <button
            class="gif-frame-chip w98-inline-button w98-button--thin"
            class:w98-inline-button--active={frameIndex === currentFrame}
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
    <div class="gif-export-progress w98-progress-track">
      <div class="gif-export-bar w98-progress-fill" style="width:{exportProgress * 100}%"></div>
    </div>
  {/if}
</div>

<style>
  .gif-controls {
    position: absolute;
    bottom: 42px;
    left: 50%;
    transform: translateX(-50%);
    padding: 4px 8px;
    z-index: 7;
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 220px;
    max-width: calc(100% - 16px);
    box-sizing: border-box;
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
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .gif-btn:disabled {
    color: var(--w98-text-disabled);
    cursor: not-allowed;
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

  .gif-slider-row {
    display: flex;
    align-items: center;
  }

  .gif-slider {
    width: 100%;
    cursor: pointer;
  }

  .gif-export-progress {
    height: 8px;
  }

  .gif-frame-strip-section {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .gif-frame-strip-label {
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
    cursor: grab;
    flex: 0 0 auto;
  }

  .gif-frame-chip.drag-source {
    opacity: 0.6;
    cursor: grabbing;
  }

  .gif-frame-chip.drag-target {
    background: var(--w98-highlight-alpha);
    box-shadow: var(--w98-inset-thin);
    outline: 1px dotted var(--w98-highlight);
    outline-offset: -3px;
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
