<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
  import type { ThemeTab } from './types';

  let {
    groupMode = $bindable(),
    activeThemeId = $bindable(),
    activeGroupId = $bindable(),
    activeTabs,
    activeTabId,
    setActiveTab
  }: {
    groupMode: 'theme' | 'colorCount';
    activeThemeId: string;
    activeGroupId: string;
    activeTabs: ThemeTab[];
    activeTabId: string;
    setActiveTab: (tabId: string) => void;
  } = $props();
</script>

<div class="pg-mode-bar">
  <button
    class="pg-mode-btn"
    class:mode-active={groupMode === 'theme'}
    onclick={() => { groupMode = 'theme'; activeThemeId = '_core'; }}
  >{i18n.t('palette_group_by_theme')}</button>
  <button
    class="pg-mode-btn"
    class:mode-active={groupMode === 'colorCount'}
    onclick={() => { groupMode = 'colorCount'; activeThemeId = `g_${activeGroupId}`; }}
  >{i18n.t('palette_group_by_color_count')}</button>
</div>
<div class="pg-toolbar">
  {#each activeTabs as tab}
    <button
      class="pg-toolbtn"
      class:tb-sel={activeTabId === tab.id}
      onclick={() => setActiveTab(tab.id)}>{tab.label}</button>
  {/each}
</div>

<style>
  .pg-mode-bar {
    display: flex;
    gap: 0;
    padding: 2px 3px 0 3px;
    flex-shrink: 0;
    background: var(--w98-surface);
  }
  .pg-mode-btn {
    flex: 1;
    padding: 3px 6px;
    font-size: var(--w98-font-size-sm);
    font-family: inherit;
    background: var(--w98-surface-active);
    border: 1px solid var(--w98-shadow-808);
    cursor: pointer;
    color: var(--w98-text-secondary);
  }
  .pg-mode-btn:hover {
    background: #e0dcd4;
  }
  .pg-mode-btn.mode-active {
    background: var(--w98-surface);
    font-weight: bold;
    color: inherit;
    border-bottom-color: var(--w98-surface);
  }

  .pg-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 1px;
    padding: 2px 3px;
    border-bottom: 1px solid var(--w98-shadow-808);
    flex-shrink: 0;
    background: var(--w98-surface);
  }
  .pg-toolbtn {
    padding: 2px 6px;
    font-size: var(--w98-font-size-sm);
    font-family: inherit;
    background: var(--w98-surface-active);
    border: 1px solid transparent;
    border-bottom: none;
    cursor: pointer;
    box-shadow:
      inset 1px 1px var(--w98-shadow-white),
      inset -1px -1px var(--w98-shadow-808);
  }
  .pg-toolbtn:hover {
    background: #e0dcd4;
  }
  .pg-toolbtn.tb-sel {
    background: var(--w98-surface);
    font-weight: bold;
    box-shadow:
      inset -1px -1px var(--w98-shadow-white),
      inset 1px 1px var(--w98-shadow-808);
  }

  @media (max-width: 550px) {
    .pg-mode-bar { padding: 1px 2px 0 2px; }
    .pg-mode-btn { padding: 2px 4px; font-size: var(--w98-font-size-caption); }
    .pg-toolbar { gap: 0; padding: 1px 2px; }
    .pg-toolbtn { padding: 2px 4px; font-size: var(--w98-font-size-caption); }
  }
</style>
