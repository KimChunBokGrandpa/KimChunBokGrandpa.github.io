<script lang="ts">
  import { PALETTE_THEMES, PALETTES, getPaletteName } from '../utils/palettes';
  import type { RGB, PaletteTheme } from '../utils/palettes';
  import { customPaletteStore } from '../stores/customPaletteStore.svelte';
  import CustomPaletteEditor from './CustomPaletteEditor.svelte';
  import { parsePaletteFile, exportAsHex, exportAsGpl, downloadFile } from '../utils/paletteIO';

  let {
    selectedPaletteId = 'original',
    onSelect,
  }: {
    selectedPaletteId: string;
    onSelect: (id: string) => void;
  } = $props();

  let activeThemeId = $state<string>('_core');
  let hoveredPaletteId = $state<string | null>(null);

  // ─── Custom Palette Editor State ───
  let showEditor = $state(false);
  let editingPaletteId = $state<string | null>(null);
  let editorInitialName = $state('');
  let editorInitialColors = $state<RGB[]>([]);

  function openNewPaletteEditor() {
    editingPaletteId = null;
    editorInitialName = '';
    editorInitialColors = [];
    showEditor = true;
  }

  function openEditPaletteEditor(id: string) {
    const p = customPaletteStore.getPaletteById(id);
    if (!p) return;
    editingPaletteId = id;
    editorInitialName = p.name;
    editorInitialColors = p.colors;
    showEditor = true;
  }

  function handleEditorSave(name: string, colors: RGB[]) {
    if (editingPaletteId) {
      customPaletteStore.updatePalette(editingPaletteId, name, colors);
    } else {
      const newPalette = customPaletteStore.addPalette(name, colors);
      onSelect(newPalette.id);
    }
    showEditor = false;
  }

  function handleDeletePalette(id: string, e: MouseEvent) {
    e.stopPropagation();
    customPaletteStore.deletePalette(id);
    if (selectedPaletteId === id) onSelect('original');
  }

  // ─── Palette Import/Export ───
  let importFileInput = $state<HTMLInputElement>();

  function handleImportClick() {
    importFileInput?.click();
  }

  function handleImportFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;

    for (const file of files) {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        const parsed = parsePaletteFile(text, file.name);
        if (parsed) {
          const newPalette = customPaletteStore.addPalette(parsed.name, parsed.colors);
          onSelect(newPalette.id);
          activeThemeId = '_custom';
        }
      };
      reader.readAsText(file);
    }
    input.value = ''; // reset so same file can be re-imported
  }

  function handleExportPalette(id: string, format: 'hex' | 'gpl', e: MouseEvent) {
    e.stopPropagation();
    const palette = customPaletteStore.getPaletteById(id);
    if (!palette) return;
    const safeName = palette.name.replace(/[^a-zA-Z0-9_-]/g, '_') || 'palette';
    if (format === 'hex') {
      downloadFile(exportAsHex(palette.colors), `${safeName}.hex`);
    } else {
      downloadFile(exportAsGpl(palette.name, palette.colors), `${safeName}.gpl`);
    }
  }

  // ─── Favorites ───
  const FAV_STORAGE_KEY = 'retro-pixel-favorites';
  let favorites = $state<Set<string>>(loadFavorites());

  function loadFavorites(): Set<string> {
    try {
      const raw = localStorage.getItem(FAV_STORAGE_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
  }

  function saveFavorites() {
    try { localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify([...favorites])); }
    catch { /* ignore */ }
  }

  function toggleFavorite(id: string, e: MouseEvent) {
    e.stopPropagation();
    if (favorites.has(id)) favorites.delete(id);
    else favorites.add(id);
    favorites = new Set(favorites);
    saveFavorites();
  }

  // ─── Theme tabs ───
  interface ThemeTab {
    id: string;
    label: string;
  }

  const themeTabs: ThemeTab[] = [
    { id: '_favorites', label: '⭐' },
    { id: '_custom', label: '✏️ Custom' },
    { id: '_core', label: '📁 Core' },
    ...PALETTE_THEMES.map(t => ({ id: t.themeId, label: t.themeName })),
  ];

  // ─── Active theme data ───
  interface VariantItem {
    id: string;
    name: string;
    colorCount: number;
    colors: RGB[] | null;
    isCustom?: boolean;
  }

  // Palette lookup for detail view (built-in palettes)
  const builtinPaletteLookup = new Map<string, VariantItem>();
  builtinPaletteLookup.set('original', { id: 'original', name: 'Original (Full Color)', colorCount: 0, colors: null });
  for (const t of PALETTE_THEMES) {
    for (const v of t.variants) {
      builtinPaletteLookup.set(v.id, {
        id: v.id,
        name: getPaletteName(v.id),
        colorCount: v.colorCount,
        colors: PALETTES[v.id] || null,
      });
    }
  }

  // Dynamic lookup including custom palettes
  function getAllPaletteLookup(): Map<string, VariantItem> {
    const map = new Map(builtinPaletteLookup);
    for (const p of customPaletteStore.palettes) {
      map.set(p.id, {
        id: p.id,
        name: p.name,
        colorCount: p.colors.length,
        colors: p.colors,
        isCustom: true,
      });
    }
    return map;
  }

  let activeVariants = $derived.by<VariantItem[]>(() => {
    const lookup = getAllPaletteLookup();
    if (activeThemeId === '_favorites') {
      return [...favorites].map(id => lookup.get(id)).filter(Boolean) as VariantItem[];
    }
    if (activeThemeId === '_custom') {
      return customPaletteStore.palettes.map(p => ({
        id: p.id,
        name: p.name,
        colorCount: p.colors.length,
        colors: p.colors,
        isCustom: true,
      }));
    }
    if (activeThemeId === '_core') {
      return [
        { id: 'original', name: 'Original (Full Color)', colorCount: 0, colors: null },
      ];
    }
    const theme = PALETTE_THEMES.find(t => t.themeId === activeThemeId);
    if (!theme) return [];
    return theme.variants.map(v => ({
      id: v.id,
      name: `${v.colorCount} colors`,
      colorCount: v.colorCount,
      colors: PALETTES[v.id] || null,
    }));
  });

  let activeThemeName = $derived(
    activeThemeId === '_favorites' ? 'Favorites'
    : activeThemeId === '_custom' ? 'Custom'
    : activeThemeId === '_core' ? 'Core'
    : PALETTE_THEMES.find(t => t.themeId === activeThemeId)?.themeName ?? ''
  );

  // Detail panel for hovered or selected palette
  let detailItem = $derived.by<VariantItem | null>(() => {
    const id = hoveredPaletteId || selectedPaletteId;
    return getAllPaletteLookup().get(id) || null;
  });
</script>

<div class="pg">
  {#if showEditor}
    <CustomPaletteEditor
      initialName={editorInitialName}
      initialColors={editorInitialColors}
      onSave={handleEditorSave}
      onCancel={() => { showEditor = false; }}
    />
  {:else}
    <!-- Theme tabs -->
    <div class="pg-toolbar">
      {#each themeTabs as tab}
        <button
          class="pg-toolbtn"
          class:tb-sel={activeThemeId === tab.id}
          onclick={() => activeThemeId = tab.id}
        >{tab.label}</button>
      {/each}
    </div>

    <div class="pg-content">
      <!-- Left: Variant list (color count options) -->
      <div class="pg-list-panel">
        {#if activeThemeId === '_custom'}
          <div class="pg-custom-toolbar">
            <button class="pg-new-btn" onclick={openNewPaletteEditor}>
              + New
            </button>
            <button class="pg-new-btn" onclick={handleImportClick}>
              📥 Import
            </button>
          </div>
          <input
            bind:this={importFileInput}
            type="file"
            accept=".hex,.gpl,.txt"
            multiple
            onchange={handleImportFile}
            style="display:none"
          />
        {/if}
        <div class="pg-list" role="listbox">
          {#each activeVariants as item}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
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
              onmouseenter={() => hoveredPaletteId = item.id}
              onmouseleave={() => hoveredPaletteId = null}
            >
              <!-- Mini swatch strip -->
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
              <span class="pg-item-name">{item.name}</span>
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
                  title="Export as .hex"
                  aria-label="Export {item.name}"
                >💾</button>
                <button
                  class="pg-edit-btn"
                  onclick={(e) => { e.stopPropagation(); openEditPaletteEditor(item.id); }}
                  title="Edit palette"
                  aria-label="Edit {item.name}"
                >✎</button>
                <button
                  class="pg-del-btn"
                  onclick={(e) => handleDeletePalette(item.id, e)}
                  title="Delete palette"
                  aria-label="Delete {item.name}"
                >×</button>
              {:else}
                <button
                  class="pg-fav-btn"
                  class:fav-active={favorites.has(item.id)}
                  onclick={(e) => toggleFavorite(item.id, e)}
                  title={favorites.has(item.id) ? 'Remove from favorites' : 'Add to favorites'}
                  aria-label="Toggle favorite"
                >{favorites.has(item.id) ? '★' : '☆'}</button>
              {/if}
            </div>
          {/each}
          {#if activeThemeId === '_custom' && activeVariants.length === 0}
            <div class="pg-empty">No custom palettes yet. Click "+ New Palette" to create one.</div>
          {/if}
        </div>
      </div>

      <!-- Right: Detail / swatch grid -->
      <div class="pg-detail">
        {#if detailItem}
          <fieldset>
            <legend>{activeThemeName} — {detailItem.name}</legend>
            <p class="pg-desc">{detailItem.colorCount > 0 ? `${detailItem.colorCount} colors` : 'Full color spectrum preserved'}</p>
            {#if detailItem.colors}
              <div class="pg-grid">
                {#each detailItem.colors as c}
                  <span
                    class="pg-swatch"
                    style="background:rgb({c.r},{c.g},{c.b})"
                    title="rgb({c.r}, {c.g}, {c.b})"
                  ></span>
                {/each}
              </div>
            {:else}
              <div class="pg-info-box">
                <p>Full color spectrum preserved</p>
              </div>
            {/if}
          </fieldset>
        {:else}
          <p class="pg-hint">Select a palette to view details</p>
        {/if}
      </div>
    </div>

    <!-- Status bar -->
    <div class="status-bar pg-status">
      <p class="status-bar-field">
        {activeThemeName} — {activeVariants.length} variant(s)
      </p>
      <p class="status-bar-field">
        Active: {selectedPaletteId}
      </p>
    </div>
  {/if}
</div>

<style>
  .pg {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: #c0c0c0;
    min-height: 0;
    overflow: hidden;
    font-size: 11px;
  }

  /* ── Toolbar ── */
  .pg-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 1px;
    padding: 2px 3px;
    border-bottom: 1px solid #808080;
    flex-shrink: 0;
    background: #c0c0c0;
  }
  .pg-toolbtn {
    padding: 2px 6px;
    font-size: 10px;
    font-family: inherit;
    background: #d4d0c8;
    border: 1px solid transparent;
    border-bottom: none;
    cursor: pointer;
    box-shadow: inset 1px 1px #fff, inset -1px -1px #808080;
  }
  .pg-toolbtn:hover { background: #e0dcd4; }
  .pg-toolbtn.tb-sel {
    background: #c0c0c0;
    font-weight: bold;
    box-shadow: inset -1px -1px #fff, inset 1px 1px #808080;
  }

  /* ── Custom Toolbar (New + Import) ── */
  .pg-custom-toolbar {
    display: flex;
    gap: 1px;
  }
  .pg-new-btn {
    flex: 1;
    padding: 4px 8px;
    font-size: 11px;
    font-weight: bold;
    cursor: pointer;
    background: #d4d0c8;
    border: none;
    border-bottom: 1px solid #808080;
    box-shadow: inset 1px 1px #fff, inset -1px -1px #808080;
    text-align: center;
  }
  .pg-new-btn:hover { background: #e0dcd4; }

  /* ── Content (list + detail) ── */
  .pg-content {
    flex: 1;
    display: flex;
    gap: 0;
    min-height: 0;
    margin: 3px;
    overflow: hidden;
  }

  /* ── List panel ── */
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
  .pg-item:hover { background: #efefef; }
  .pg-item.sel {
    background: #000080;
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
    border: 0.5px solid rgba(0,0,0,0.1);
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

  .pg-color-badge {
    flex-shrink: 0;
    font-size: 9px;
    padding: 0 4px;
    border-radius: 3px;
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
    font-size: 12px;
    font-weight: bold;
    color: #0a0;
  }
  .pg-item.sel .pg-check { color: #8f8; }

  /* ── Favorite button ── */
  .pg-fav-btn {
    flex-shrink: 0;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 13px;
    padding: 0 2px;
    color: #ccc;
    min-width: 0;
    min-height: 0;
    box-shadow: none;
    line-height: 1;
  }
  .pg-fav-btn:hover { color: #e8a000; }
  .pg-fav-btn.fav-active { color: #e8a000; }
  .pg-item.sel .pg-fav-btn { color: #aaa; }
  .pg-item.sel .pg-fav-btn.fav-active { color: #ffd700; }

  /* ── Export/Edit/Delete buttons for custom palettes ── */
  .pg-export-btn {
    flex-shrink: 0;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 10px;
    padding: 0 2px;
    color: #888;
    min-width: 0;
    min-height: 0;
    box-shadow: none;
    line-height: 1;
  }
  .pg-export-btn:hover { color: #008000; }
  .pg-item.sel .pg-export-btn { color: #aaa; }
  .pg-item.sel .pg-export-btn:hover { color: #8f8; }

  .pg-edit-btn, .pg-del-btn {
    flex-shrink: 0;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 12px;
    padding: 0 2px;
    color: #888;
    min-width: 0;
    min-height: 0;
    box-shadow: none;
    line-height: 1;
  }
  .pg-edit-btn:hover { color: #000080; }
  .pg-del-btn:hover { color: #cc0000; }
  .pg-item.sel .pg-edit-btn { color: #aaa; }
  .pg-item.sel .pg-del-btn { color: #faa; }
  .pg-item.sel .pg-edit-btn:hover { color: #fff; }
  .pg-item.sel .pg-del-btn:hover { color: #ff4444; }

  /* ── Empty state ── */
  .pg-empty {
    padding: 12px;
    color: #888;
    text-align: center;
    font-style: italic;
  }

  /* ── Detail panel ── */
  .pg-detail {
    flex: 1;
    min-width: 0;
    overflow-y: auto;
    padding: 0 0 0 3px;
  }
  .pg-detail fieldset {
    margin: 0;
    padding: 6px;
    min-width: 0;
  }
  .pg-detail legend {
    font-weight: bold;
    padding: 0 4px;
  }

  .pg-desc {
    margin: 0 0 6px 0;
    color: #444;
    font-style: italic;
  }

  .pg-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 1px;
  }
  .pg-swatch {
    width: 14px;
    height: 14px;
    border: 1px solid rgba(0,0,0,0.15);
    cursor: crosshair;
    flex-shrink: 0;
  }
  .pg-swatch:hover {
    outline: 2px solid #000080;
    outline-offset: -1px;
    z-index: 1;
    position: relative;
  }

  .pg-info-box {
    padding: 8px;
    background: #f8f8f8;
    border: 1px inset;
  }
  .pg-info-box p { margin: 0 0 6px 0; }

  .pg-hint {
    color: #888;
    text-align: center;
    margin-top: 20px;
    font-style: italic;
  }

  /* Status bar */
  .pg-status {
    margin: 0 3px 3px 3px;
    flex-shrink: 0;
  }

  @media (max-width: 550px) {
    .pg-content {
      flex-direction: column;
      overflow: hidden;
    }
    .pg-list-panel {
      flex: 1;
      min-height: 60px;
      overflow: hidden;
    }
    .pg-list {
      overflow-y: auto;
    }
    .pg-detail {
      flex: 0 0 auto;
      max-height: 140px;
      overflow-y: auto;
      padding: 3px 0 0 0;
    }
    .pg-toolbar {
      gap: 0;
      padding: 1px 2px;
    }
    .pg-toolbtn {
      padding: 2px 4px;
      font-size: 9px;
    }
  }
</style>
