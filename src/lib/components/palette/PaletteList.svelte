<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
  import type { VariantItem } from './types';

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
  } = $props();
</script>

<div class="pg-list-panel">
  {#if activeThemeId === '_custom'}
    <div class="pg-custom-toolbar">
      <button class="pg-new-btn" onclick={openNewPaletteEditor}>{i18n.t('new_palette')}</button>
      {#if handleExtractFromImage}
        <button class="pg-new-btn" onclick={handleExtractFromImage} disabled={isExtracting || !hasImage} title={!hasImage ? i18n.t('extract_no_image') : i18n.t('extract_palette')}>
          {isExtracting ? '⏳' : '🎨'} {isExtracting ? i18n.t('extracting_palette') : i18n.t('extract_palette_short')}
        </button>
      {/if}
      <button class="pg-new-btn" onclick={handleImportClick} disabled={isImporting}>
        {isImporting ? '⏳' : '📥'} {isImporting ? i18n.t('loading') : i18n.t('import_palette')}
      </button>
    </div>
  {/if}
  
  <div class="pg-list" role="listbox">
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
        <div class="pg-mini-swatches">
          {#if item.colors}
            {#each item.colors.slice(0, 8) as c}
              <span class="ms" style="background:rgb({c.r},{c.g},{c.b})"></span>
            {/each}
          {:else if item.id === 'original'}
            <span class="ms ms-rainbow"></span>
          {:else}
            <span class="ms" style="background:linear-gradient(90deg,#000,#fff)"></span>
          {/if}
        </div>
        <span class="pg-item-name">
          {item.name}
          {#if item.themeName}
            <span class="pg-theme-label">{item.themeName}</span>
          {/if}
        </span>
        {#if item.colorCount > 0}
          <span class="pg-color-badge">{item.colorCount}</span>
        {/if}
        {#if selectedPaletteId === item.id}
          <span class="pg-check">✓</span>
        {/if}
        
        {#if item.isCustom}
          <button
            class="pg-export-btn"
            onclick={(e) => handleExportPalette(item.id, 'hex', e)}
            title={i18n.t('export_as_hex')}
            aria-label="{i18n.t('export_as_hex')} {item.name}">💾</button>
          <button
            class="pg-edit-btn"
            onclick={(e) => { e.stopPropagation(); openEditPaletteEditor(item.id); }}
            title={i18n.t('edit_palette')}
            aria-label="{i18n.t('edit_palette')} {item.name}">✎</button>
          <button
            class="pg-del-btn"
            onclick={(e) => handleDeletePalette(item.id, e)}
            title={i18n.t('delete_palette')}
            aria-label="{i18n.t('delete_palette')} {item.name}">×</button>
        {:else}
          <button
            class="pg-fav-btn"
            class:fav-active={favorites.has(item.id)}
            onclick={(e) => toggleFavorite(item.id, e)}
            title={favorites.has(item.id) ? i18n.t('remove_from_favorites') : i18n.t('add_to_favorites')}
            aria-label={favorites.has(item.id) ? i18n.t('remove_from_favorites') : i18n.t('add_to_favorites')}>{favorites.has(item.id) ? '★' : '☆'}</button>
        {/if}
      </div>
    {/each}
    {#if activeThemeId === '_custom' && activeVariants.length === 0}
      <div class="pg-empty">{i18n.t('no_custom_palettes')}</div>
    {:else if activeThemeId === '_favorites' && activeVariants.length === 0}
      <div class="pg-empty">{i18n.t('no_favorites')}</div>
    {/if}
  </div>
</div>

<style>
  .pg-list-panel {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .pg-list {
    flex: 1;
    overflow-y: auto;
    background: #fff;
    border: 2px inset;
    padding: 1px;
  }
  .pg-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 5px;
    cursor: pointer;
    border-bottom: 1px solid #f4f4f4;
  }
  .pg-item:hover {
    background: #efefef;
  }
  .pg-item.sel {
    background: var(--w98-highlight);
    color: #fff;
  }

  .pg-mini-swatches {
    display: flex;
    gap: 0;
    flex-shrink: 0;
  }
  .ms {
    display: inline-block;
    width: 8px;
    height: 10px;
    border: 0.5px solid rgba(0, 0, 0, 0.1);
  }
  .ms-rainbow {
    width: 64px;
    background: linear-gradient(90deg, red, orange, yellow, green, cyan, blue, violet);
  }

  .pg-item-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
  }

  .pg-theme-label {
    display: block;
    font-size: var(--w98-font-size-caption);
    font-weight: normal;
    color: var(--w98-text-hint);
    line-height: 1.1;
  }
  .pg-item.sel .pg-theme-label {
    color: #ccc;
  }

  .pg-color-badge {
    flex-shrink: 0;
    font-size: var(--w98-font-size-caption);
    padding: 0 4px;
    background: #e8e4e0;
    color: #555;
    font-weight: bold;
  }
  .pg-item.sel .pg-color-badge {
    background: #4040a0;
    color: #ddd;
  }

  .pg-check {
    flex-shrink: 0;
    font-size: var(--w98-font-size-action);
    font-weight: bold;
    color: var(--w98-color-success);
  }
  .pg-item.sel .pg-check {
    color: #8f8;
  }

  .pg-custom-toolbar {
    display: flex;
    gap: 1px;
  }
  .pg-new-btn {
    flex: 1;
    padding: 4px 8px;
    font-size: var(--w98-font-size-base);
    font-weight: bold;
    cursor: pointer;
    background: var(--w98-surface-active);
    border: none;
    border-bottom: 1px solid var(--w98-shadow-808);
    box-shadow:
      inset 1px 1px var(--w98-shadow-white),
      inset -1px -1px var(--w98-shadow-808);
    text-align: center;
  }
  .pg-new-btn:hover {
    background: #e0dcd4;
  }

  .pg-fav-btn {
    flex-shrink: 0;
    background: none;
    border: none;
    cursor: pointer;
    font-size: var(--w98-font-size-icon);
    padding: 0 2px;
    color: #ccc;
    min-width: 0;
    min-height: 0;
    box-shadow: none;
    line-height: 1;
  }
  .pg-fav-btn:hover { color: var(--w98-color-warning); }
  .pg-fav-btn.fav-active { color: var(--w98-color-warning); }
  .pg-item.sel .pg-fav-btn { color: #aaa; }
  .pg-item.sel .pg-fav-btn.fav-active { color: #ffd700; }

  .pg-export-btn, .pg-edit-btn, .pg-del-btn {
    flex-shrink: 0;
    background: none;
    border: none;
    cursor: pointer;
    font-size: var(--w98-font-size-sm);
    padding: 0 2px;
    color: var(--w98-text-hint);
    min-width: 0;
    min-height: 0;
    box-shadow: none;
    line-height: 1;
  }
  .pg-edit-btn, .pg-del-btn { font-size: var(--w98-font-size-action); }

  .pg-export-btn:hover { color: var(--w98-color-success); }
  .pg-edit-btn:hover { color: var(--w98-highlight); }
  .pg-del-btn:hover { color: var(--w98-color-error); }
  
  .pg-item.sel .pg-export-btn { color: #aaa; }
  .pg-item.sel .pg-export-btn:hover { color: #8f8; }
  .pg-item.sel .pg-edit-btn { color: #aaa; }
  .pg-item.sel .pg-del-btn { color: #faa; }
  .pg-item.sel .pg-edit-btn:hover { color: #fff; }
  .pg-item.sel .pg-del-btn:hover { color: var(--w98-color-error); }

  .pg-empty {
    padding: 12px;
    color: var(--w98-text-hint);
    text-align: center;
    font-style: italic;
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
