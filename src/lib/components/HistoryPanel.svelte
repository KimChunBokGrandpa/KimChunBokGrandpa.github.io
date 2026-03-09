<script lang="ts">
  /**
   * HistoryPanel — Displays the undo/redo timeline and allows jumping
   * to specific states.
   */
  import { getPaletteName } from '$lib/utils/palettes';
  import { i18n } from '$lib/i18n/index.svelte';
  import type { ProcessingSettings } from '$lib/types';

  let {
    history,
    redoHistory,
    currentSettings,
    onJumpToHistory,
    onUndo,
    onRedo,
  }: {
    history: ProcessingSettings[];
    redoHistory: ProcessingSettings[];
    currentSettings: ProcessingSettings;
    onJumpToHistory: (index: number, isRedo: boolean) => void;
    onUndo: () => void;
    onRedo: () => void;
  } = $props();

  // Helper to concisely describe a setting state
  function describeSettings(s: ProcessingSettings) {
    let desc = `Pixel: ${s.pixelSize}x, `;
    desc += getPaletteName(s.palette);
    if (s.crtEffect) desc += ' +CRT';
    if (s.glitchFilters.length > 0) desc += ` (+${s.glitchFilters.length} glitch)`;
    return desc;
  }
</script>

<div class="history-panel">
  <div class="history-controls">
    <button onclick={onUndo} disabled={history.length === 0} title="{i18n.t('undo')} (Ctrl+Z)">↩ {i18n.t('undo')}</button>
    <button onclick={onRedo} disabled={redoHistory.length === 0} title="{i18n.t('redo')} (Ctrl+Y)">↪ {i18n.t('redo')}</button>
  </div>

  <div class="history-list">
    <!-- Past states -->
    {#each history as step, i}
      <button class="history-item past" onclick={() => onJumpToHistory(i, false)}>
        <span class="step-num">{i + 1}</span>
        <span class="step-desc">{describeSettings(step)}</span>
      </button>
    {/each}

    <!-- Current state -->
    <div class="history-item current">
      <span class="step-num">{history.length + 1}</span>
      <span class="step-desc">{describeSettings(currentSettings)}</span>
      <span class="current-badge">{i18n.t('current')}</span>
    </div>

    <!-- Future (redo) states -->
    <!-- redoHistory acts like a stack, so the top of the stack (last element) is the NEXT step -->
    {#each [...redoHistory].reverse() as step, i}
      <button class="history-item future" onclick={() => onJumpToHistory(redoHistory.length - 1 - i, true)}>
        <span class="step-num">{history.length + 2 + i}</span>
        <span class="step-desc">{describeSettings(step)}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .history-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #fff;
    border: 2px inset #dfdfdf;
    font-size: 11px;
    overflow: hidden;
  }

  .history-controls {
    display: flex;
    gap: 4px;
    padding: 4px;
    background: #c0c0c0;
    border-bottom: 1px solid #808080;
  }

  .history-controls button {
    flex: 1;
    padding: 3px 6px;
    font-weight: bold;
  }

  .history-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    padding: 2px;
  }

  .history-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 6px;
    margin-bottom: 2px;
    text-align: left;
    background: #fff;
    border: 1px solid transparent;
    cursor: pointer;
    font-family: inherit;
    font-size: 11px;
    width: 100%;
  }

  .history-item:hover:not(.current) {
    background: #000080;
    color: #fff;
  }

  .history-item.past {
    color: #333;
  }

  .history-item.current {
    background: #d4d0c8;
    border: 1px dotted #000;
    font-weight: bold;
    cursor: default;
  }

  .history-item.future {
    color: #888;
    font-style: italic;
  }

  .history-item:hover.future {
    color: #fff; /* override italics color on hover */
  }

  .step-num {
    display: inline-block;
    width: 20px;
    min-width: 20px;
    color: #808080;
    text-align: right;
  }
  .history-item:hover:not(.current) .step-num {
    color: #c0c0c0;
  }

  .step-desc {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .current-badge {
    font-size: 9px;
    background: #000080;
    color: #fff;
    padding: 1px 4px;
    border-radius: 2px;
  }
</style>
