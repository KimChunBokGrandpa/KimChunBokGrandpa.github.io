<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
  import { getPaletteFamily, getPaletteName } from '$lib/utils/palettes';
  import { getPresetFamilyLabelKey } from '$lib/utils/presets';
  import type { VariantItem } from './types';
  import type { PaletteRecommendation } from '$lib/utils/paletteRecommender';

  let {
    activeThemeId,
    activeVariants,
    selectedPaletteId,
    hoveredPaletteId = $bindable<string | null>(),
    isImporting,
    favorites,
    onSelect,
    openNewPaletteEditor,
    handleImportClick,
    handleExportPalette,
    openEditPaletteEditor,
    handleDeletePalette,
    toggleFavorite,
    handleExtractFromImage,
    isExtracting = false,
    hasImage = false,
    recommendations = [] as PaletteRecommendation[],
    isRecommending = false,
  }: {
    activeThemeId: string;
    activeVariants: VariantItem[];
    selectedPaletteId: string;
    hoveredPaletteId: string | null;
    isImporting: boolean;
    favorites: Set<string>;
    onSelect: (id: string) => void;
    openNewPaletteEditor: () => void;
    handleImportClick: () => void;
    handleExportPalette: (id: string, format: 'hex' | 'gpl', e: MouseEvent) => void;
    openEditPaletteEditor: (id: string) => void;
    handleDeletePalette: (id: string, e: MouseEvent) => void;
    toggleFavorite: (id: string, e: MouseEvent) => void;
    handleExtractFromImage?: () => void;
    isExtracting?: boolean;
    hasImage?: boolean;
    recommendations?: PaletteRecommendation[];
    isRecommending?: boolean;
  } = $props();

  const originalSwatches = ['#ff4d4d', '#ffa64d', '#4dd2ff', '#7cff7c'];
  const neutralSwatches = ['#000000', '#4d4d4d', '#a6a6a6', '#ffffff'];
</script>

<div class="pg-list-panel">
  {#if activeThemeId === '_custom'}
    <div class="pg-custom-toolbar w98-toolbar">
      <button class="pg-new-btn w98-inline-button w98-button--thin" onclick={openNewPaletteEditor}>{i18n.t('new_palette')}</button>
      {#if handleExtractFromImage}
        <button class="pg-new-btn w98-inline-button w98-button--thin" onclick={handleExtractFromImage} disabled={isExtracting || !hasImage} title={!hasImage ? i18n.t('extract_no_image') : i18n.t('extract_palette')}>
          <span class="w98-emoji" aria-hidden="true">{isExtracting ? '⏳' : '🎨'}</span>
          <span>{isExtracting ? i18n.t('extracting_palette') : i18n.t('extract_palette_short')}</span>
        </button>
      {/if}
      <button class="pg-new-btn w98-inline-button w98-button--thin" onclick={handleImportClick} disabled={isImporting}>
        <span class="w98-emoji" aria-hidden="true">{isImporting ? '⏳' : '📥'}</span>
        <span>{isImporting ? i18n.t('loading') : i18n.t('import_palette')}</span>
      </button>
    </div>
  {/if}
  
  {#if (isRecommending || recommendations.length > 0) && activeThemeId !== '_custom'}
    <div class="pg-recommend-bar w98-status-panel">
      <span class="pg-recommend-label w98-kicker">
        <span class="w98-emoji" aria-hidden="true">{isRecommending ? '⏳' : '✨'}</span>
        <span>{i18n.t('recommended_palettes')}</span>
      </span>
      <div class="pg-recommend-list">
        {#if recommendations.length > 0}
          {#each recommendations as rec, index}
            <button
              class="pg-recommend-chip w98-inline-button w98-button--thin"
              class:w98-inline-button--active={selectedPaletteId === rec.id}
              onclick={() => onSelect(rec.id)}
              title={`${getPaletteName(rec.id)} - ${i18n.t(getPresetFamilyLabelKey(getPaletteFamily(rec.id)))}`}
            >
              <span class="pg-recommend-rank">#{index + 1}</span>
              <span class="pg-recommend-name">{getPaletteName(rec.id)}</span>
              <span class="pg-recommend-family w98-chip">
                {i18n.t(getPresetFamilyLabelKey(getPaletteFamily(rec.id)))}
              </span>
            </button>
          {/each}
        {:else}
          <span class="pg-recommend-loading w98-note">{i18n.t('loading')}</span>
        {/if}
      </div>
    </div>
  {/if}

  <div class="pg-list w98-inset-panel" role="listbox">
    {#each activeVariants as item}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_interactive_supports_focus -->
      <div
        class="pg-item"
        class:sel={selectedPaletteId === item.id}
        role="option"
        tabindex="0"
        aria-selected={selectedPaletteId === item.id}
        onclick={() => onSelect(item.id)}
        onkeydown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(item.id);
          }
        }}
        onmouseenter={() => (hoveredPaletteId = item.id)}
        onmouseleave={() => (hoveredPaletteId = null)}
      >
        <div class="pg-mini-swatches w98-color-swatch-strip">
          {#if item.colors}
            {#each item.colors.slice(0, 8) as c}
              <span class="ms w98-color-swatch w98-color-swatch--mini" style="background:rgb({c.r},{c.g},{c.b})"></span>
            {/each}
          {:else}
            {#each (item.id === 'original' ? originalSwatches : neutralSwatches) as swatch}
              <span class="ms ms-solid w98-color-swatch w98-color-swatch--mini w98-color-swatch--solid" style={`background:${swatch}`}></span>
            {/each}
          {/if}
        </div>
        <span class="pg-item-name">
          {item.name}
          {#if item.themeName}
            <span class="pg-theme-label">{item.themeName}</span>
          {/if}
        </span>
        {#if item.colorCount > 0}
          <span class="pg-color-badge w98-chip">{item.colorCount}</span>
        {/if}
        {#if selectedPaletteId === item.id}
          <span class="pg-check w98-structural-glyph" aria-hidden="true">▶</span>
        {/if}
        
        {#if item.isCustom}
          <button
            class="pg-export-btn pg-icon-btn w98-inline-button w98-button--thin"
            onclick={(e) => handleExportPalette(item.id, 'hex', e)}
            title={i18n.t('export_as_hex')}
            aria-label="{i18n.t('export_as_hex')} {item.name}"
          >
            <span class="w98-emoji" aria-hidden="true">💾</span>
          </button>
          <button
            class="pg-edit-btn pg-icon-btn w98-inline-button w98-button--thin"
            onclick={(e) => { e.stopPropagation(); openEditPaletteEditor(item.id); }}
            title={i18n.t('edit_palette')}
            aria-label="{i18n.t('edit_palette')} {item.name}"
          >
            <span class="w98-emoji" aria-hidden="true">🎨</span>
          </button>
          <button
            class="pg-del-btn pg-icon-btn w98-inline-button w98-button--thin"
            onclick={(e) => handleDeletePalette(item.id, e)}
            title={i18n.t('delete_palette')}
            aria-label="{i18n.t('delete_palette')} {item.name}"
          >
            <span class="w98-structural-glyph" aria-hidden="true">✕</span>
          </button>
        {:else}
          <button
            class="pg-fav-btn pg-icon-btn w98-inline-button w98-button--thin"
            class:fav-active={favorites.has(item.id)}
            onclick={(e) => toggleFavorite(item.id, e)}
            title={favorites.has(item.id) ? i18n.t('remove_from_favorites') : i18n.t('add_to_favorites')}
            aria-label={favorites.has(item.id) ? i18n.t('remove_from_favorites') : i18n.t('add_to_favorites')}
          >
            <span class="w98-emoji" aria-hidden="true">📌</span>
          </button>
        {/if}
      </div>
    {/each}
    {#if activeThemeId === '_custom' && activeVariants.length === 0}
      <div class="pg-empty w98-note">{i18n.t('no_custom_palettes')}</div>
    {:else if activeThemeId === '_favorites' && activeVariants.length === 0}
      <div class="pg-empty w98-note">{i18n.t('no_favorites')}</div>
    {/if}
  </div>
</div>

<style>
  .pg-recommend-bar {
    padding: var(--w98-space-6);
    flex-shrink: 0;
  }
  .pg-recommend-label {
    color: var(--w98-highlight);
    display: inline-flex;
    align-items: center;
    gap: var(--w98-space-4);
    margin-bottom: var(--w98-space-2);
  }
  .pg-recommend-list {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
  }
  .pg-recommend-chip {
    display: inline-flex;
    align-items: center;
    gap: var(--w98-space-4);
    min-width: 0;
    white-space: nowrap;
  }
  .pg-recommend-rank {
    color: var(--w98-highlight);
    flex-shrink: 0;
  }
  .pg-recommend-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .pg-recommend-family {
    flex-shrink: 0;
    max-width: 96px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .pg-recommend-loading {
    min-height: 18px;
  }

  .pg-list-panel {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .pg-list {
    flex: 1;
    overflow-y: auto;
    padding: var(--w98-space-2);
  }
  .pg-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 5px;
    cursor: pointer;
    background: var(--w98-surface);
    box-shadow: var(--w98-outset-thin);
    margin-bottom: var(--w98-space-2);
  }
  .pg-item:hover,
  .pg-item:focus-visible {
    background: var(--w98-surface);
    box-shadow: var(--w98-inset-thin);
    outline: 1px dotted var(--w98-text);
    outline-offset: -3px;
  }
  .pg-item.sel {
    background: var(--w98-highlight-alpha);
    color: var(--w98-text);
    box-shadow: var(--w98-inset-thin);
    outline: 1px dotted var(--w98-text);
    outline-offset: -3px;
  }

  .pg-mini-swatches {
    align-items: center;
  }
  .ms {
    flex-shrink: 0;
  }

  .pg-item-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: bold;
  }

  .pg-theme-label {
    display: block;
    font-size: var(--w98-font-size-caption);
    color: var(--w98-text-hint);
    line-height: 1.1;
  }
  .pg-item.sel .pg-theme-label {
    color: var(--w98-text-secondary);
  }

  .pg-color-badge {
    flex-shrink: 0;
    font-size: var(--w98-font-size-caption);
    background: var(--w98-surface-white);
    color: var(--w98-text-secondary);
  }
  .pg-item.sel .pg-color-badge {
    background: var(--w98-surface-active);
    color: var(--w98-text);
  }

  .pg-check {
    flex-shrink: 0;
    font-size: var(--w98-font-size-action);
    font-weight: bold;
    color: var(--w98-highlight);
  }

  .pg-custom-toolbar {
    gap: 1px;
  }
  .pg-new-btn {
    flex: 1;
  }

  .pg-icon-btn {
    flex-shrink: 0;
    min-width: 18px;
    min-height: 18px;
    padding: 0 4px;
    line-height: 1;
  }
  .pg-icon-btn :global(.w98-emoji),
  .pg-icon-btn :global(.w98-structural-glyph) {
    line-height: 1;
  }
  .pg-fav-btn {
    color: var(--w98-text-hint);
  }
  .pg-fav-btn.fav-active {
    background: var(--w98-surface-active);
    box-shadow: var(--w98-inset-thin);
    color: var(--w98-text);
  }

  .pg-export-btn, .pg-edit-btn, .pg-del-btn {
    color: var(--w98-text-hint);
  }

  .pg-empty {
    justify-content: center;
  }

  @media (max-width: 550px) {
    .pg-list-panel { flex: 1; min-height: 60px; overflow: hidden; }
    .pg-list { overflow-y: auto; }
    .pg-item { padding: 6px 5px; min-height: 36px; }
    .pg-export-btn, .pg-edit-btn, .pg-del-btn, .pg-fav-btn {
      min-width: 32px; min-height: 32px; display: flex; align-items: center; justify-content: center; font-size: var(--w98-font-size-icon);
    }
  }
</style>
