<script lang="ts">
  import { getPaletteName } from '$lib/utils/palettes';
  import { PRESETS, type Preset } from '$lib/utils/presets';
  import type { DitherType, GlitchFilter, ProcessingSettings, PostProcessFilters } from '$lib/types';
  import EffectLayerStack from './EffectLayerStack.svelte';
  import { DEFAULT_POST_FILTERS } from '$lib/types';
  import type { SaveFormat } from '$lib/services/saveService';
  import { i18n } from '$lib/i18n/index.svelte';
  import PresetManager from './PresetManager.svelte';
  import PostProcessFiltersComponent from './PostProcessFilters.svelte';

  // Dithering options
  const DITHER_OPTIONS = [
    { id: 'none', labelKey: 'dither_none' as const, titleKey: 'dither_none_desc' as const },
    { id: 'floyd_steinberg', labelKey: 'dither_fs' as const, titleKey: 'dither_fs_desc' as const },
    { id: 'ordered', labelKey: 'dither_ordered' as const, titleKey: 'dither_ordered_desc' as const },
    { id: 'atkinson', labelKey: 'dither_atkinson' as const, titleKey: 'dither_atkinson_desc' as const },
  ] as const;

  // Save format options
  const FORMAT_OPTIONS = [
    { id: 'png', label: 'PNG' },
    { id: 'jpeg', label: 'JPEG' },
    { id: 'webp', label: 'WebP' },
  ] as const;


  let {
    settings = $bindable({ pixelSize: 1, palette: 'original', crtEffect: 'none' as const, glitchFilters: [] as GlitchFilter[], renderMode: 'pixel_perfect' as const, glitchSeed: null as (number | null), ditherType: 'none' as const }),
    saveFormat = 'png' as SaveFormat,
    saveQuality = 0.92,
    onChange,
    onSave,
    onExportSvg,
    onOpenGallery,
    onFormatChange,
    onQualityChange,
    hasImage = true,
    hasProcessedImage = false,
    postFilters = $bindable({ ...DEFAULT_POST_FILTERS }),
    autoProcess = $bindable(true),
    hasUnappliedChanges = false,
    onApplyNow,
    onError,
  }: {
    settings: ProcessingSettings;
    saveFormat?: SaveFormat;
    saveQuality?: number;
    onChange: (settings: ProcessingSettings) => void;
    onSave: () => void;
    onExportSvg?: () => void;
    onOpenGallery: () => void;
    onFormatChange?: (format: SaveFormat) => void;
    onQualityChange?: (quality: number) => void;
    hasImage?: boolean;
    hasProcessedImage?: boolean;
    postFilters?: PostProcessFilters;
    autoProcess?: boolean;
    hasUnappliedChanges?: boolean;
    onApplyNow?: () => void;
    onError?: (message: string) => void;
  } = $props();

  // Popular palettes for quick selection
  const QUICK_PALETTES = [
    { id: 'original', shortName: 'Full', preview: ['#ff0000', '#00ff00', '#0000ff', '#ffff00'] },
    { id: 'dmg', shortName: 'DMG', preview: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'] },
    { id: 'nes', shortName: 'NES', preview: ['#d82800', '#0058f8', '#00a800', '#f8d878'] },
    { id: 'pico8', shortName: 'PICO', preview: ['#000000', '#ff004d', '#29adff', '#00e436'] },
    { id: 'monochrome', shortName: 'B&W', preview: ['#000000', '#ffffff'] },
  ];

  function update() {
    onChange(settings);
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

  // True when current settings don't match any preset
  let isCustom = $derived(!PRESETS.some(p => matchesPreset(p)));

  // ─── Derived: active effect count for section header badge ───
  let activeEffectCount = $derived(
    (settings.effectLayers || []).filter(l => l.enabled).length
  );
  let hasPostFilterChanges = $derived(
    postFilters.brightness !== 100 || postFilters.contrast !== 100 ||
    postFilters.saturation !== 100 || postFilters.hueRotate !== 0
  );

  // ─── Tab System ───
  type TabId = 'basic' | 'effects' | 'adjust' | 'presets';
  let activeTab = $state<TabId>('basic');

  const TABS: { id: TabId; labelKey: 'tab_basic' | 'tab_effects' | 'tab_adjust' | 'tab_presets'; icon: string }[] = [
    { id: 'basic', labelKey: 'tab_basic', icon: '🎨' },
    { id: 'effects', labelKey: 'tab_effects', icon: '✨' },
    { id: 'adjust', labelKey: 'tab_adjust', icon: '🔧' },
    { id: 'presets', labelKey: 'tab_presets', icon: '📋' },
  ];

  // Badge indicators for tabs
  let effectsBadge = $derived(activeEffectCount + (settings.crtEffect !== 'none' ? 1 : 0));
  let adjustBadge = $derived(hasPostFilterChanges);
</script>

<div class="cp-root">
  <!-- ═══ Top Bar: Auto-Process + Settings Summary ═══ -->
  <div class="cp-topbar">
    <div class="topbar-left">
      <label class="auto-toggle" title={i18n.t('auto_process_label')}>
        <input type="checkbox" bind:checked={autoProcess} />
        <span>{i18n.t('auto_process_short')}</span>
      </label>
      {#if !autoProcess}
        <button class="apply-now-btn-inline" class:has-changes={hasUnappliedChanges} onclick={() => onApplyNow?.()} disabled={!hasImage}>
          {#if hasUnappliedChanges}<span class="unsaved-dot"></span>{/if}
          ▶ {i18n.t('apply_now')}
          {#if hasUnappliedChanges}<span class="unsaved-badge">{i18n.t('unsaved_changes')}</span>{/if}
        </button>
      {/if}
    </div>
    <div class="topbar-summary">
      <span class="summary-badge" title={i18n.t('pixel_size')}>📌 {settings.pixelSize}px</span>
      <span class="summary-badge" title={i18n.t('palette')}>🎨 {getPaletteName(settings.palette)}</span>
      {#if isCustom}<span class="summary-badge custom-badge">{i18n.t('custom')}</span>{/if}
    </div>
  </div>

  <!-- ═══ Tab Bar ═══ -->
  <div class="cp-tab-bar" role="tablist">
    {#each TABS as tab}
      <button
        class="cp-tab"
        class:cp-tab-active={activeTab === tab.id}
        role="tab"
        aria-selected={activeTab === tab.id}
        aria-label={i18n.t(tab.labelKey)}
        onclick={() => { activeTab = tab.id; }}
      >
        <span class="tab-icon">{tab.icon}</span>
        <span class="tab-label">{i18n.t(tab.labelKey)}</span>
        {#if tab.id === 'effects' && effectsBadge > 0}
          <span class="tab-badge">{effectsBadge}</span>
        {/if}
        {#if tab.id === 'adjust' && adjustBadge}
          <span class="tab-badge">●</span>
        {/if}
      </button>
    {/each}
  </div>

  <!-- ═══ Tab Content ═══ -->
  <div class="cp-tab-content">
    <!-- ─── Basic Tab ─── -->
    {#if activeTab === 'basic'}
      <div class="tab-panel" role="tabpanel">
        <fieldset class="cp-section">
          <legend>{i18n.t('pixel_size')}: {settings.pixelSize}px</legend>
          <div class="field-row slider-row">
            <span class="slider-label">1</span>
            <button
              class="stepper-btn"
              onclick={() => { settings.pixelSize = Math.max(1, settings.pixelSize - 1); update(); }}
              aria-label={i18n.t('decrease_pixel_size')}
            >-</button>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              bind:value={settings.pixelSize}
              oninput={update}
              class="slider-input"
              aria-label={i18n.t('pixel_size')}
            />
            <button
              class="stepper-btn"
              onclick={() => { settings.pixelSize = Math.min(10, settings.pixelSize + 1); update(); }}
              aria-label={i18n.t('increase_pixel_size')}
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
          <div class="quick-palette-row">
            {#each QUICK_PALETTES as qp}
              <button
                class="quick-palette-chip"
                data-testid={"quick-palette-" + qp.id}
                class:preset-active={settings.palette === qp.id}
                onclick={() => { settings.palette = qp.id; update(); }}
                title={getPaletteName(qp.id)}
              >
                <span class="qp-swatches">
                  {#each qp.preview as color}
                    <span class="qp-dot" style="background:{color}"></span>
                  {/each}
                </span>
                <span class="qp-label">{qp.shortName}</span>
              </button>
            {/each}
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

        <!-- Oklab color space toggle -->
        <fieldset>
          <legend>{i18n.t('color_space')}</legend>
          <label class="oklab-toggle">
            <input
              type="checkbox"
              checked={settings.useOklab ?? false}
              onchange={(e) => { settings.useOklab = (e.target as HTMLInputElement).checked; update(); }}
            />
            {i18n.t('use_oklab')}
          </label>
        </fieldset>
      </div>

    <!-- ─── Effects Tab ─── -->
    {:else if activeTab === 'effects'}
      <div class="tab-panel" role="tabpanel">
        <EffectLayerStack bind:settings onChange={update} />
      </div>

    <!-- ─── Adjust Tab ─── -->
    {:else if activeTab === 'adjust'}
      <PostProcessFiltersComponent bind:postFilters />

    <!-- ─── Presets Tab ─── -->
    {:else if activeTab === 'presets'}
      <PresetManager bind:settings onChange={update} onError={onError} />
    {/if}
  </div>

  <!-- ═══ Sticky Save Bar ═══ -->
  <div class="cp-save-bar">
    <div class="field-row format-row">
      {#each FORMAT_OPTIONS as opt}
        <button
          class:preset-active={saveFormat === opt.id}
          class="format-btn"
          onclick={() => onFormatChange?.(opt.id as SaveFormat)}
        >{opt.label}</button>
      {/each}
      {#if saveFormat !== 'png'}
        <span class="quality-inline">{Math.round(saveQuality * 100)}%</span>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          value={saveQuality}
          oninput={(e) => onQualityChange?.(parseFloat((e.target as HTMLInputElement).value))}
          class="slider-input quality-slider"
          aria-label={i18n.t('quality')}
        />
      {/if}
    </div>
    <div class="field-row save-row">
      <button
        class="save-btn"
        data-testid="save-image-button"
        class:save-ready={hasProcessedImage}
        onclick={onSave}
        disabled={!hasImage}
        title={!hasImage ? i18n.t('save_no_image') : i18n.t('shortcut_hint_save')}
      >
        💾 {i18n.t('save_as')}
      </button>
      {#if onExportSvg}
        <button
          class="save-btn svg-btn"
          onclick={onExportSvg}
          disabled={!hasImage}
          title={i18n.t('export_svg')}
        >
          🖼 SVG
        </button>
      {/if}
    </div>
  </div>
</div>

<style>
  .cp-root {
    padding: 4px;
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .cp-root :global(.preset-active) {
    box-shadow: var(--w98-inset);
    font-weight: bold;
    background: #d0d8e0;
    border-color: var(--w98-highlight);
  }

  /* ===== Top Bar ===== */
  .cp-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 2px;
    margin-bottom: 4px;
    background: var(--w98-surface-active);
    border: 1px solid;
    border-color: var(--w98-shadow-light) var(--w98-shadow-808) var(--w98-shadow-808) var(--w98-shadow-light);
    gap: 4px;
    flex-wrap: wrap;
  }
  .topbar-left {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .auto-toggle {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: var(--w98-font-size-base);
    cursor: pointer;
    white-space: nowrap;
  }
  .auto-toggle input {
    margin: 0;
  }
  .apply-now-btn-inline {
    font-size: var(--w98-font-size-sm);
    padding: 2px 8px;
    font-weight: bold;
    background: var(--w98-surface);
    color: var(--w98-highlight);
    cursor: pointer;
    white-space: nowrap;
    box-shadow: var(--w98-outset-thin);
  }
  .apply-now-btn-inline:hover {
    background: var(--w98-surface-active);
  }
  .apply-now-btn-inline:active {
    box-shadow: var(--w98-inset-thin);
  }
  .apply-now-btn-inline:disabled {
    color: var(--w98-shadow-808);
    cursor: not-allowed;
    color: var(--w98-text-disabled);
  }
  .apply-now-btn-inline.has-changes {
    background: var(--w98-color-error-light);
    color: var(--w98-color-error);
    border: 1px solid var(--w98-color-error);
  }
  .unsaved-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    background: var(--w98-color-error);
    vertical-align: middle;
    margin-right: 2px;
  }
  .unsaved-badge {
    font-size: var(--w98-font-size-micro);
    background: var(--w98-color-error);
    color: var(--w98-surface-white);
    padding: 0 3px;
    margin-left: 3px;
    font-weight: bold;
    line-height: 12px;
  }
  .topbar-summary {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .summary-badge {
    font-size: var(--w98-font-size-base);
    padding: 1px 5px;
    background: #e8e4dc;
    border: 1px solid var(--w98-surface);
    white-space: nowrap;
  }
  .custom-badge {
    background: var(--w98-highlight);
    color: #fff;
    font-weight: bold;
    border-color: var(--w98-highlight);
  }

  /* ===== Tab Bar ===== */
  .cp-tab-bar {
    display: flex;
    gap: 0;
    margin-top: 4px;
    border-bottom: 2px solid var(--w98-shadow-808);
    padding: 0 2px;
  }
  .cp-tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 4px 2px;
    font-size: var(--w98-font-size-sm);
    font-weight: bold;
    background: var(--w98-surface-active);
    border: 1px solid var(--w98-shadow-808);
    border-bottom: none;
    margin-bottom: -2px;
    cursor: pointer;
    position: relative;
    color: var(--w98-text-secondary);
  }
  .cp-tab:hover {
    background: var(--w98-surface);
  }
  .cp-tab-active {
    background: var(--w98-surface);
    color: var(--w98-text);
    border-color: var(--w98-shadow-808) var(--w98-shadow-808) var(--w98-surface);
    z-index: 1;
  }
  .tab-icon {
    font-size: var(--w98-font-size-base);
  }
  .tab-label {
    white-space: nowrap;
  }
  @media (max-width: 550px) {
    .tab-label {
      display: none;
    }
  }
  .tab-badge {
    font-size: var(--w98-font-size-micro);
    background: var(--w98-highlight);
    color: #fff;
    padding: 0 4px;
    line-height: 12px;
    min-width: 12px;
    text-align: center;
  }

  /* ===== Tab Content ===== */
  .cp-tab-content {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
  }
  .tab-panel {
    padding: 6px 4px;
  }

  /* ===== Sections ===== */
  .cp-section { margin-top: 6px; }

  .section-label {
    margin-top: 8px;
    font-size: var(--w98-font-size-base);
    margin-bottom: 2px;
  }

  /* ===== Slider Row ===== */
  .slider-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .slider-label {
    font-size: var(--w98-font-size-sm);
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
    font-size: var(--w98-font-size-sm);
  }

  /* ===== Render Mode Buttons ===== */
  .render-row {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .render-btn {
    font-size: var(--w98-font-size-sm);
    padding: 3px 6px;
    flex: 1;
    text-align: center;
  }

  /* ===== Sticky Save Bar ===== */
  .cp-save-bar {
    position: sticky;
    bottom: 0;
    margin-top: 8px;
    padding: 6px;
    background: var(--w98-surface-active);
    border: 2px solid;
    border-color: var(--w98-shadow-light) var(--w98-shadow-808) var(--w98-shadow-808) var(--w98-shadow-light);
    z-index: 2;
  }
  .format-row {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 4px;
    flex-wrap: wrap;
  }
  .format-btn {
    font-size: var(--w98-font-size-sm);
    padding: 2px 8px;
    text-align: center;
  }
  .quality-inline {
    font-size: var(--w98-font-size-caption);
    color: #333;
    flex-shrink: 0;
    margin-left: 4px;
  }
  .quality-slider {
    min-width: 60px;
    max-width: 100px;
  }
  .save-row {
    justify-content: flex-end;
    gap: 4px;
  }
  .save-btn {
    font-weight: bold;
    padding: 4px 12px;
    font-size: var(--w98-font-size-action);
    background: var(--w98-highlight);
    color: #fff;
  }
  .save-btn:hover {
    background: color-mix(in srgb, var(--w98-highlight) 80%, #000);
  }
  .save-btn:disabled {
    background: var(--w98-surface);
    color: var(--w98-shadow-808);
  }
  .save-btn.save-ready {
    animation: save-pulse 2s ease-in-out 1;
  }
  @keyframes save-pulse {
    0%, 100% { box-shadow: var(--w98-outset-thin); }
    50% { box-shadow: 0 0 0 3px color-mix(in srgb, var(--w98-highlight) 40%, transparent); }
  }
  .svg-btn {
    background: var(--w98-surface);
    color: inherit;
  }
  .svg-btn:hover {
    background: #d0d0d0;
  }

  /* Quick Palette */
  .quick-palette-row {
    display: flex;
    gap: 3px;
    flex-wrap: wrap;
    margin-top: 4px;
  }
  .quick-palette-chip {
    display: flex;
    align-items: center;
    gap: 3px;
    padding: 2px 5px;
    font-size: var(--w98-font-size-sm);
    background: var(--w98-surface);
    border: none;
    box-shadow: var(--w98-outset-thin);
    cursor: pointer;
    flex-shrink: 0;
  }
  .quick-palette-chip:hover {
    background: var(--w98-surface-active);
  }
  .qp-swatches {
    display: flex;
    gap: 1px;
  }
  .qp-dot {
    width: 8px;
    height: 8px;
    border: 1px solid #000;
  }
  .qp-label {
    font-size: var(--w98-font-size-sm);
  }
</style>
