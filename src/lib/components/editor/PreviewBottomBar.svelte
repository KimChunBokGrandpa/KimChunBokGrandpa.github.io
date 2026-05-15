<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
  import { getPaletteName } from '$lib/utils/palettes';
  import { tooltip } from '$lib/utils/tooltip';
  import { replacePrimaryModifierShortcutLabel } from '$lib/utils/platformShortcuts';
  import type { CompareVariant } from './CompareView.svelte';
  import type { createZoomPan } from '$lib/stores/zoomPanStore.svelte';
  import type { DitherType, ProcessingSettings } from '$lib/types';
  import type { ExportPrimaryAction } from '$lib/utils/exportHierarchy';

  const ditherLabelKeys: Record<
    DitherType,
    'dither_none' | 'dither_fs' | 'dither_ordered' | 'dither_atkinson'
  > = {
    none: 'dither_none',
    floyd_steinberg: 'dither_fs',
    ordered: 'dither_ordered',
    atkinson: 'dither_atkinson',
  };

  const compareVariantLabelKeys: Record<
    CompareVariant,
    'compare_slider' | 'compare_side_by_side' | 'compare_onion'
  > = {
    slider: 'compare_slider',
    'side-by-side': 'compare_side_by_side',
    onion: 'compare_onion',
  };

  let {
    zp,
    compareMode = $bindable(false),
    compareVariant = 'slider',
    compareVariantIcon,
    compareVariantUsesEmoji = false,
    cropModeActive = $bindable(false),
    tileMode = $bindable(false),
    eyedropperActive = $bindable(false),
    eyedropperOverlay,
    hasCrop,
    currentRotation,
    processingSettings,
    colorCount = 0,
    exportPrimary = null,
    onInvokeExportPrimary,
    onRotate,
    onResetTransform,
    cycleCompareVariant,
    onOpenSettings,
  }: {
    zp: ReturnType<typeof createZoomPan>;
    compareMode: boolean;
    compareVariant?: CompareVariant;
    compareVariantIcon: string;
    compareVariantUsesEmoji?: boolean;
    cropModeActive: boolean;
    tileMode: boolean;
    eyedropperActive: boolean;
    eyedropperOverlay: any;
    hasCrop: boolean;
    currentRotation: number;
    processingSettings?: ProcessingSettings;
    colorCount?: number;
    exportPrimary?: ExportPrimaryAction | null;
    onInvokeExportPrimary?: () => void;
    onRotate?: (degrees: 90 | -90 | 180) => void;
    onResetTransform?: () => void;
    cycleCompareVariant: () => void;
    onOpenSettings: () => void;
  } = $props();

  let compareShortcutHint = $derived(
    replacePrimaryModifierShortcutLabel(i18n.t('shortcut_hint_compare')),
  );
  let zoomOutShortcutHint = $derived(
    replacePrimaryModifierShortcutLabel(i18n.t('shortcut_hint_zoom_out')),
  );
  let zoomInShortcutHint = $derived(
    replacePrimaryModifierShortcutLabel(i18n.t('shortcut_hint_zoom_in')),
  );
  let zoomFitShortcutHint = $derived(
    replacePrimaryModifierShortcutLabel(i18n.t('shortcut_hint_fit')),
  );
  let outputPaletteName = $derived(
    processingSettings ? getPaletteName(processingSettings.palette) : '',
  );
  let outputDitherLabel = $derived(
    processingSettings ? i18n.t(ditherLabelKeys[processingSettings.ditherType]) : '',
  );
  let compareVariantLabel = $derived(i18n.t(compareVariantLabelKeys[compareVariant]));
</script>

<div class="preview-bottom-stack">
  {#if processingSettings}
    <div
      class="output-summary w98-floating-surface"
      data-testid="preview-output-summary"
      role="status"
      aria-live="polite"
      aria-label={i18n.t('preview_output_summary')}
    >
      <span class="output-chip w98-readout-chip" title={i18n.t('pixel_size')} use:tooltip>
        <span class="output-icon w98-structural-glyph" aria-hidden="true">⊡</span>
        {processingSettings.pixelSize}px
      </span>
      <span class="output-chip w98-readout-chip" title={i18n.t('palette')} use:tooltip>
        <span class="output-icon w98-emoji" aria-hidden="true">🎨</span>
        {outputPaletteName}
      </span>
      <span class="output-chip w98-readout-chip" title={i18n.t('dithering')} use:tooltip>
        <span class="output-icon w98-structural-glyph" aria-hidden="true">▒</span>
        {outputDitherLabel}
      </span>
      {#if colorCount > 0}
        <span
          class="output-chip w98-readout-chip w98-readout-chip--accent"
          title={i18n.t('unique_colors')}
          use:tooltip
        >
          {i18n.t('gallery_n_colors', colorCount)}
        </span>
      {/if}
      {#if compareMode}
        <span
          class="output-chip output-chip--compare w98-readout-chip w98-readout-chip--active"
          data-testid="preview-compare-summary"
          title={i18n.t('preview_compare_summary')}
          use:tooltip
        >
          <span
            class="output-icon"
            class:w98-emoji={compareVariantUsesEmoji}
            class:w98-structural-glyph={!compareVariantUsesEmoji}
            aria-hidden="true">{compareVariantIcon}</span
          >
          {compareVariantLabel}
        </span>
      {/if}
    </div>
  {/if}

  <div class="toolbar w98-floating-surface">
    <!-- Pixel Lab controls -->
    <button
      class="tb-btn w98-inline-button w98-button--thin"
      onclick={(e) => {
        e.stopPropagation();
        onOpenSettings();
      }}
      title={i18n.t('open_settings')}
      aria-label={i18n.t('btn_open_settings')}
      use:tooltip><span class="toolbar-icon w98-emoji" aria-hidden="true">⚙️</span></button
    >
    <span class="tb-sep w98-toolbar-divider"></span>
    <!-- Transform -->
    <button
      class="tb-btn w98-inline-button w98-button--thin"
      onclick={() => onRotate?.(-90)}
      title={i18n.t('rotate_left')}
      aria-label={i18n.t('btn_rotate_left')}
      use:tooltip
      ><span class="toolbar-icon w98-structural-glyph" aria-hidden="true">↺</span></button
    >
    <button
      class="tb-btn w98-inline-button w98-button--thin"
      onclick={() => onRotate?.(90)}
      title={i18n.t('rotate_right')}
      aria-label={i18n.t('btn_rotate_right')}
      use:tooltip
      ><span class="toolbar-icon w98-structural-glyph" aria-hidden="true">↻</span></button
    >
    <button
      class="tb-btn w98-inline-button w98-button--thin"
      class:w98-inline-button--active={cropModeActive}
      onclick={() => {
        cropModeActive = !cropModeActive;
        if (cropModeActive) {
          eyedropperActive = false;
          eyedropperOverlay?.dismiss();
        }
      }}
      title={cropModeActive ? i18n.t('crop_active') : i18n.t('crop')}
      aria-label={cropModeActive ? i18n.t('crop_active') : i18n.t('crop')}
      aria-pressed={cropModeActive}
      use:tooltip
      ><span class="toolbar-icon w98-structural-glyph" aria-hidden="true">✂</span></button
    >
    {#if currentRotation !== 0 || hasCrop}
      <button
        class="tb-btn w98-inline-button w98-button--thin"
        onclick={() => {
          onResetTransform?.();
          cropModeActive = false;
        }}
        title={i18n.t('reset_transform')}
        aria-label={i18n.t('btn_reset_transform')}
        use:tooltip
        ><span class="toolbar-icon w98-structural-glyph" aria-hidden="true">⟲</span></button
      >
    {/if}
    <span class="tb-sep w98-toolbar-divider"></span>
    <!-- Compare -->
    <button
      class="tb-btn w98-inline-button w98-button--thin"
      class:w98-inline-button--active={compareMode}
      data-testid="toggle-compare-button"
      onclick={() => {
        compareMode = !compareMode;
      }}
      title={compareMode ? i18n.t('exit_compare') : compareShortcutHint}
      aria-label={i18n.t('btn_compare_toggle')}
      aria-pressed={compareMode}
      use:tooltip><span class="toolbar-icon w98-emoji" aria-hidden="true">⚖️</span></button
    >
    {#if compareMode}
      <button
        class="tb-btn w98-inline-button w98-button--thin"
        data-testid="cycle-compare-variant-button"
        onclick={cycleCompareVariant}
        title={i18n.t('compare_mode_cycle')}
        aria-label={i18n.t('btn_compare_variant')}
        use:tooltip
        ><span
          class="toolbar-icon"
          class:w98-emoji={compareVariantUsesEmoji}
          class:w98-structural-glyph={!compareVariantUsesEmoji}
          aria-hidden="true">{compareVariantIcon}</span
        ></button
      >
    {/if}
    {#if !compareMode}
      <span class="tb-sep w98-toolbar-divider"></span>
      <!-- Zoom -->
      <button
        class="tb-btn w98-inline-button w98-button--thin"
        onclick={zp.zoomOut}
        title={zoomOutShortcutHint}
        aria-label={i18n.t('btn_zoom_out')}
        use:tooltip
        ><span class="toolbar-icon w98-structural-glyph" aria-hidden="true">−</span></button
      >
      <div class="zoom-input-container w98-panel-inset-thin">
        <input
          type="number"
          class="zoom-input"
          min="25"
          max="800"
          aria-label={i18n.t('set_zoom')}
          value={Math.round(zp.zoomLevel * 100)}
          onchange={(e) => {
            const val = parseInt(e.currentTarget.value);
            if (!isNaN(val)) {
              const clamped = Math.max(25, Math.min(800, val));
              zp.setZoom(clamped / 100);
            }
          }}
          title={i18n.t('set_zoom')}
        />
        <span class="zoom-percent w98-mono">%</span>
      </div>
      <button
        class="tb-btn w98-inline-button w98-button--thin"
        onclick={zp.zoomIn}
        title={zoomInShortcutHint}
        aria-label={i18n.t('btn_zoom_in')}
        use:tooltip
        ><span class="toolbar-icon w98-structural-glyph" aria-hidden="true">+</span></button
      >
      <button
        class="tb-btn w98-inline-button w98-button--thin"
        onclick={zp.zoomToFit}
        title={zoomFitShortcutHint}
        aria-label={i18n.t('btn_fit_to_window')}
        use:tooltip
        ><span class="toolbar-icon w98-structural-glyph" aria-hidden="true">⊡</span></button
      >
      <span class="tb-sep w98-toolbar-divider"></span>
      <!-- View tools -->
      <button
        class="tb-btn w98-inline-button w98-button--thin"
        class:w98-inline-button--active={zp.showGrid}
        onclick={() => {
          zp.showGrid = !zp.showGrid;
        }}
        title={zp.showGrid ? i18n.t('hide_pixel_grid') : i18n.t('show_pixel_grid')}
        aria-label={i18n.t('btn_grid_toggle')}
        aria-pressed={zp.showGrid}
        use:tooltip
        ><span class="toolbar-icon w98-structural-glyph" aria-hidden="true">#</span></button
      >
      <button
        class="tb-btn w98-inline-button w98-button--thin"
        class:w98-inline-button--active={tileMode}
        onclick={() => {
          tileMode = !tileMode;
        }}
        title={tileMode ? i18n.t('exit_tile') : i18n.t('tile_preview')}
        aria-label={i18n.t('btn_tile_toggle')}
        aria-pressed={tileMode}
        use:tooltip
        ><span class="toolbar-icon w98-structural-glyph" aria-hidden="true">⊞</span></button
      >
      <button
        class="tb-btn w98-inline-button w98-button--thin"
        class:w98-inline-button--active={eyedropperActive}
        onclick={() => {
          eyedropperActive = !eyedropperActive;
          eyedropperOverlay?.dismiss();
        }}
        title={eyedropperActive ? i18n.t('exit_eyedropper') : i18n.t('eyedropper')}
        aria-label={i18n.t('btn_eyedropper_toggle')}
        aria-pressed={eyedropperActive}
        use:tooltip><span class="toolbar-icon w98-emoji" aria-hidden="true">💧</span></button
      >
    {/if}
    {#if exportPrimary}
      <span class="tb-sep w98-toolbar-divider"></span>
      <button
        class="tb-btn export-primary-mirror w98-button w98-button--primary"
        data-testid="preview-export-primary-action"
        aria-label={exportPrimary.ariaLabel}
        aria-busy={exportPrimary.busy}
        disabled={exportPrimary.busy}
        title={exportPrimary.tooltip}
        onclick={onInvokeExportPrimary}
      >
        <span class="w98-emoji" aria-hidden="true">{exportPrimary.icon}</span>
        <span>{i18n.t(exportPrimary.labelKey)}</span>
      </button>
    {/if}
  </div>
</div>

<style>
  .preview-bottom-stack {
    position: absolute;
    bottom: 8px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    z-index: 6;
    max-width: calc(100% - 16px);
  }
  .output-summary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
    max-width: 100%;
    padding: 2px 4px;
    overflow: hidden;
  }
  .output-chip {
    flex-shrink: 1;
    min-width: 0;
    max-width: 140px;
    cursor: default;
  }
  .output-chip:not(:first-child) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .output-chip--compare {
    max-width: 128px;
  }
  .output-icon {
    font-size: var(--w98-font-size-caption);
    line-height: 1;
  }
  .toolbar {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 2px 4px;
  }
  .tb-btn {
    min-width: 24px;
    height: 24px;
    padding: 0 4px;
    font-size: var(--w98-font-size-action);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .toolbar-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }
  .tb-sep {
    height: 18px;
    margin: 0 2px;
  }

  .zoom-input-container {
    display: flex;
    align-items: center;
    height: 22px;
    padding: 0 2px 0 4px;
    flex-shrink: 0;
  }
  .zoom-input {
    width: 30px;
    height: 16px;
    border: none;
    font-family: 'Courier New', monospace;
    font-size: var(--w98-font-size-sm);
    text-align: right;
    outline: none;
    background: transparent;
    padding: 0;
  }
  .zoom-input::-webkit-outer-spin-button,
  .zoom-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .zoom-percent {
    font-size: var(--w98-font-size-sm);
    color: var(--w98-text-hint);
    margin-left: 1px;
  }

  .export-primary-mirror {
    flex-shrink: 0;
  }

  @media (max-width: 550px) {
    .preview-bottom-stack {
      bottom: 4px;
      left: 4px;
      right: 4px;
      transform: none;
      align-items: stretch;
      max-width: none;
    }
    .output-summary {
      justify-content: flex-start;
      overflow-x: auto;
      flex-wrap: nowrap;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      padding: 3px 4px;
    }
    .output-summary::-webkit-scrollbar {
      display: none;
    }
    .output-chip {
      flex: 0 0 auto;
      max-width: none;
    }
    .toolbar {
      overflow-x: auto;
      flex-wrap: nowrap;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      padding: 3px 4px;
    }
    .toolbar::-webkit-scrollbar {
      display: none;
    }
    .tb-btn {
      min-width: 36px;
      height: 36px;
      font-size: var(--w98-font-size-icon);
    }
    .tb-sep {
      height: 24px;
    }
    .zoom-input-container {
      display: none;
    }
    .export-primary-mirror {
      position: sticky;
      right: 0;
    }
  }
</style>
