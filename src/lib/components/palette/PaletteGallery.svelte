<script lang="ts">
  import { PALETTE_THEMES, PALETTE_GROUPS, PALETTES, getPaletteName } from '$lib/utils/palettes';
  import type { RGB, PaletteTheme } from '$lib/utils/palettes';
  import { customPaletteStore } from '$lib/stores/customPaletteStore.svelte';
  import CustomPaletteEditor from './CustomPaletteEditor.svelte';
  import { parsePaletteFile, exportAsHex, exportAsGpl, downloadFile } from '$lib/utils/paletteIO';
  import { i18n } from '$lib/i18n/index.svelte';

  let {
    selectedPaletteId = 'original',
    onSelect,
  }: {
    selectedPaletteId: string;
    onSelect: (id: string) => void;
  } = $props();

  let groupMode = $state<'theme' | 'colorCount'>('theme');
  let activeThemeId = $state<string>('_core');
  let activeGroupId = $state<string>('16');
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
    if (!confirm(i18n.t('confirm_delete_palette'))) return;
    customPaletteStore.deletePalette(id);
    if (selectedPaletteId === id) onSelect('original');
  }

  // ─── Palette Import/Export ───
  let importFileInput = $state<HTMLInputElement>();
  let isImporting = $state(false);

  function handleImportClick() {
    importFileInput?.click();
  }

  function handleImportFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;

    isImporting = true;
    let pending = files.length;

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
        if (--pending === 0) isImporting = false;
      };
      reader.onerror = () => {
        if (--pending === 0) isImporting = false;
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
      if (!raw) return new Set();
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return new Set();
      return new Set(parsed.filter((v: unknown) => typeof v === 'string'));
    } catch {
      return new Set();
    }
  }

  function saveFavorites() {
    try {
      localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify([...favorites]));
    } catch {
      /* ignore */
    }
  }

  function toggleFavorite(id: string, e: MouseEvent) {
    e.stopPropagation();
    if (favorites.has(id)) favorites.delete(id);
    else favorites.add(id);
    favorites = new Set(favorites);
    saveFavorites();
  }

  // ─── Theme tabs (dynamic based on groupMode) ───
  interface ThemeTab {
    id: string;
    label: string;
  }

  let activeTabs = $derived.by<ThemeTab[]>(() => {
    const special: ThemeTab[] = [
      { id: '_favorites', label: '⭐' },
      { id: '_custom', label: `✏️ ${i18n.t('gallery_custom')}` },
      { id: '_core', label: `📁 ${i18n.t('gallery_core')}` },
    ];
    if (groupMode === 'theme') {
      return [...special, ...PALETTE_THEMES.map((t) => ({ id: t.themeId, label: t.themeName }))];
    } else {
      return [...special, ...PALETTE_GROUPS.map((g) => ({ id: `g_${g.groupId}`, label: g.groupName }))];
    }
  });

  // Active tab ID (switches between theme/group namespaces)
  let activeTabId = $derived(
    activeThemeId.startsWith('_') ? activeThemeId
    : groupMode === 'theme' ? activeThemeId
    : `g_${activeGroupId}`
  );

  function setActiveTab(tabId: string) {
    if (tabId.startsWith('_')) {
      activeThemeId = tabId;
    } else if (groupMode === 'theme') {
      activeThemeId = tabId;
    } else {
      activeGroupId = tabId.replace('g_', '');
      activeThemeId = tabId; // keep in sync for special tab detection
    }
  }

  // ─── Active theme data ───
  interface VariantItem {
    id: string;
    name: string;
    colorCount: number;
    colors: RGB[] | null;
    isCustom?: boolean;
    themeName?: string;
  }

  // Palette lookup for detail view (built-in palettes)
  const builtinPaletteLookup = new Map<string, VariantItem>();
  builtinPaletteLookup.set('original', {
    id: 'original',
    name: i18n.t('palette_original_full_color'),
    colorCount: 0,
    colors: null,
  });
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

  // Dynamic lookup including custom palettes (memoized via $derived)
  let allPaletteLookup = $derived.by<Map<string, VariantItem>>(() => {
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
  });

  let activeVariants = $derived.by<VariantItem[]>(() => {
    const lookup = allPaletteLookup;
    const tabId = activeTabId;

    // Special tabs (shared across both modes)
    if (tabId === '_favorites') {
      return [...favorites].map((id) => lookup.get(id)).filter(Boolean) as VariantItem[];
    }
    if (tabId === '_custom') {
      return customPaletteStore.palettes.map((p) => ({
        id: p.id,
        name: p.name,
        colorCount: p.colors.length,
        colors: p.colors,
        isCustom: true,
      }));
    }
    if (tabId === '_core') {
      return [{ id: 'original', name: i18n.t('palette_original'), colorCount: 0, colors: null }];
    }

    if (groupMode === 'theme') {
      // Theme mode: show variants of selected theme
      const theme = PALETTE_THEMES.find((t) => t.themeId === tabId);
      if (!theme) return [];
      return theme.variants.map((v) => ({
        id: v.id,
        name: i18n.t('gallery_n_colors').replace('{0}', String(v.colorCount)),
        colorCount: v.colorCount,
        colors: PALETTES[v.id] || null,
      }));
    } else {
      // Color count mode: show all palettes in the selected color-count group
      const gid = activeGroupId;
      const group = PALETTE_GROUPS.find((g) => g.groupId === gid);
      if (!group) return [];
      return group.palettes.map((p) => {
        const colors = PALETTES[p.id] || null;
        return {
          id: p.id,
          name: getPaletteName(p.id),
          colorCount: colors ? colors.length : 0,
          colors,
          themeName: p.theme,
        };
      });
    }
  });

  let activeThemeName = $derived.by(() => {
    const tabId = activeTabId;
    if (tabId === '_favorites') return i18n.t('palette_tab_favorites');
    if (tabId === '_custom') return i18n.t('palette_tab_custom');
    if (tabId === '_core') return i18n.t('palette_tab_core');
    if (groupMode === 'theme') {
      return PALETTE_THEMES.find((t) => t.themeId === tabId)?.themeName ?? '';
    } else {
      return PALETTE_GROUPS.find((g) => g.groupId === activeGroupId)?.groupName ?? '';
    }
  });

  // Detail panel for hovered or selected palette
  let detailItem = $derived.by<VariantItem | null>(() => {
    const id = hoveredPaletteId || selectedPaletteId;
    return allPaletteLookup.get(id) || null;
  });
</script>

<div class="pg">
  {#if showEditor}
    <CustomPaletteEditor
      initialName={editorInitialName}
      initialColors={editorInitialColors}
      onSave={handleEditorSave}
      onCancel={() => {
        showEditor = false;
      }}
    />
  {:else}
    <!-- Mode toggle + tabs -->
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
          onclick={() => setActiveTab(tab.id)}>{tab.label}</button
        >
      {/each}
    </div>

    <div class="pg-content">
      <!-- Left: Variant list (color count options) -->
      <div class="pg-list-panel">
        {#if activeThemeId === '_custom'}
          <div class="pg-custom-toolbar">
            <button class="pg-new-btn" onclick={openNewPaletteEditor}>{i18n.t('new_palette')}</button>
            <button class="pg-new-btn" onclick={handleImportClick} disabled={isImporting}>
              {isImporting ? '⏳' : '📥'} {isImporting ? i18n.t('loading') : i18n.t('import_palette')}
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
              onmouseenter={() => (hoveredPaletteId = item.id)}
              onmouseleave={() => (hoveredPaletteId = null)}
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
                  aria-label="{i18n.t('export_as_hex')} {item.name}">💾</button
                >
                <button
                  class="pg-edit-btn"
                  onclick={(e) => {
                    e.stopPropagation();
                    openEditPaletteEditor(item.id);
                  }}
                  title={i18n.t('edit_palette')}
                  aria-label="{i18n.t('edit_palette')} {item.name}">✎</button
                >
                <button
                  class="pg-del-btn"
                  onclick={(e) => handleDeletePalette(item.id, e)}
                  title={i18n.t('delete_palette')}
                  aria-label="{i18n.t('delete_palette')} {item.name}">×</button
                >
              {:else}
                <button
                  class="pg-fav-btn"
                  class:fav-active={favorites.has(item.id)}
                  onclick={(e) => toggleFavorite(item.id, e)}
                  title={favorites.has(item.id) ? i18n.t('remove_from_favorites') : i18n.t('add_to_favorites')}
                  aria-label={favorites.has(item.id) ? i18n.t('remove_from_favorites') : i18n.t('add_to_favorites')}>{favorites.has(item.id) ? '★' : '☆'}</button
                >
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

      <!-- Right: Detail / swatch grid -->
      <div class="pg-detail">
        {#if detailItem}
          <fieldset>
            <legend>{activeThemeName} — {detailItem.name}</legend>
            <p class="pg-desc">
              {detailItem.colorCount > 0
                ? i18n.t('gallery_n_colors').replace('{0}', String(detailItem.colorCount))
                : i18n.t('full_color_desc')}
            </p>
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
                <p>{i18n.t('full_color_desc')}</p>
              </div>
            {/if}
          </fieldset>
        {:else}
          <p class="pg-hint">{i18n.t('select_palette_hint')}</p>
        {/if}
      </div>
    </div>

    <!-- Status bar -->
    <div class="status-bar pg-status">
      <p class="status-bar-field">
        {activeThemeName} — {i18n.t('gallery_variants').replace('{0}', String(activeVariants.length))}
      </p>
      <p class="status-bar-field">
        {i18n.t('gallery_active')}: {selectedPaletteId}
      </p>
    </div>
  {/if}
</div>

<style>
  .pg {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: var(--w98-surface);
    min-height: 0;
    overflow: hidden;
    font-size: var(--w98-font-size-base);
  }

  /* ── Mode bar ── */
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

  /* ── Toolbar ── */
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

  /* ── Custom Toolbar (New + Import) ── */
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

  /* ── Favorite button ── */
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
  .pg-fav-btn:hover {
    color: var(--w98-color-warning);
  }
  .pg-fav-btn.fav-active {
    color: var(--w98-color-warning);
  }
  .pg-item.sel .pg-fav-btn {
    color: #aaa;
  }
  .pg-item.sel .pg-fav-btn.fav-active {
    color: #ffd700;
  }

  /* ── Export/Edit/Delete buttons for custom palettes ── */
  .pg-export-btn {
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
  .pg-export-btn:hover {
    color: var(--w98-color-success);
  }
  .pg-item.sel .pg-export-btn {
    color: #aaa;
  }
  .pg-item.sel .pg-export-btn:hover {
    color: #8f8;
  }

  .pg-edit-btn,
  .pg-del-btn {
    flex-shrink: 0;
    background: none;
    border: none;
    cursor: pointer;
    font-size: var(--w98-font-size-action);
    padding: 0 2px;
    color: var(--w98-text-hint);
    min-width: 0;
    min-height: 0;
    box-shadow: none;
    line-height: 1;
  }
  .pg-edit-btn:hover {
    color: var(--w98-highlight);
  }
  .pg-del-btn:hover {
    color: var(--w98-color-error);
  }
  .pg-item.sel .pg-edit-btn {
    color: #aaa;
  }
  .pg-item.sel .pg-del-btn {
    color: #faa;
  }
  .pg-item.sel .pg-edit-btn:hover {
    color: #fff;
  }
  .pg-item.sel .pg-del-btn:hover {
    color: var(--w98-color-error);
  }

  /* ── Empty state ── */
  .pg-empty {
    padding: 12px;
    color: var(--w98-text-hint);
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
    color: var(--w98-text-secondary);
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
    border: 1px solid rgba(0, 0, 0, 0.15);
    cursor: crosshair;
    flex-shrink: 0;
  }
  .pg-swatch:hover {
    outline: 2px solid var(--w98-highlight);
    outline-offset: -1px;
    z-index: 1;
    position: relative;
  }

  .pg-info-box {
    padding: 8px;
    background: #f8f8f8;
    border: 1px inset;
  }
  .pg-info-box p {
    margin: 0 0 6px 0;
  }

  .pg-hint {
    color: var(--w98-text-hint);
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
    .pg-item {
      padding: 6px 5px;
      min-height: 36px;
    }
    .pg-detail {
      flex: 0 0 auto;
      max-height: 100px;
      overflow-y: auto;
      padding: 3px 0 0 0;
      border-top: 1px solid var(--w98-shadow-808);
    }
    .pg-mode-bar {
      padding: 1px 2px 0 2px;
    }
    .pg-mode-btn {
      padding: 2px 4px;
      font-size: var(--w98-font-size-caption);
    }
    .pg-toolbar {
      gap: 0;
      padding: 1px 2px;
    }
    .pg-toolbtn {
      padding: 2px 4px;
      font-size: var(--w98-font-size-caption);
    }
    .pg-export-btn,
    .pg-edit-btn,
    .pg-del-btn,
    .pg-fav-btn {
      min-width: 32px;
      min-height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--w98-font-size-icon);
    }
  }
</style>
