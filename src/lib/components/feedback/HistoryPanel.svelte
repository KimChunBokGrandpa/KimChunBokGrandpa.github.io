<script lang="ts">
  /**
   * HistoryPanel — Displays the undo/redo timeline and allows jumping
   * to specific states.
   */
  import { getPaletteName } from '$lib/utils/palettes';
  import { i18n } from '$lib/i18n/index.svelte';
  import { tooltip } from '$lib/utils/tooltip';
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

  let listEl = $state<HTMLDivElement | null>(null);

  // Auto-scroll to the current item when history changes
  $effect(() => {
    // Track history length to trigger on changes
    const _len = history.length + redoHistory.length;
    if (listEl) {
      // Use tick to ensure DOM is updated
      requestAnimationFrame(() => {
        const currentEl = listEl?.querySelector('.current');
        currentEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
    }
  });

  // Helper to concisely describe a setting state
  function describeSettings(s: ProcessingSettings) {
    let desc = i18n.t('history_pixel').replace('{0}', String(s.pixelSize)) + ', ';
    desc += getPaletteName(s.palette);
    if (s.crtEffect !== 'none') desc += ' ' + i18n.t('history_crt');
    if (s.glitchFilters.length > 0) desc += ' ' + i18n.t('history_glitch').replace('{0}', String(s.glitchFilters.length));
    return desc;
  }
</script>

<div class="history-panel">
  <div class="history-controls">
    <button onclick={onUndo} disabled={history.length === 0} title="{i18n.t('undo')} (Ctrl+Z)" use:tooltip>↩ {i18n.t('undo')}</button>
    <button onclick={onRedo} disabled={redoHistory.length === 0} title="{i18n.t('redo')} (Ctrl+Shift+Z)" use:tooltip>↪ {i18n.t('redo')}</button>
  </div>

  <div class="history-list" bind:this={listEl}>
    {#if history.length === 0 && redoHistory.length === 0}
      <div class="history-empty">
        <span class="history-empty-icon">📜</span>
        <p class="history-empty-text">{i18n.t('history_empty')}</p>
        <p class="history-empty-hint">{i18n.t('history_empty_hint')}</p>
      </div>
    {:else}
      <!-- Past states -->
      {#each history as step, i}
        <button class="history-item past" onclick={() => onJumpToHistory(i, false)}>
          <span class="step-num">{i + 1}</span>
          <span class="step-desc">{describeSettings(step)}</span>
        </button>
      {/each}
    {/if}

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
    background: var(--w98-surface-white);
    border: 2px inset var(--w98-shadow-light);
    font-size: var(--w98-font-size-base);
    overflow: hidden;
  }

  .history-controls {
    display: flex;
    gap: 4px;
    padding: 4px;
    background: var(--w98-surface);
    border-bottom: 1px solid var(--w98-shadow-808);
  }

  .history-controls button {
    flex: 1;
    padding: 3px 6px;
    font-weight: bold;
    cursor: pointer;
  }
  .history-controls button:active {
    box-shadow: var(--w98-inset-thin);
  }
  .history-controls button:disabled {
    color: var(--w98-text-disabled);
    cursor: not-allowed;
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
    background: var(--w98-surface-white);
    border: 1px solid transparent;
    cursor: pointer;
    font-family: inherit;
    font-size: var(--w98-font-size-base);
    width: 100%;
  }

  .history-item:hover:not(.current) {
    background: var(--w98-highlight);
    color: #fff;
  }

  .history-item.past {
    color: var(--w98-text-secondary);
  }

  .history-item.current {
    background: var(--w98-surface-active);
    border: 1px dotted #000;
    font-weight: bold;
    cursor: default;
  }

  .history-item.future {
    color: var(--w98-text-hint);
    font-style: italic;
  }

  .history-item:hover.future {
    color: #fff; /* override italics color on hover */
  }

  .step-num {
    display: inline-block;
    width: 20px;
    min-width: 20px;
    color: var(--w98-shadow-808);
    text-align: right;
  }
  .history-item:hover:not(.current) .step-num {
    color: var(--w98-surface);
  }

  .step-desc {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .current-badge {
    font-size: var(--w98-font-size-caption);
    background: var(--w98-highlight);
    color: #fff;
    padding: 1px 4px;
    border-radius: var(--w98-radius-sm);
  }

  .history-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 16px 8px;
    gap: 4px;
    color: var(--w98-text-hint);
    text-align: center;
  }
  .history-empty-icon {
    font-size: 24px;
    color: var(--w98-text-hint);
  }
  .history-empty-text {
    font-size: var(--w98-font-size-base);
    color: var(--w98-text-muted);
    margin: 0;
  }
  .history-empty-hint {
    font-size: var(--w98-font-size-sm);
    color: var(--w98-text-disabled);
    margin: 0;
  }
</style>
