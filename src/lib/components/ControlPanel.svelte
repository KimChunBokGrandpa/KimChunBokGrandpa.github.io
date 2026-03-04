<script lang="ts">
  import { PALETTE_GROUPS } from '../utils/palettes';

  // O(1) 상수 시간 검색을 위한 팔레트 이름 맵
  const paletteNameMap = new Map<string, string>([
    ['original', 'Full Color (Original)'],
    ['win256', '8-bit Windows 256'],
    ['monochrome', '2-bit Monochrome'],
    ...PALETTE_GROUPS.flatMap(g => g.palettes).map(p => [p.id, p.name] as [string, string]),
  ]);

  // 추천 프리셋 정의
  interface Preset {
    id: string;
    label: string;
    pixelSize: number;
    palette: string;
    crtEffect: boolean;
    glitchType: string;
    glitchIntensity: number;
    renderMode: string;
  }

  const PRESETS: Preset[] = [
    { id: 'retro_crt',  label: '📺 CRT',         pixelSize: 3, palette: 'win256',     crtEffect: true,  glitchType: 'none',      glitchIntensity: 1, renderMode: 'pixel_perfect' },
    { id: 'gameboy',    label: '🎮 Gameboy',     pixelSize: 4, palette: 'dmg',        crtEffect: false, glitchType: 'none',      glitchIntensity: 1, renderMode: 'pixel_perfect' },
    { id: 'nes',        label: '🕹️ NES',         pixelSize: 3, palette: 'nes',        crtEffect: false, glitchType: 'none',      glitchIntensity: 1, renderMode: 'pixel_perfect' },
    { id: 'pico8',      label: '👾 PICO-8',      pixelSize: 4, palette: 'pico8',      crtEffect: false, glitchType: 'none',      glitchIntensity: 1, renderMode: 'pixel_perfect' },
    { id: 'broken_vhs', label: '📼 Broken VHS',  pixelSize: 2, palette: 'win256',     crtEffect: true,  glitchType: 'wave',      glitchIntensity: 2, renderMode: 'pixel_perfect' },
    { id: 'cyberpunk',  label: '🌃 Cyberpunk',   pixelSize: 2, palette: 'cyberpunk16', crtEffect: true,  glitchType: 'rgb_split', glitchIntensity: 2, renderMode: 'pixel_perfect' },
    { id: 'glitch_art', label: '☠️ Glitch Art',  pixelSize: 3, palette: 'c64',        crtEffect: true,  glitchType: 'noise',     glitchIntensity: 3, renderMode: 'pixel_perfect' },
    { id: 'smooth_hqx', label: '✨ Smooth HQx',  pixelSize: 2, palette: 'win256',     crtEffect: false, glitchType: 'none',      glitchIntensity: 1, renderMode: 'hqx' },
    { id: 'original',   label: '🖼️ Original',    pixelSize: 1, palette: 'original',   crtEffect: false, glitchType: 'none',      glitchIntensity: 1, renderMode: 'pixel_perfect' },
  ];

  let {
    settings = $bindable({ pixelSize: 1, palette: 'original', crtEffect: false, glitchType: 'none', glitchIntensity: 1, renderMode: 'pixel_perfect' }),
    onChange,
    onSave,
    onOpenGallery,
  }: {
    settings: { pixelSize: number; palette: string; crtEffect: boolean; glitchType: string; glitchIntensity: number; renderMode: string };
    onChange: (settings: { pixelSize: number; palette: string; crtEffect: boolean; glitchType: string; glitchIntensity: number; renderMode: string }) => void;
    onSave: () => void;
    onOpenGallery: () => void;
  } = $props();

  function update() {
    onChange(settings);
  }

  function applyPreset(preset: Preset) {
    settings = {
      pixelSize: preset.pixelSize,
      palette: preset.palette,
      crtEffect: preset.crtEffect,
      glitchType: preset.glitchType,
      glitchIntensity: preset.glitchIntensity,
      renderMode: preset.renderMode
    };
    update();
  }

  function getPaletteName(id: string) {
    return paletteNameMap.get(id) ?? id;
  }

  function matchesPreset(preset: Preset): boolean {
    return settings.pixelSize === preset.pixelSize
      && settings.palette === preset.palette
      && settings.crtEffect === preset.crtEffect
      && settings.glitchType === preset.glitchType
      && settings.glitchIntensity === preset.glitchIntensity
      && settings.renderMode === preset.renderMode;
  }
</script>

<div class="cp-root">
  <fieldset>
    <legend>Recommended Presets</legend>
    <div class="field-row" style="display: flex; flex-wrap: wrap; gap: 4px; justify-content: flex-start;">
      {#each PRESETS as preset}
        <button
          class:preset-active={matchesPreset(preset)}
          style="font-size: 11px; padding: 2px 6px;"
          onclick={() => applyPreset(preset)}
        >{preset.label}</button>
      {/each}
    </div>
  </fieldset>

  <fieldset style="margin-top: 8px;">
    <legend>Pixelation Size: {settings.pixelSize}px</legend>
    <div class="field-row" style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 10px; flex-shrink: 0;">1</span>
      <button
        style="min-width: 24px; padding: 0;"
        onclick={() => { settings.pixelSize = Math.max(1, settings.pixelSize - 1); update(); }}
      >-</button>
      <input
        type="range"
        min="1"
        max="10"
        step="1"
        bind:value={settings.pixelSize}
        oninput={update}
        style="flex: 1;"
      />
      <button
        style="min-width: 24px; padding: 0;"
        onclick={() => { settings.pixelSize = Math.min(10, settings.pixelSize + 1); update(); }}
      >+</button>
      <span style="font-size: 10px; flex-shrink: 0;">10</span>
    </div>
  </fieldset>

  <fieldset style="margin-top: 8px;">
    <legend>Color Quantization</legend>
    <div class="field-row">
      <button
        style="width: 100%; text-align: left; padding: 4px; display: flex; justify-content: space-between; align-items: center;"
        onclick={onOpenGallery}
      >
        <span><b>Palette:</b> {getPaletteName(settings.palette)}</span>
        <span style="font-size: 10px;">Select &gt;</span>
      </button>
    </div>
  </fieldset>

  <fieldset style="margin-top: 8px;">
    <legend>Post Processing</legend>
    <div class="field-row">
      <input type="checkbox" id="crt-effect" bind:checked={settings.crtEffect} onchange={update} />
      <label for="crt-effect">CRT Scanlines</label>
    </div>
    
    <div style="margin-top: 8px; font-size: 11px; margin-bottom: 2px;">Glitch Filter:</div>
    <div class="field-row" style="display: flex; flex-wrap: wrap; gap: 4px;">
      {#each [
        { id: 'none', icon: '🚫', label: 'None' },
        { id: 'rgb_split', icon: '🔴', label: 'RGB Split' },
        { id: 'wave', icon: '📺', label: 'Wave' },
        { id: 'noise', icon: '🧩', label: 'Noise' },
        { id: 'slice', icon: '🔪', label: 'Slice' }
      ] as opt}
        <button
          class:preset-active={settings.glitchType === opt.id}
          style="font-size: 11px; padding: 2px 4px; flex: 1; text-align: center;"
          onclick={() => { settings.glitchType = opt.id; update(); }}
          aria-label="{opt.label} Glitch Filter"
          title="{opt.label}"
        >
          {opt.icon} <span class="hide-on-small">{opt.label}</span>
        </button>
      {/each}
    </div>

    {#if settings.glitchType !== 'none'}
    <div style="margin-top: 6px; font-size: 11px; margin-bottom: 2px;">Glitch Intensity:</div>
    <div class="field-row" style="display: flex; gap: 4px;">
      {#each [1, 2, 3] as intensity}
        <button
          class:preset-active={settings.glitchIntensity === intensity}
          style="font-size: 10px; padding: 1px 0; flex: 1; text-align: center;"
          onclick={() => { settings.glitchIntensity = intensity; update(); }}
        >
          Lv {intensity}
        </button>
      {/each}
    </div>
    {/if}

    <div style="margin-top: 8px; font-size: 11px; margin-bottom: 2px;">Scaling / Render Mode:</div>
    <div class="field-row" style="display: flex; flex-wrap: wrap; gap: 4px;">
      {#each [
        { id: 'pixel_perfect', label: 'Pixel Perfect', title: 'Crisp & sharp dot edges' },
        { id: 'bilinear', label: 'Bilinear Blur', title: 'Smoothly interpolates for retro CRT feel' },
        { id: 'hqx', label: 'HQx Upscale', title: 'High quality curve-based edge upscaling' }
      ] as opt}
        <button
          class:preset-active={settings.renderMode === opt.id}
          style="font-size: 10px; padding: 3px 6px; flex: 1; text-align: center;"
          onclick={() => { settings.renderMode = opt.id; update(); }}
          title={opt.title}
        >
          {opt.label}
        </button>
      {/each}
    </div>
  </fieldset>

  <div class="field-row" style="margin-top: 10px; justify-content: flex-end;">
    <button style="font-weight: bold;" onclick={onSave}>Save As...</button>
  </div>
</div>

<style>
  .cp-root {
    padding: 4px;
  }
  .cp-root :global(.preset-active) {
    box-shadow: inset -1px -1px #fff, inset 1px 1px #0a0a0a, inset -2px -2px #dfdfdf, inset 2px 2px #808080;
    font-weight: bold;
    background: #e0e0e0;
  }
  @media (max-width: 400px) {
    .hide-on-small { display: none; }
  }
</style>
