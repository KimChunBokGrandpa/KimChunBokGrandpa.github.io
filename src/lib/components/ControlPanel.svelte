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
  }

  const PRESETS: Preset[] = [
    { id: 'retro_crt',  label: '📺 Retro CRT',    pixelSize: 3, palette: 'win256',     crtEffect: true },
    { id: 'gameboy',    label: '🎮 Gameboy',       pixelSize: 4, palette: 'dmg',        crtEffect: false },
    { id: 'nes',        label: '🕹️ NES',           pixelSize: 3, palette: 'nes',        crtEffect: false },
    { id: 'pico8',      label: '👾 PICO-8',        pixelSize: 4, palette: 'pico8',      crtEffect: false },
    { id: 'pastel',     label: '🌸 Pastel',        pixelSize: 2, palette: 'pastel8',    crtEffect: false },
    { id: 'cyberpunk',  label: '🌃 Cyberpunk',     pixelSize: 2, palette: 'cyberpunk16', crtEffect: true },
    { id: 'monochrome', label: '⬛ Mono',           pixelSize: 3, palette: 'monochrome', crtEffect: false },
    { id: 'original',   label: '🖼️ Original',      pixelSize: 1, palette: 'original',   crtEffect: false },
  ];

  let {
    settings = $bindable({ pixelSize: 1, palette: 'original', crtEffect: false }),
    onChange,
    onSave,
    onOpenGallery,
  }: {
    settings: { pixelSize: number; palette: string; crtEffect: boolean };
    onChange: (settings: { pixelSize: number; palette: string; crtEffect: boolean }) => void;
    onSave: () => void;
    onOpenGallery: () => void;
  } = $props();

  function update() {
    onChange(settings);
  }

  function applyPreset(preset: Preset) {
    settings = { pixelSize: preset.pixelSize, palette: preset.palette, crtEffect: preset.crtEffect };
    update();
  }

  function getPaletteName(id: string) {
    return paletteNameMap.get(id) ?? id;
  }

  function matchesPreset(preset: Preset): boolean {
    return settings.pixelSize === preset.pixelSize
      && settings.palette === preset.palette
      && settings.crtEffect === preset.crtEffect;
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
      <input
        type="range"
        min="1"
        max="10"
        step="1"
        bind:value={settings.pixelSize}
        oninput={update}
        style="flex: 1;"
      />
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
</style>
