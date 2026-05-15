<script lang="ts">
  import { paletteThemes, paletteGroups, palettes, getPaletteFamily, getPaletteName } from '$lib/utils/palettes';
  import type { RGB } from '$lib/utils/palettes';
  import { getPresetFamilyLabelKey } from '$lib/utils/presets';
  import { customPaletteStore } from '$lib/stores/customPaletteStore.svelte';
  import CustomPaletteEditor from './CustomPaletteEditor.svelte';
  import { parsePaletteFile, exportAsHex, exportAsGpl, downloadFile } from '$lib/utils/paletteIO';
  import { extractPaletteFromImage } from '$lib/utils/paletteExtractor';
  import { recommendPalettesFromImage, type PaletteRecommendation } from '$lib/utils/paletteRecommender';
  import { blendPalettes } from '$lib/utils/colorUtils';
  import { i18n } from '$lib/i18n/index.svelte';
  import type { ThemeTab, VariantItem } from './types';
  import PaletteToolbar from './PaletteToolbar.svelte';
  import PaletteList from './PaletteList.svelte';
  import PaletteDetail from './PaletteDetail.svelte';
  import { dialogStore } from '$lib/stores/dialogStore.svelte';

  let {
    selectedPaletteId = 'original',
    onSelect,
    imageSrc = null,
  }: {
    selectedPaletteId: string;
    onSelect: (id: string) => void;
    imageSrc?: string | null;
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

  // ─── Palette Recommendation ───
  let recommendations = $state<PaletteRecommendation[]>([]);
  let isRecommending = $state(false);
  let recommendationRequestId = 0;

  // Auto-recommend when image changes
  $effect(() => {
    const requestId = ++recommendationRequestId;
    if (!imageSrc) { recommendations = []; return; }
    isRecommending = true;
    recommendPalettesFromImage(imageSrc, 5)
      .then(r => {
        if (requestId !== recommendationRequestId) return;
        recommendations = r;
      })
      .catch(() => {
        if (requestId !== recommendationRequestId) return;
        recommendations = [];
      })
      .finally(() => {
        if (requestId !== recommendationRequestId) return;
        isRecommending = false;
      });
  });

  // ─── Palette Extraction from Image ───
  let isExtracting = $state(false);

  async function handleExtractFromImage() {
    if (!imageSrc) return;
    isExtracting = true;
    try {
      const colors = await extractPaletteFromImage(imageSrc, 8);
      if (colors.length >= 2) {
        editingPaletteId = null;
        editorInitialName = 'Extracted Palette';
        editorInitialColors = colors;
        showEditor = true;
        activeThemeId = '_custom';
      }
    } catch (err) {
      console.error('Palette extraction failed:', err);
    } finally {
      isExtracting = false;
    }
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

  async function handleDeletePalette(id: string, e: MouseEvent) {
    e.stopPropagation();
    const shouldDelete = await dialogStore.requestConfirm({
      title: i18n.t('dialog_delete_palette_title'),
      message: i18n.t('confirm_delete_palette'),
      confirmLabel: i18n.t('delete_palette'),
      cancelLabel: i18n.t('cancel'),
    });
    if (!shouldDelete) return;
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

    const binaryExtensions = ['act', 'ase', 'pal'];

    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      const isBinary = binaryExtensions.includes(ext);

      if (isBinary) {
        // Read both text and binary for formats that may be either
        const textReader = new FileReader();
        const binReader = new FileReader();
        let textResult: string | null = null;
        let binResult: ArrayBuffer | null = null;
        let doneCount = 0;

        const tryParse = () => {
          if (++doneCount < 2) return;
          const parsed = parsePaletteFile(textResult ?? '', file.name, binResult ?? undefined);
          if (parsed) {
            const newPalette = customPaletteStore.addPalette(parsed.name, parsed.colors);
            onSelect(newPalette.id);
            activeThemeId = '_custom';
          }
          if (--pending === 0) isImporting = false;
        };

        textReader.onload = () => { textResult = textReader.result as string; tryParse(); };
        textReader.onerror = () => tryParse();
        binReader.onload = () => { binResult = binReader.result as ArrayBuffer; tryParse(); };
        binReader.onerror = () => tryParse();

        textReader.readAsText(file);
        binReader.readAsArrayBuffer(file);
      } else {
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
  const favoritesStorageKey = 'retro-pixel-favorites';
  let favorites = $state<Set<string>>(loadFavorites());

  function loadFavorites(): Set<string> {
    try {
      const raw = localStorage.getItem(favoritesStorageKey);
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
      localStorage.setItem(favoritesStorageKey, JSON.stringify([...favorites]));
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

  // ─── Palette Blending ───
  let blendMode = $state(false);
  let blendSourceId = $state<string | null>(null);
  let blendFactor = $state(0.5);

  function startBlend() {
    blendSourceId = selectedPaletteId;
    blendFactor = 0.5;
    blendMode = true;
  }

  function cancelBlend() {
    blendMode = false;
    blendSourceId = null;
    blendFactor = 0.5;
  }

  function getDisplayPaletteName(id: string): string {
    if (id === 'original') return i18n.t('palette_original_full_color');
    if (id.startsWith('custom_')) {
      return customPaletteStore.getPaletteById(id)?.name ?? id;
    }
    return getPaletteName(id);
  }

  let selectedPaletteName = $derived(getDisplayPaletteName(selectedPaletteId));
  let selectedPaletteFamilyLabel = $derived(
    i18n.t(getPresetFamilyLabelKey(getPaletteFamily(selectedPaletteId)))
  );

  function getColorsForId(id: string): RGB[] {
    if (id === 'original') return [];
    if (id.startsWith('custom_')) {
      return customPaletteStore.getPaletteById(id)?.colors ?? [];
    }
    return palettes[id] ?? [];
  }

  let blendedColors = $derived.by(() => {
    if (!blendMode || !blendSourceId || blendSourceId === selectedPaletteId) return null;
    const src = getColorsForId(blendSourceId);
    const tgt = getColorsForId(selectedPaletteId);
    if (src.length === 0 || tgt.length === 0) return null;
    return blendPalettes(src, tgt, blendFactor);
  });

  function saveBlendedPalette() {
    if (!blendedColors || blendedColors.length === 0) return;
    const srcName = getDisplayPaletteName(blendSourceId!);
    const tgtName = getDisplayPaletteName(selectedPaletteId);
    const name = `${srcName} × ${tgtName} (${Math.round(blendFactor * 100)}%)`;
    const newPalette = customPaletteStore.addPalette(name, blendedColors);
    onSelect(newPalette.id);
    activeThemeId = '_custom';
    cancelBlend();
  }

  // ─── Theme tabs (dynamic based on groupMode) ───
  let activeTabs = $derived.by<ThemeTab[]>(() => {
    const special: ThemeTab[] = [
      { id: '_favorites', label: '⭐' },
      { id: '_custom', label: `✏️ ${i18n.t('gallery_custom')}` },
      { id: '_core', label: `📁 ${i18n.t('gallery_core')}` },
    ];
    if (groupMode === 'theme') {
      return [...special, ...paletteThemes.map((t) => ({ id: t.themeId, label: t.themeName }))];
    } else {
      return [...special, ...paletteGroups.map((g) => ({ id: `g_${g.groupId}`, label: g.groupName }))];
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

  // Palette lookup for detail view (built-in palettes)
  const builtinPaletteLookup = new Map<string, VariantItem>();
  builtinPaletteLookup.set('original', {
    id: 'original',
    name: i18n.t('palette_original_full_color'),
    colorCount: 0,
    colors: null,
  });
  for (const t of paletteThemes) {
    for (const v of t.variants) {
      builtinPaletteLookup.set(v.id, {
        id: v.id,
        name: getPaletteName(v.id),
        colorCount: v.colorCount,
        colors: palettes[v.id] || null,
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
      const theme = paletteThemes.find((t) => t.themeId === tabId);
      if (!theme) return [];
      return theme.variants.map((v) => ({
        id: v.id,
        name: i18n.t('gallery_n_colors').replace('{0}', String(v.colorCount)),
        colorCount: v.colorCount,
        colors: palettes[v.id] || null,
      }));
    } else {
      // Color count mode: show all palettes in the selected color-count group
      const gid = activeGroupId;
      const group = paletteGroups.find((g) => g.groupId === gid);
      if (!group) return [];
      return group.palettes.map((p) => {
        const colors = palettes[p.id] || null;
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
      return paletteThemes.find((t) => t.themeId === tabId)?.themeName ?? '';
    } else {
      return paletteGroups.find((g) => g.groupId === activeGroupId)?.groupName ?? '';
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
    <div class="pg-current-bar w98-toolbar" data-testid="palette-current-summary">
      <span class="pg-current-label">{i18n.t('gallery_active')}</span>
      <span class="pg-current-name w98-chip w98-chip--active" title={selectedPaletteName}>
        {selectedPaletteName}
      </span>
      <span class="pg-current-family w98-chip">{selectedPaletteFamilyLabel}</span>
    </div>

    <PaletteToolbar
      bind:groupMode
      bind:activeThemeId
      bind:activeGroupId
      {activeTabs}
      {activeTabId}
      {setActiveTab}
    />

    <div class="pg-content">
      <PaletteList
        {activeThemeId}
        {activeVariants}
        {selectedPaletteId}
        bind:hoveredPaletteId
        {isImporting}
        {favorites}
        {onSelect}
        {openNewPaletteEditor}
        {handleImportClick}
        {handleExportPalette}
        {openEditPaletteEditor}
        {handleDeletePalette}
        {toggleFavorite}
        {handleExtractFromImage}
        {isExtracting}
        hasImage={!!imageSrc}
        {recommendations}
        {isRecommending}
      />

      <input
        bind:this={importFileInput}
        type="file"
        accept=".hex,.gpl,.pal,.ase,.act,.txt"
        multiple
        onchange={handleImportFile}
        style="display:none"
      />

      <PaletteDetail
        {detailItem}
        {activeThemeName}
      />
    </div>

    <!-- Blend Panel -->
    {#if blendMode}
      <div class="blend-panel w98-frame">
        <div class="blend-header w98-panel-titlebar">
          <span class="blend-title w98-panel-title">
            <span class="w98-emoji" aria-hidden="true">🎨</span>
            <span>{i18n.t('blend_palettes')}</span>
          </span>
          <button
            type="button"
            class="blend-close w98-inline-button w98-button--thin w98-window-control-button"
            onclick={cancelBlend}
            aria-label={i18n.t('cancel')}
            title={i18n.t('cancel')}
          >
            ✕
          </button>
        </div>
        <div class="blend-body w98-panel-body">
          <div class="blend-info w98-note">
            {getDisplayPaletteName(blendSourceId!)} ↔ {getDisplayPaletteName(selectedPaletteId)}
          </div>
          <div class="blend-slider-row">
            <span class="blend-label">0%</span>
            <input
              type="range"
              class="blend-slider w98-range"
              min="0"
              max="100"
              value={Math.round(blendFactor * 100)}
              oninput={(e) => { blendFactor = parseInt((e.target as HTMLInputElement).value) / 100; }}
            />
            <span class="blend-current w98-chip w98-chip--active">{Math.round(blendFactor * 100)}%</span>
            <span class="blend-label">100%</span>
          </div>
          {#if blendedColors && blendedColors.length > 0}
            <div class="blend-preview w98-panel-inset-thin">
              {#each blendedColors as c}
                <div class="blend-swatch" style="background:rgb({c.r},{c.g},{c.b})"></div>
              {/each}
            </div>
            <button type="button" class="blend-save-btn w98-button w98-button--primary" onclick={saveBlendedPalette}>
              <span class="w98-emoji" aria-hidden="true">💾</span>
              <span>{i18n.t('blend_save')}</span>
            </button>
          {:else}
            <div class="blend-hint w98-note">{i18n.t('blend_select_target')}</div>
          {/if}
        </div>
      </div>
    {:else if selectedPaletteId !== 'original'}
      <div class="blend-start-row">
        <button type="button" class="blend-start-btn w98-inline-button w98-button--thin" onclick={startBlend}>
          <span aria-hidden="true">🔀</span>
          <span>{i18n.t('blend_start')}</span>
        </button>
      </div>
    {/if}

    <!-- Status bar -->
    <div class="status-bar pg-status">
      <p class="status-bar-field">
        {activeThemeName} — {i18n.t('gallery_variants').replace('{0}', String(activeVariants.length))}
      </p>
      <p class="status-bar-field">
        {i18n.t('gallery_active')}: {selectedPaletteName} · {selectedPaletteFamilyLabel}
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

  /* ── Content (list + detail) ── */
  .pg-content {
    flex: 1;
    display: flex;
    gap: 0;
    min-height: 0;
    margin: 3px;
    overflow: hidden;
  }

  .pg-status {
    margin: 0 3px 3px 3px;
    flex-shrink: 0;
  }

  .pg-current-bar {
    gap: var(--w98-space-4);
    flex-wrap: nowrap;
    margin: 0 3px 3px;
    min-width: 0;
  }

  .pg-current-label {
    flex-shrink: 0;
    color: var(--w98-text-hint);
    font-size: var(--w98-font-size-caption);
    font-weight: bold;
    line-height: 1;
    text-transform: uppercase;
  }

  .pg-current-name,
  .pg-current-family {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .pg-current-name {
    flex: 1;
  }

  .pg-current-family {
    flex-shrink: 0;
    max-width: 116px;
  }

  /* ── Blend Panel ── */
  .blend-panel {
    margin: 0 3px;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }
  .blend-title {
    min-width: 0;
  }
  .blend-close {
    flex-shrink: 0;
  }
  .blend-info {
    text-align: center;
    justify-content: center;
  }
  .blend-slider-row {
    display: flex;
    align-items: center;
    gap: var(--w98-space-4);
  }
  .blend-slider {
    flex: 1;
  }
  .blend-label {
    font-size: var(--w98-font-size-caption);
    color: var(--w98-text-hint);
    min-width: 24px;
    text-align: center;
  }
  .blend-current {
    min-width: 52px;
    justify-content: center;
  }
  .blend-preview {
    display: flex;
    gap: 1px;
    height: 16px;
    padding: 1px;
  }
  .blend-swatch {
    flex: 1;
    min-width: 0;
  }
  .blend-save-btn {
    align-self: center;
  }
  .blend-hint {
    text-align: center;
  }
  .blend-start-row {
    display: flex;
    justify-content: center;
    padding: 2px 3px;
    flex-shrink: 0;
  }
</style>
