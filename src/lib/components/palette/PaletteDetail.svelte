<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
  import { getPaletteFamily } from '$lib/utils/palettes';
  import { getPresetFamilyLabelKey } from '$lib/utils/presets';
  import type { VariantItem } from './types';

  let {
    detailItem,
    activeThemeName
  }: {
    detailItem: VariantItem | null;
    activeThemeName: string;
  } = $props();

  let detailFamilyLabel = $derived(
    detailItem ? i18n.t(getPresetFamilyLabelKey(getPaletteFamily(detailItem.id))) : ''
  );
</script>

<div class="pg-detail">
  {#if detailItem}
    <fieldset class="w98-fieldset">
      <legend>{activeThemeName} — {detailItem.name}</legend>
      <p class="pg-desc w98-quiet-copy">
        {detailItem.colorCount > 0
          ? i18n.t('gallery_n_colors').replace('{0}', String(detailItem.colorCount))
          : i18n.t('full_color_desc')}
      </p>
      <div class="pg-meta-row">
        <span class="pg-family-chip w98-chip w98-chip--active">{detailFamilyLabel}</span>
        <span class="pg-count-chip w98-chip">
          {detailItem.colorCount > 0
            ? i18n.t('gallery_n_colors').replace('{0}', String(detailItem.colorCount))
            : i18n.t('palette_original_full_color')}
        </span>
      </div>
      {#if detailItem.colors}
        <div class="pg-grid">
          {#each detailItem.colors as c}
            <span
              class="pg-swatch w98-color-swatch w98-color-swatch--small w98-color-swatch--interactive"
              style="background:rgb({c.r},{c.g},{c.b})"
              title="rgb({c.r}, {c.g}, {c.b})"
            ></span>
          {/each}
        </div>
      {:else}
        <div class="pg-info-box w98-note">
          <p>{i18n.t('full_color_desc')}</p>
        </div>
      {/if}
    </fieldset>
  {:else}
    <p class="pg-hint w98-note">{i18n.t('select_palette_hint')}</p>
  {/if}
</div>

<style>
  .pg-detail {
    flex: 1;
    min-width: 0;
    overflow-y: auto;
    padding: 0 0 0 3px;
  }
  .pg-detail :global(fieldset) {
    min-width: 0;
  }
  .pg-desc {
    margin: 0 0 6px 0;
  }
  .pg-meta-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--w98-space-4);
    margin-bottom: var(--w98-space-6);
  }
  .pg-family-chip,
  .pg-count-chip {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .pg-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 1px;
  }
  .pg-swatch {
    cursor: crosshair;
    flex-shrink: 0;
  }
  .pg-info-box {
    display: block;
  }
  .pg-hint {
    text-align: center;
  }

  @media (max-width: 550px) {
    .pg-detail {
      flex: 0 0 auto; max-height: 100px; overflow-y: auto; padding: 3px 0 0 0; border-top: 1px solid var(--w98-shadow-808);
    }
  }
</style>
