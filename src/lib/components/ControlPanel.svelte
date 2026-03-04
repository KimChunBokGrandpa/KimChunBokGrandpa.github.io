<script lang="ts">
  import { PALETTE_GROUPS } from '../utils/palettes';

  // O(1) 상수 시간 검색을 위한 팔레트 이름 맵
  const paletteNameMap = new Map(
    PALETTE_GROUPS.flatMap(g => g.palettes).map(p => [p.id, p.name])
  );

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

  function applyPreset(preset: string) {
    if (preset === 'Win95') {
      settings = { pixelSize: 3, palette: 'win256', crtEffect: true };
    } else if (preset === 'Win98') {
      settings = { pixelSize: 2, palette: 'highcolor', crtEffect: false };
    } else if (preset === 'WinXP') {
      settings = { pixelSize: 1, palette: 'original', crtEffect: false };
    } else if (preset === 'Gameboy') {
      settings = { pixelSize: 4, palette: 'dmg', crtEffect: false };
    }
    update();
  }

  function getPaletteName(id: string) {
    if (id === 'original') return 'Full Color (Original)';
    if (id === 'highcolor') return '16-bit High Color';
    if (id === 'win256') return '8-bit Windows 256';
    if (id === 'monochrome') return '2-bit Monochrome';
    return paletteNameMap.get(id) ?? id;
  }

  function matchesPreset(preset: string): boolean {
    if (preset === 'Win95') return settings.pixelSize === 3 && settings.palette === 'win256' && settings.crtEffect;
    if (preset === 'Win98') return settings.pixelSize === 2 && settings.palette === 'highcolor' && !settings.crtEffect;
    if (preset === 'WinXP') return settings.pixelSize === 1 && settings.palette === 'original' && !settings.crtEffect;
    if (preset === 'Gameboy') return settings.pixelSize === 4 && settings.palette === 'dmg' && !settings.crtEffect;
    return false;
  }
</script>

<div class="cp-root">
  <fieldset>
    <legend>OS Presets</legend>
    <div class="field-row" style="display: flex; flex-wrap: wrap; gap: 5px; justify-content: flex-start;">
      {#each ['Win95', 'Win98', 'WinXP', 'Gameboy'] as preset}
        <button
          class:preset-active={matchesPreset(preset)}
          onclick={() => applyPreset(preset)}
        >{preset === 'Win95' ? 'Win 95' : preset === 'Win98' ? 'Win 98' : preset === 'WinXP' ? 'Win XP' : preset}</button>
      {/each}
    </div>
  </fieldset>

  <fieldset style="margin-top: 8px;">
    <legend>Pixelation Size</legend>
    <div class="field-row" style="display: flex; flex-wrap: wrap; gap: 4px;">
      {#each [1, 2, 3, 4, 5, 10] as size}
        <button
          style={settings.pixelSize === size ? "font-weight: bold; padding: 2px 5px;" : "padding: 2px 5px;"}
          onclick={() => { settings.pixelSize = size; update(); }}
        >
          {size}px
        </button>
      {/each}
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
