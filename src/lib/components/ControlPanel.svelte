<script lang="ts">
  import { getPaletteName } from '../utils/palettes';
  import { PRESETS, type Preset } from '../utils/presets';
  import type { DitherType, EffectLayer, GlitchFilter, GlitchType, RenderMode, ProcessingSettings, PostProcessFilters } from '../types';
  import { DEFAULT_POST_FILTERS } from '../types';
  import type { SaveFormat } from '../services/saveService';
  import { i18n } from '$lib/i18n/index.svelte';
  import type { TranslationKey } from '$lib/i18n/en';
  import { getCustomPresets, addCustomPreset, removeCustomPreset } from '$lib/stores/customPresetStore.svelte';

  // CSS render mode options (HQx moved to effect layers)
  const CSS_RENDER_OPTIONS = [
    { id: 'pixel_perfect', labelKey: 'pixel_perfect' as const, titleKey: 'pixel_perfect_desc' as const },
    { id: 'bilinear', labelKey: 'bilinear_blur' as const, titleKey: 'bilinear_desc' as const },
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
    postFilters = $bindable({ ...DEFAULT_POST_FILTERS }),
    autoProcess = $bindable(true),
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
    postFilters?: PostProcessFilters;
    autoProcess?: boolean;
    onApplyNow?: () => void;
    onError?: (message: string) => void;
  } = $props();

  function update() {
    onChange(settings);
  }

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
    update();
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

  // ─── Effect Layer Management ───
  const EFFECT_OPTIONS: { type: EffectLayer['type']; glitchType?: GlitchType; icon: string; labelKey: TranslationKey }[] = [
    { type: 'glitch', glitchType: 'rgb_split', icon: '🔴', labelKey: 'effect_glitch_rgb_split' },
    { type: 'glitch', glitchType: 'wave',      icon: '📺', labelKey: 'effect_glitch_wave' },
    { type: 'glitch', glitchType: 'noise',     icon: '🧩', labelKey: 'effect_glitch_noise' },
    { type: 'glitch', glitchType: 'slice',     icon: '🔪', labelKey: 'effect_glitch_slice' },
    { type: 'hqx',                             icon: '✨', labelKey: 'effect_hqx' },
  ];

  function addEffectLayer(opt: typeof EFFECT_OPTIONS[number]) {
    const layer: EffectLayer = {
      id: crypto.randomUUID(),
      type: opt.type,
      enabled: true,
      ...(opt.glitchType ? { glitchType: opt.glitchType, intensity: 1 } : {}),
    };
    settings.effectLayers = [...(settings.effectLayers || []), layer];
    syncLegacyFromLayers();
    update();
  }

  function removeEffectLayer(id: string) {
    settings.effectLayers = (settings.effectLayers || []).filter(l => l.id !== id);
    syncLegacyFromLayers();
    update();
  }

  function toggleEffectLayer(id: string) {
    settings.effectLayers = (settings.effectLayers || []).map(l =>
      l.id === id ? { ...l, enabled: !l.enabled } : { ...l }
    );
    syncLegacyFromLayers();
    update();
  }

  function setLayerIntensity(id: string, intensity: number) {
    settings.effectLayers = (settings.effectLayers || []).map(l =>
      l.id === id ? { ...l, intensity } : { ...l }
    );
    syncLegacyFromLayers();
    update();
  }

  // Keep legacy fields in sync for backward compat (presets, export, etc.)
  function syncLegacyFromLayers() {
    const layers = settings.effectLayers || [];
    settings.glitchFilters = layers
      .filter(l => l.type === 'glitch' && l.enabled && l.glitchType && l.glitchType !== 'none')
      .map(l => ({ type: l.glitchType!, intensity: l.intensity || 1 }));
    const hasHqx = layers.some(l => l.type === 'hqx' && l.enabled);
    if (hasHqx && settings.renderMode !== 'hqx') {
      // Only override to hqx if an hqx layer is enabled
      // but keep the CSS render mode as is for pixel_perfect / bilinear
    }
  }

  function getEffectLabel(layer: EffectLayer): string {
    const opt = EFFECT_OPTIONS.find(o =>
      o.type === layer.type && (layer.type === 'hqx' || o.glitchType === layer.glitchType)
    );
    return opt ? `${opt.icon} ${i18n.t(opt.labelKey)}` : layer.type;
  }

  // ─── Drag & Drop Reorder ───
  let dragIdx = $state<number | null>(null);
  let dragOverIdx = $state<number | null>(null);

  function onDragStart(idx: number, e: DragEvent) {
    dragIdx = idx;
    e.dataTransfer!.effectAllowed = 'move';
    e.dataTransfer!.setData('text/plain', String(idx));
  }

  function onDragOver(idx: number, e: DragEvent) {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
    dragOverIdx = idx;
  }

  function onDragLeave() {
    dragOverIdx = null;
  }

  function onDrop(idx: number, e: DragEvent) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) { dragIdx = null; dragOverIdx = null; return; }
    const layers = [...(settings.effectLayers || [])];
    const [moved] = layers.splice(dragIdx, 1);
    layers.splice(idx, 0, moved);
    settings.effectLayers = layers;
    syncLegacyFromLayers();
    update();
    dragIdx = null;
    dragOverIdx = null;
  }

  function onDragEnd() {
    dragIdx = null;
    dragOverIdx = null;
  }

  function moveLayer(idx: number, direction: -1 | 1) {
    const layers = settings.effectLayers;
    if (!layers) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= layers.length) return;
    const copy = [...layers];
    [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
    settings.effectLayers = copy;
    syncLegacyFromLayers();
    update();
  }

  let showAddMenu = $state(false);
  let addMenuWrapperEl: HTMLDivElement | undefined = $state();

  $effect(() => {
    if (!showAddMenu) return;
    function handleClickOutside(e: MouseEvent) {
      if (addMenuWrapperEl && !addMenuWrapperEl.contains(e.target as Node)) {
        showAddMenu = false;
      }
    }
    // Delay listener to avoid catching the opening click
    requestAnimationFrame(() => {
      window.addEventListener('pointerdown', handleClickOutside);
    });
    return () => window.removeEventListener('pointerdown', handleClickOutside);
  });

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
      effectLayers: preset.settings.effectLayers?.map(l => ({ ...l })) || migrateToEffectLayers(preset.settings),
    };
    update();
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
      const s = data.settings;
      if (!s || typeof s.pixelSize !== 'number' || typeof s.palette !== 'string') {
        throw new Error('Invalid preset format');
      }
      const imported: ProcessingSettings = {
        pixelSize: Math.max(1, Math.min(64, s.pixelSize)),
        palette: s.palette,
        crtEffect: ['none', 'horizontal', 'vertical'].includes(s.crtEffect) ? s.crtEffect : (s.crtEffect === true ? 'horizontal' : 'none'),
        glitchFilters: Array.isArray(s.glitchFilters) ? s.glitchFilters.map((f: { type: GlitchType; intensity: number }) => ({ type: f.type, intensity: f.intensity })) : [],
        renderMode: ['pixel_perfect', 'bilinear', 'hqx'].includes(s.renderMode) ? s.renderMode : 'pixel_perfect',
        glitchSeed: s.glitchSeed ?? null,
        ditherType: ['none', 'floyd_steinberg', 'ordered'].includes(s.ditherType) ? s.ditherType : 'none',
      };
      imported.effectLayers = Array.isArray(s.effectLayers)
        ? s.effectLayers
            .filter((l: unknown): l is Record<string, unknown> =>
              typeof l === 'object' && l !== null &&
              typeof (l as Record<string, unknown>).type === 'string' &&
              ['glitch', 'hqx'].includes((l as Record<string, unknown>).type as string)
            )
            .map((l: EffectLayer) => ({
              id: l.id || crypto.randomUUID(),
              type: l.type,
              enabled: typeof l.enabled === 'boolean' ? l.enabled : true,
              ...(l.type === 'glitch' ? { glitchType: l.glitchType, intensity: typeof l.intensity === 'number' ? l.intensity : 1 } : {}),
            }))
        : migrateToEffectLayers(imported);
      settings = imported;
      update();
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
        <span>Auto</span>
      </label>
      {#if !autoProcess}
        <button class="apply-now-btn-inline" onclick={() => onApplyNow?.()} disabled={!hasImage}>
          ▶ {i18n.t('apply_now')}
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
      </div>

    <!-- ─── Effects Tab ─── -->
    {:else if activeTab === 'effects'}
      <div class="tab-panel" role="tabpanel">
        <!-- CRT Scanline Mode -->
        <div class="section-label">{i18n.t('crt_scanlines')}:</div>
        <div class="field-row">
          <select id="crt-effect" bind:value={settings.crtEffect} onchange={update}>
            <option value="none">{i18n.t('crt_none')}</option>
            <option value="horizontal">{i18n.t('crt_horizontal')}</option>
            <option value="vertical">{i18n.t('crt_vertical')}</option>
          </select>
        </div>

        <div class="section-label">{i18n.t('css_render_mode')}:</div>
        <div class="field-row render-row">
          {#each CSS_RENDER_OPTIONS as opt}
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

        <!-- Effect Stack -->
        <div class="section-label">{i18n.t('effect_stack')} <span class="section-hint">({i18n.t('effect_stack_hint')})</span></div>
        {#if !settings.effectLayers || settings.effectLayers.length === 0}
          <div class="no-effects">{i18n.t('no_effects')}</div>
        {:else}
          <div class="effect-layer-list">
            {#each settings.effectLayers as layer, idx (layer.id)}
              <div
                class="effect-layer-item"
                class:drag-over={dragOverIdx === idx}
                class:dragging={dragIdx === idx}
                class:disabled={!layer.enabled}
                draggable="true"
                ondragstart={(e) => onDragStart(idx, e)}
                ondragover={(e) => onDragOver(idx, e)}
                ondragleave={onDragLeave}
                ondrop={(e) => onDrop(idx, e)}
                ondragend={onDragEnd}
                role="listitem"
              >
                <button
                  class="layer-toggle"
                  class:active={layer.enabled}
                  onclick={() => toggleEffectLayer(layer.id)}
                  title={layer.enabled ? i18n.t('effect_enabled') : i18n.t('effect_disabled')}
                >{layer.enabled ? '✓' : '○'}</button>

                <span class="layer-label">{getEffectLabel(layer)}</span>

                {#if layer.type === 'glitch'}
                  <div class="layer-intensity">
                    {#each [1, 2, 3] as lv}
                      <button
                        class:preset-active={layer.intensity === lv}
                        class="intensity-btn"
                        onclick={() => setLayerIntensity(layer.id, lv)}
                        title="{i18n.t('level')} {lv}"
                      >{lv}</button>
                    {/each}
                  </div>
                {/if}

                <button
                  class="layer-remove"
                  onclick={() => removeEffectLayer(layer.id)}
                  title={i18n.t('remove_effect')}
                >×</button>

                <span class="layer-move-btns">
                  <button
                    class="layer-move-btn"
                    onclick={() => moveLayer(idx, -1)}
                    disabled={idx === 0}
                    title={i18n.t('move_up')}
                    aria-label={i18n.t('move_up')}
                  >▲</button>
                  <button
                    class="layer-move-btn"
                    onclick={() => moveLayer(idx, 1)}
                    disabled={idx === (settings.effectLayers?.length ?? 0) - 1}
                    title={i18n.t('move_down')}
                    aria-label={i18n.t('move_down')}
                  >▼</button>
                </span>

                <span class="drag-handle" aria-hidden="true">≡</span>
              </div>
            {/each}
          </div>
        {/if}

        <!-- Glitch seed (shown when any glitch layer exists) -->
        {#if settings.effectLayers?.some(l => l.type === 'glitch' && l.enabled)}
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

        <!-- Add Effect Button -->
        <div class="add-effect-row">
          <div class="add-effect-wrapper" bind:this={addMenuWrapperEl}>
            <button class="add-effect-btn" onclick={() => { showAddMenu = !showAddMenu; }}>
              + {i18n.t('add_effect')}
            </button>
            {#if showAddMenu}
              <div class="add-effect-menu">
                {#each EFFECT_OPTIONS as opt}
                  <button
                    class="add-effect-option"
                    onclick={() => { addEffectLayer(opt); showAddMenu = false; }}
                  >
                    {opt.icon} {i18n.t(opt.labelKey)}
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      </div>

    <!-- ─── Adjust Tab ─── -->
    {:else if activeTab === 'adjust'}
      <div class="tab-panel" role="tabpanel">
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
        {#if hasPostFilterChanges}
          <button class="pf-reset" onclick={() => { postFilters = { ...DEFAULT_POST_FILTERS }; }}>{i18n.t('reset_filters')}</button>
        {/if}
      </div>

    <!-- ─── Presets Tab ─── -->
    {:else if activeTab === 'presets'}
      <div class="tab-panel" role="tabpanel">
        <div class="field-row preset-grid">
          {#each PRESETS as preset}
            <button
              class:preset-active={matchesPreset(preset)}
              class="preset-btn preset-card"
              onclick={() => applyPreset(preset)}
              title="{i18n.t('pixel_size')}: {preset.pixelSize}px | {i18n.t('palette')}: {getPaletteName(preset.palette)} | {i18n.t('dithering')}: {preset.ditherType}{preset.crtEffect !== 'none' ? ` | CRT (${preset.crtEffect})` : ''}{preset.glitchFilters.length > 0 ? ` | ${preset.glitchFilters.length} effects` : ''}"
            >
              <span class="preset-card-icon">{preset.icon}</span>
              <span class="preset-card-name">{i18n.t(preset.labelKey)}</span>
              <span class="preset-card-info">{preset.pixelSize}px</span>
            </button>
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
      </div>
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
        />
      {/if}
    </div>
    <div class="field-row save-row">
      <button
        class="save-btn"
        onclick={onSave}
        disabled={!hasImage}
        title={!hasImage ? i18n.t('save_no_image') : i18n.t('save_processed')}
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
    box-shadow: inset -1px -1px #fff, inset 1px 1px #0a0a0a, inset -2px -2px #dfdfdf, inset 2px 2px #808080;
    font-weight: bold;
    background: #d0d8e0;
    border-color: #000080;
  }

  /* ===== Top Bar ===== */
  .cp-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 2px;
    margin-bottom: 4px;
    background: #d4d0c8;
    border: 1px solid;
    border-color: #dfdfdf #808080 #808080 #dfdfdf;
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
    font-size: 11px;
    cursor: pointer;
    white-space: nowrap;
  }
  .auto-toggle input {
    margin: 0;
  }
  .apply-now-btn-inline {
    font-size: 10px;
    padding: 2px 8px;
    font-weight: bold;
    background: #000080;
    color: #fff;
    cursor: pointer;
    white-space: nowrap;
  }
  .apply-now-btn-inline:hover {
    background: #0000a0;
  }
  .apply-now-btn-inline:disabled {
    background: #808080;
    cursor: default;
  }
  .topbar-summary {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .summary-badge {
    font-size: 11px;
    padding: 1px 5px;
    background: #e8e4dc;
    border: 1px solid #c0c0c0;
    white-space: nowrap;
  }
  .custom-badge {
    background: #000080;
    color: #fff;
    font-weight: bold;
    border-color: #000080;
  }

  /* ===== Tab Bar ===== */
  .cp-tab-bar {
    display: flex;
    gap: 0;
    margin-top: 4px;
    border-bottom: 2px solid #808080;
    padding: 0 2px;
  }
  .cp-tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 4px 2px;
    font-size: 10px;
    font-weight: bold;
    background: #d4d0c8;
    border: 1px solid #808080;
    border-bottom: none;
    margin-bottom: -2px;
    cursor: pointer;
    position: relative;
    color: #444;
    transition: background 0.1s;
  }
  .cp-tab:hover {
    background: #e0dcd4;
  }
  .cp-tab-active {
    background: #c0c0c0;
    color: #000;
    border-color: #808080 #808080 #c0c0c0;
    z-index: 1;
  }
  .tab-icon {
    font-size: 11px;
  }
  .tab-label {
    white-space: nowrap;
  }
  @media (max-width: 370px) {
    .tab-label {
      display: none;
    }
  }
  .tab-badge {
    font-size: 8px;
    background: #000080;
    color: #fff;
    padding: 0 4px;
    border-radius: 8px;
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

  /* ===== Preset Card ===== */
  .preset-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
    padding: 4px 6px;
    min-width: 56px;
  }
  .preset-card-icon {
    font-size: 14px;
    line-height: 1;
  }
  .preset-card-name {
    font-size: 9px;
    line-height: 1.1;
    white-space: nowrap;
  }
  .preset-card-info {
    font-size: 8px;
    color: #808080;
    line-height: 1;
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
  .preset-delete:focus-visible {
    outline: 1px solid #000080;
    outline-offset: 1px;
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

  /* ===== Sticky Save Bar ===== */
  .cp-save-bar {
    position: sticky;
    bottom: 0;
    margin-top: 8px;
    padding: 6px;
    background: #d4d0c8;
    border: 2px solid;
    border-color: #dfdfdf #808080 #808080 #dfdfdf;
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
    font-size: 10px;
    padding: 2px 8px;
    text-align: center;
  }
  .quality-inline {
    font-size: 9px;
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
    font-size: 12px;
    background: #c0c0c0;
  }
  .save-btn:hover {
    background: #d0d0d0;
  }

  /* ===== Effect Layer Stack ===== */
  .effect-layer-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .effect-layer-item {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px 4px;
    background: #e8e8e0;
    border: 1px solid #c0c0c0;
    cursor: grab;
    transition: background 0.1s, opacity 0.1s;
  }
  .effect-layer-item:active {
    cursor: grabbing;
  }
  .effect-layer-item.dragging {
    opacity: 0.4;
  }
  .effect-layer-item.drag-over {
    border-top: 2px solid #000080;
  }
  .effect-layer-item.disabled {
    opacity: 0.5;
    background: #f0f0f0;
  }
  .layer-toggle {
    min-width: 20px;
    width: 20px;
    height: 20px;
    padding: 0;
    font-size: 10px;
    text-align: center;
    line-height: 20px;
    cursor: pointer;
  }
  .layer-toggle.active {
    color: #008000;
    font-weight: bold;
  }
  .layer-label {
    font-size: 11px;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .layer-intensity {
    display: flex;
    gap: 2px;
  }
  .layer-remove {
    min-width: 18px;
    width: 18px;
    height: 18px;
    padding: 0;
    font-size: 12px;
    font-weight: bold;
    color: #808080;
    cursor: pointer;
    line-height: 16px;
    text-align: center;
  }
  .layer-remove:hover {
    color: #c00;
  }
  .layer-move-btns {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .layer-move-btn {
    min-width: 16px;
    width: 16px;
    height: 12px;
    padding: 0;
    font-size: 8px;
    line-height: 10px;
    text-align: center;
    color: #808080;
    cursor: pointer;
  }
  .layer-move-btn:hover:not(:disabled) {
    color: #000;
  }
  .layer-move-btn:disabled {
    color: #c0c0c0;
    cursor: default;
  }
  .drag-handle {
    font-size: 14px;
    color: #999;
    cursor: grab;
    user-select: none;
    line-height: 1;
  }
  .no-effects {
    font-size: 10px;
    color: #808080;
    padding: 6px 0;
    text-align: center;
  }
  .add-effect-row {
    margin-top: 6px;
  }
  .add-effect-wrapper {
    position: relative;
  }
  .add-effect-btn {
    width: 100%;
    font-size: 11px;
    padding: 3px 8px;
    cursor: pointer;
  }
  .add-effect-menu {
    position: absolute;
    bottom: 100%;
    left: 0;
    right: 0;
    background: #fff;
    border: 1px solid #808080;
    box-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    z-index: 10;
    display: flex;
    flex-direction: column;
  }
  .add-effect-option {
    font-size: 11px;
    padding: 4px 8px;
    text-align: left;
    border: none;
    background: none;
    cursor: pointer;
  }
  .add-effect-option:hover {
    background: #000080;
    color: #fff;
  }

</style>
