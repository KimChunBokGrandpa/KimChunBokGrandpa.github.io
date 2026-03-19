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
  } = $props();
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
    background: rgba(0, 0, 0, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 3px;
    padding: 4px 8px;
    z-index: 7;
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 220px;
    max-width: calc(100% - 16px);
    box-sizing: border-box;
    backdrop-filter: blur(4px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
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
    opacity: 0.5;
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
    color: #fff;
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
    transition: width 0.2s;
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
