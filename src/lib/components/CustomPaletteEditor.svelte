<script lang="ts">
  import type { RGB } from '../utils/palettes';

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

  let name = $state(initialName);
  let colors = $state<RGB[]>(initialColors.map(c => ({ ...c })));
  let hexInput = $state('#000000');
  let editingIndex = $state<number | null>(null);

  function rgbToHex(c: RGB): string {
    return `#${c.r.toString(16).padStart(2, '0')}${c.g.toString(16).padStart(2, '0')}${c.b.toString(16).padStart(2, '0')}`;
  }

  function hexToRgb(hex: string): RGB | null {
    const m = hex.match(/^#?([0-9a-f]{6})$/i);
    if (!m) return null;
    return {
      r: parseInt(m[1].slice(0, 2), 16),
      g: parseInt(m[1].slice(2, 4), 16),
      b: parseInt(m[1].slice(4, 6), 16),
    };
  }

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
    onSave(name || 'Untitled Palette', colors);
  }

  let canSave = $derived(colors.length >= 2);
</script>

<div class="cpe-root">
  <fieldset>
    <legend>Palette Name</legend>
    <div class="field-row">
      <input
        type="text"
        class="cpe-name-input"
        bind:value={name}
        placeholder="My Custom Palette"
        maxlength="40"
      />
    </div>
  </fieldset>

  <fieldset>
    <legend>Colors ({colors.length})</legend>
    <div class="cpe-swatches">
      {#each colors as c, i}
        <div class="cpe-swatch-item">
          <span
            class="cpe-swatch"
            class:cpe-editing={editingIndex === i}
            style="background:rgb({c.r},{c.g},{c.b})"
            title="{rgbToHex(c)} — Click to edit, right-click to remove"
            onclick={() => editColor(i)}
            oncontextmenu={(e) => { e.preventDefault(); removeColor(i); }}
            role="button"
            tabindex="0"
            onkeydown={(e) => { if (e.key === 'Delete' || e.key === 'Backspace') removeColor(i); else if (e.key === 'Enter') editColor(i); }}
          ></span>
        </div>
      {/each}
      {#if colors.length === 0}
        <span class="cpe-hint">Add at least 2 colors</span>
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
        {editingIndex !== null ? 'Update' : '+ Add'}
      </button>
      {#if editingIndex !== null}
        <button class="cpe-add-btn" onclick={() => { editingIndex = null; hexInput = '#000000'; }}>
          Cancel
        </button>
      {/if}
    </div>
  </fieldset>

  <div class="cpe-actions">
    <button onclick={onCancel}>Cancel</button>
    <button onclick={handleSave} disabled={!canSave}>
      Save Palette
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
</style>
