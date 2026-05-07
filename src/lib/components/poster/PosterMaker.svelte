<script lang="ts">
  import { onDestroy } from 'svelte';
  import { i18n } from '$lib/i18n/index.svelte';
  import { saveImage } from '$lib/services/saveService';
  import { getHandoffBus } from '$lib/handoffs/runtime';
  import {
    defaultPosterPresetId,
    defaultPosterSubtitle,
    defaultPosterTitle,
    posterPresets,
    getPosterPreset,
  } from '$lib/poster/presets';
  import {
    defaultPosterFrameStyleId,
    defaultPosterOverlayStyleId,
    defaultPosterStickerStyleId,
    posterFrameStyles,
    posterOverlayStyles,
    posterStickerStyles,
    type PosterFrameStyleId,
    type PosterOverlayStyleId,
    type PosterStickerStyleId,
  } from '$lib/poster/styles';
  import { getProjectStorageAdapter } from '$lib/projects/runtime';
  import { dialogStore } from '$lib/stores/dialogStore.svelte';
  import { posterMakerStore } from '$lib/stores/posterMakerStore.svelte';

  let {
    onMessage,
    onError,
    onSwitchToPixelLab,
  }: {
    onMessage?: (message: string) => void;
    onError?: (message: string) => void;
    onSwitchToPixelLab?: () => void;
  } = $props();

  const projectStorage = getProjectStorageAdapter();
  const handoffBus = getHandoffBus();

  let previewCanvas: HTMLCanvasElement | null = null;
  let importedImage = $state<HTMLImageElement | null>(null);
  let importedObjectUrl: string | null = null;
  let loadedAssetId = $state<string | null>(null);

  function drawOverlay(
    ctx: CanvasRenderingContext2D,
    preset: ReturnType<typeof getPosterPreset>,
    imageBox: { x: number; y: number; width: number; height: number },
  ) {
    if (posterMakerStore.overlayStyleId === 'none') return;

    ctx.save();
    if (posterMakerStore.overlayStyleId === 'sunset') {
      const gradient = ctx.createLinearGradient(imageBox.x, imageBox.y, imageBox.x + imageBox.width, imageBox.y + imageBox.height);
      gradient.addColorStop(0, 'rgba(255, 195, 113, 0.18)');
      gradient.addColorStop(1, 'rgba(255, 94, 98, 0.3)');
      ctx.fillStyle = gradient;
      ctx.fillRect(imageBox.x, imageBox.y, imageBox.width, imageBox.height);
    } else if (posterMakerStore.overlayStyleId === 'cool') {
      const gradient = ctx.createLinearGradient(0, 0, preset.width, preset.height);
      gradient.addColorStop(0, 'rgba(55, 214, 255, 0.22)');
      gradient.addColorStop(1, 'rgba(30, 74, 195, 0.28)');
      ctx.fillStyle = gradient;
      ctx.fillRect(imageBox.x, imageBox.y, imageBox.width, imageBox.height);
    }
    ctx.restore();
  }

  function drawFrame(
    ctx: CanvasRenderingContext2D,
    preset: ReturnType<typeof getPosterPreset>,
  ) {
    ctx.save();
    if (posterMakerStore.frameStyleId === 'classic') {
      ctx.strokeStyle = preset.accent;
      ctx.lineWidth = 12;
      ctx.strokeRect(18, 18, preset.width - 36, preset.height - 36);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.strokeRect(34, 34, preset.width - 68, preset.height - 68);
    } else if (posterMakerStore.frameStyleId === 'marquee') {
      ctx.strokeStyle = preset.accent;
      ctx.lineWidth = 6;
      ctx.setLineDash([14, 8]);
      ctx.strokeRect(24, 24, preset.width - 48, preset.height - 48);
      ctx.setLineDash([]);
      ctx.fillStyle = `${preset.accent}1f`;
      ctx.fillRect(24, 24, preset.width - 48, 42);
    }
    ctx.restore();
  }

  function drawSticker(
    ctx: CanvasRenderingContext2D,
    preset: ReturnType<typeof getPosterPreset>,
  ) {
    if (posterMakerStore.stickerStyleId === 'none') return;

    ctx.save();
    if (posterMakerStore.stickerStyleId === 'pixel_lab') {
      ctx.fillStyle = preset.accent;
      ctx.fillRect(preset.width - 186, 40, 138, 44);
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 3;
      ctx.strokeRect(preset.width - 186, 40, 138, 44);
      ctx.fillStyle = '#fff8d6';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PIXEL LAB', preset.width - 117, 68);
    } else if (posterMakerStore.stickerStyleId === 'new_burst') {
      const cx = preset.width - 110;
      const cy = 84;
      const spikes = 12;
      const outer = 48;
      const inner = 28;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i += 1) {
        const radius = i % 2 === 0 ? outer : inner;
        const angle = (Math.PI / spikes) * i - Math.PI / 2;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = '#ffe45c';
      ctx.fill();
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#8b1f52';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('NEW!', cx, cy + 6);
    }
    ctx.restore();
  }

  function revokeImportedUrl() {
    if (importedObjectUrl) {
      URL.revokeObjectURL(importedObjectUrl);
      importedObjectUrl = null;
    }
  }

  function derivedDefaultTitle() {
    const trimmedFilename = posterMakerStore.importedFilename?.trim();
    if (!trimmedFilename) return defaultPosterTitle;
    return trimmedFilename.replace(/\.[^.]+$/, '').toUpperCase();
  }

  function shouldConfirmNewDocument() {
    return !posterMakerStore.isBlankDocument();
  }

  function shouldConfirmResetDocument() {
    return posterMakerStore.activePresetId !== defaultPosterPresetId
      || posterMakerStore.frameStyleId !== defaultPosterFrameStyleId
      || posterMakerStore.overlayStyleId !== defaultPosterOverlayStyleId
      || posterMakerStore.stickerStyleId !== defaultPosterStickerStyleId
      || posterMakerStore.titleText !== derivedDefaultTitle()
      || posterMakerStore.subtitleText !== defaultPosterSubtitle;
  }

  async function loadImage(url: string): Promise<HTMLImageElement> {
    const image = new Image();
    return new Promise((resolve, reject) => {
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(i18n.t('error_image_load')));
      image.src = url;
    });
  }

  function drawPoster() {
    if (!previewCanvas) return;
    const preset = getPosterPreset(posterMakerStore.activePresetId);
    previewCanvas.width = preset.width;
    previewCanvas.height = preset.height;

    const ctx = previewCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, preset.width, preset.height);
    ctx.fillStyle = preset.background;
    ctx.fillRect(0, 0, preset.width, preset.height);
    ctx.fillStyle = `${preset.accent}18`;
    ctx.fillRect(36, 36, preset.width - 72, preset.height - 72);

    const imageBox = {
      x: 48,
      y: 48,
      width: preset.width - 96,
      height: preset.height - 280,
    };

    if (importedImage) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(imageBox.x, imageBox.y, imageBox.width, imageBox.height);
      ctx.drawImage(importedImage, imageBox.x, imageBox.y, imageBox.width, imageBox.height);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(imageBox.x, imageBox.y, imageBox.width, imageBox.height);
      ctx.strokeStyle = preset.accent;
      ctx.setLineDash([10, 6]);
      ctx.strokeRect(imageBox.x, imageBox.y, imageBox.width, imageBox.height);
      ctx.setLineDash([]);
      ctx.fillStyle = preset.accent;
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(i18n.t('poster_empty_hint'), preset.width / 2, imageBox.y + imageBox.height / 2);
    }

    drawOverlay(ctx, preset, imageBox);

    ctx.fillStyle = preset.textColor;
    ctx.textAlign = 'left';
    ctx.font = 'bold 52px serif';
    ctx.fillText(posterMakerStore.titleText || defaultPosterTitle, 48, preset.height - 136, preset.width - 96);

    ctx.font = '24px sans-serif';
    ctx.fillText(
      posterMakerStore.subtitleText || defaultPosterSubtitle,
      48,
      preset.height - 84,
      preset.width - 96,
    );

    drawFrame(ctx, preset);
    drawSticker(ctx, preset);
  }

  async function handleFileInput(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    try {
      await posterMakerStore.importFile(file, 'poster-maker');
      onMessage?.(i18n.t('poster_file_loaded'));
    } catch (error) {
      onError?.(error instanceof Error ? error.message : String(error));
    }
  }

  async function exportPoster() {
    if (!previewCanvas) return;
    try {
      const message = await saveImage(
        '',
        { format: 'png', quality: 0.92, filename: posterMakerStore.currentProjectName() },
        previewCanvas,
      );
      if (message) {
        await posterMakerStore.recordExport({
          format: 'png',
          width: previewCanvas.width,
          height: previewCanvas.height,
        });
        onMessage?.(message);
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : i18n.t('poster_export_failed'));
    }
  }

  async function clearImportedImage() {
    revokeImportedUrl();
    importedImage = null;
    loadedAssetId = null;
    await posterMakerStore.clearImportedImage();
  }

  async function createNewDocument() {
    if (shouldConfirmNewDocument()) {
      const confirmed = await dialogStore.requestConfirm({
        title: i18n.t('dialog_poster_new_document_title'),
        message: i18n.t('dialog_poster_new_document_message'),
        confirmLabel: i18n.t('poster_new_document'),
        cancelLabel: i18n.t('cancel'),
      });
      if (!confirmed) return;
    }
    revokeImportedUrl();
    importedImage = null;
    loadedAssetId = null;
    await posterMakerStore.createNewDocument();
    onMessage?.(i18n.t('poster_document_new'));
  }

  async function resetCurrentDocument() {
    if (shouldConfirmResetDocument()) {
      const confirmed = await dialogStore.requestConfirm({
        title: i18n.t('dialog_poster_reset_title'),
        message: i18n.t('dialog_poster_reset_message'),
        confirmLabel: i18n.t('poster_reset_document'),
        cancelLabel: i18n.t('cancel'),
      });
      if (!confirmed) return;
    }
    await posterMakerStore.resetCurrentDocument();
    onMessage?.(i18n.t('poster_document_reset'));
  }

  async function reopenProject(projectId: string) {
    try {
      const reopened = await posterMakerStore.loadProject(projectId);
      if (reopened) {
        onMessage?.(i18n.t('poster_project_reopened'));
      } else {
        onError?.(i18n.t('poster_project_missing'));
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : String(error));
    }
  }

  function handlePresetChange(id: typeof posterPresets[number]['id']) {
    void posterMakerStore.setPreset(id);
  }

  function handleTitleInput(value: string) {
    void posterMakerStore.setTitle(value);
  }

  function handleSubtitleInput(value: string) {
    void posterMakerStore.setSubtitle(value);
  }

  function handleFrameStyleChange(value: string) {
    void posterMakerStore.setFrameStyle(value as PosterFrameStyleId);
  }

  function handleOverlayStyleChange(value: string) {
    void posterMakerStore.setOverlayStyle(value as PosterOverlayStyleId);
  }

  function handleStickerStyleChange(value: string) {
    void posterMakerStore.setStickerStyle(value as PosterStickerStyleId);
  }

  $effect(() => {
    void posterMakerStore.ensureInitialized();
  });

  $effect(() => {
    const assetId = posterMakerStore.importedAssetId;
    let cancelled = false;

    void (async () => {
      if (!assetId) {
        loadedAssetId = null;
        importedImage = null;
        revokeImportedUrl();
        return;
      }

      if (assetId === loadedAssetId && importedImage) return;

      const resolved = await projectStorage.resolveAsset(assetId);
      if (!resolved) {
        if (!cancelled) {
          loadedAssetId = null;
          importedImage = null;
          revokeImportedUrl();
          onError?.(i18n.t('poster_handoff_missing'));
        }
        return;
      }

      const nextUrl = URL.createObjectURL(resolved.blob);
      try {
        const nextImage = await loadImage(nextUrl);
        if (cancelled) {
          URL.revokeObjectURL(nextUrl);
          return;
        }
        revokeImportedUrl();
        importedObjectUrl = nextUrl;
        importedImage = nextImage;
        loadedAssetId = assetId;
      } catch (error) {
        URL.revokeObjectURL(nextUrl);
        if (!cancelled) {
          onError?.(error instanceof Error ? error.message : String(error));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  });

  $effect(() => {
    const _dependencies = [
      previewCanvas,
      posterMakerStore.activePresetId,
      posterMakerStore.titleText,
      posterMakerStore.subtitleText,
      importedImage,
    ];
    void _dependencies;
    drawPoster();
  });

  $effect(() => {
    const pending = handoffBus.current;
    if (!pending || pending.toAppId !== 'poster-maker') return;
    void (async () => {
      const envelope = handoffBus.consume('poster-maker');
      if (envelope) {
        const imported = await posterMakerStore.applyHandoff(envelope);
        if (imported) {
          onMessage?.(i18n.t('poster_handoff_imported'));
        } else {
          onError?.(i18n.t('poster_handoff_missing'));
        }
      }
    })();
  });

  onDestroy(() => {
    revokeImportedUrl();
  });
</script>

<div class="poster-maker-root">
  <div class="poster-toolbar w98-toolbar">
    <div class="preset-group w98-toolbar-group">
      {#each posterPresets as preset}
        <button
          class="toolbar-btn w98-inline-button w98-button--thin"
          class:w98-inline-button--active={posterMakerStore.activePresetId === preset.id}
          onclick={() => handlePresetChange(preset.id)}
        >
          {i18n.t(preset.labelKey)}
        </button>
      {/each}
    </div>

    <div class="action-group w98-toolbar-group">
      <button class="toolbar-btn w98-inline-button w98-button--thin" data-testid="poster-new-document-button" onclick={createNewDocument}>
        <span class="w98-structural-glyph" aria-hidden="true">✎</span>
        <span>{i18n.t('poster_new_document')}</span>
      </button>
      <button class="toolbar-btn w98-inline-button w98-button--thin" data-testid="poster-reset-document-button" onclick={resetCurrentDocument}>
        <span class="w98-structural-glyph" aria-hidden="true">↺</span>
        <span>{i18n.t('poster_reset_document')}</span>
      </button>
      <label class="toolbar-btn file-btn w98-inline-button w98-button--thin">
        <span class="w98-emoji" aria-hidden="true">📂</span>
        <span>{i18n.t('poster_open_image')}</span>
        <input type="file" accept="image/png,image/jpeg,image/gif,image/bmp,image/webp" onchange={handleFileInput} />
      </label>
      <button class="toolbar-btn w98-inline-button w98-button--thin" onclick={clearImportedImage} disabled={!posterMakerStore.importedAssetId}>
        <span class="w98-structural-glyph" aria-hidden="true">✕</span>
        <span>{i18n.t('poster_clear_image')}</span>
      </button>
      <button class="toolbar-btn export-btn w98-button w98-button--primary" onclick={exportPoster}>
        <span class="w98-emoji" aria-hidden="true">💾</span>
        <span>{i18n.t('poster_export')}</span>
      </button>
    </div>
  </div>

  <div class="poster-layout">
    <div class="poster-sidebar">
      <label class="field w98-form-stack">
        <span class="w98-form-label">{i18n.t('poster_title_label')}</span>
        <input
          class="w98-input"
          value={posterMakerStore.titleText}
          oninput={(e) => handleTitleInput((e.currentTarget as HTMLInputElement).value)}
        />
      </label>
      <label class="field w98-form-stack">
        <span class="w98-form-label">{i18n.t('poster_subtitle_label')}</span>
        <input
          class="w98-input"
          value={posterMakerStore.subtitleText}
          oninput={(e) => handleSubtitleInput((e.currentTarget as HTMLInputElement).value)}
        />
      </label>
      <label class="field w98-form-stack">
        <span class="w98-form-label">{i18n.t('poster_frame_label')}</span>
        <select
          class="w98-select"
          value={posterMakerStore.frameStyleId}
          oninput={(e) => handleFrameStyleChange((e.currentTarget as HTMLSelectElement).value)}
        >
          {#each posterFrameStyles as option}
            <option value={option.id}>{i18n.t(option.labelKey)}</option>
          {/each}
        </select>
      </label>
      <label class="field w98-form-stack">
        <span class="w98-form-label">{i18n.t('poster_overlay_label')}</span>
        <select
          class="w98-select"
          value={posterMakerStore.overlayStyleId}
          oninput={(e) => handleOverlayStyleChange((e.currentTarget as HTMLSelectElement).value)}
        >
          {#each posterOverlayStyles as option}
            <option value={option.id}>{i18n.t(option.labelKey)}</option>
          {/each}
        </select>
      </label>
      <label class="field w98-form-stack">
        <span class="w98-form-label">{i18n.t('poster_sticker_label')}</span>
        <select
          class="w98-select"
          value={posterMakerStore.stickerStyleId}
          oninput={(e) => handleStickerStyleChange((e.currentTarget as HTMLSelectElement).value)}
        >
          {#each posterStickerStyles as option}
            <option value={option.id}>{i18n.t(option.labelKey)}</option>
          {/each}
        </select>
      </label>
      <div class="meta w98-status-panel">
        <div><strong>{posterMakerStore.currentProjectName()}</strong></div>
        <div class="w98-quiet-copy">{i18n.t('poster_document_status')}: {i18n.t(posterMakerStore.importedAssetId ? 'poster_status_ready' : 'poster_status_waiting')}</div>
        <div class="w98-quiet-copy">{posterMakerStore.importedFilename ?? i18n.t('poster_empty_hint')}</div>
      </div>

      {#if posterMakerStore.sourceContext}
        <div class="source-context w98-status-panel" data-testid="poster-source-context">
          <div class="source-context-header w98-kicker">{i18n.t('poster_source_context')}</div>
          <div class="source-context-line w98-quiet-copy">
            <strong>{i18n.t('poster_source_from')} </strong>{posterMakerStore.sourceContext.sourceLabel ?? posterMakerStore.sourceContext.sourceAppId}
          </div>
          {#if posterMakerStore.sourceContext.sourceProjectId}
            <div class="source-context-line source-context-id w98-mono">
              {posterMakerStore.sourceContext.sourceProjectId}
            </div>
          {/if}
          {#if posterMakerStore.sourceContext.sourceAppId === 'pixel-lab' && onSwitchToPixelLab}
            <button
              class="toolbar-btn source-context-btn w98-inline-button w98-button--thin"
              data-testid="poster-switch-to-pixel-lab"
              onclick={onSwitchToPixelLab}
            >
              <span class="w98-emoji" aria-hidden="true">🖼️</span>
              <span>{i18n.t('poster_switch_to_pixel_lab')}</span>
            </button>
          {/if}
        </div>
      {/if}

      <div class="recent-projects w98-status-panel">
        <div class="recent-projects-header w98-kicker">{i18n.t('poster_recent_projects')}</div>
        {#if posterMakerStore.recentProjects.length > 0}
          <div class="recent-projects-list">
            {#each posterMakerStore.recentProjects as entry}
              <button
                class="recent-project-btn w98-button w98-button--thin"
                data-testid={`poster-recent-project-${entry.projectId}`}
                onclick={() => reopenProject(entry.projectId)}
                disabled={entry.projectId === posterMakerStore.projectId}
              >
                <span class="recent-project-name">{entry.name}</span>
                <span class="recent-project-meta">
                  {entry.projectId === posterMakerStore.projectId
                    ? i18n.t('poster_current_project')
                    : i18n.t('poster_reopen_project')}
                </span>
              </button>
            {/each}
          </div>
        {:else}
          <div class="recent-projects-empty">{i18n.t('poster_recent_projects_empty')}</div>
        {/if}
      </div>
    </div>

    <div class="poster-preview-shell w98-frame">
      <div class="poster-preview-titlebar w98-panel-titlebar">
        <strong class="w98-panel-title">
          <span class="w98-emoji" aria-hidden="true">📰</span>
          <span>{i18n.t('win_poster_maker')}</span>
        </strong>
        <span class="poster-preview-status w98-kicker">
          {i18n.t(posterMakerStore.importedAssetId ? 'poster_status_ready' : 'poster_status_waiting')}
        </span>
      </div>
      <div class="poster-preview-body">
        <div class="poster-preview-stage w98-inset-panel">
          <canvas bind:this={previewCanvas} class="poster-canvas"></canvas>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .poster-maker-root {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--w98-space-8);
    padding: var(--w98-space-8);
    box-sizing: border-box;
    background: var(--w98-surface);
  }

  .poster-toolbar {
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .preset-group,
  .action-group {
    gap: var(--w98-space-6);
  }

  .toolbar-btn {
    white-space: nowrap;
  }

  .file-btn input {
    display: none;
  }

  .poster-layout {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: 260px minmax(0, 1fr);
    gap: var(--w98-space-8);
  }

  .poster-sidebar {
    display: flex;
    flex-direction: column;
    gap: var(--w98-space-8);
    min-width: 0;
  }

  .field {
    font-size: var(--w98-font-size-base);
  }

  .meta {
    font-size: var(--w98-font-size-base);
    line-height: 1.4;
    overflow-wrap: anywhere;
  }

  .recent-projects {
    display: flex;
    flex-direction: column;
    gap: var(--w98-space-6);
    min-height: 0;
  }

  .source-context {
    display: flex;
    flex-direction: column;
    gap: var(--w98-space-6);
    font-size: var(--w98-font-size-base);
  }

  .source-context-header {
    color: var(--w98-color-warning);
  }

  .source-context-line {
    overflow-wrap: anywhere;
  }

  .source-context-id {
    font-size: var(--w98-font-size-base);
    color: var(--w98-text-hint);
  }

  .source-context-btn {
    align-self: flex-start;
  }

  .recent-projects-header {
    color: var(--w98-highlight);
  }

  .recent-projects-list {
    display: flex;
    flex-direction: column;
    gap: var(--w98-space-6);
  }

  .recent-project-btn {
    padding: 6px 8px;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .recent-project-btn:disabled {
    color: var(--w98-text-disabled);
  }

  .recent-project-name {
    font-weight: bold;
    overflow-wrap: anywhere;
  }

  .recent-project-meta,
  .recent-projects-empty {
    font-size: var(--w98-font-size-caption);
    color: var(--w98-text-hint);
  }

  .poster-preview-shell {
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .poster-preview-titlebar {
    flex-shrink: 0;
  }

  .poster-preview-body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: var(--w98-space-8);
    background: var(--w98-surface);
  }

  .poster-preview-status {
    color: #fff;
    opacity: 0.85;
  }

  .poster-preview-stage {
    min-height: 0;
    height: 100%;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: auto;
    padding: var(--w98-space-12);
    background: var(--w98-surface-dim);
  }

  .poster-canvas {
    max-width: 100%;
    max-height: 100%;
    box-shadow: var(--w98-outset);
    background: var(--w98-surface-white);
  }

  @media (max-width: 760px) {
    .poster-toolbar {
      align-items: stretch;
    }

    .preset-group,
    .action-group {
      width: 100%;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .toolbar-btn,
    .file-btn {
      width: 100%;
      text-align: center;
    }

    .poster-layout {
      grid-template-columns: 1fr;
      grid-template-rows: auto minmax(0, 1fr);
    }

    .poster-preview-stage {
      padding: 10px;
    }

    .poster-canvas {
      width: 100%;
      height: auto;
      max-height: none;
    }
  }

  @media (max-width: 460px) {
    .poster-maker-root {
      padding: 6px;
      gap: 6px;
    }

    .preset-group,
    .action-group {
      grid-template-columns: 1fr;
      gap: 4px;
    }

    .poster-preview-stage {
      padding: 8px;
    }
  }
</style>
