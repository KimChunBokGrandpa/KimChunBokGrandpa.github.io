<script lang="ts">
  import { browser } from '$app/environment';
  import { getPaletteFamily, getPaletteName } from '$lib/utils/palettes';
  import {
    getPresetFamilyLabelKey,
    presetMatchesSettings,
    presets,
    type Preset,
  } from '$lib/utils/presets';
  import { countActiveEffectLayers } from '$lib/utils/effectLayers';
  import type {
    DitherType,
    GlitchFilter,
    ProcessingSettings,
    PostProcessFilters,
  } from '$lib/types';
  import EffectLayerStack from './EffectLayerStack.svelte';
  import { defaultPostFilters } from '$lib/types';
  import { i18n } from '$lib/i18n/index.svelte';
  import PostProcessFiltersComponent from './PostProcessFilters.svelte';
  import type { Snippet } from 'svelte';

  type PresetManagerComponent = typeof import('./PresetManager.svelte').default;

  // Dithering options
  const ditherOptions = [
    { id: 'none', labelKey: 'dither_none' as const, titleKey: 'dither_none_desc' as const },
    { id: 'floyd_steinberg', labelKey: 'dither_fs' as const, titleKey: 'dither_fs_desc' as const },
    {
      id: 'ordered',
      labelKey: 'dither_ordered' as const,
      titleKey: 'dither_ordered_desc' as const,
    },
    {
      id: 'atkinson',
      labelKey: 'dither_atkinson' as const,
      titleKey: 'dither_atkinson_desc' as const,
    },
  ] as const;

  let {
    settings = $bindable({
      pixelSize: 1,
      palette: 'original',
      crtEffect: 'none' as const,
      glitchFilters: [] as GlitchFilter[],
      renderMode: 'pixel_perfect' as const,
      glitchSeed: null as number | null,
      ditherType: 'none' as const,
    }),
    imageSrc = null,
    onChange,
    onOpenGallery,
    hasImage = true,
    postFilters = $bindable({ ...defaultPostFilters }),
    autoProcess = $bindable(true),
    hasUnappliedChanges = false,
    onApplyNow,
    onError,
    export: exportSnippet,
  }: {
    settings: ProcessingSettings;
    imageSrc?: string | null;
    onChange: (settings: ProcessingSettings) => void;
    onOpenGallery: () => void;
    hasImage?: boolean;
    postFilters?: PostProcessFilters;
    autoProcess?: boolean;
    hasUnappliedChanges?: boolean;
    onApplyNow?: () => void;
    onError?: (message: string) => void;
    export?: Snippet;
  } = $props();

  // Popular palettes for quick selection
  const quickPalettes = [
    { id: 'original', shortName: 'Full', preview: ['#ff0000', '#00ff00', '#0000ff', '#ffff00'] },
    { id: 'dmg', shortName: 'DMG', preview: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'] },
    { id: 'nes', shortName: 'NES', preview: ['#d82800', '#0058f8', '#00a800', '#f8d878'] },
    { id: 'pico8', shortName: 'PICO', preview: ['#000000', '#ff004d', '#29adff', '#00e436'] },
    { id: 'monochrome', shortName: 'B&W', preview: ['#000000', '#ffffff'] },
  ];

  function update() {
    onChange(settings);
  }

  function setPixelSize(pixelSize: number) {
    settings.pixelSize = Math.max(1, Math.min(10, pixelSize));
    update();
  }

  function setPalette(palette: string) {
    settings.palette = palette;
    update();
  }

  function setDitherType(ditherType: DitherType) {
    settings.ditherType = ditherType;
    update();
  }

  function matchesPreset(preset: Preset): boolean {
    return presetMatchesSettings(preset, settings);
  }

  // True when current settings don't match any preset
  let isCustom = $derived(!presets.some((p) => matchesPreset(p)));

  // ─── Derived: active effect count for section header badge ───
  let activeEffectCount = $derived(countActiveEffectLayers(settings));
  let hasPostFilterChanges = $derived(
    postFilters.brightness !== 100 ||
      postFilters.contrast !== 100 ||
      postFilters.saturation !== 100 ||
      postFilters.hueRotate !== 0,
  );

  // ─── Tab System ───
  type TabId = 'presets' | 'basic' | 'effects' | 'adjust';
  let activeTab = $state<TabId>('presets');
  let lazyPresetManager = $state<PresetManagerComponent | null>(null);
  let PresetManager = $derived(lazyPresetManager);

  const tabs: {
    id: TabId;
    labelKey: 'tab_basic' | 'tab_effects' | 'tab_adjust' | 'tab_presets';
    icon: string;
  }[] = [
    { id: 'presets', labelKey: 'tab_presets', icon: '📋' },
    { id: 'basic', labelKey: 'tab_basic', icon: '🎨' },
    { id: 'effects', labelKey: 'tab_effects', icon: '✨' },
    { id: 'adjust', labelKey: 'tab_adjust', icon: '🔧' },
  ];

  // Badge indicators for tabs
  let effectsBadge = $derived(activeEffectCount + (settings.crtEffect !== 'none' ? 1 : 0));
  let adjustBadge = $derived(hasPostFilterChanges);
  let paletteFamilyLabel = $derived(
    i18n.t(getPresetFamilyLabelKey(getPaletteFamily(settings.palette))),
  );

  async function ensurePresetManagerLoaded() {
    if (lazyPresetManager) return lazyPresetManager;

    const mod = await import('./PresetManager.svelte');
    lazyPresetManager = mod.default;
    return lazyPresetManager;
  }

  function prefetchTab(tabId: TabId) {
    if (tabId === 'presets') {
      void ensurePresetManagerLoaded();
    }
  }

  $effect(() => {
    if (activeTab !== 'presets' || lazyPresetManager) return;
    void ensurePresetManagerLoaded();
  });

  $effect(() => {
    if (!browser || lazyPresetManager) return;

    const warmPresetManager = () => {
      void ensurePresetManagerLoaded();
    };
    const requestIdle = globalThis.requestIdleCallback?.bind(globalThis);
    const cancelIdle = globalThis.cancelIdleCallback?.bind(globalThis);

    if (requestIdle) {
      const idleId = requestIdle(warmPresetManager, { timeout: 1500 });
      return () => cancelIdle?.(idleId);
    }

    const timeoutId = globalThis.setTimeout(warmPresetManager, 1200);
    return () => globalThis.clearTimeout(timeoutId);
  });
</script>

<div class="cp-root">
  <!-- ═══ Top Bar: Auto-Process + Settings Summary ═══ -->
  <div class="cp-topbar w98-toolbar">
    <div class="topbar-left">
      <label class="auto-toggle w98-checkbox-label" title={i18n.t('auto_process_label')}>
        <input class="w98-checkbox" type="checkbox" bind:checked={autoProcess} />
        <span>{i18n.t('auto_process_short')}</span>
      </label>
      {#if !autoProcess}
        <button
          class="apply-now-btn-inline w98-inline-button w98-button--thin"
          class:has-changes={hasUnappliedChanges}
          onclick={() => onApplyNow?.()}
          disabled={!hasImage}
        >
          {#if hasUnappliedChanges}<span class="unsaved-dot"></span>{/if}
          <span class="w98-structural-glyph" aria-hidden="true">▶</span>
          <span>{i18n.t('apply_now')}</span>
          {#if hasUnappliedChanges}<span class="unsaved-badge">{i18n.t('unsaved_changes')}</span
            >{/if}
        </button>
      {/if}
    </div>
    <div class="topbar-summary">
      <span class="summary-badge w98-chip" title={i18n.t('pixel_size')}>
        <span class="w98-emoji" aria-hidden="true">📌</span>
        <span>{settings.pixelSize}px</span>
      </span>
      <span class="summary-badge w98-chip" title={i18n.t('palette')}>
        <span class="w98-emoji" aria-hidden="true">🎨</span>
        <span>{getPaletteName(settings.palette)}</span>
      </span>
      <span
        class="summary-badge family-badge w98-chip"
        data-testid="palette-family-summary"
        title={paletteFamilyLabel}>{paletteFamilyLabel}</span
      >
      {#if isCustom}<span class="summary-badge custom-badge w98-chip w98-chip--active"
          >{i18n.t('custom')}</span
        >{/if}
    </div>
  </div>

  <!-- ═══ Tab Bar ═══ -->
  <div class="cp-tab-bar w98-tab-strip" role="tablist">
    {#each tabs as tab}
      <button
        class="cp-tab w98-tab-button"
        class:cp-tab-active={activeTab === tab.id}
        class:w98-tab-button--active={activeTab === tab.id}
        role="tab"
        aria-selected={activeTab === tab.id}
        aria-label={i18n.t(tab.labelKey)}
        onpointerenter={() => prefetchTab(tab.id)}
        onfocus={() => prefetchTab(tab.id)}
        onclick={() => {
          activeTab = tab.id;
        }}
      >
        <span class="tab-icon w98-emoji w98-tab-icon">{tab.icon}</span>
        <span class="tab-label">{i18n.t(tab.labelKey)}</span>
        {#if tab.id === 'effects' && effectsBadge > 0}
          <span class="tab-badge w98-tab-badge">{effectsBadge}</span>
        {/if}
        {#if tab.id === 'adjust' && adjustBadge}
          <span class="tab-badge w98-tab-badge">●</span>
        {/if}
      </button>
    {/each}
  </div>

  <!-- ═══ Tab Content ═══ -->
  <div class="cp-tab-content">
    <!-- ─── Basic Tab ─── -->
    {#if activeTab === 'basic'}
      <div class="tab-panel" role="tabpanel">
        <div class="basic-tuning-grid" data-testid="basic-tuning-grid">
          <fieldset
            class="cp-section cp-section--dense w98-fieldset"
            data-testid="basic-pixel-fieldset"
          >
            <legend>{i18n.t('pixel_size')}: {settings.pixelSize}px</legend>
            <div class="field-row slider-row">
              <span class="slider-label">1</span>
              <button
                class="stepper-btn w98-inline-button w98-button--thin"
                onclick={() => {
                  settings.pixelSize = Math.max(1, settings.pixelSize - 1);
                  update();
                }}
                aria-label={i18n.t('decrease_pixel_size')}>-</button
              >
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={settings.pixelSize}
                class="slider-input w98-range"
                oninput={(e) => {
                  settings.pixelSize = Number((e.currentTarget as HTMLInputElement).value);
                  update();
                }}
                aria-label={i18n.t('pixel_size')}
              />
              <button
                class="stepper-btn w98-inline-button w98-button--thin"
                onclick={() => {
                  settings.pixelSize = Math.min(10, settings.pixelSize + 1);
                  update();
                }}
                aria-label={i18n.t('increase_pixel_size')}>+</button
              >
              <span class="slider-label">10</span>
            </div>
          </fieldset>

          <fieldset
            class="cp-section cp-section--dense cp-section--wide w98-fieldset"
            data-testid="basic-color-fieldset"
          >
            <legend>{i18n.t('color_quant')}</legend>
            <div class="field-row">
              <button
                class="palette-btn w98-inline-button w98-button--thin"
                onclick={onOpenGallery}
              >
                <span class="palette-label-group">
                  <span class="palette-label-text"
                    ><b>{i18n.t('palette')}:</b> {getPaletteName(settings.palette)}</span
                  >
                  <span class="palette-family-inline w98-chip">{paletteFamilyLabel}</span>
                </span>
                <span class="palette-arrow">{i18n.t('select')}</span>
              </button>
            </div>
            <div class="quick-palette-row">
              {#each quickPalettes as qp}
                <button
                  class="quick-palette-chip w98-inline-button w98-button--thin"
                  data-testid={'quick-palette-' + qp.id}
                  class:preset-active={settings.palette === qp.id}
                  onclick={() => {
                    settings.palette = qp.id;
                    update();
                  }}
                  title={getPaletteName(qp.id)}
                >
                  <span class="qp-swatches">
                    {#each qp.preview as color}
                      <span
                        class="qp-dot w98-color-swatch w98-color-swatch--tiny"
                        style="background:{color}"
                      ></span>
                    {/each}
                  </span>
                  <span class="qp-label">{qp.shortName}</span>
                </button>
              {/each}
            </div>

            <div class="section-label">{i18n.t('dithering')}:</div>
            <div class="field-row render-row">
              {#each ditherOptions as opt}
                <button
                  class:preset-active={settings.ditherType === opt.id}
                  class="render-btn w98-inline-button w98-button--thin"
                  onclick={() => {
                    settings.ditherType = opt.id as DitherType;
                    update();
                  }}
                  title={i18n.t(opt.titleKey)}
                >
                  {i18n.t(opt.labelKey)}
                </button>
              {/each}
            </div>

            <div class="color-space-row" data-testid="basic-color-space-row">
              <span class="section-label section-label--inline">{i18n.t('color_space')}:</span>
              <label class="oklab-toggle">
                <input
                  class="w98-checkbox"
                  type="checkbox"
                  checked={settings.useOklab ?? false}
                  onchange={(e) => {
                    settings.useOklab = (e.target as HTMLInputElement).checked;
                    update();
                  }}
                />
                {i18n.t('use_oklab')}
              </label>
            </div>
          </fieldset>
        </div>
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
      <div class="tab-panel" role="tabpanel">
        <fieldset class="cp-section cp-preset-tune w98-fieldset" data-testid="preset-tune-strip">
          <legend>{i18n.t('quick_tune')}</legend>

          <div class="preset-tune-grid">
            <div class="preset-tune-control">
              <span class="preset-tune-label">{i18n.t('pixel_size')}</span>
              <div class="preset-stepper">
                <button
                  class="stepper-btn w98-inline-button w98-button--thin"
                  data-testid="preset-tune-pixel-decrease"
                  onclick={() => setPixelSize(settings.pixelSize - 1)}
                  aria-label={i18n.t('decrease_pixel_size')}>-</button
                >
                <span class="preset-tune-value">{settings.pixelSize}px</span>
                <button
                  class="stepper-btn w98-inline-button w98-button--thin"
                  data-testid="preset-tune-pixel-increase"
                  onclick={() => setPixelSize(settings.pixelSize + 1)}
                  aria-label={i18n.t('increase_pixel_size')}>+</button
                >
              </div>
            </div>

            <button
              class="palette-btn preset-gallery-btn w98-inline-button w98-button--thin"
              data-testid="preset-tune-palette-gallery"
              onclick={onOpenGallery}
            >
              <span class="palette-label-group">
                <span class="palette-label-text"
                  ><b>{i18n.t('palette')}:</b> {getPaletteName(settings.palette)}</span
                >
                <span class="palette-family-inline w98-chip">{paletteFamilyLabel}</span>
              </span>
              <span class="palette-arrow">{i18n.t('select')}</span>
            </button>
          </div>

          <div class="quick-palette-row preset-tune-palettes">
            {#each quickPalettes as qp}
              <button
                class="quick-palette-chip w98-inline-button w98-button--thin"
                data-testid={'preset-tune-palette-' + qp.id}
                class:preset-active={settings.palette === qp.id}
                onclick={() => setPalette(qp.id)}
                title={getPaletteName(qp.id)}
              >
                <span class="qp-swatches">
                  {#each qp.preview as color}
                    <span
                      class="qp-dot w98-color-swatch w98-color-swatch--tiny"
                      style="background:{color}"
                    ></span>
                  {/each}
                </span>
                <span class="qp-label">{qp.shortName}</span>
              </button>
            {/each}
          </div>

          <div class="section-label">{i18n.t('dithering')}:</div>
          <div class="field-row render-row preset-tune-dither">
            {#each ditherOptions as opt}
              <button
                class:preset-active={settings.ditherType === opt.id}
                class="render-btn w98-inline-button w98-button--thin"
                data-testid={'preset-tune-dither-' + opt.id}
                onclick={() => setDitherType(opt.id as DitherType)}
                title={i18n.t(opt.titleKey)}
              >
                {i18n.t(opt.labelKey)}
              </button>
            {/each}
          </div>
        </fieldset>

        {#if PresetManager}
          <PresetManager bind:settings {imageSrc} onChange={update} {onError} />
        {:else}
          <div
            class="cp-lazy-panel w98-status-panel"
            data-testid="preset-manager-loading"
            role="status"
            aria-live="polite"
          >
            <div class="cp-lazy-icon w98-emoji" aria-hidden="true">📋</div>
            <div class="w98-section-title">{i18n.t('loading')}</div>
            <div class="cp-lazy-title">{i18n.t('tab_presets')}</div>
            <div class="cp-lazy-summary w98-quiet-copy">{i18n.t('presets')}</div>
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- ═══ Export Snippet Slot ═══ -->
  {#if exportSnippet}
    {@render exportSnippet()}
  {/if}
</div>

<style>
  .cp-root {
    padding: 4px;
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .cp-root :global(.preset-active) {
    box-shadow: var(--w98-inset-thin);
    font-weight: bold;
    background: var(--w98-surface-active);
  }

  /* ===== Top Bar ===== */
  .cp-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
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
    color: var(--w98-highlight);
    white-space: nowrap;
  }
  .apply-now-btn-inline:disabled {
    color: var(--w98-text-disabled);
  }
  .apply-now-btn-inline.has-changes {
    background: var(--w98-surface-active);
    box-shadow: var(--w98-inset-thin);
    color: var(--w98-text);
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
    white-space: nowrap;
  }
  .custom-badge {
    font-weight: bold;
  }
  .family-badge {
    max-width: 116px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ===== Tab Bar ===== */
  .cp-tab-bar {
    margin-top: 4px;
  }
  .cp-tab {
    font-size: var(--w98-font-size-sm);
    font-weight: bold;
  }
  .cp-tab-active {
    color: var(--w98-text);
  }
  .tab-icon {
    flex-shrink: 0;
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
    flex-shrink: 0;
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

  .basic-tuning-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--w98-space-6);
  }

  .basic-tuning-grid > .cp-section {
    margin-top: 0;
  }

  .cp-lazy-panel {
    align-items: center;
    justify-content: center;
    min-height: 180px;
    text-align: center;
    margin: var(--w98-space-8) var(--w98-space-4) 0;
  }

  .cp-lazy-icon {
    font-size: 26px;
  }

  .cp-lazy-title {
    font-size: var(--w98-font-size-action);
    color: var(--w98-text);
  }

  .cp-lazy-summary {
    line-height: 1.3;
  }

  /* ===== Preset Tune Strip ===== */
  .cp-preset-tune {
    margin-top: 0;
  }
  .preset-tune-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--w98-space-4);
  }
  .preset-tune-control {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--w98-space-6);
    min-width: 0;
  }
  .preset-tune-label {
    font-size: var(--w98-font-size-sm);
    font-weight: bold;
    white-space: nowrap;
  }
  .preset-stepper {
    display: flex;
    align-items: center;
    gap: var(--w98-space-4);
    flex-shrink: 0;
  }
  .preset-tune-value {
    min-width: 36px;
    padding: 0 var(--w98-space-4);
    font-size: var(--w98-font-size-sm);
    font-weight: bold;
    line-height: 20px;
    text-align: center;
    background: var(--w98-surface-white);
    box-shadow: var(--w98-inset-thin);
  }
  .preset-gallery-btn {
    min-width: 0;
  }
  .preset-tune-palettes {
    margin-top: var(--w98-space-6);
  }
  .preset-tune-dither .render-btn {
    flex: 0 1 auto;
    min-width: 82px;
  }
  @media (min-width: 460px) {
    .preset-tune-grid {
      grid-template-columns: minmax(130px, 0.7fr) minmax(180px, 1.3fr);
      align-items: center;
    }
  }
  @media (max-width: 420px) {
    .preset-tune-control {
      align-items: flex-start;
      flex-direction: column;
      gap: var(--w98-space-4);
    }
    .preset-stepper {
      width: 100%;
      justify-content: space-between;
    }
    .preset-tune-value {
      flex: 1;
    }
  }

  /* ===== Sections ===== */
  .cp-section {
    margin-top: 6px;
  }

  .cp-section--dense {
    padding-bottom: var(--w98-space-8);
  }

  .section-label {
    margin-top: 8px;
    font-size: var(--w98-font-size-caption);
    margin-bottom: 2px;
    letter-spacing: 0.4px;
    text-transform: uppercase;
    color: var(--w98-text-hint);
  }

  .section-label--inline {
    margin: 0;
  }

  .color-space-row {
    display: flex;
    align-items: center;
    gap: var(--w98-space-6);
    flex-wrap: wrap;
    margin-top: var(--w98-space-8);
    padding-top: var(--w98-space-6);
    border-top: 1px solid var(--w98-shadow-808);
    box-shadow: inset 0 1px var(--w98-shadow-white);
  }

  .oklab-toggle {
    display: flex;
    align-items: center;
    gap: var(--w98-space-4);
    min-width: 0;
    font-size: var(--w98-font-size-sm);
    color: var(--w98-text);
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
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--w98-space-6);
    padding-inline: var(--w98-space-6);
  }
  .palette-label-group {
    display: flex;
    align-items: center;
    gap: var(--w98-space-4);
    min-width: 0;
  }
  .palette-label-text {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .palette-family-inline {
    flex-shrink: 0;
    max-width: 110px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .palette-arrow {
    font-size: var(--w98-font-size-sm);
    flex-shrink: 0;
  }

  /* ===== Render Mode Buttons ===== */
  .render-row {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .render-btn {
    font-size: var(--w98-font-size-sm);
    flex: 1 1 88px;
    min-width: 88px;
    text-align: center;
  }

  @media (min-width: 520px) {
    .basic-tuning-grid {
      grid-template-columns: minmax(150px, 0.7fr) minmax(230px, 1.3fr);
      align-items: start;
    }
  }
  /* Quick Palette */
  .quick-palette-row {
    display: flex;
    gap: var(--w98-space-4);
    flex-wrap: wrap;
    margin-top: var(--w98-space-4);
  }
  .quick-palette-chip {
    display: flex;
    align-items: center;
    gap: var(--w98-space-4);
    font-size: var(--w98-font-size-sm);
    flex-shrink: 0;
  }
  .qp-swatches {
    display: flex;
    gap: 1px;
  }
  .qp-dot {
    flex-shrink: 0;
  }
  .qp-label {
    font-size: var(--w98-font-size-sm);
  }
</style>
