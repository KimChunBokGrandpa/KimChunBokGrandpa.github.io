<script lang="ts">
  import type { RGB } from '../utils/palettes';
  import { rgbToHex, hexToRgb } from '../utils/colorUtils';
  import { i18n } from '$lib/i18n/index.svelte';

  let {
    initialName = '',
    initialColors = [] as RGB[],
    onSave,
    onCancel,
  }: {
    initialName?: string;
    initialColors?: RGB[];
    onSave: (name: string, colors: RGB[]) => void;
    onCancel: () => void;
  } = $props();

  let name = $state('');
  let colors = $state<RGB[]>([]);
  $effect(() => { name = initialName; });
  $effect(() => { colors = initialColors.map(c => ({ ...c })); });
  let hexInput = $state('#000000');
  let editingIndex = $state<number | null>(null);

  function addColor() {
    const rgb = hexToRgb(hexInput);
    if (!rgb) return;
    if (editingIndex !== null) {
      colors[editingIndex] = rgb;
      colors = [...colors];
      editingIndex = null;
    } else {
      colors = [...colors, rgb];
    }
    hexInput = '#000000';
  }

  function removeColor(index: number) {
    colors = colors.filter((_, i) => i !== index);
    if (editingIndex === index) editingIndex = null;
  }

  function editColor(index: number) {
    editingIndex = index;
    hexInput = rgbToHex(colors[index]);
  }

  function handleColorPickerInput(e: Event) {
    hexInput = (e.target as HTMLInputElement).value;
  }

  function handleSave() {
    if (colors.length < 2) return;
    onSave(name || i18n.t('my_custom_palette'), colors);
  }

  // ─── Gradient Generation ───
  let gradStart = $state('#000000');
  let gradEnd = $state('#ffffff');
  let gradSteps = $state(6);

  function generateGradient() {
    const start = hexToRgb(gradStart);
    const end = hexToRgb(gradEnd);
    if (!start || !end || gradSteps < 2) return;
    const newColors: RGB[] = [];
    for (let i = 0; i < gradSteps; i++) {
      const t = i / (gradSteps - 1);
      newColors.push({
        r: Math.round(start.r + (end.r - start.r) * t),
        g: Math.round(start.g + (end.g - start.g) * t),
        b: Math.round(start.b + (end.b - start.b) * t),
      });
    }
    colors = [...colors, ...newColors];
  }

  // ─── Color Sorting & Reverse ───
  function rgbToHue(c: RGB): number {
    const r = c.r / 255, g = c.g / 255, b = c.b / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (max === min) return 0;
    const d = max - min;
    let h = 0;
    if (max === r) h = ((g - b) / d + 6) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    return h * 60;
  }

  function sortByHue() {
    colors = [...colors].sort((a, b) => rgbToHue(a) - rgbToHue(b));
  }

  function reverseColors() {
    colors = [...colors].reverse();
  }

  let canSave = $derived(colors.length >= 2);
</script>

<div class="cpe-root">
  <fieldset>
    <legend>{i18n.t('palette_name')}</legend>
    <div class="field-row">
      <input
        type="text"
        class="cpe-name-input"
        bind:value={name}
        placeholder={i18n.t('my_custom_palette')}
        maxlength="40"
      />
    </div>
  </fieldset>

  <fieldset>
    <legend>{i18n.t('colors_count').replace('{0}', String(colors.length))}</legend>
    <div class="cpe-swatches">
      {#each colors as c, i}
        <div class="cpe-swatch-item">
          <span
            class="cpe-swatch"
            class:cpe-editing={editingIndex === i}
            style="background:rgb({c.r},{c.g},{c.b})"
            title={i18n.t('swatch_hint').replace('{0}', rgbToHex(c))}
            onclick={() => editColor(i)}
            oncontextmenu={(e) => { e.preventDefault(); removeColor(i); }}
            role="button"
            tabindex="0"
            onkeydown={(e) => { if (e.key === 'Delete' || e.key === 'Backspace') removeColor(i); else if (e.key === 'Enter') editColor(i); }}
          ></span>
          <button
            class="cpe-swatch-remove"
            onclick={() => removeColor(i)}
            aria-label={i18n.t('close')}
          >&times;</button>
        </div>
      {/each}
      {#if colors.length === 0}
        <span class="cpe-hint">{i18n.t('add_at_least_2')}</span>
      {/if}
    </div>

    <div class="cpe-add-row">
      <input
        type="color"
        class="cpe-color-picker"
        bind:value={hexInput}
        oninput={handleColorPickerInput}
      />
      <input
        type="text"
        class="cpe-hex-input"
        bind:value={hexInput}
        placeholder="#RRGGBB"
        maxlength="7"
        onkeydown={(e) => { if (e.key === 'Enter') addColor(); }}
      />
      <button class="cpe-add-btn" onclick={addColor}>
        {editingIndex !== null ? i18n.t('update') : i18n.t('add_color')}
      </button>
      {#if editingIndex !== null}
        <button class="cpe-add-btn" onclick={() => { editingIndex = null; hexInput = '#000000'; }}>
          {i18n.t('cancel')}
        </button>
      {/if}
    </div>

    {#if colors.length > 0}
      <div class="cpe-tools-row">
        <button class="cpe-tool-btn" onclick={sortByHue} title={i18n.t('sort_by_hue')}>↕ {i18n.t('sort_by_hue')}</button>
        <button class="cpe-tool-btn" onclick={reverseColors} title={i18n.t('reverse_colors')}>⇆ {i18n.t('reverse_colors')}</button>
      </div>
    {/if}
  </fieldset>

  <fieldset>
    <legend>{i18n.t('generate_gradient')}</legend>
    <div class="cpe-gradient-row">
      <label class="cpe-grad-label">
        <span>{i18n.t('gradient_start')}</span>
        <input type="color" bind:value={gradStart} class="cpe-color-picker" />
      </label>
      <label class="cpe-grad-label">
        <span>{i18n.t('gradient_end')}</span>
        <input type="color" bind:value={gradEnd} class="cpe-color-picker" />
      </label>
      <label class="cpe-grad-label">
        <span>{i18n.t('gradient_steps')}</span>
        <input type="number" min="2" max="64" bind:value={gradSteps} class="cpe-step-input" />
      </label>
      <button class="cpe-add-btn" onclick={generateGradient}>{i18n.t('generate_gradient')}</button>
    </div>
    <div class="cpe-gradient-preview">
      {#each Array(gradSteps) as _, i}
        {@const t = gradSteps > 1 ? i / (gradSteps - 1) : 0}
        {@const sr = hexToRgb(gradStart)}
        {@const er = hexToRgb(gradEnd)}
        {#if sr && er}
          <span
            class="cpe-grad-swatch"
            style="background:rgb({Math.round(sr.r + (er.r - sr.r) * t)},{Math.round(sr.g + (er.g - sr.g) * t)},{Math.round(sr.b + (er.b - sr.b) * t)})"
          ></span>
        {/if}
      {/each}
    </div>
  </fieldset>

  <div class="cpe-actions">
    <button onclick={onCancel}>{i18n.t('cancel')}</button>
    <button onclick={handleSave} disabled={!canSave}>
      {i18n.t('save_palette')}
    </button>
  </div>
</div>

<style>
  .cpe-root {
    padding: 6px;
    font-size: 11px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .cpe-name-input {
    width: 100%;
    box-sizing: border-box;
    padding: 2px 4px;
  }

  .cpe-swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
    min-height: 28px;
    padding: 4px;
    background: #fff;
    border: 2px inset #dfdfdf;
  }

  .cpe-swatch-item {
    position: relative;
  }

  .cpe-swatch-remove {
    position: absolute;
    top: -6px;
    right: -6px;
    width: 14px;
    height: 14px;
    padding: 0;
    font-size: 10px;
    line-height: 1;
    background: #c0c0c0;
    border: 1px solid #808080;
    cursor: pointer;
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 2;
  }
  .cpe-swatch-item:hover .cpe-swatch-remove {
    display: flex;
  }

  .cpe-swatch {
    display: block;
    width: 18px;
    height: 18px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    cursor: pointer;
  }

  .cpe-swatch:hover {
    outline: 2px solid #000080;
    outline-offset: -1px;
    z-index: 1;
    position: relative;
  }

  .cpe-swatch.cpe-editing {
    outline: 2px solid #ff0000;
    outline-offset: -1px;
  }

  .cpe-hint {
    color: #888;
    font-style: italic;
    padding: 4px;
  }

  .cpe-add-row {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
  }

  .cpe-color-picker {
    width: 28px;
    height: 22px;
    padding: 0;
    border: 1px solid #808080;
    cursor: pointer;
  }

  .cpe-hex-input {
    width: 70px;
    padding: 2px 4px;
    font-family: 'Courier New', monospace;
    font-size: 11px;
  }

  .cpe-add-btn {
    padding: 2px 8px;
    font-size: 10px;
    font-weight: bold;
  }

  .cpe-actions {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
  }

  .cpe-actions button {
    padding: 3px 12px;
    font-weight: bold;
  }

  .cpe-actions button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* ── Color Tools Row ── */
  .cpe-tools-row {
    display: flex;
    gap: 4px;
    margin-top: 4px;
  }
  .cpe-tool-btn {
    padding: 2px 6px;
    font-size: 10px;
    font-weight: bold;
    cursor: pointer;
  }

  /* ── Gradient Generator ── */
  .cpe-gradient-row {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    flex-wrap: wrap;
  }
  .cpe-grad-label {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 10px;
    font-weight: bold;
  }
  .cpe-step-input {
    width: 44px;
    padding: 2px 4px;
    font-size: 11px;
  }
  .cpe-gradient-preview {
    display: flex;
    gap: 1px;
    margin-top: 4px;
    padding: 3px;
    background: #fff;
    border: 2px inset #dfdfdf;
    min-height: 16px;
  }
  .cpe-grad-swatch {
    flex: 1;
    height: 14px;
    min-width: 4px;
  }

  @media (max-width: 550px) {
    .cpe-swatch {
      width: 28px;
      height: 28px;
    }
    .cpe-swatches {
      gap: 6px;
    }
    .cpe-add-row {
      flex-wrap: wrap;
    }
    .cpe-color-picker {
      width: 36px;
      height: 28px;
    }
    .cpe-hex-input {
      flex: 1;
      min-width: 60px;
    }
    .cpe-swatch-remove {
      display: flex;
    }
  }
</style>
