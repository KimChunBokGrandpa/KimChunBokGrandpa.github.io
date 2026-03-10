<script lang="ts">
  import { getPaletteName } from '../utils/palettes';
  import { PRESETS, type Preset } from '../utils/presets';
  import type { DitherType, GlitchFilter, GlitchType, RenderMode, ProcessingSettings, PostProcessFilters } from '../types';
  import { DEFAULT_POST_FILTERS } from '../types';
  import type { SaveFormat } from '../services/saveService';
  import { i18n } from '$lib/i18n/index.svelte';
  import { getCustomPresets, addCustomPreset, removeCustomPreset } from '$lib/stores/customPresetStore.svelte';

  // Glitch filter options
  const GLITCH_OPTIONS = [
    { id: 'rgb_split', icon: '🔴', labelKey: 'rgb_split' as const },
    { id: 'wave',      icon: '📺', labelKey: 'wave' as const },
    { id: 'noise',     icon: '🧩', labelKey: 'noise' as const },
    { id: 'slice',     icon: '🔪', labelKey: 'slice' as const },
  ] as const;

  // Render mode options
  const RENDER_OPTIONS = [
    { id: 'pixel_perfect', labelKey: 'pixel_perfect' as const, titleKey: 'pixel_perfect_desc' as const },
    { id: 'bilinear', labelKey: 'bilinear_blur' as const, titleKey: 'bilinear_desc' as const },
    { id: 'hqx', labelKey: 'hqx_upscale' as const, titleKey: 'hqx_desc' as const },
  ] as const;

  // Dithering options
  const DITHER_OPTIONS = [
    { id: 'none', labelKey: 'dither_none' as const, titleKey: 'dither_none_desc' as const },
    { id: 'floyd_steinberg', labelKey: 'dither_fs' as const, titleKey: 'dither_fs_desc' as const },
    { id: 'ordered', labelKey: 'dither_ordered' as const, titleKey: 'dither_ordered_desc' as const },
  ] as const;

  // Save format options
  const FORMAT_OPTIONS = [
    { id: 'png', label: 'PNG' },
    { id: 'jpeg', label: 'JPEG' },
    { id: 'webp', label: 'WebP' },
  ] as const;


  let {
    settings = $bindable({ pixelSize: 1, palette: 'original', crtEffect: false, glitchFilters: [] as GlitchFilter[], renderMode: 'pixel_perfect' as const, glitchSeed: null as (number | null), ditherType: 'none' as const }),
    saveFormat = 'png' as SaveFormat,
    saveQuality = 0.92,
    onChange,
    onSave,
    onOpenGallery,
    onFormatChange,
    onQualityChange,
    hasImage = true,
    postFilters = $bindable({ ...DEFAULT_POST_FILTERS }),
    autoProcess = $bindable(true),
    onApplyNow,
  }: {
    settings: ProcessingSettings;
    saveFormat?: SaveFormat;
    saveQuality?: number;
    onChange: (settings: ProcessingSettings) => void;
    onSave: () => void;
    onOpenGallery: () => void;
    onFormatChange?: (format: SaveFormat) => void;
    onQualityChange?: (quality: number) => void;
    hasImage?: boolean;
    postFilters?: PostProcessFilters;
    autoProcess?: boolean;
    onApplyNow?: () => void;
  } = $props();

  function update() {
    onChange(settings);
  }

  function applyPreset(preset: Preset) {
    settings = {
      pixelSize: preset.pixelSize,
      palette: preset.palette,
      crtEffect: preset.crtEffect,
      glitchFilters: preset.glitchFilters.map(f => ({ ...f })),
      renderMode: preset.renderMode,
      glitchSeed: settings.glitchSeed,
      ditherType: preset.ditherType,
    };
    update();
  }

  function matchesPreset(preset: Preset): boolean {
    if (settings.pixelSize !== preset.pixelSize) return false;
    if (settings.palette !== preset.palette) return false;
    if (settings.crtEffect !== preset.crtEffect) return false;
    if (settings.renderMode !== preset.renderMode) return false;
    if ((settings.ditherType || 'none') !== preset.ditherType) return false;
    if (settings.glitchFilters.length !== preset.glitchFilters.length) return false;
    return preset.glitchFilters.every(pf =>
      settings.glitchFilters.some(sf => sf.type === pf.type && sf.intensity === pf.intensity)
    );
  }

  // True when current settings don't match any preset
  let isCustom = $derived(!PRESETS.some(p => matchesPreset(p)));

  // Toggle filter: add with intensity 1 if absent, remove if present
  function toggleGlitch(filterId: GlitchType) {
    const idx = settings.glitchFilters.findIndex(f => f.type === filterId);
    if (idx >= 0) {
      settings.glitchFilters = settings.glitchFilters.filter((_, i) => i !== idx);
    } else {
      settings.glitchFilters = [...settings.glitchFilters, { type: filterId, intensity: 1 }];
    }
    update();
  }

  // Change intensity of a specific filter
  function setFilterIntensity(filterId: GlitchType, intensity: number) {
    settings.glitchFilters = settings.glitchFilters.map(f =>
      f.type === filterId ? { ...f, intensity } : { ...f }
    );
    update();
  }

  // Check if a filter is active
  function isFilterActive(filterId: GlitchType): boolean {
    return settings.glitchFilters.some(f => f.type === filterId);
  }

  // Get current intensity of a filter
  function getFilterIntensity(filterId: GlitchType): number {
    return settings.glitchFilters.find(f => f.type === filterId)?.intensity ?? 1;
  }

  function clearAllGlitch() {
    settings.glitchFilters = [];
    update();
  }

  // ─── Custom Presets ───
  let showSavePreset = $state(false);
  let newPresetName = $state('');
  let customPresets = $derived(getCustomPresets());

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
    };
    update();
  }

  // ─── Preset Sharing ───
  let presetFileInput = $state<HTMLInputElement>();

  function exportPreset() {
    const preset = {
      name: 'Custom Preset',
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

  async function handlePresetFile(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files?.length) return;
    try {
      const text = await input.files[0].text();
      const data = JSON.parse(text);
      const s = data.settings;
      if (!s || typeof s.pixelSize !== 'number' || typeof s.palette !== 'string') {
        throw new Error('Invalid preset format');
      }
      settings = {
        pixelSize: Math.max(1, Math.min(64, s.pixelSize)),
        palette: s.palette,
        crtEffect: !!s.crtEffect,
        glitchFilters: Array.isArray(s.glitchFilters) ? s.glitchFilters.map((f: { type: GlitchType; intensity: number }) => ({ type: f.type, intensity: f.intensity })) : [],
        renderMode: ['pixel_perfect', 'bilinear', 'hqx'].includes(s.renderMode) ? s.renderMode : 'pixel_perfect',
        glitchSeed: s.glitchSeed ?? null,
        ditherType: ['none', 'floyd_steinberg', 'ordered'].includes(s.ditherType) ? s.ditherType : 'none',
      };
      update();
    } catch {
      alert('Failed to load preset file. Please check the format.');
    }
    input.value = '';
  }
</script>

<div class="cp-root">
  <fieldset>
    <legend>{i18n.t('presets')}</legend>
    <div class="field-row preset-grid">
      {#each PRESETS as preset}
        <button
          class:preset-active={matchesPreset(preset)}
          class="preset-btn"
          onclick={() => applyPreset(preset)}
          title="{i18n.t('pixel_size')}: {preset.pixelSize}px | {i18n.t('palette')}: {getPaletteName(preset.palette)}"
        >{preset.label}</button>
      {/each}
    </div>
    <div class="field-row preset-share-row">
      <button class="preset-share-btn" onclick={exportPreset} title={i18n.t('export_preset')}>📤 {i18n.t('export_btn')}</button>
      <button class="preset-share-btn" onclick={importPreset} title={i18n.t('import_preset')}>📥 {i18n.t('import_btn')}</button>
      <input bind:this={presetFileInput} type="file" accept=".json" onchange={handlePresetFile} style="display:none" />
    </div>

    <!-- Custom Presets -->
    {#if customPresets.length > 0}
      <div class="section-label">{i18n.t('my_presets')}:</div>
      <div class="field-row preset-grid">
        {#each customPresets as cp}
          <button
            class="preset-btn custom-preset-btn"
            onclick={() => applyCustomPreset(cp)}
            title={cp.name}
          >
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
        <button class="preset-share-btn" onclick={saveCurrentAsPreset}>✓</button>
        <button class="preset-share-btn" onclick={() => { showSavePreset = false; }}>✕</button>
      {:else}
        <button class="preset-share-btn" onclick={() => { showSavePreset = true; }}>💾 {i18n.t('save_preset')}</button>
      {/if}
    </div>
  </fieldset>

  <fieldset class="cp-section">
    <legend>{i18n.t('pixel_size')}: {settings.pixelSize}px</legend>
    <div class="field-row slider-row">
      <span class="slider-label">1</span>
      <button
        class="stepper-btn"
        onclick={() => { settings.pixelSize = Math.max(1, settings.pixelSize - 1); update(); }}
      >-</button>
      <input
        type="range"
        min="1"
        max="10"
        step="1"
        bind:value={settings.pixelSize}
        oninput={update}
        class="slider-input"
      />
      <button
        class="stepper-btn"
        onclick={() => { settings.pixelSize = Math.min(10, settings.pixelSize + 1); update(); }}
      >+</button>
      <span class="slider-label">10</span>
    </div>
  </fieldset>

  <fieldset class="cp-section">
    <legend>{i18n.t('color_quant')}</legend>
    <div class="field-row">
      <button class="palette-btn" onclick={onOpenGallery}>
        <span><b>{i18n.t('palette')}:</b> {getPaletteName(settings.palette)}</span>
        <span class="palette-arrow">{i18n.t('select')}</span>
      </button>
    </div>

    <div class="section-label">{i18n.t('dithering')}:</div>
    <div class="field-row render-row">
      {#each DITHER_OPTIONS as opt}
        <button
          class:preset-active={settings.ditherType === opt.id}
          class="render-btn"
          onclick={() => { settings.ditherType = opt.id as DitherType; update(); }}
          title={i18n.t(opt.titleKey)}
        >
          {i18n.t(opt.labelKey)}
        </button>
      {/each}
    </div>
  </fieldset>

  <fieldset class="cp-section">
    <legend>{i18n.t('post_processing')}</legend>
    <div class="field-row">
      <input type="checkbox" id="crt-effect" bind:checked={settings.crtEffect} onchange={update} />
      <label for="crt-effect">{i18n.t('crt_scanlines')}</label>
    </div>

    <div class="section-label">
      {i18n.t('glitch_filters')} <span class="section-hint">({i18n.t('multi_select')})</span>:
    </div>
    <div class="field-row glitch-toggles">
      <button
        class:preset-active={settings.glitchFilters.length === 0}
        class="glitch-toggle-btn"
        onclick={clearAllGlitch}
        title={i18n.t('none')}
      >
        🚫 <span class="hide-on-small">{i18n.t('none')}</span>
      </button>
      {#each GLITCH_OPTIONS as opt}
        <button
          class:preset-active={isFilterActive(opt.id)}
          class="glitch-toggle-btn"
          onclick={() => toggleGlitch(opt.id)}
          aria-label="{i18n.t(opt.labelKey)} Glitch Filter"
          title={i18n.t(opt.labelKey)}
        >
          {opt.icon} <span class="hide-on-small">{i18n.t(opt.labelKey)}</span>
        </button>
      {/each}
    </div>

    <!-- Per-filter intensity sliders -->
    {#if settings.glitchFilters.length > 0}
    <div class="glitch-intensity-panel">
      {#each GLITCH_OPTIONS.filter(o => isFilterActive(o.id)) as opt}
        <div class="glitch-intensity-row">
          <span class="glitch-intensity-label">{opt.icon} {i18n.t(opt.labelKey)}</span>
          <div class="glitch-intensity-btns">
            {#each [1, 2, 3] as lv}
              <button
                class:preset-active={getFilterIntensity(opt.id) === lv}
                class="intensity-btn"
                onclick={() => setFilterIntensity(opt.id, lv)}
                title="{i18n.t('level')} {lv}"
              >
                {lv}
              </button>
            {/each}
          </div>
        </div>
      {/each}
    </div>
    {/if}

    <!-- Glitch seed lock/random toggle -->
    {#if settings.glitchFilters.length > 0}
    <div class="glitch-intensity-panel glitch-seed-panel">
      <div class="glitch-intensity-row">
        <span class="glitch-intensity-label">🎲 {i18n.t('seed')}</span>
        <div class="glitch-intensity-btns">
          <button
            class:preset-active={settings.glitchSeed === null}
            class="intensity-btn seed-btn"
            onclick={() => { settings.glitchSeed = null; update(); }}
          >{i18n.t('random')}</button>
          <button
            class:preset-active={settings.glitchSeed !== null}
            class="intensity-btn seed-btn"
            onclick={() => { settings.glitchSeed = Math.round(Math.random() * 10000) / 10000; update(); }}
          >{settings.glitchSeed !== null ? `${i18n.t('fixed')} (${settings.glitchSeed})` : i18n.t('fix')}</button>
          {#if settings.glitchSeed !== null}
            <button
              class="intensity-btn"
              title={i18n.t('reroll_seed')}
              onclick={() => { settings.glitchSeed = Math.round(Math.random() * 10000) / 10000; update(); }}
            >🔄</button>
          {/if}
        </div>
      </div>
    </div>
    {/if}

    <div class="section-label">{i18n.t('scaling_render')}:</div>
    <div class="field-row render-row">
      {#each RENDER_OPTIONS as opt}
        <button
          class:preset-active={settings.renderMode === opt.id}
          class="render-btn"
          onclick={() => { settings.renderMode = opt.id as RenderMode; update(); }}
          title={i18n.t(opt.titleKey)}
        >
          {i18n.t(opt.labelKey)}
        </button>
      {/each}
    </div>
  </fieldset>

  <!-- Post-Process Filters -->
  <fieldset class="cp-section">
    <legend>{i18n.t('adjust_post')}</legend>
    <div class="pf-row">
      <span class="pf-label">☀️ {i18n.t('brightness')}: {postFilters.brightness}%</span>
      <input type="range" min="20" max="200" step="5" bind:value={postFilters.brightness} class="slider-input" />
    </div>
    <div class="pf-row">
      <span class="pf-label">◐ {i18n.t('contrast')}: {postFilters.contrast}%</span>
      <input type="range" min="20" max="200" step="5" bind:value={postFilters.contrast} class="slider-input" />
    </div>
    <div class="pf-row">
      <span class="pf-label">🎨 {i18n.t('saturation')}: {postFilters.saturation}%</span>
      <input type="range" min="0" max="200" step="5" bind:value={postFilters.saturation} class="slider-input" />
    </div>
    <div class="pf-row">
      <span class="pf-label">🌈 {i18n.t('hue_rotate')}: {postFilters.hueRotate}°</span>
      <input type="range" min="0" max="360" step="5" bind:value={postFilters.hueRotate} class="slider-input" />
    </div>
    {#if postFilters.brightness !== 100 || postFilters.contrast !== 100 || postFilters.saturation !== 100 || postFilters.hueRotate !== 0}
      <button class="pf-reset" onclick={() => { postFilters = { ...DEFAULT_POST_FILTERS }; }}>{i18n.t('reset_filters')}</button>
    {/if}
  </fieldset>

  <!-- Auto-Process Toggle -->
  <fieldset class="cp-section">
    <legend>{i18n.t('auto_process')}</legend>
    <div class="field-row auto-process-row">
      <input type="checkbox" id="auto-process" bind:checked={autoProcess} />
      <label for="auto-process">{i18n.t('auto_process_label')}</label>
    </div>
    {#if !autoProcess}
      <button class="apply-now-btn" onclick={() => onApplyNow?.()} disabled={!hasImage}>
        ▶️ {i18n.t('apply_now')}
      </button>
    {/if}
  </fieldset>

  <!-- Current Settings Summary -->
  <fieldset class="cp-section summary-fieldset">
    <legend>{i18n.t('current_settings')} {#if isCustom}<span class="custom-badge">{i18n.t('custom')}</span>{/if}</legend>
    <div class="settings-summary">
      <span>📌 {settings.pixelSize}px</span>
      <span>🎨 {getPaletteName(settings.palette)}</span>
      {#if settings.crtEffect}<span>📺 CRT</span>{/if}
      {#each settings.glitchFilters as f}
        <span>⚡ {f.type} Lv{f.intensity}</span>
      {/each}
      <span>🔍 {settings.renderMode === 'pixel_perfect' ? 'Pixel' : settings.renderMode === 'bilinear' ? 'Smooth' : 'HQx'}</span>
      {#if settings.ditherType && settings.ditherType !== 'none'}<span>🔳 {settings.ditherType === 'floyd_steinberg' ? 'FS Dither' : 'Ordered'}</span>{/if}
    </div>
  </fieldset>

  <fieldset class="cp-section">
    <legend>{i18n.t('save_options')}</legend>
    <div class="field-row format-row">
      <span class="format-label">{i18n.t('format')}:</span>
      {#each FORMAT_OPTIONS as opt}
        <button
          class:preset-active={saveFormat === opt.id}
          class="format-btn"
          onclick={() => onFormatChange?.(opt.id as SaveFormat)}
        >{opt.label}</button>
      {/each}
    </div>
    {#if saveFormat !== 'png'}
      <div class="field-row quality-row">
        <span class="quality-label">{i18n.t('quality')}: {Math.round(saveQuality * 100)}%</span>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          value={saveQuality}
          oninput={(e) => onQualityChange?.(parseFloat((e.target as HTMLInputElement).value))}
          class="slider-input"
        />
      </div>
    {/if}
  </fieldset>

  <div class="field-row save-row">
    <button
      class="save-btn"
      onclick={onSave}
      disabled={!hasImage}
      title={!hasImage ? i18n.t('save_no_image') : i18n.t('save_processed')}
    >
      💾 {i18n.t('save_as')}
    </button>
  </div>

  <div class="shortcuts-hint">
    <span>⌨️</span>
    <span>{i18n.t('shortcut_undo')}</span>
    <span>{i18n.t('shortcut_redo')}</span>
    <span>{i18n.t('shortcut_save')}</span>
  </div>
</div>

<style>
  .cp-root {
    padding: 4px;
  }
  .cp-root :global(.preset-active) {
    box-shadow: inset -1px -1px #fff, inset 1px 1px #0a0a0a, inset -2px -2px #dfdfdf, inset 2px 2px #808080;
    font-weight: bold;
    background: #d0d8e0;
    border-color: #000080;
  }

  /* ===== Sections ===== */
  .cp-section { margin-top: 8px; }
  .summary-fieldset { background: #f8f8f0; }

  .section-label {
    margin-top: 8px;
    font-size: 11px;
    margin-bottom: 2px;
  }
  .section-hint {
    color: #808080;
    font-size: 9px;
  }

  /* ===== Preset Grid ===== */
  .preset-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    justify-content: flex-start;
  }
  .preset-btn {
    font-size: 11px;
    padding: 3px 8px;
    transition: background 0.1s;
  }
  .preset-btn:hover {
    background: #e8e8e0;
  }

  /* ===== Custom Preset ===== */
  .custom-preset-btn {
    position: relative;
    padding-right: 16px;
  }
  .preset-delete {
    position: absolute;
    top: 0;
    right: 2px;
    font-size: 12px;
    font-weight: bold;
    color: #808080;
    cursor: pointer;
    line-height: 1;
  }
  .preset-delete:hover {
    color: #c00;
  }
  .preset-name-input {
    flex: 1;
    font-size: 11px;
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
    font-size: 10px;
    padding: 2px 8px;
  }

  /* ===== Slider Row ===== */
  .slider-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .slider-label {
    font-size: 10px;
    flex-shrink: 0;
  }
  .slider-input {
    flex: 1;
  }
  .stepper-btn {
    min-width: 24px;
    padding: 0;
  }

  /* ===== Palette Button ===== */
  .palette-btn {
    width: 100%;
    text-align: left;
    padding: 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .palette-arrow {
    font-size: 10px;
  }

  /* ===== Glitch Filter Toggle Buttons ===== */
  .glitch-toggles {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .glitch-toggle-btn {
    font-size: 11px;
    padding: 2px 4px;
    flex: 1;
    text-align: center;
    min-width: 0;
  }

  /* ===== Per-Filter Intensity Panel ===== */
  .glitch-intensity-panel {
    margin-top: 6px;
    display: flex;
    flex-direction: column;
    gap: 3px;
    background: #e8e8e0;
    border: 1px solid #c0c0c0;
    padding: 4px;
  }
  .glitch-seed-panel {
    margin-top: 4px;
  }
  .glitch-intensity-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
  }
  .glitch-intensity-label {
    font-size: 10px;
    white-space: nowrap;
    min-width: 70px;
  }
  .glitch-intensity-btns {
    display: flex;
    gap: 2px;
  }
  .intensity-btn {
    font-size: 9px;
    padding: 1px 6px;
    min-width: 22px;
    text-align: center;
  }
  .seed-btn {
    min-width: 50px;
  }

  /* ===== Render Mode Buttons ===== */
  .render-row {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .render-btn {
    font-size: 10px;
    padding: 3px 6px;
    flex: 1;
    text-align: center;
  }

  /* ===== Format / Quality ===== */
  .format-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
  }
  .format-label {
    font-size: 11px;
    flex-shrink: 0;
  }
  .format-btn {
    font-size: 10px;
    padding: 2px 8px;
    flex: 1;
    text-align: center;
  }
  .quality-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .quality-label {
    font-size: 10px;
    flex-shrink: 0;
  }

  /* ===== Post-Process Filters ===== */
  .pf-row {
    display: flex;
    flex-direction: column;
    gap: 1px;
    margin-bottom: 4px;
  }
  .pf-label {
    font-size: 10px;
    color: #333;
  }
  .pf-reset {
    font-size: 10px;
    padding: 2px 8px;
    margin-top: 2px;
    width: 100%;
  }

  /* ===== Auto-Process ===== */
  .auto-process-row {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .apply-now-btn {
    width: 100%;
    margin-top: 4px;
    padding: 4px 8px;
    font-weight: bold;
    font-size: 12px;
    background: #000080;
    color: #fff;
    cursor: pointer;
  }
  .apply-now-btn:hover {
    background: #0000a0;
  }
  .apply-now-btn:disabled {
    background: #808080;
    cursor: default;
  }

  /* ===== Settings Summary ===== */
  .settings-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    font-size: 10px;
    color: #444;
  }
  .settings-summary span {
    background: #e8e4dc;
    padding: 1px 5px;
    border: 1px solid #c0c0c0;
    white-space: nowrap;
  }
  .custom-badge {
    display: inline-block;
    background: #000080;
    color: #fff;
    font-size: 9px;
    padding: 0 4px;
    margin-left: 4px;
    font-weight: bold;
    vertical-align: middle;
  }

  /* ===== Save Button ===== */
  .save-row {
    margin-top: 10px;
    justify-content: flex-end;
  }
  .save-btn {
    font-weight: bold;
    padding: 4px 12px;
    font-size: 12px;
    background: #c0c0c0;
  }
  .save-btn:hover {
    background: #d0d0d0;
  }

  /* ===== Shortcuts Hint ===== */
  .shortcuts-hint {
    display: flex;
    gap: 8px;
    font-size: 9px;
    color: #808080;
    padding: 4px 0 0 0;
    justify-content: center;
    flex-wrap: wrap;
  }
  @media (max-width: 400px) {
    .hide-on-small { display: none; }
  }
</style>
