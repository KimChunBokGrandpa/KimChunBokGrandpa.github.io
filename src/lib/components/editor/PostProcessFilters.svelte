<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
  import { DEFAULT_POST_FILTERS, type PostProcessFilters } from '$lib/types';

  let {
    postFilters = $bindable({ ...DEFAULT_POST_FILTERS }),
  }: {
    postFilters?: PostProcessFilters;
  } = $props();

  let hasChanges = $derived(
    postFilters.brightness !== 100 || postFilters.contrast !== 100 ||
    postFilters.saturation !== 100 || postFilters.hueRotate !== 0
  );
</script>

<div class="tab-panel" role="tabpanel">
  <div class="pf-row">
    <label class="pf-label" for="pf-brightness">☀️ {i18n.t('brightness')}: {postFilters.brightness}%</label>
    <input id="pf-brightness" type="range" min="20" max="200" step="5" bind:value={postFilters.brightness} class="slider-input" aria-label={i18n.t('brightness')} />
  </div>
  <div class="pf-row">
    <label class="pf-label" for="pf-contrast">◐ {i18n.t('contrast')}: {postFilters.contrast}%</label>
    <input id="pf-contrast" type="range" min="20" max="200" step="5" bind:value={postFilters.contrast} class="slider-input" aria-label={i18n.t('contrast')} />
  </div>
  <div class="pf-row">
    <label class="pf-label" for="pf-saturation">🎨 {i18n.t('saturation')}: {postFilters.saturation}%</label>
    <input id="pf-saturation" type="range" min="0" max="200" step="5" bind:value={postFilters.saturation} class="slider-input" aria-label={i18n.t('saturation')} />
  </div>
  <div class="pf-row">
    <label class="pf-label" for="pf-hue">🌈 {i18n.t('hue_rotate')}: {postFilters.hueRotate}°</label>
    <input id="pf-hue" type="range" min="0" max="360" step="5" bind:value={postFilters.hueRotate} class="slider-input" aria-label={i18n.t('hue_rotate')} />
  </div>
  {#if hasChanges}
    <button class="pf-reset" onclick={() => { postFilters = { ...DEFAULT_POST_FILTERS }; }}>{i18n.t('reset_filters')}</button>
  {/if}
</div>

<style>
  .pf-row {
    display: flex;
    flex-direction: column;
    gap: 1px;
    margin-bottom: 4px;
  }
  .pf-label {
    font-size: var(--w98-font-size-sm);
    color: var(--w98-text-secondary);
  }
  .pf-reset {
    font-size: var(--w98-font-size-sm);
    padding: 2px 8px;
    margin-top: 2px;
    width: 100%;
    cursor: pointer;
  }
  .pf-reset:active {
    box-shadow: var(--w98-inset-thin);
  }
</style>
