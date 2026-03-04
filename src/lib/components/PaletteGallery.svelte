<script lang="ts">
  import { PALETTE_GROUPS, PALETTES } from '../utils/palettes';
  import type { RGB } from '../utils/palettes';

  let {
    selectedPaletteId = 'original',
    onSelect,
  }: {
    selectedPaletteId: string;
    onSelect: (id: string) => void;
  } = $props();

  let activeGroup = $state<string>('core');
  let hoveredPalette = $state<string | null>(null);

  interface PalItem {
    id: string;
    name: string;
    colors: RGB[] | null;
    desc: string;
  }

  const coreItems: PalItem[] = [
    { id: 'original', name: 'Original (Full Color)', colors: null, desc: 'No color quantization — keep all original colors' },
    { id: 'win256', name: '★ Windows 256', colors: PALETTES['win256'] || null, desc: '8-bit Windows default (216 web-safe + extras)' },
  ];

  const groupTabs = [
    { id: 'core', label: '📁 Core' },
    ...PALETTE_GROUPS.map(g => ({ id: g.groupId, label: `📁 ${g.groupName}` })),
  ];

  let activeItems = $derived.by<PalItem[]>(() => {
    if (activeGroup === 'core') return coreItems;
    const group = PALETTE_GROUPS.find(g => g.groupId === activeGroup);
    if (!group) return [];
    return group.palettes.map(p => ({
      id: p.id,
      name: p.name,
      colors: PALETTES[p.id] || null,
      desc: `${(PALETTES[p.id] || []).length} colors`,
    }));
  });

  const paletteLookup = new Map<string, PalItem>();
  coreItems.forEach(i => paletteLookup.set(i.id, i));
  PALETTE_GROUPS.forEach(g => g.palettes.forEach(p => {
    paletteLookup.set(p.id, {
      id: p.id, name: p.name,
      colors: PALETTES[p.id] || null,
      desc: `${(PALETTES[p.id] || []).length} colors`,
    });
  }));

  // Detail panel for hovered or selected palette
  let detailItem = $derived.by<PalItem | null>(() => {
    const id = hoveredPalette || selectedPaletteId;
    return paletteLookup.get(id) || null;
  });
</script>

<div class="pg">
  <!-- Toolbar -->
  <div class="pg-toolbar">
    {#each groupTabs as tab}
      <button
        class="pg-toolbtn"
        class:tb-sel={activeGroup === tab.id}
        onclick={() => activeGroup = tab.id}
      >{tab.label}</button>
    {/each}
  </div>

  <div class="pg-content">
    <!-- Left: Palette list -->
    <div class="pg-list-panel">
      <div class="pg-list" role="listbox">
        {#each activeItems as item}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <div
            class="pg-item"
            class:sel={selectedPaletteId === item.id}
            role="option"
            tabindex="0"
            aria-selected={selectedPaletteId === item.id}
            onclick={() => onSelect(item.id)}
            onmouseenter={() => hoveredPalette = item.id}
            onmouseleave={() => hoveredPalette = null}
          >
            <!-- Mini swatch strip -->
            <div class="pg-mini-swatches">
              {#if item.colors}
                {#each item.colors.slice(0, 8) as c}
                  <span class="ms" style="background:rgb({c.r},{c.g},{c.b})"></span>
                {/each}
              {:else if item.id === 'original'}
                <span class="ms ms-rainbow"></span>
              {:else}
                <span class="ms" style="background:linear-gradient(90deg,#000,#fff)"></span>
              {/if}
            </div>
            <span class="pg-item-name" class:recommended={item.name.startsWith('★')}>{item.name}</span>
            {#if selectedPaletteId === item.id}
              <span class="pg-check">✓</span>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <!-- Right: Detail / swatch grid -->
    <div class="pg-detail">
      {#if detailItem}
        <fieldset>
          <legend>{detailItem.name}</legend>
          <p class="pg-desc">{detailItem.desc}</p>
          {#if detailItem.colors}
            <div class="pg-grid">
              {#each detailItem.colors as c}
                <span
                  class="pg-swatch"
                  style="background:rgb({c.r},{c.g},{c.b})"
                  title="rgb({c.r}, {c.g}, {c.b})"
                ></span>
              {/each}
            </div>
          {:else}
            <div class="pg-info-box">
              <p>Full color spectrum preserved</p>
            </div>
          {/if}
        </fieldset>
      {:else}
        <p class="pg-hint">Select a palette to view details</p>
      {/if}
    </div>
  </div>

  <!-- Status bar -->
  <div class="status-bar pg-status">
    <p class="status-bar-field">
      {activeItems.length} palette(s) in group
    </p>
    <p class="status-bar-field">
      Active: {selectedPaletteId}
    </p>
  </div>
</div>

<style>
  .pg {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: #c0c0c0;
    min-height: 0;
    font-size: 11px;
  }

  /* ── Toolbar ── */
  .pg-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 1px;
    padding: 2px 3px;
    border-bottom: 1px solid #808080;
    flex-shrink: 0;
    background: #c0c0c0;
  }
  .pg-toolbtn {
    padding: 2px 6px;
    font-size: 10px;
    font-family: inherit;
    background: #d4d0c8;
    border: 1px solid transparent;
    border-bottom: none;
    cursor: pointer;
    box-shadow: inset 1px 1px #fff, inset -1px -1px #808080;
  }
  .pg-toolbtn:hover { background: #e0dcd4; }
  .pg-toolbtn.tb-sel {
    background: #c0c0c0;
    font-weight: bold;
    box-shadow: inset -1px -1px #fff, inset 1px 1px #808080;
  }

  /* ── Content (list + detail) ── */
  .pg-content {
    flex: 1;
    display: flex;
    gap: 0;
    min-height: 0;
    margin: 3px;
  }

  /* ── List panel ── */
  .pg-list-panel {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .pg-list {
    flex: 1;
    overflow-y: auto;
    background: #fff;
    border: 2px inset;
    padding: 1px;
  }

  .pg-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 5px;
    cursor: pointer;
    border-bottom: 1px solid #f4f4f4;
  }
  .pg-item:hover { background: #efefef; }
  .pg-item.sel {
    background: #000080;
    color: #fff;
  }

  .pg-mini-swatches {
    display: flex;
    gap: 0;
    flex-shrink: 0;
  }
  .ms {
    display: inline-block;
    width: 8px;
    height: 10px;
    border: 0.5px solid rgba(0,0,0,0.1);
  }
  .ms-rainbow {
    width: 64px;
    background: linear-gradient(90deg, red, orange, yellow, green, cyan, blue, violet);
  }

  .pg-item-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
  }
  .pg-item-name.recommended {
    color: #8B6914;
    font-weight: bold;
  }
  .pg-item.sel .pg-item-name.recommended {
    color: #FFD700;
  }
  .pg-check {
    flex-shrink: 0;
    font-size: 12px;
    font-weight: bold;
    color: #0a0;
  }
  .pg-item.sel .pg-check { color: #8f8; }

  /* ── Detail panel ── */
  .pg-detail {
    flex: 1;
    min-width: 0;
    overflow-y: auto;
    padding: 0 0 0 3px;
  }
  .pg-detail fieldset {
    margin: 0;
    padding: 6px;
    min-width: 0;
  }
  .pg-detail legend {
    font-weight: bold;
    padding: 0 4px;
  }

  .pg-desc {
    margin: 0 0 6px 0;
    color: #444;
    font-style: italic;
  }

  .pg-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 1px;
  }
  .pg-swatch {
    width: 14px;
    height: 14px;
    border: 1px solid rgba(0,0,0,0.15);
    cursor: crosshair;
    flex-shrink: 0;
  }
  .pg-swatch:hover {
    outline: 2px solid #000080;
    outline-offset: -1px;
    z-index: 1;
    position: relative;
  }

  .pg-info-box {
    padding: 8px;
    background: #f8f8f8;
    border: 1px inset;
  }
  .pg-info-box p { margin: 0 0 6px 0; }

  .pg-hint {
    color: #888;
    text-align: center;
    margin-top: 20px;
    font-style: italic;
  }

  /* Status bar */
  .pg-status {
    margin: 0 3px 3px 3px;
    flex-shrink: 0;
  }

  @media (max-width: 550px) {
    .pg-content { flex-direction: column; }
    .pg-detail { padding: 3px 0 0 0; max-height: 200px; }
  }
</style>
