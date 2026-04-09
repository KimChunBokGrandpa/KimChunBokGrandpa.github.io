<script lang="ts">
  import { getPaletteName } from '$lib/utils/palettes';
  import { PRESETS, type Preset } from '$lib/utils/presets';
  import type { EffectLayer, ProcessingSettings } from '$lib/types';
  import { i18n } from '$lib/i18n/index.svelte';
  import { getCustomPresets, addCustomPreset, removeCustomPreset, type CustomPreset } from '$lib/stores/customPresetStore.svelte';
  import { getPresetPreview } from '$lib/utils/presetPreview';
  import { recommendStylesFromImage, type StyleRecommendation } from '$lib/utils/styleRecommender';
  import {
    buildPresetShareUrl,
    decodePresetShareInput,
    encodePresetShareCode,
    sanitizeImportedPresetSettings,
  } from '$lib/utils/presetShare';

  let {
    settings = $bindable(),
    imageSrc = null,
    onChange,
    onError,
  }: {
    settings: ProcessingSettings;
    imageSrc?: string | null;
    onChange: () => void;
    onError?: (message: string) => void;
  } = $props();

  // ─── Built-in Presets ───
  function applyPreset(preset: Preset) {
    // Build effectLayers from preset
    const layers: EffectLayer[] = [
      ...preset.glitchFilters
        .filter(f => f.type !== 'none')
        .map(f => ({
          id: crypto.randomUUID(),
          type: 'glitch' as const,
          enabled: true,
          glitchType: f.type,
          intensity: f.intensity,
        })),
      ...(preset.renderMode === 'hqx' ? [{
        id: crypto.randomUUID(),
        type: 'hqx' as const,
        enabled: true,
      }] : []),
    ];
    settings = {
      pixelSize: preset.pixelSize,
      palette: preset.palette,
      crtEffect: preset.crtEffect,
      glitchFilters: preset.glitchFilters.map(f => ({ ...f })),
      renderMode: preset.renderMode === 'hqx' ? 'pixel_perfect' : preset.renderMode,
      glitchSeed: settings.glitchSeed,
      ditherType: preset.ditherType,
      effectLayers: layers,
    };
    onChange();
  }

  function matchesPreset(preset: Preset): boolean {
    if (settings.pixelSize !== preset.pixelSize) return false;
    if (settings.palette !== preset.palette) return false;
    if (settings.crtEffect !== preset.crtEffect) return false;
    if ((settings.ditherType || 'none') !== preset.ditherType) return false;

    // Compare via effectLayers
    const layers = settings.effectLayers || [];
    const enabledGlitch = layers.filter(l => l.type === 'glitch' && l.enabled);
    const hasHqx = layers.some(l => l.type === 'hqx' && l.enabled);

    // Check renderMode: preset hqx should match hqx layer
    if (preset.renderMode === 'hqx') {
      if (!hasHqx) return false;
    } else {
      if (hasHqx) return false;
      if (settings.renderMode !== preset.renderMode) return false;
    }

    // Check glitch filters match
    if (enabledGlitch.length !== preset.glitchFilters.length) return false;
    return preset.glitchFilters.every(pf =>
      enabledGlitch.some(sl => sl.glitchType === pf.type && sl.intensity === pf.intensity)
    );
  }

  // ─── Custom Presets ───
  let showSavePreset = $state(false);
  let newPresetName = $state('');
  let customPresets = $derived(getCustomPresets());
  let presetPreviews = $state<Record<string, string>>({});
  let styleRecommendations = $state<StyleRecommendation[]>([]);
  let isRecommendingStyles = $state(false);
  let styleRecommendationRequestId = 0;

  async function loadPreview(id: string, previewSource: ProcessingSettings, name?: string) {
    if (presetPreviews[id]) return;
    try {
      const preview = await getPresetPreview({ id, name, settings: previewSource });
      presetPreviews = { ...presetPreviews, [id]: preview };
    } catch {
      // Keep preset usable even if thumbnail generation fails.
    }
  }

  $effect(() => {
    PRESETS.forEach((preset) => {
      void loadPreview(
        preset.id,
        {
          pixelSize: preset.pixelSize,
          palette: preset.palette,
          crtEffect: preset.crtEffect,
          glitchFilters: preset.glitchFilters.map((filter) => ({ ...filter })),
          renderMode: preset.renderMode,
          glitchSeed: null,
          ditherType: preset.ditherType,
          effectLayers: [],
        },
      );
    });

    customPresets.forEach((preset) => {
      void loadPreview(preset.id, preset.settings, preset.name);
    });
  });

  $effect(() => {
    const requestId = ++styleRecommendationRequestId;
    if (!imageSrc) {
      styleRecommendations = [];
      isRecommendingStyles = false;
      return;
    }

    isRecommendingStyles = true;
    recommendStylesFromImage(imageSrc, 3)
      .then((recommendations) => {
        if (requestId !== styleRecommendationRequestId) return;
        styleRecommendations = recommendations;
      })
      .catch(() => {
        if (requestId !== styleRecommendationRequestId) return;
        styleRecommendations = [];
      })
      .finally(() => {
        if (requestId !== styleRecommendationRequestId) return;
        isRecommendingStyles = false;
      });
  });

  function saveCurrentAsPreset() {
    if (!newPresetName.trim()) return;
    addCustomPreset(newPresetName, settings);
    newPresetName = '';
    showSavePreset = false;
  }

  function applyCustomPreset(preset: { settings: ProcessingSettings }) {
    settings = {
      ...preset.settings,
      glitchFilters: preset.settings.glitchFilters.map(f => ({ ...f })),
      effectLayers: preset.settings.effectLayers?.map(l => ({ ...l })) || migrateToEffectLayers(preset.settings),
    };
    onChange();
  }

  function customPresetMatches(preset: CustomPreset): boolean {
    return JSON.stringify({
      ...settings,
      glitchFilters: settings.glitchFilters,
      effectLayers: settings.effectLayers || [],
    }) === JSON.stringify({
      ...preset.settings,
      glitchFilters: preset.settings.glitchFilters,
      effectLayers: preset.settings.effectLayers || [],
    });
  }

  // Migrate legacy settings to effectLayers
  function migrateToEffectLayers(s: ProcessingSettings): EffectLayer[] {
    const layers: EffectLayer[] = s.glitchFilters
      .filter(f => f.type !== 'none')
      .map(f => ({
        id: crypto.randomUUID(),
        type: 'glitch' as const,
        enabled: true,
        glitchType: f.type,
        intensity: f.intensity,
      }));
    if (s.renderMode === 'hqx') {
      layers.push({ id: crypto.randomUUID(), type: 'hqx', enabled: true });
    }
    return layers;
  }

  // ─── Preset Sharing ───
  let presetFileInput = $state<HTMLInputElement>();
  let shareImportVisible = $state(false);
  let shareInput = $state('');
  let shareStatus = $state('');
  const shareBasePath = import.meta.env.BASE_URL === '/' ? '' : import.meta.env.BASE_URL.replace(/\/$/, '');

  function exportPreset() {
    const preset = {
      name: i18n.t('custom_preset'),
      version: 1,
      settings: { ...settings, glitchFilters: settings.glitchFilters.map(f => ({ ...f })) },
    };
    const json = JSON.stringify(preset, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pixel-preset.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function importPreset() {
    presetFileInput?.click();
  }

  async function copyShareLink() {
    const shareCode = encodePresetShareCode(settings, i18n.t('custom_preset'));
    const shareUrl = buildPresetShareUrl(shareCode, window.location.origin, shareBasePath);

    try {
      await navigator.clipboard.writeText(shareUrl);
      shareStatus = i18n.t('share_link_copied');
    } catch {
      shareInput = shareUrl;
      shareImportVisible = true;
      shareStatus = i18n.t('copy_failed');
      onError?.(i18n.t('copy_failed'));
    }
  }

  function applySharedPreset() {
    try {
      const shared = decodePresetShareInput(shareInput);
      settings = shared.settings;
      newPresetName = shared.name;
      shareInput = '';
      shareImportVisible = false;
      shareStatus = i18n.t('preset_share_imported');
      onChange();
    } catch {
      const message = i18n.t('preset_error_invalid_share');
      shareStatus = message;
      onError?.(message);
    }
  }

  const MAX_PRESET_FILE_SIZE = 1024 * 1024; // 1MB

  async function handlePresetFile(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files?.length) return;
    try {
      if (input.files[0].size > MAX_PRESET_FILE_SIZE) {
        throw new Error('File too large');
      }
      const text = await input.files[0].text();
      const data = JSON.parse(text);
      const imported = sanitizeImportedPresetSettings(data.settings);
      settings = imported;
      shareStatus = i18n.t('preset_share_imported');
      onChange();
    } catch (err) {
      const reason = err instanceof SyntaxError
        ? i18n.t('preset_error_invalid_json')
        : err instanceof Error && err.message === 'File too large'
          ? i18n.t('preset_error_too_large')
          : err instanceof Error && err.message === 'Invalid preset format'
            ? i18n.t('preset_error_invalid_format')
            : i18n.t('preset_import_error');
      onError?.(reason);
    }
    input.value = '';
  }
</script>

<div class="tab-panel" role="tabpanel">
  {#if imageSrc}
    <div class="section-label">
      ✨ {i18n.t('recommended_styles')}
      {#if isRecommendingStyles}
        <span class="recommend-loading"> · {i18n.t('loading')}</span>
      {/if}
    </div>
    {#if styleRecommendations.length > 0}
      <div class="field-row preset-grid style-grid" data-testid="style-recommendations">
        {#each styleRecommendations as recommendation}
          {@const preset = PRESETS.find((item) => item.id === recommendation.id)}
          {#if preset}
            <button
              class:preset-active={matchesPreset(preset)}
              class="preset-btn preset-card style-card"
              data-testid={`style-recommendation-${preset.id}`}
              onclick={() => applyPreset(preset)}
              title={i18n.t(recommendation.reasonKey)}
            >
              {#if presetPreviews[preset.id]}
                <img
                  class="preset-card-thumb"
                  src={presetPreviews[preset.id]}
                  alt={i18n.t(preset.labelKey)}
                  draggable="false"
                />
              {/if}
              <span class="preset-card-icon">{preset.icon}</span>
              <span class="preset-card-name">{i18n.t(preset.labelKey)}</span>
              <span class="style-reason">{i18n.t(recommendation.reasonKey)}</span>
            </button>
          {/if}
        {/each}
      </div>
    {/if}
  {/if}
  <div class="field-row preset-grid">
    {#each PRESETS as preset}
      <button
        class:preset-active={matchesPreset(preset)}
        class="preset-btn preset-card"
        onclick={() => applyPreset(preset)}
        title="{i18n.t('pixel_size')}: {preset.pixelSize}px | {i18n.t('palette')}: {getPaletteName(preset.palette)} | {i18n.t('dithering')}: {preset.ditherType}{preset.crtEffect !== 'none' ? ` | CRT (${preset.crtEffect})` : ''}{preset.glitchFilters.length > 0 ? ` | ${preset.glitchFilters.length} effects` : ''}"
      >
        {#if presetPreviews[preset.id]}
          <img
            class="preset-card-thumb"
            src={presetPreviews[preset.id]}
            alt={i18n.t(preset.labelKey)}
            draggable="false"
          />
        {/if}
        <span class="preset-card-icon">{preset.icon}</span>
        <span class="preset-card-name">{i18n.t(preset.labelKey)}</span>
        <span class="preset-card-info">{preset.pixelSize}px</span>
      </button>
    {/each}
  </div>
  <div class="field-row preset-share-row">
    <button class="preset-share-btn" onclick={exportPreset} title={i18n.t('export_preset')}>📤 {i18n.t('export_btn')}</button>
    <button class="preset-share-btn" onclick={importPreset} title={i18n.t('import_preset')}>📥 {i18n.t('import_btn')}</button>
    <button
      class="preset-share-btn"
      data-testid="preset-share-copy-link"
      onclick={copyShareLink}
      title={i18n.t('copy_share_link')}
    >🔗 {i18n.t('copy_btn')}</button>
    <button
      class="preset-share-btn"
      data-testid="preset-share-open-import"
      onclick={() => { shareImportVisible = !shareImportVisible; }}
      title={i18n.t('import_share_link')}
    >🧾 {i18n.t('paste_btn')}</button>
    <input bind:this={presetFileInput} type="file" accept=".json" onchange={handlePresetFile} style="display:none" />
  </div>
  {#if shareImportVisible}
    <div class="field-row preset-share-row">
      <input
        type="text"
        class="preset-name-input"
        data-testid="preset-share-import-input"
        bind:value={shareInput}
        placeholder={i18n.t('share_link_placeholder')}
        onkeydown={(e) => { if (e.key === 'Enter') applySharedPreset(); if (e.key === 'Escape') shareImportVisible = false; }}
      />
      <button
        class="preset-share-btn"
        data-testid="preset-share-apply-import"
        onclick={applySharedPreset}
        aria-label={i18n.t('apply_share_link')}
      >↩</button>
      <button
        class="preset-share-btn"
        onclick={() => { shareImportVisible = false; shareInput = ''; }}
        aria-label={i18n.t('cancel')}
      >✕</button>
    </div>
  {/if}
  {#if shareStatus}
    <div class="section-label">{shareStatus}</div>
  {/if}

  <!-- Custom Presets -->
  {#if customPresets.length > 0}
    <div class="section-label">{i18n.t('my_presets')}:</div>
    <div class="field-row preset-grid">
      {#each customPresets as cp}
        <button
          class:preset-active={customPresetMatches(cp)}
          class="preset-btn custom-preset-btn"
          onclick={() => applyCustomPreset(cp)}
          title={cp.name}
        >
          {#if presetPreviews[cp.id]}
            <img
              class="preset-card-thumb custom-preset-thumb"
              src={presetPreviews[cp.id]}
              alt={cp.name}
              draggable="false"
            />
          {/if}
          ⭐ {cp.name}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <span
            class="preset-delete"
            role="button"
            tabindex="0"
            onclick={(e) => { e.stopPropagation(); removeCustomPreset(cp.id); }}
            onkeydown={(e) => { e.stopPropagation(); if (e.key === 'Enter') removeCustomPreset(cp.id); }}
          >×</span>
        </button>
      {/each}
    </div>
  {/if}

  <!-- Save Current as Preset -->
  <div class="field-row preset-share-row">
    {#if showSavePreset}
      <input
        type="text"
        class="preset-name-input"
        bind:value={newPresetName}
        placeholder={i18n.t('preset_name_placeholder')}
        onkeydown={(e) => { if (e.key === 'Enter') saveCurrentAsPreset(); if (e.key === 'Escape') showSavePreset = false; }}
      />
      <button class="preset-share-btn" onclick={saveCurrentAsPreset} aria-label={i18n.t('save_preset')}>✓</button>
      <button class="preset-share-btn" onclick={() => { showSavePreset = false; }} aria-label={i18n.t('cancel')}>✕</button>
    {:else}
      <button class="preset-share-btn" onclick={() => { showSavePreset = true; }}>💾 {i18n.t('save_preset')}</button>
    {/if}
  </div>
</div>

<style>
  .tab-panel {
    padding: 6px 4px;
  }

  .section-label {
    margin-top: 8px;
    font-size: var(--w98-font-size-base);
    margin-bottom: 2px;
  }
  .recommend-loading {
    color: var(--w98-shadow-808);
  }

  /* ===== Preset Grid ===== */
  .preset-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    justify-content: flex-start;
  }
  .preset-btn {
    font-size: var(--w98-font-size-base);
    padding: 3px 8px;
    transition: background 0.1s;
  }
  .preset-btn:hover {
    background: var(--w98-surface-active);
  }
  .preset-btn:active {
    box-shadow: var(--w98-inset-thin);
  }

  /* ===== Preset Card ===== */
  .preset-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
    padding: 4px 6px;
    min-width: 56px;
    position: relative;
    overflow: hidden;
  }
  .preset-card-thumb {
    width: 72px;
    height: 52px;
    object-fit: cover;
    border: 1px solid var(--w98-shadow-808);
    margin-bottom: 4px;
    background: #000;
    image-rendering: pixelated;
    pointer-events: none;
  }
  .preset-card-icon {
    font-size: 14px;
    line-height: 1;
  }
  .preset-card-name {
    font-size: var(--w98-font-size-caption);
    line-height: 1.1;
    white-space: nowrap;
  }
  .preset-card-info {
    font-size: var(--w98-font-size-micro);
    color: var(--w98-shadow-808);
    line-height: 1;
  }
  .style-grid {
    margin-bottom: 8px;
  }
  .style-card {
    align-items: flex-start;
    text-align: left;
    min-width: 120px;
  }
  .style-reason {
    font-size: var(--w98-font-size-micro);
    color: var(--w98-shadow-808);
    line-height: 1.2;
    white-space: normal;
  }

  /* ===== Custom Preset ===== */
  .custom-preset-btn {
    position: relative;
    padding-right: 16px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .custom-preset-thumb {
    width: 40px;
    height: 28px;
    margin-bottom: 0;
    flex: 0 0 auto;
  }
  .preset-delete {
    position: absolute;
    top: 0;
    right: 2px;
    font-size: var(--w98-font-size-action);
    font-weight: bold;
    color: var(--w98-shadow-808);
    cursor: pointer;
    line-height: 1;
  }
  .preset-delete:hover {
    color: var(--w98-color-error);
  }
  .preset-delete:focus-visible {
    outline: 1px solid var(--w98-highlight);
    outline-offset: 1px;
  }
  .preset-name-input {
    flex: 1;
    font-size: var(--w98-font-size-base);
    padding: 2px 4px;
    min-width: 0;
  }

  /* ===== Preset Share ===== */
  .preset-share-row {
    margin-top: 4px;
    display: flex;
    gap: 4px;
    justify-content: flex-end;
  }
  .preset-share-btn {
    font-size: var(--w98-font-size-sm);
    padding: 2px 8px;
    cursor: pointer;
  }
  .preset-share-btn:active {
    box-shadow: var(--w98-inset-thin);
  }
</style>
