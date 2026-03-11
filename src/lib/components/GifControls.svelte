<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';

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
    onExportSpritesheet?: () => void;
  } = $props();
</script>

<div class="gif-controls">
  <div class="gif-controls-row">
    <button
      class="gif-btn"
      onclick={() => isPlaying ? onPause() : onPlay()}
      title={isPlaying ? i18n.t('pause') : i18n.t('play')}
      disabled={isExporting}
    >
      {isPlaying ? '⏸' : '▶'}
    </button>
    <button
      class="gif-btn"
      onclick={() => onSeek(0)}
      title={i18n.t('first_frame')}
      disabled={isExporting}
    >⏮</button>
    <button
      class="gif-btn"
      onclick={() => onSeek(Math.max(0, currentFrame - 1))}
      title={i18n.t('prev_frame')}
      disabled={isExporting}
    >◀</button>
    <span class="gif-frame-info">{currentFrame + 1}/{frameCount}</span>
    <button
      class="gif-btn"
      onclick={() => onSeek(Math.min(frameCount - 1, currentFrame + 1))}
      title={i18n.t('next_frame')}
      disabled={isExporting}
    >▶</button>
    <button
      class="gif-btn"
      onclick={() => onSeek(frameCount - 1)}
      title={i18n.t('last_frame')}
      disabled={isExporting}
    >⏭</button>
    <div class="gif-sep"></div>
    <button
      class="gif-btn gif-export-btn"
      onclick={onExport}
      disabled={isExporting}
      title={i18n.t('export_gif')}
    >
      {isExporting ? `${Math.round(exportProgress * 100)}%` : `💾 ${i18n.t('gif_btn')}`}
    </button>
    {#if onExportSpritesheet}
      <button
        class="gif-btn gif-export-btn"
        onclick={onExportSpritesheet}
        disabled={isExporting}
        title={i18n.t('export_spritesheet')}
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
    bottom: 28px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.85);
    border: 2px outset #dfdfdf;
    padding: 4px 8px;
    z-index: 6;
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 220px;
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
  .gif-btn:active {
    box-shadow: inset -1px -1px #fff, inset 1px 1px #0a0a0a;
  }
  .gif-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .gif-export-btn {
    padding: 0 8px;
    font-size: 10px;
  }

  .gif-frame-info {
    font-size: 11px;
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
    accent-color: #000080;
  }

  .gif-export-progress {
    height: 8px;
    background: #000;
    border: 1px inset #dfdfdf;
    overflow: hidden;
  }

  .gif-export-bar {
    height: 100%;
    background: #000080;
    transition: width 0.2s;
  }
</style>
