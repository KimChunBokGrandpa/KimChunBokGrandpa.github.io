<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
  import { tooltip } from '$lib/utils/tooltip';
  import type { createZoomPan } from '$lib/stores/zoomPanStore.svelte';
  import type { CompareVariant } from './CompareView.svelte';

  let {
    zp,
    compareMode = $bindable(false),
    compareVariant,
    compareVariantIcon,
    cropModeActive = $bindable(false),
    tileMode = $bindable(false),
    eyedropperActive = $bindable(false),
    eyedropperOverlay,
    hasCrop,
    currentRotation,
    onRotate,
    onResetTransform,
    cycleCompareVariant,
    onOpenSettings
  }: {
    zp: ReturnType<typeof createZoomPan>;
    compareMode: boolean;
    compareVariant: CompareVariant;
    compareVariantIcon: string;
    cropModeActive: boolean;
    tileMode: boolean;
    eyedropperActive: boolean;
    eyedropperOverlay: any;
    hasCrop: boolean;
    currentRotation: number;
    onRotate?: (degrees: 90 | -90 | 180) => void;
    onResetTransform?: () => void;
    cycleCompareVariant: () => void;
    onOpenSettings: () => void;
  } = $props();

</script>

<div class="toolbar">
  <!-- Settings -->
  <button
    class="tb-btn"
    onclick={(e) => { e.stopPropagation(); onOpenSettings(); }}
    title={i18n.t('open_settings')}
    aria-label={i18n.t('btn_open_settings')}
    use:tooltip>⚙️</button>
  <span class="tb-sep"></span>
  <!-- Transform -->
  <button class="tb-btn" onclick={() => onRotate?.(-90)} title={i18n.t('rotate_left')} aria-label={i18n.t('btn_rotate_left')} use:tooltip>↺</button>
  <button class="tb-btn" onclick={() => onRotate?.(90)} title={i18n.t('rotate_right')} aria-label={i18n.t('btn_rotate_right')} use:tooltip>↻</button>
  <button
    class="tb-btn"
    class:tb-active={cropModeActive}
    onclick={() => { cropModeActive = !cropModeActive; if (cropModeActive) { eyedropperActive = false; eyedropperOverlay?.dismiss(); } }}
    title={cropModeActive ? i18n.t('crop_active') : i18n.t('crop')}
    aria-label={cropModeActive ? i18n.t('crop_active') : i18n.t('crop')}
    aria-pressed={cropModeActive}
    use:tooltip>✂</button>
  {#if currentRotation !== 0 || hasCrop}
    <button
      class="tb-btn"
      onclick={() => { onResetTransform?.(); cropModeActive = false; }}
      title={i18n.t('reset_transform')}
      aria-label={i18n.t('btn_reset_transform')}
      use:tooltip>⟲</button>
  {/if}
  <span class="tb-sep"></span>
  <!-- Compare -->
  <button
    class="tb-btn"
    class:tb-active={compareMode}
    onclick={() => { compareMode = !compareMode; }}
    title={compareMode ? i18n.t('exit_compare') : i18n.t('compare_before_after')}
    aria-label={i18n.t('btn_compare_toggle')}
    aria-pressed={compareMode}
    use:tooltip
  >⚖️</button>
  {#if compareMode}
    <button
      class="tb-btn"
      onclick={cycleCompareVariant}
      title="{i18n.t('compare_mode_cycle')}"
      aria-label={i18n.t('btn_compare_variant')}
      use:tooltip
    >{compareVariantIcon}</button>
  {/if}
  {#if !compareMode}
    <span class="tb-sep"></span>
    <!-- Zoom -->
    <button class="tb-btn" onclick={zp.zoomOut} title={i18n.t('zoom_out')} aria-label={i18n.t('btn_zoom_out')} use:tooltip>−</button>
    <div class="zoom-input-container">
      <input
        type="number"
        class="zoom-input"
        min="25"
        max="800"
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
      <span class="zoom-percent">%</span>
    </div>
    <button class="tb-btn" onclick={zp.zoomIn} title={i18n.t('zoom_in')} aria-label={i18n.t('btn_zoom_in')} use:tooltip>+</button>
    <button class="tb-btn" onclick={zp.zoomToFit} title={i18n.t('fit_to_window')} aria-label={i18n.t('btn_fit_to_window')} use:tooltip>⊡</button>
    <span class="tb-sep"></span>
    <!-- View tools -->
    <button
      class="tb-btn"
      class:tb-active={zp.showGrid}
      onclick={() => { zp.showGrid = !zp.showGrid; }}
      title={zp.showGrid ? i18n.t('hide_pixel_grid') : i18n.t('show_pixel_grid')}
      aria-label={zp.showGrid ? i18n.t('hide_pixel_grid') : i18n.t('show_pixel_grid')}
      aria-pressed={zp.showGrid}
      use:tooltip>#</button>
    <button
      class="tb-btn"
      class:tb-active={tileMode}
      onclick={() => { tileMode = !tileMode; }}
      title={tileMode ? i18n.t('exit_tile') : i18n.t('tile_preview')}
      aria-label={tileMode ? i18n.t('exit_tile') : i18n.t('tile_preview')}
      aria-pressed={tileMode}
      use:tooltip>⊞</button>
    <button
      class="tb-btn"
      class:tb-active={eyedropperActive}
      onclick={() => { eyedropperActive = !eyedropperActive; eyedropperOverlay?.dismiss(); }}
      title={eyedropperActive ? i18n.t('exit_eyedropper') : i18n.t('eyedropper')}
      aria-label={eyedropperActive ? i18n.t('exit_eyedropper') : i18n.t('eyedropper')}
      aria-pressed={eyedropperActive}
      use:tooltip>💧</button>
  {/if}
</div>

<style>
  .toolbar {
    position: absolute;
    bottom: 8px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 2px;
    z-index: 6;
    background: var(--w98-surface);
    padding: 2px 4px;
    box-shadow: var(--w98-outset);
  }
  .tb-btn {
    min-width: 24px;
    height: 24px;
    padding: 0 4px;
    font-size: var(--w98-font-size-action);
    font-weight: bold;
    font-family: inherit;
    background: var(--w98-surface);
    border: none;
    cursor: pointer;
    box-shadow: var(--w98-outset-thin);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .tb-btn:hover {
    background: var(--w98-surface-active);
  }
  .tb-btn:active {
    box-shadow: var(--w98-inset-thin);
  }
  .tb-active {
    background: var(--w98-highlight);
    color: #fff;
    box-shadow: var(--w98-inset-thin);
  }
  .tb-active:hover {
    background: color-mix(in srgb, var(--w98-highlight) 80%, #000);
  }
  .tb-sep {
    width: 1px;
    height: 18px;
    background: var(--w98-shadow-808);
    margin: 0 2px;
    flex-shrink: 0;
  }

  .zoom-input-container {
    display: flex;
    align-items: center;
    background: #fff;
    border: 1px inset var(--w98-shadow-light);
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
    font-family: 'Courier New', monospace;
    color: #666;
    margin-left: 1px;
  }

  @media (max-width: 550px) {
    .toolbar {
      bottom: 4px;
      left: 4px;
      right: 4px;
      transform: none;
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
  }
</style>
