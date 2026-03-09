<script lang="ts">
  import { getPaletteName } from '../utils/palettes';
  import { PRESETS, type Preset } from '../utils/presets';
  import type { DitherType, GlitchFilter, GlitchType, RenderMode, ProcessingSettings } from '../types';
  import type { SaveFormat } from '../services/saveService';

  // 글리치 필터 옵션 정의
  const GLITCH_OPTIONS = [
    { id: 'rgb_split', icon: '🔴', label: 'RGB Split' },
    { id: 'wave',      icon: '📺', label: 'Wave' },
    { id: 'noise',     icon: '🧩', label: 'Noise' },
    { id: 'slice',     icon: '🔪', label: 'Slice' },
  ] as const;

  // 렌더 모드 옵션
  const RENDER_OPTIONS = [
    { id: 'pixel_perfect', label: 'Pixel Perfect', title: 'Crisp & sharp dot edges' },
    { id: 'bilinear', label: 'Bilinear Blur', title: 'Smoothly interpolates for retro CRT feel' },
    { id: 'hqx', label: 'HQx Upscale', title: 'High quality curve-based edge upscaling' },
  ] as const;

  // 디더링 옵션
  const DITHER_OPTIONS = [
    { id: 'none', label: 'None', title: 'No dithering — flat color blocks' },
    { id: 'floyd_steinberg', label: 'Floyd-Steinberg', title: 'Error diffusion for smooth gradients' },
    { id: 'ordered', label: 'Ordered', title: 'Bayer matrix pattern dithering' },
  ] as const;

  // 저장 포맷 옵션
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

  // 현재 설정이 어떤 프리셋과도 일치하지 않으면 Custom
  let isCustom = $derived(!PRESETS.some(p => matchesPreset(p)));

  // 필터 토글: 없으면 intensity 1로 추가, 있으면 제거
  function toggleGlitch(filterId: GlitchType) {
    const idx = settings.glitchFilters.findIndex(f => f.type === filterId);
    if (idx >= 0) {
      settings.glitchFilters = settings.glitchFilters.filter((_, i) => i !== idx);
    } else {
      settings.glitchFilters = [...settings.glitchFilters, { type: filterId, intensity: 1 }];
    }
    update();
  }

  // 개별 필터의 강도 변경
  function setFilterIntensity(filterId: GlitchType, intensity: number) {
    settings.glitchFilters = settings.glitchFilters.map(f =>
      f.type === filterId ? { ...f, intensity } : { ...f }
    );
    update();
  }

  // 특정 필터가 활성화되어 있는지
  function isFilterActive(filterId: GlitchType): boolean {
    return settings.glitchFilters.some(f => f.type === filterId);
  }

  // 특정 필터의 현재 강도
  function getFilterIntensity(filterId: GlitchType): number {
    return settings.glitchFilters.find(f => f.type === filterId)?.intensity ?? 1;
  }

  function clearAllGlitch() {
    settings.glitchFilters = [];
    update();
  }
</script>

<div class="cp-root">
  <fieldset>
    <legend>Recommended Presets</legend>
    <div class="field-row preset-grid">
      {#each PRESETS as preset}
        <button
          class:preset-active={matchesPreset(preset)}
          class="preset-btn"
          onclick={() => applyPreset(preset)}
          title="Pixel: {preset.pixelSize}px | Palette: {getPaletteName(preset.palette)}"
        >{preset.label}</button>
      {/each}
    </div>
  </fieldset>

  <fieldset class="cp-section">
    <legend>Pixelation Size: {settings.pixelSize}px</legend>
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
    <legend>Color Quantization</legend>
    <div class="field-row">
      <button class="palette-btn" onclick={onOpenGallery}>
        <span><b>Palette:</b> {getPaletteName(settings.palette)}</span>
        <span class="palette-arrow">Select &gt;</span>
      </button>
    </div>

    <div class="section-label">Dithering:</div>
    <div class="field-row render-row">
      {#each DITHER_OPTIONS as opt}
        <button
          class:preset-active={settings.ditherType === opt.id}
          class="render-btn"
          onclick={() => { settings.ditherType = opt.id as DitherType; update(); }}
          title={opt.title}
        >
          {opt.label}
        </button>
      {/each}
    </div>
  </fieldset>

  <fieldset class="cp-section">
    <legend>Post Processing</legend>
    <div class="field-row">
      <input type="checkbox" id="crt-effect" bind:checked={settings.crtEffect} onchange={update} />
      <label for="crt-effect">CRT Scanlines</label>
    </div>

    <div class="section-label">
      Glitch Filters <span class="section-hint">(multi-select)</span>:
    </div>
    <div class="field-row glitch-toggles">
      <button
        class:preset-active={settings.glitchFilters.length === 0}
        class="glitch-toggle-btn"
        onclick={clearAllGlitch}
        title="None"
      >
        🚫 <span class="hide-on-small">None</span>
      </button>
      {#each GLITCH_OPTIONS as opt}
        <button
          class:preset-active={isFilterActive(opt.id)}
          class="glitch-toggle-btn"
          onclick={() => toggleGlitch(opt.id)}
          aria-label="{opt.label} Glitch Filter"
          title="{opt.label}"
        >
          {opt.icon} <span class="hide-on-small">{opt.label}</span>
        </button>
      {/each}
    </div>

    <!-- 활성 필터별 개별 강도 슬라이더 -->
    {#if settings.glitchFilters.length > 0}
    <div class="glitch-intensity-panel">
      {#each GLITCH_OPTIONS.filter(o => isFilterActive(o.id)) as opt}
        <div class="glitch-intensity-row">
          <span class="glitch-intensity-label">{opt.icon} {opt.label}</span>
          <div class="glitch-intensity-btns">
            {#each [1, 2, 3] as lv}
              <button
                class:preset-active={getFilterIntensity(opt.id) === lv}
                class="intensity-btn"
                onclick={() => setFilterIntensity(opt.id, lv)}
                title="Level {lv}"
              >
                {lv}
              </button>
            {/each}
          </div>
        </div>
      {/each}
    </div>
    {/if}

    <!-- 글리치 시드 고정/랜덤 토글 -->
    {#if settings.glitchFilters.length > 0}
    <div class="glitch-intensity-panel glitch-seed-panel">
      <div class="glitch-intensity-row">
        <span class="glitch-intensity-label">🎲 Seed</span>
        <div class="glitch-intensity-btns">
          <button
            class:preset-active={settings.glitchSeed === null}
            class="intensity-btn seed-btn"
            onclick={() => { settings.glitchSeed = null; update(); }}
          >Random</button>
          <button
            class:preset-active={settings.glitchSeed !== null}
            class="intensity-btn seed-btn"
            onclick={() => { settings.glitchSeed = Math.round(Math.random() * 10000) / 10000; update(); }}
          >{settings.glitchSeed !== null ? `Fixed (${settings.glitchSeed})` : 'Fix'}</button>
          {#if settings.glitchSeed !== null}
            <button
              class="intensity-btn"
              title="Re-roll seed"
              onclick={() => { settings.glitchSeed = Math.round(Math.random() * 10000) / 10000; update(); }}
            >🔄</button>
          {/if}
        </div>
      </div>
    </div>
    {/if}

    <div class="section-label">Scaling / Render Mode:</div>
    <div class="field-row render-row">
      {#each RENDER_OPTIONS as opt}
        <button
          class:preset-active={settings.renderMode === opt.id}
          class="render-btn"
          onclick={() => { settings.renderMode = opt.id as RenderMode; update(); }}
          title={opt.title}
        >
          {opt.label}
        </button>
      {/each}
    </div>
  </fieldset>

  <!-- Current Settings Summary -->
  <fieldset class="cp-section summary-fieldset">
    <legend>Current Settings {#if isCustom}<span class="custom-badge">Custom</span>{/if}</legend>
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
    <legend>Save Options</legend>
    <div class="field-row format-row">
      <span class="format-label">Format:</span>
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
        <span class="quality-label">Quality: {Math.round(saveQuality * 100)}%</span>
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
      title={!hasImage ? 'Load an image in Preview to save' : 'Save Processed Image'}
    >
      💾 Save As...
    </button>
  </div>

  <div class="shortcuts-hint">
    <span>⌨️</span>
    <span>Ctrl+Z Undo</span>
    <span>Ctrl+Shift+Z Redo</span>
    <span>Ctrl+S Save</span>
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
