<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
  import type { ExportViewModel, ExportSecondaryActionId } from '$lib/utils/exportHierarchy';
  import { formatRelativeTime } from '$lib/utils/relativeTime';
  import type { SaveFormat } from '$lib/services/saveService';
  import type { TranslationKey } from '$lib/i18n/en';

  interface Props {
    viewModel: ExportViewModel;
    onInvokePrimary: () => void;
    onInvokeSecondary: (id: ExportSecondaryActionId) => void;
    onCancelAnimationExport?: () => void;
    onFormatChange: (format: SaveFormat) => void;
    onQualityChange: (quality: number) => void;
    onApplyNow?: () => void;
  }

  const {
    viewModel,
    onInvokePrimary,
    onInvokeSecondary,
    onCancelAnimationExport,
    onFormatChange,
    onQualityChange,
    onApplyNow,
  }: Props = $props();

  // 60-second interval for timestamp refresh (Requirement 6.8)
  let tick = $state(0);

  $effect(() => {
    const interval = setInterval(() => {
      tick++;
    }, 60_000);
    return () => clearInterval(interval);
  });

  const formats: SaveFormat[] = ['png', 'jpeg', 'webp'];
</script>

<section
  class="export-region w98-toolbar"
  data-testid="export-region"
  aria-label={i18n.t('export_btn')}
>
  <header class="export-region-header">
    <h3 class="export-region-title">{i18n.t('export_btn')}</h3>
  </header>

  {#if !viewModel.primary}
    <p class="export-empty w98-quiet-copy" data-testid="export-empty-copy">
      {i18n.t('export_empty_load_image')}
    </p>
  {:else}
    <!-- Format selector (Requirement 2.3/2.8) -->
    {#if viewModel.formatSelector.visible}
      <div class="export-format-row" data-testid="export-format-row">
        <div class="export-format-toggles">
          {#each formats as fmt}
            <button
              class="w98-button export-format-toggle"
              class:active={viewModel.formatSelector.format === fmt}
              aria-pressed={viewModel.formatSelector.format === fmt}
              onclick={() => onFormatChange(fmt)}
            >
              {fmt.toUpperCase()}
            </button>
          {/each}
        </div>
        {#if viewModel.formatSelector.showsQualitySlider}
          <label class="export-quality-row">
            <span class="export-quality-label">{i18n.t('quality')}</span>
            <input
              type="range"
              class="export-quality-slider"
              min="0.1"
              max="1"
              step="0.05"
              value={viewModel.formatSelector.quality}
              oninput={(e) => onQualityChange(Number((e.target as HTMLInputElement).value))}
            />
            <span class="export-quality-value"
              >{Math.round(viewModel.formatSelector.quality * 100)}%</span
            >
          </label>
        {/if}
      </div>
    {/if}

    <!-- Primary action (Requirement 2.2) -->
    <div class="export-primary-row" data-testid="export-primary-action">
      <button
        class="w98-button w98-button--primary export-primary"
        data-testid={viewModel.primary.testId}
        aria-label={viewModel.primary.ariaLabel}
        aria-busy={viewModel.primary.busy}
        disabled={viewModel.primary.busy}
        class:blocked={viewModel.primary.blocked}
        title={viewModel.primary.tooltip}
        onclick={onInvokePrimary}
      >
        <span class="w98-emoji" aria-hidden="true">{viewModel.primary.icon}</span>
        <span class="export-primary-label">
          {i18n.t(viewModel.primary.labelKey)}
          {#if viewModel.primary.subLabel}
            <span class="export-primary-sub">· {viewModel.primary.subLabel}</span>
          {/if}
        </span>
      </button>

      {#if viewModel.primary.blocked && onApplyNow}
        <button
          class="w98-inline-button w98-button--thin export-apply-now-hint"
          data-testid="export-apply-now-hint"
          onclick={onApplyNow}>{i18n.t('apply_now')}</button
        >
      {/if}

      {#if viewModel.cancel?.visible && onCancelAnimationExport}
        <button
          class="w98-inline-button w98-button--thin export-cancel"
          data-testid="export-cancel-animation"
          onclick={onCancelAnimationExport}
          aria-label={i18n.t('cancel')}>{i18n.t('cancel')}</button
        >
      {/if}
    </div>

    <!-- Secondary groups in fixed order: still-variants → animation-variants (Requirement 1.5) -->
    {#each viewModel.sections as section}
      <fieldset
        class="export-section w98-fieldset"
        data-testid={section.id === 'animation-variants'
          ? 'animation-variants-group'
          : `export-section-${section.id}`}
      >
        <legend>{i18n.t(section.labelKey)}</legend>
        <div class="export-section-body">
          {#each section.actions as action}
            <button
              class="w98-button export-variant"
              data-testid={action.testId}
              aria-label={i18n.t(action.labelKey as TranslationKey)}
              disabled={action.disabled}
              title={action.tooltip ?? i18n.t(action.labelKey as TranslationKey)}
              onclick={() => onInvokeSecondary(action.id)}
            >
              <span class="w98-emoji" aria-hidden="true">{action.icon}</span>
              <span>{i18n.t(action.labelKey as TranslationKey)}</span>
            </button>
          {/each}
        </div>
      </fieldset>
    {/each}

    <!-- History readout (Requirement 6) -->
    <footer class="export-history-row" data-testid="export-history-readout">
      {#if viewModel.history.latest}
        {@const _ = tick}
        <span class="w98-readout-chip">
          {viewModel.history.latest.format}
          {#if viewModel.history.latest.dimensions}
            · {viewModel.history.latest.dimensions}
          {/if}
          · {formatRelativeTime(viewModel.history.latest.createdAtIso, i18n.locale)}
        </span>
      {:else}
        <span class="w98-quiet-copy">{i18n.t('export_history_empty')}</span>
      {/if}
    </footer>
  {/if}
</section>

<style>
  .export-region {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
  }

  .export-region-header {
    display: flex;
    align-items: center;
  }

  .export-region-title {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .export-empty {
    margin: 4px 0;
    text-align: center;
  }

  .export-format-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .export-format-toggles {
    display: flex;
    gap: 4px;
  }

  .export-format-toggle.active {
    font-weight: bold;
  }

  .export-quality-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem;
  }

  .export-quality-label {
    flex-shrink: 0;
  }

  .export-quality-slider {
    flex: 1;
    min-width: 60px;
  }

  .export-quality-value {
    flex-shrink: 0;
    min-width: 32px;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .export-primary-row {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .export-primary {
    flex: 1;
    min-width: 0;
  }

  .export-primary-label {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .export-primary-sub {
    opacity: 0.7;
  }

  .export-primary.blocked {
    opacity: 0.7;
  }

  .export-apply-now-hint {
    flex-shrink: 0;
  }

  .export-cancel {
    flex-shrink: 0;
  }

  .export-section {
    margin: 0;
    padding: 4px 8px 8px;
  }

  .export-section-body {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .export-history-row {
    display: flex;
    align-items: center;
    min-height: 20px;
    font-size: 0.8rem;
  }

  /* Mobile stacked layout (Requirement 7.2) */
  @media (max-aspect-ratio: 19.5/9) {
    .export-region {
      flex-direction: column;
    }

    .export-primary-row {
      flex-direction: column;
      align-items: stretch;
    }

    .export-section-body {
      flex-direction: column;
    }
  }
</style>
