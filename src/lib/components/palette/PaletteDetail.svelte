<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
  import type { VariantItem } from './types';

  let {
    detailItem,
    activeThemeName
  }: {
    detailItem: VariantItem | null;
    activeThemeName: string;
  } = $props();
</script>

<div class="pg-detail">
  {#if detailItem}
    <fieldset>
      <legend>{activeThemeName} — {detailItem.name}</legend>
      <p class="pg-desc">
        {detailItem.colorCount > 0
          ? i18n.t('gallery_n_colors').replace('{0}', String(detailItem.colorCount))
          : i18n.t('full_color_desc')}
      </p>
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
          <p>{i18n.t('full_color_desc')}</p>
        </div>
      {/if}
    </fieldset>
  {:else}
    <p class="pg-hint">{i18n.t('select_palette_hint')}</p>
  {/if}
</div>

<style>
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
    font-size: var(--w98-font-size-base);
  }
  .pg-desc {
    margin: 0 0 6px 0;
    color: var(--w98-text-secondary);
    font-style: italic;
    font-size: var(--w98-font-size-base);
  }
  .pg-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 1px;
  }
  .pg-swatch {
    width: 14px;
    height: 14px;
    border: 1px solid rgba(0, 0, 0, 0.15);
    cursor: crosshair;
    flex-shrink: 0;
  }
  .pg-swatch:hover {
    outline: 2px solid var(--w98-highlight);
    outline-offset: -1px;
    z-index: 1;
    position: relative;
  }
  .pg-info-box {
    padding: 8px;
    background: #e8e4e0;
    border: 1px solid #ccc;
    font-size: var(--w98-font-size-sm);
  }
  .pg-hint {
    padding: 12px;
    color: var(--w98-text-hint);
    text-align: center;
    font-style: italic;
    font-size: var(--w98-font-size-base);
  }

  @media (max-width: 550px) {
    .pg-detail {
      flex: 0 0 auto; max-height: 100px; overflow-y: auto; padding: 3px 0 0 0; border-top: 1px solid var(--w98-shadow-808);
    }
  }
</style>
