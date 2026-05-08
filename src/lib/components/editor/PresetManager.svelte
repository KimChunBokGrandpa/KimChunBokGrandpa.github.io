<script lang="ts">
  import { getPaletteName } from '$lib/utils/palettes';
  import {
    createPresetProcessingSettings,
    getPresetFamilyLabelKey,
    presetMatchesSettings,
    presets,
    type Preset,
  } from '$lib/utils/presets';
  import type { EffectLayer, ProcessingSettings } from '$lib/types';
  import { i18n } from '$lib/i18n/index.svelte';
  import { getCustomPresets, addCustomPreset, removeCustomPreset, type CustomPreset } from '$lib/stores/customPresetStore.svelte';
  import {
    buildCloudPresetShareUrl,
    listOwnCloudPresets,
    listPublicCloudPresets,
    publishCloudPreset,
    type CloudPresetRecord,
    type CloudPresetVisibility,
  } from '$lib/services/cloudPresetService';
  import {
    getSharedPresets,
    importSharedPreset,
    markSharedPresetApplied,
    removeSharedPreset,
    type SharedPresetRecord,
  } from '$lib/stores/sharedPresetStore.svelte';
  import { getPresetPreview } from '$lib/utils/presetPreview';
  import { recommendStylesFromImage, type StyleRecommendation } from '$lib/utils/styleRecommender';
  import {
    buildPresetShareUrl,
    encodePresetShareCode,
    sanitizeImportedPresetSettings,
  } from '$lib/utils/presetShare';

  let {
    settings = $bindable(),
    imageSrc = null,
    onChange,
    onError,
  }: {
    settings: ProcessingSettings;
    imageSrc?: string | null;
    onChange: () => void;
    onError?: (message: string) => void;
  } = $props();

  // ─── Built-in Presets ───
  function applyPreset(preset: Preset) {
    settings = createPresetProcessingSettings(preset, { glitchSeed: settings.glitchSeed });
    onChange();
  }

  function matchesPreset(preset: Preset): boolean {
    return presetMatchesSettings(preset, settings);
  }

  // ─── Custom Presets ───
  let showSavePreset = $state(false);
  let newPresetName = $state('');
  let customPresets = $derived(getCustomPresets());
  let sharedPresets = $derived(getSharedPresets());
  let presetPreviews = $state<Record<string, string>>({});
  let cloudPresets = $state<CloudPresetRecord[]>([]);
  let communityPresets = $state<CloudPresetRecord[]>([]);
  let styleRecommendations = $state<StyleRecommendation[]>([]);
  let isRecommendingStyles = $state(false);
  let isPublishingCloudPreset = $state(false);
  let cloudPublishVisible = $state(false);
  let cloudPublishName = $state('');
  let styleRecommendationRequestId = 0;

  async function loadPreview(id: string, previewSource: ProcessingSettings, name?: string) {
    if (presetPreviews[id]) return;
    try {
      const preview = await getPresetPreview({ id, name, settings: previewSource });
      presetPreviews = { ...presetPreviews, [id]: preview };
    } catch {
      // Keep preset usable even if thumbnail generation fails.
    }
  }

  $effect(() => {
    presets.forEach((preset) => {
      void loadPreview(
        preset.id,
        createPresetProcessingSettings(preset),
      );
    });

    customPresets.forEach((preset) => {
      void loadPreview(preset.id, preset.settings, preset.name);
    });

    sharedPresets.forEach((preset) => {
      void loadPreview(preset.id, preset.settings, preset.name);
    });

    cloudPresets.forEach((preset) => {
      void loadPreview(preset.id, preset.settings, preset.name);
    });

    communityPresets.forEach((preset) => {
      void loadPreview(preset.id, preset.settings, preset.name);
    });
  });

  $effect(() => {
    void refreshCloudPresets();
  });

  $effect(() => {
    const requestId = ++styleRecommendationRequestId;
    if (!imageSrc) {
      styleRecommendations = [];
      isRecommendingStyles = false;
      return;
    }

    isRecommendingStyles = true;
    recommendStylesFromImage(imageSrc, 3)
      .then((recommendations) => {
        if (requestId !== styleRecommendationRequestId) return;
        styleRecommendations = recommendations;
      })
      .catch(() => {
        if (requestId !== styleRecommendationRequestId) return;
        styleRecommendations = [];
      })
      .finally(() => {
        if (requestId !== styleRecommendationRequestId) return;
        isRecommendingStyles = false;
      });
  });

  function saveCurrentAsPreset() {
    if (!newPresetName.trim()) return;
    addCustomPreset(newPresetName, settings);
    newPresetName = '';
    showSavePreset = false;
  }

  function applyCustomPreset(preset: { settings: ProcessingSettings }) {
    settings = {
      ...preset.settings,
      glitchFilters: preset.settings.glitchFilters.map(f => ({ ...f })),
      effectLayers: preset.settings.effectLayers?.map(l => ({ ...l })) || migrateToEffectLayers(preset.settings),
    };
    onChange();
  }

  function applySharedPresetRecord(preset: SharedPresetRecord) {
    const refreshed = markSharedPresetApplied(preset.id) ?? preset;
    settings = {
      ...refreshed.settings,
      glitchFilters: refreshed.settings.glitchFilters.map((filter) => ({ ...filter })),
      effectLayers: refreshed.settings.effectLayers?.map((layer) => ({ ...layer })) || migrateToEffectLayers(refreshed.settings),
    };
    newPresetName = refreshed.name;
    shareStatus = i18n.t('preset_share_imported');
    onChange();
  }

  function applyCloudPresetRecord(preset: CloudPresetRecord) {
    settings = {
      ...preset.settings,
      glitchFilters: preset.settings.glitchFilters.map((filter) => ({ ...filter })),
      effectLayers: preset.settings.effectLayers?.map((layer) => ({ ...layer })) || migrateToEffectLayers(preset.settings),
    };
    newPresetName = preset.name;
    shareStatus = i18n.t('cloud_preset_applied');
    onChange();
  }

  function customPresetMatches(preset: CustomPreset): boolean {
    return JSON.stringify({
      ...settings,
      glitchFilters: settings.glitchFilters,
      effectLayers: settings.effectLayers || [],
    }) === JSON.stringify({
      ...preset.settings,
      glitchFilters: preset.settings.glitchFilters,
      effectLayers: preset.settings.effectLayers || [],
    });
  }

  // Migrate legacy settings to effectLayers
  function migrateToEffectLayers(s: ProcessingSettings): EffectLayer[] {
    const layers: EffectLayer[] = s.glitchFilters
      .filter(f => f.type !== 'none')
      .map(f => ({
        id: crypto.randomUUID(),
        type: 'glitch' as const,
        enabled: true,
        glitchType: f.type,
        intensity: f.intensity,
      }));
    if (s.renderMode === 'hqx') {
      layers.push({ id: crypto.randomUUID(), type: 'hqx', enabled: true });
    }
    return layers;
  }

  // ─── Preset Sharing ───
  let presetFileInput = $state<HTMLInputElement>();
  let shareImportVisible = $state(false);
  let shareInput = $state('');
  let shareStatus = $state('');
  const shareBasePath = import.meta.env.BASE_URL === '/' ? '' : import.meta.env.BASE_URL.replace(/\/$/, '');

  function exportPreset() {
    const preset = {
      name: i18n.t('custom_preset'),
      version: 1,
      settings: { ...settings, glitchFilters: settings.glitchFilters.map(f => ({ ...f })) },
    };
    const json = JSON.stringify(preset, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pixel-preset.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function importPreset() {
    presetFileInput?.click();
  }

  async function copyShareLink() {
    const shareCode = encodePresetShareCode(settings, i18n.t('custom_preset'));
    const shareUrl = buildPresetShareUrl(shareCode, window.location.origin, shareBasePath);

    try {
      await navigator.clipboard.writeText(shareUrl);
      shareStatus = i18n.t('share_link_copied');
    } catch {
      shareInput = shareUrl;
      shareImportVisible = true;
      shareStatus = i18n.t('copy_failed');
      onError?.(i18n.t('copy_failed'));
    }
  }

  async function refreshCloudPresets() {
    const [own, community] = await Promise.all([
      listOwnCloudPresets(),
      listPublicCloudPresets(),
    ]);
    cloudPresets = own;
    communityPresets = community;
  }

  async function publishToCloud(visibility: CloudPresetVisibility) {
    if (isPublishingCloudPreset) return;
    isPublishingCloudPreset = true;
    try {
      const record = await publishCloudPreset({
        name: cloudPublishName.trim() || newPresetName.trim() || i18n.t('custom_preset'),
        settings,
        visibility,
      });
      const shareUrl = buildCloudPresetShareUrl(record.shortId, window.location.origin, shareBasePath);
      cloudPublishVisible = false;
      cloudPublishName = record.name;
      await refreshCloudPresets();
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch {
        shareInput = shareUrl;
        cloudPublishVisible = true;
      }
      shareStatus = visibility === 'public'
        ? i18n.t('cloud_publish_public_success')
        : i18n.t('cloud_publish_unlisted_success');
    } catch {
      shareStatus = i18n.t('cloud_publish_failed');
      onError?.(i18n.t('cloud_publish_failed'));
    } finally {
      isPublishingCloudPreset = false;
    }
  }

  function applySharedPreset() {
    try {
      const shared = importSharedPreset(shareInput);
      settings = {
        ...shared.settings,
        glitchFilters: shared.settings.glitchFilters.map((filter) => ({ ...filter })),
        effectLayers: shared.settings.effectLayers?.map((layer) => ({ ...layer })) || migrateToEffectLayers(shared.settings),
      };
      newPresetName = shared.name;
      shareInput = '';
      shareImportVisible = false;
      shareStatus = i18n.t('preset_share_imported');
      onChange();
    } catch {
      const message = i18n.t('preset_error_invalid_share');
      shareStatus = message;
      onError?.(message);
    }
  }

  const maxPresetFileSize = 1024 * 1024; // 1MB

  async function handlePresetFile(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files?.length) return;
    try {
      if (input.files[0].size > maxPresetFileSize) {
        throw new Error('File too large');
      }
      const text = await input.files[0].text();
      const data = JSON.parse(text);
      const imported = sanitizeImportedPresetSettings(data.settings);
      settings = imported;
      shareStatus = i18n.t('preset_share_imported');
      onChange();
    } catch (err) {
      const reason = err instanceof SyntaxError
        ? i18n.t('preset_error_invalid_json')
        : err instanceof Error && err.message === 'File too large'
          ? i18n.t('preset_error_too_large')
          : err instanceof Error && err.message === 'Invalid preset format'
            ? i18n.t('preset_error_invalid_format')
            : i18n.t('preset_import_error');
      onError?.(reason);
    }
    input.value = '';
  }
</script>

<div class="tab-panel" role="tabpanel">
  {#if imageSrc}
    <div class="section-label">
      ✨ {i18n.t('recommended_styles')}
      {#if isRecommendingStyles}
        <span class="recommend-loading" data-testid="style-recommendations-loading"> · {i18n.t('loading')}</span>
      {/if}
    </div>
    {#if styleRecommendations.length > 0}
      <div class="field-row preset-grid style-grid" data-testid="style-recommendations">
        {#each styleRecommendations as recommendation}
          {@const preset = presets.find((item) => item.id === recommendation.id)}
          {#if preset}
            <button
              class:preset-active={matchesPreset(preset)}
              class="preset-btn preset-card style-card w98-button"
              data-testid={`style-recommendation-${preset.id}`}
              onclick={() => applyPreset(preset)}
              title={i18n.t(recommendation.reasonKey)}
            >
              {#if presetPreviews[preset.id]}
                <img
                  class="preset-card-thumb"
                  src={presetPreviews[preset.id]}
                  alt={i18n.t(preset.labelKey)}
                  draggable="false"
                />
              {/if}
              <span class="preset-card-icon">{preset.icon}</span>
              <span class="preset-family-label">{i18n.t(getPresetFamilyLabelKey(recommendation.family))}</span>
              <span class="preset-card-name">{i18n.t(preset.labelKey)}</span>
              <span class="style-reason">{i18n.t(recommendation.reasonKey)}</span>
            </button>
          {/if}
        {/each}
      </div>
    {/if}
  {/if}
  <div class="field-row preset-grid">
    {#each presets as preset}
      <button
        class:preset-active={matchesPreset(preset)}
        class="preset-btn preset-card w98-button"
        data-testid={`preset-${preset.id}`}
        onclick={() => applyPreset(preset)}
        title={`${i18n.t('pixel_size')}: ${preset.pixelSize}px | ${i18n.t('palette')}: ${getPaletteName(preset.palette)} | ${i18n.t('dithering')}: ${preset.ditherType}${preset.crtEffect !== 'none' ? ` | CRT (${preset.crtEffect})` : ''}${preset.glitchFilters.length > 0 ? ` | ${preset.glitchFilters.length} effects` : ''}`}
      >
        {#if presetPreviews[preset.id]}
          <img
            class="preset-card-thumb"
            src={presetPreviews[preset.id]}
            alt={i18n.t(preset.labelKey)}
            draggable="false"
          />
        {/if}
        <span class="preset-card-icon w98-emoji">{preset.icon}</span>
        <span class="preset-family-label">{i18n.t(getPresetFamilyLabelKey(preset.family))}</span>
        <span class="preset-card-name">{i18n.t(preset.labelKey)}</span>
        <span class="preset-card-info">{preset.pixelSize}px</span>
      </button>
    {/each}
  </div>
  <div class="field-row preset-share-row">
    <button class="preset-share-btn w98-inline-button w98-button--thin" onclick={exportPreset} title={i18n.t('export_preset')}>
      <span><span class="w98-emoji" aria-hidden="true">📤</span> {i18n.t('export_btn')}</span>
    </button>
    <button class="preset-share-btn w98-inline-button w98-button--thin" onclick={importPreset} title={i18n.t('import_preset')}>
      <span><span class="w98-emoji" aria-hidden="true">📥</span> {i18n.t('import_btn')}</span>
    </button>
    <button
      class="preset-share-btn w98-inline-button w98-button--thin"
      data-testid="preset-share-copy-link"
      onclick={copyShareLink}
      title={i18n.t('copy_share_link')}
    >
      <span><span class="w98-emoji" aria-hidden="true">🔗</span> {i18n.t('copy_btn')}</span>
    </button>
    <button
      class="preset-share-btn w98-inline-button w98-button--thin"
      data-testid="preset-share-open-import"
      onclick={() => { shareImportVisible = !shareImportVisible; }}
      title={i18n.t('import_share_link')}
    >
      <span><span class="w98-emoji" aria-hidden="true">🧾</span> {i18n.t('paste_btn')}</span>
    </button>
    <button
      class="preset-share-btn w98-inline-button w98-button--thin"
      data-testid="preset-cloud-open-publish"
      onclick={() => { cloudPublishVisible = !cloudPublishVisible; cloudPublishName = newPresetName || i18n.t('custom_preset'); }}
      title={i18n.t('publish_cloud_preset')}
    >
      <span><span class="w98-emoji" aria-hidden="true">☁️</span> {i18n.t('publish_btn')}</span>
    </button>
    <input bind:this={presetFileInput} type="file" accept=".json" onchange={handlePresetFile} style="display:none" />
  </div>
  {#if shareImportVisible}
    <div class="field-row preset-share-row">
      <input
        type="text"
        class="preset-name-input w98-input"
        data-testid="preset-share-import-input"
        bind:value={shareInput}
        placeholder={i18n.t('share_link_placeholder')}
        onkeydown={(e) => { if (e.key === 'Enter') applySharedPreset(); if (e.key === 'Escape') shareImportVisible = false; }}
      />
      <button
        class="preset-share-btn w98-inline-button w98-button--thin"
        data-testid="preset-share-apply-import"
        onclick={applySharedPreset}
        aria-label={i18n.t('apply_share_link')}
      >
        <span class="w98-structural-glyph" aria-hidden="true">↩</span>
      </button>
      <button
        class="preset-share-btn w98-inline-button w98-button--thin"
        onclick={() => { shareImportVisible = false; shareInput = ''; }}
        aria-label={i18n.t('cancel')}
      >
        <span class="w98-structural-glyph" aria-hidden="true">✕</span>
      </button>
    </div>
  {/if}
  {#if shareStatus}
    <div class="section-label">{shareStatus}</div>
  {/if}

  {#if cloudPublishVisible}
    <div class="field-row preset-share-row">
      <input
        type="text"
        class="preset-name-input w98-input"
        data-testid="preset-cloud-name-input"
        bind:value={cloudPublishName}
        placeholder={i18n.t('preset_name_placeholder')}
        onkeydown={(e) => {
          if (e.key === 'Enter') void publishToCloud('public');
          if (e.key === 'Escape') cloudPublishVisible = false;
        }}
      />
      <button
        class="preset-share-btn w98-inline-button w98-button--thin"
        data-testid="preset-cloud-publish-public"
        onclick={() => void publishToCloud('public')}
        disabled={isPublishingCloudPreset}
        aria-label={i18n.t('publish_public')}
      >
        <span class="w98-emoji" aria-hidden="true">🌐</span>
      </button>
      <button
        class="preset-share-btn w98-inline-button w98-button--thin"
        data-testid="preset-cloud-publish-unlisted"
        onclick={() => void publishToCloud('unlisted')}
        disabled={isPublishingCloudPreset}
        aria-label={i18n.t('publish_unlisted')}
      >
        <span class="w98-emoji" aria-hidden="true">🔒</span>
      </button>
      <button
        class="preset-share-btn w98-inline-button w98-button--thin"
        onclick={() => { cloudPublishVisible = false; }}
        aria-label={i18n.t('cancel')}
      >
        <span class="w98-structural-glyph" aria-hidden="true">✕</span>
      </button>
    </div>
  {/if}

  {#if communityPresets.length > 0}
    <div class="section-label">{i18n.t('community_presets')}:</div>
    <div class="field-row preset-grid" data-testid="community-presets">
      {#each communityPresets as preset}
        <button
          class="preset-btn custom-preset-btn w98-button w98-button--thin"
          onclick={() => applyCloudPresetRecord(preset)}
          title={preset.name}
        >
          {#if presetPreviews[preset.id]}
            <img
              class="preset-card-thumb custom-preset-thumb"
              src={presetPreviews[preset.id]}
              alt={preset.name}
              draggable="false"
            />
          {/if}
          <span><span class="w98-emoji" aria-hidden="true">🌐</span> {preset.name}</span>
          <span class="preset-card-info">{preset.applyCount} {i18n.t('uses_label')}</span>
        </button>
      {/each}
    </div>
  {/if}

  {#if cloudPresets.length > 0}
    <div class="section-label">{i18n.t('published_presets')}:</div>
    <div class="field-row preset-grid" data-testid="published-cloud-presets">
      {#each cloudPresets as preset}
        <button
          class="preset-btn custom-preset-btn w98-button w98-button--thin"
          onclick={() => applyCloudPresetRecord(preset)}
          title={preset.name}
        >
          {#if presetPreviews[preset.id]}
            <img
              class="preset-card-thumb custom-preset-thumb"
              src={presetPreviews[preset.id]}
              alt={preset.name}
              draggable="false"
            />
          {/if}
          <span><span class="w98-emoji" aria-hidden="true">{preset.visibility === 'public' ? '☁️' : '🔒'}</span> {preset.name}</span>
          <span class="preset-card-info">{preset.shortId}</span>
        </button>
      {/each}
    </div>
  {/if}

  {#if sharedPresets.length > 0}
    <div class="section-label">{i18n.t('shared_presets')}:</div>
    <div class="field-row preset-grid" data-testid="shared-presets">
      {#each sharedPresets as preset}
        <button
          class="preset-btn custom-preset-btn w98-button w98-button--thin"
          onclick={() => applySharedPresetRecord(preset)}
          title={preset.name}
        >
          {#if presetPreviews[preset.id]}
            <img
              class="preset-card-thumb custom-preset-thumb"
              src={presetPreviews[preset.id]}
              alt={preset.name}
              draggable="false"
            />
          {/if}
          <span><span class="w98-emoji" aria-hidden="true">🔗</span> {preset.name}</span>
          <span class="preset-card-info">{new Date(preset.lastAppliedAt).toLocaleDateString()}</span>
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <span
            class="preset-delete"
            role="button"
            tabindex="0"
            onclick={(e) => { e.stopPropagation(); removeSharedPreset(preset.id); }}
            onkeydown={(e) => { e.stopPropagation(); if (e.key === 'Enter') removeSharedPreset(preset.id); }}
          ><span class="w98-structural-glyph" aria-hidden="true">✕</span></span>
        </button>
      {/each}
    </div>
  {/if}

  <!-- Custom Presets -->
  {#if customPresets.length > 0}
    <div class="section-label">{i18n.t('my_presets')}:</div>
    <div class="field-row preset-grid">
      {#each customPresets as cp}
        <button
          class:preset-active={customPresetMatches(cp)}
          class="preset-btn custom-preset-btn w98-button w98-button--thin"
          onclick={() => applyCustomPreset(cp)}
          title={cp.name}
        >
          {#if presetPreviews[cp.id]}
            <img
              class="preset-card-thumb custom-preset-thumb"
              src={presetPreviews[cp.id]}
              alt={cp.name}
              draggable="false"
            />
          {/if}
          <span><span class="w98-emoji" aria-hidden="true">⭐</span> {cp.name}</span>
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <span
            class="preset-delete"
            role="button"
            tabindex="0"
            onclick={(e) => { e.stopPropagation(); removeCustomPreset(cp.id); }}
            onkeydown={(e) => { e.stopPropagation(); if (e.key === 'Enter') removeCustomPreset(cp.id); }}
          ><span class="w98-structural-glyph" aria-hidden="true">✕</span></span>
        </button>
      {/each}
    </div>
  {/if}

  <!-- Save Current as Preset -->
  <div class="field-row preset-share-row">
    {#if showSavePreset}
      <input
        type="text"
        class="preset-name-input w98-input"
        bind:value={newPresetName}
        placeholder={i18n.t('preset_name_placeholder')}
        onkeydown={(e) => { if (e.key === 'Enter') saveCurrentAsPreset(); if (e.key === 'Escape') showSavePreset = false; }}
      />
      <button class="preset-share-btn w98-inline-button w98-button--thin" onclick={saveCurrentAsPreset} aria-label={i18n.t('save_preset')}>
        <span class="w98-structural-glyph" aria-hidden="true">✓</span>
      </button>
      <button class="preset-share-btn w98-inline-button w98-button--thin" onclick={() => { showSavePreset = false; }} aria-label={i18n.t('cancel')}>
        <span class="w98-structural-glyph" aria-hidden="true">✕</span>
      </button>
    {:else}
      <button class="preset-share-btn w98-inline-button w98-button--thin" onclick={() => { showSavePreset = true; }}>
        <span><span class="w98-emoji" aria-hidden="true">💾</span> {i18n.t('save_preset')}</span>
      </button>
    {/if}
  </div>
</div>

<style>
  .tab-panel {
    padding: 6px 4px;
  }

  .section-label {
    margin-top: 8px;
    font-size: var(--w98-font-size-base);
    margin-bottom: 2px;
  }
  .recommend-loading {
    color: var(--w98-shadow-808);
  }

  /* ===== Preset Grid ===== */
  .preset-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    justify-content: flex-start;
  }
  .preset-btn {
    font-size: var(--w98-font-size-base);
    padding: 3px 8px;
  }

  /* ===== Preset Card ===== */
  .preset-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--w98-space-2);
    padding: 4px 6px;
    min-width: 56px;
    position: relative;
    overflow: hidden;
  }
  .preset-card-thumb {
    width: 72px;
    height: 52px;
    display: block;
    box-sizing: border-box;
    padding: var(--w98-space-2);
    object-fit: cover;
    margin-bottom: 4px;
    background: var(--w98-surface-white);
    box-shadow: var(--w98-inset-thin);
    image-rendering: pixelated;
    pointer-events: none;
  }
  .preset-card-icon {
    font-size: 14px;
    line-height: 1;
  }
  .preset-card-name {
    font-size: var(--w98-font-size-caption);
    line-height: 1.1;
    white-space: nowrap;
  }
  .preset-family-label {
    font-size: var(--w98-font-size-micro);
    line-height: 1;
    color: var(--w98-highlight);
    text-transform: uppercase;
    white-space: nowrap;
  }
  .preset-card-info {
    font-size: var(--w98-font-size-micro);
    color: var(--w98-text-hint);
    line-height: 1;
  }
  .style-grid {
    margin-bottom: 8px;
  }
  .style-card {
    align-items: flex-start;
    text-align: left;
    min-width: 120px;
  }
  .style-reason {
    font-size: var(--w98-font-size-micro);
    color: var(--w98-text-hint);
    line-height: 1.2;
    white-space: normal;
  }

  /* ===== Custom Preset ===== */
  .custom-preset-btn {
    position: relative;
    padding-right: 16px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 6px;
  }
  .custom-preset-thumb {
    width: 40px;
    height: 28px;
    margin-bottom: 0;
    flex: 0 0 auto;
  }
  .preset-delete {
    position: absolute;
    top: 0;
    right: 2px;
    font-size: var(--w98-font-size-action);
    font-weight: bold;
    color: var(--w98-shadow-808);
    cursor: pointer;
    line-height: 1;
  }
  .preset-delete:hover {
    color: var(--w98-color-error);
  }
  .preset-delete:focus-visible {
    outline: 1px solid var(--w98-highlight);
    outline-offset: 1px;
  }
  .preset-name-input {
    flex: 1;
    font-size: var(--w98-font-size-base);
    padding: 2px 4px;
    min-width: 0;
  }

  /* ===== Preset Share ===== */
  .preset-share-row {
    margin-top: 4px;
    display: flex;
    gap: 4px;
    justify-content: flex-end;
  }
  .preset-share-btn {
    font-size: var(--w98-font-size-sm);
  }
</style>
