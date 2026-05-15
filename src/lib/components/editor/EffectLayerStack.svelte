<script lang="ts">
  import type { EffectLayer, GlitchType, RenderMode, ProcessingSettings } from '$lib/types';
  import { i18n } from '$lib/i18n/index.svelte';
  import type { TranslationKey } from '$lib/i18n/en';
  import { getAllEffects } from '$lib/utils/effectRegistry';
  import { ensureBuiltInEffectsRegistered } from '$lib/utils/effects';

  ensureBuiltInEffectsRegistered();

  // CSS render mode options (HQx moved to effect layers)
  const cssRenderOptions = [
    { id: 'pixel_perfect', labelKey: 'pixel_perfect' as const, titleKey: 'pixel_perfect_desc' as const },
    { id: 'bilinear', labelKey: 'bilinear_blur' as const, titleKey: 'bilinear_desc' as const },
  ] as const;

  type EffectOption = { type: EffectLayer['type']; glitchType?: GlitchType; icon: string; labelKey: TranslationKey };
  const effectOptions: EffectOption[] = [
    ...getAllEffects().map((effect) => ({
      type: 'glitch' as const,
      glitchType: effect.id,
      icon: effect.icon,
      labelKey: effect.labelKey,
    })),
    { type: 'hqx', icon: '✨', labelKey: 'effect_hqx' },
  ];

  let {
    settings = $bindable(),
    onChange,
  }: {
    settings: ProcessingSettings;
    onChange: () => void;
  } = $props();

  // ─── Effect Layer Management ───
  function addEffectLayer(opt: typeof effectOptions[number]) {
    const layer: EffectLayer = {
      id: crypto.randomUUID(),
      type: opt.type,
      enabled: true,
      ...(opt.glitchType ? { glitchType: opt.glitchType, intensity: 1 } : {}),
    };
    settings.effectLayers = [...(settings.effectLayers || []), layer];
    syncLegacyFromLayers();
    onChange();
  }

  function removeEffectLayer(id: string) {
    settings.effectLayers = (settings.effectLayers || []).filter(l => l.id !== id);
    syncLegacyFromLayers();
    onChange();
  }

  function toggleEffectLayer(id: string) {
    settings.effectLayers = (settings.effectLayers || []).map(l =>
      l.id === id ? { ...l, enabled: !l.enabled } : { ...l }
    );
    syncLegacyFromLayers();
    onChange();
  }

  function setLayerIntensity(id: string, intensity: number) {
    settings.effectLayers = (settings.effectLayers || []).map(l =>
      l.id === id ? { ...l, intensity } : { ...l }
    );
    syncLegacyFromLayers();
    onChange();
  }

  // Keep legacy fields in sync for backward compat (presets, export, etc.)
  function syncLegacyFromLayers() {
    const layers = settings.effectLayers || [];
    settings.glitchFilters = layers
      .filter(l => l.type === 'glitch' && l.enabled && l.glitchType && l.glitchType !== 'none')
      .map(l => ({ type: l.glitchType!, intensity: l.intensity || 1 }));
    const hasHqx = layers.some(l => l.type === 'hqx' && l.enabled);
    if (hasHqx && settings.renderMode !== 'hqx') {
      // Only override to hqx if an hqx layer is enabled
      // but keep the CSS render mode as is for pixel_perfect / bilinear
    }
  }

  function getEffectLabel(layer: EffectLayer): string {
    const opt = effectOptions.find(o =>
      o.type === layer.type && (layer.type === 'hqx' || o.glitchType === layer.glitchType)
    );
    return opt ? `${opt.icon} ${i18n.t(opt.labelKey)}` : layer.type;
  }

  // ─── Drag & Drop Reorder ───
  let dragIdx = $state<number | null>(null);
  let dragOverIdx = $state<number | null>(null);

  function onDragStart(idx: number, e: DragEvent) {
    dragIdx = idx;
    e.dataTransfer!.effectAllowed = 'move';
    e.dataTransfer!.setData('text/plain', String(idx));
  }

  function onDragOver(idx: number, e: DragEvent) {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
    dragOverIdx = idx;
  }

  function onDragLeave() {
    dragOverIdx = null;
  }

  function onDrop(idx: number, e: DragEvent) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) { dragIdx = null; dragOverIdx = null; return; }
    const layers = [...(settings.effectLayers || [])];
    const [moved] = layers.splice(dragIdx, 1);
    layers.splice(idx, 0, moved);
    settings.effectLayers = layers;
    syncLegacyFromLayers();
    onChange();
    dragIdx = null;
    dragOverIdx = null;
  }

  function onDragEnd() {
    dragIdx = null;
    dragOverIdx = null;
  }

  function moveLayer(idx: number, direction: -1 | 1) {
    const layers = settings.effectLayers;
    if (!layers) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= layers.length) return;
    const copy = [...layers];
    [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
    settings.effectLayers = copy;
    syncLegacyFromLayers();
    onChange();
  }

  // ─── Add Effect Menu ───
  let showAddMenu = $state(false);
  let addMenuWrapperEl: HTMLDivElement | undefined = $state();

  $effect(() => {
    if (!showAddMenu) return;
    function handleClickOutside(e: MouseEvent) {
      if (addMenuWrapperEl && !addMenuWrapperEl.contains(e.target as Node)) {
        showAddMenu = false;
      }
    }
    // Delay listener to avoid catching the opening click
    requestAnimationFrame(() => {
      window.addEventListener('pointerdown', handleClickOutside);
    });
    return () => window.removeEventListener('pointerdown', handleClickOutside);
  });
</script>

<fieldset class="effect-section w98-fieldset" data-testid="effect-display-fieldset">
  <legend>{i18n.t('crt_scanlines')}</legend>
  <div class="field-row">
    <select
      class="w98-select"
      id="crt-effect"
      value={settings.crtEffect}
      onchange={(e) => {
        settings.crtEffect = (e.currentTarget as HTMLSelectElement).value as ProcessingSettings['crtEffect'];
        onChange();
      }}
    >
      <option value="none">{i18n.t('crt_none')}</option>
      <option value="horizontal">{i18n.t('crt_horizontal')}</option>
      <option value="vertical">{i18n.t('crt_vertical')}</option>
    </select>
  </div>
</fieldset>

<fieldset class="effect-section w98-fieldset" data-testid="effect-render-fieldset">
  <legend>{i18n.t('css_render_mode')}</legend>
  <div class="field-row render-row">
    {#each cssRenderOptions as opt}
      <button
        class:preset-active={settings.renderMode === opt.id}
        class="render-btn w98-inline-button w98-button--thin"
        onclick={() => { settings.renderMode = opt.id as RenderMode; onChange(); }}
        title={i18n.t(opt.titleKey)}
      >
        {i18n.t(opt.labelKey)}
      </button>
    {/each}
  </div>
</fieldset>

<fieldset class="effect-section effect-section--stack w98-fieldset" data-testid="effect-stack-fieldset">
  <legend>{i18n.t('effect_stack')}</legend>
  <div class="effect-stack-hint section-hint">({i18n.t('effect_stack_hint')})</div>

  {#if !settings.effectLayers || settings.effectLayers.length === 0}
    <div class="no-effects w98-note">{i18n.t('no_effects')}</div>
  {:else}
    <div class="effect-layer-list">
      {#each settings.effectLayers as layer, idx (layer.id)}
        <div
          class="effect-layer-item"
          class:drag-over={dragOverIdx === idx}
          class:dragging={dragIdx === idx}
          class:disabled={!layer.enabled}
          draggable="true"
          ondragstart={(e) => onDragStart(idx, e)}
          ondragover={(e) => onDragOver(idx, e)}
          ondragleave={onDragLeave}
          ondrop={(e) => onDrop(idx, e)}
          ondragend={onDragEnd}
          role="listitem"
        >
          <button
            class="layer-toggle w98-inline-button w98-button--thin"
            class:active={layer.enabled}
            class:w98-inline-button--active={layer.enabled}
            onclick={() => toggleEffectLayer(layer.id)}
            title={layer.enabled ? i18n.t('effect_enabled') : i18n.t('effect_disabled')}
            aria-label={layer.enabled ? i18n.t('effect_enabled') : i18n.t('effect_disabled')}
          >{layer.enabled ? '✓' : '○'}</button>

          <span class="layer-label">{getEffectLabel(layer)}</span>

          {#if layer.type === 'glitch'}
            <div class="layer-intensity">
              {#each [1, 2, 3] as lv}
                <button
                  class:preset-active={layer.intensity === lv}
                  class="intensity-btn w98-inline-button w98-button--thin"
                  onclick={() => setLayerIntensity(layer.id, lv)}
                  title="{i18n.t('level')} {lv}"
                >{lv}</button>
              {/each}
            </div>
          {/if}

          <button
            class="layer-remove w98-inline-button w98-button--thin"
            onclick={() => removeEffectLayer(layer.id)}
            title={i18n.t('remove_effect')}
            aria-label={i18n.t('remove_effect')}
          >×</button>

          <span class="layer-move-btns">
            <button
              class="layer-move-btn w98-inline-button w98-button--thin"
              onclick={() => moveLayer(idx, -1)}
              disabled={idx === 0}
              title={i18n.t('move_up')}
              aria-label={i18n.t('move_up')}
            >▲</button>
            <button
              class="layer-move-btn w98-inline-button w98-button--thin"
              onclick={() => moveLayer(idx, 1)}
              disabled={idx === (settings.effectLayers?.length ?? 0) - 1}
              title={i18n.t('move_down')}
              aria-label={i18n.t('move_down')}
            >▼</button>
          </span>

          <span class="drag-handle" aria-hidden="true">≡</span>
        </div>
      {/each}
    </div>
  {/if}

  {#if settings.effectLayers?.some(l => l.type === 'glitch' && l.enabled)}
    <div class="glitch-intensity-panel glitch-seed-panel w98-status-panel">
      <div class="glitch-intensity-row">
        <span class="glitch-intensity-label">🎲 {i18n.t('seed')}</span>
        <div class="glitch-intensity-btns">
          <button
            class:preset-active={settings.glitchSeed === null}
            class="intensity-btn seed-btn w98-inline-button w98-button--thin"
            onclick={() => { settings.glitchSeed = null; onChange(); }}
          >{i18n.t('random')}</button>
          <button
            class:preset-active={settings.glitchSeed !== null}
            class="intensity-btn seed-btn w98-inline-button w98-button--thin"
            onclick={() => { settings.glitchSeed = Math.round(Math.random() * 10000) / 10000; onChange(); }}
          >{settings.glitchSeed !== null ? `${i18n.t('fixed')} (${settings.glitchSeed})` : i18n.t('fix')}</button>
          {#if settings.glitchSeed !== null}
            <button
              class="intensity-btn w98-inline-button w98-button--thin"
              title={i18n.t('reroll_seed')}
              onclick={() => { settings.glitchSeed = Math.round(Math.random() * 10000) / 10000; onChange(); }}
            >🔄</button>
          {/if}
        </div>
      </div>
    </div>
  {/if}

  <div class="add-effect-row">
    <div class="add-effect-wrapper" bind:this={addMenuWrapperEl}>
      <button class="add-effect-btn w98-button w98-button--thin" onclick={() => { showAddMenu = !showAddMenu; }}>
        + {i18n.t('add_effect')}
      </button>
      {#if showAddMenu}
        <div class="add-effect-menu w98-menu-surface">
          {#each effectOptions as opt}
            <button
              class="add-effect-option w98-menu-item"
              onclick={() => { addEffectLayer(opt); showAddMenu = false; }}
            >
              {opt.icon} {i18n.t(opt.labelKey)}
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</fieldset>

<style>
  .preset-active {
    background: var(--w98-surface-active);
    box-shadow: var(--w98-inset-thin);
    font-weight: bold;
  }

  .effect-section {
    margin: 0 0 var(--w98-space-6);
  }

  .effect-section:last-of-type {
    margin-bottom: 0;
  }

  .effect-stack-hint {
    margin-bottom: var(--w98-space-4);
  }

  .section-hint {
    color: var(--w98-text-hint);
    font-size: var(--w98-font-size-caption);
    text-transform: none;
  }

  /* ===== Render Mode Buttons ===== */
  .render-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--w98-space-4);
  }
  .render-btn {
    font-size: var(--w98-font-size-sm);
    flex: 1 1 88px;
    min-width: 88px;
    text-align: center;
  }

  /* ===== Per-Filter Intensity Panel ===== */
  .glitch-intensity-panel {
    margin-top: var(--w98-space-6);
    display: flex;
    flex-direction: column;
    gap: var(--w98-space-4);
  }
  .glitch-seed-panel {
    margin-top: var(--w98-space-4);
  }
  .glitch-intensity-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--w98-space-4);
  }
  .glitch-intensity-label {
    display: inline-flex;
    align-items: center;
    gap: var(--w98-space-4);
    font-size: var(--w98-font-size-sm);
    white-space: nowrap;
    min-width: 70px;
  }
  .glitch-intensity-btns {
    display: flex;
    gap: var(--w98-space-2);
  }
  .intensity-btn {
    font-size: var(--w98-font-size-caption);
    min-width: 22px;
    text-align: center;
  }
  .seed-btn {
    min-width: 50px;
  }

  /* ===== Effect Layer Stack ===== */
  .effect-layer-list {
    display: flex;
    flex-direction: column;
    gap: var(--w98-space-2);
  }
  .effect-layer-item {
    display: flex;
    align-items: center;
    gap: var(--w98-space-4);
    padding: var(--w98-space-4);
    background: var(--w98-surface);
    box-shadow: var(--w98-outset-thin);
    cursor: grab;
  }
  .effect-layer-item:active {
    cursor: grabbing;
  }
  .effect-layer-item.dragging {
    background: var(--w98-surface-dim);
  }
  .effect-layer-item.drag-over {
    outline: 1px dotted var(--w98-highlight);
    outline-offset: -2px;
  }
  .effect-layer-item.disabled {
    color: var(--w98-text-disabled);
    background: var(--w98-surface-dim);
  }
  .layer-toggle {
    min-width: 20px;
    width: 20px;
    height: 20px;
    padding: 0;
    font-size: var(--w98-font-size-sm);
    text-align: center;
    line-height: 20px;
    cursor: pointer;
  }
  .layer-toggle.active {
    color: var(--w98-color-success);
    font-weight: bold;
  }
  .layer-label {
    font-size: var(--w98-font-size-base);
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .layer-intensity {
    display: flex;
    gap: var(--w98-space-2);
  }
  .layer-remove {
    min-width: 18px;
    width: 18px;
    height: 18px;
    padding: 0;
    font-size: var(--w98-font-size-action);
    font-weight: bold;
    color: var(--w98-shadow-808);
    line-height: 16px;
    text-align: center;
  }
  .layer-remove:hover {
    color: var(--w98-color-error);
  }
  .layer-move-btns {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .layer-move-btn {
    min-width: 16px;
    width: 16px;
    height: 12px;
    padding: 0;
    font-size: var(--w98-font-size-micro);
    line-height: 10px;
    text-align: center;
    color: var(--w98-shadow-808);
  }
  .layer-move-btn:hover:not(:disabled) {
    color: #000;
  }
  .layer-move-btn:disabled {
    color: var(--w98-surface);
    cursor: default;
  }
  .drag-handle {
    font-size: var(--w98-font-size-action);
    color: var(--w98-text-disabled);
    cursor: grab;
    user-select: none;
    line-height: 1;
  }
  .no-effects {
    font-size: var(--w98-font-size-sm);
    color: var(--w98-text-hint);
    padding: var(--w98-space-6) 0;
    text-align: center;
  }
  .add-effect-row {
    margin-top: var(--w98-space-6);
  }
  .add-effect-wrapper {
    position: relative;
  }
  .add-effect-btn {
    width: 100%;
    font-size: var(--w98-font-size-base);
  }
  .add-effect-menu {
    position: absolute;
    bottom: 100%;
    left: 0;
    right: 0;
    z-index: 10;
    display: flex;
    flex-direction: column;
  }
  .add-effect-option {
    width: 100%;
  }
</style>
