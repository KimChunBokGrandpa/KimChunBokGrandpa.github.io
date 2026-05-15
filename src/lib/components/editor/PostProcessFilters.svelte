<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
  import { defaultPostFilters, type PostProcessFilters } from '$lib/types';

  let {
    postFilters = $bindable({ ...defaultPostFilters }),
  }: {
    postFilters?: PostProcessFilters;
  } = $props();

  let hasChanges = $derived(
    postFilters.brightness !== 100 || postFilters.contrast !== 100 ||
    postFilters.saturation !== 100 || postFilters.hueRotate !== 0
  );
</script>

<div class="tab-panel" role="tabpanel" data-testid="adjust-tuning-panel">
  <fieldset class="pf-fieldset w98-fieldset" data-testid="adjust-filter-fieldset">
    <legend>{i18n.t('tab_adjust')}</legend>
    <div class="pf-grid">
      <div class="pf-row">
        <label class="pf-label" for="pf-brightness">☀️ {i18n.t('brightness')}: {postFilters.brightness}%</label>
        <input id="pf-brightness" type="range" min="20" max="200" step="5" bind:value={postFilters.brightness} class="slider-input w98-range" aria-label={i18n.t('brightness')} />
      </div>
      <div class="pf-row">
        <label class="pf-label" for="pf-contrast">◐ {i18n.t('contrast')}: {postFilters.contrast}%</label>
        <input id="pf-contrast" type="range" min="20" max="200" step="5" bind:value={postFilters.contrast} class="slider-input w98-range" aria-label={i18n.t('contrast')} />
      </div>
      <div class="pf-row">
        <label class="pf-label" for="pf-saturation">🎨 {i18n.t('saturation')}: {postFilters.saturation}%</label>
        <input id="pf-saturation" type="range" min="0" max="200" step="5" bind:value={postFilters.saturation} class="slider-input w98-range" aria-label={i18n.t('saturation')} />
      </div>
      <div class="pf-row">
        <label class="pf-label" for="pf-hue">🌈 {i18n.t('hue_rotate')}: {postFilters.hueRotate}°</label>
        <input id="pf-hue" type="range" min="0" max="360" step="5" bind:value={postFilters.hueRotate} class="slider-input w98-range" aria-label={i18n.t('hue_rotate')} />
      </div>
    </div>
    {#if hasChanges}
      <button class="pf-reset w98-inline-button w98-button--thin" onclick={() => { postFilters = { ...defaultPostFilters }; }}>{i18n.t('reset_filters')}</button>
    {/if}
  </fieldset>
</div>

<style>
  .pf-fieldset {
    margin: 0;
  }
  .pf-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--w98-space-4);
  }
  .pf-row {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .pf-label {
    font-size: var(--w98-font-size-sm);
    color: var(--w98-text-secondary);
  }
  .pf-reset {
    font-size: var(--w98-font-size-sm);
    margin-top: 2px;
    width: 100%;
  }
  @media (min-width: 520px) {
    .pf-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
