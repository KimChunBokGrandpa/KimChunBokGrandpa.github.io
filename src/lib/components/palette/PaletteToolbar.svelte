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

<div class="pg-mode-bar w98-tab-strip">
  <button
    class="pg-mode-btn w98-tab-button"
    class:w98-tab-button--active={groupMode === 'theme'}
    onclick={() => { groupMode = 'theme'; activeThemeId = '_core'; }}
  >{i18n.t('palette_group_by_theme')}</button>
  <button
    class="pg-mode-btn w98-tab-button"
    class:w98-tab-button--active={groupMode === 'colorCount'}
    onclick={() => { groupMode = 'colorCount'; activeThemeId = `g_${activeGroupId}`; }}
  >{i18n.t('palette_group_by_color_count')}</button>
</div>
<div class="pg-toolbar w98-tab-strip">
  {#each activeTabs as tab}
    <button
      class="pg-toolbtn w98-tab-button"
      class:w98-tab-button--active={activeTabId === tab.id}
      onclick={() => setActiveTab(tab.id)}>{tab.label}</button>
  {/each}
</div>

<style>
  .pg-mode-bar {
    margin-top: 0;
    padding-inline: 3px;
    flex-shrink: 0;
  }
  .pg-mode-btn {
    flex: 1;
  }

  .pg-toolbar {
    flex-wrap: wrap;
    padding-inline: 3px;
    flex-shrink: 0;
  }
  .pg-toolbtn {
    flex: 0 0 auto;
  }

  @media (max-width: 550px) {
    .pg-mode-bar {
      padding-inline: 2px;
    }
    .pg-toolbar {
      padding-inline: 2px;
    }
  }
</style>
