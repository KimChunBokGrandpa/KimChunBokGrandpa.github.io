<script lang="ts">
  /**
   * BatchProcessor — Batch process multiple images with current settings.
   * Drag & drop or browse to add images, then process all with one click.
   */

  import { processorService } from '$lib/services/imageProcessor';
  import { saveImage, shareImageFiles } from '$lib/services/saveService';
  import { i18n } from '$lib/i18n/index.svelte';
  import { getPaletteName } from '$lib/utils/palettes';
  import type { ProcessingSettings } from '$lib/types';
  import type { SaveFormat } from '$lib/services/saveService';

  let {
    settings,
    saveFormat = 'png' as SaveFormat,
    saveQuality = 0.92,
    onError,
    onMessage,
    onItemClick,
  }: {
    settings: ProcessingSettings;
    saveFormat?: SaveFormat;
    saveQuality?: number;
    onError?: (msg: string) => void;
    onMessage?: (msg: string) => void;
    onItemClick?: (file: File) => void;
  } = $props();

  interface BatchItem {
    id: string;
    file: File;
    name: string;
    thumbnailUrl: string;
    status: 'pending' | 'processing' | 'done' | 'error';
    resultUrl: string | null;
    error: string | null;
    progress: number; // 0–1
  }

  let items = $state<BatchItem[]>([]);
  let isDragging = $state(false);
  let isProcessingAll = $state(false);
  let isSharingAll = $state(false);
  let isPaused = $state(false);
  let batchFileInput = $state<HTMLInputElement | null>(null);

  const acceptedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/bmp', 'image/webp'];

  function addFiles(files: FileList | File[]) {
    for (const file of files) {
      if (!acceptedTypes.includes(file.type)) continue;
      const item: BatchItem = {
        id: crypto.randomUUID(),
        file,
        name: file.name,
        thumbnailUrl: URL.createObjectURL(file),
        status: 'pending',
        resultUrl: null,
        error: null,
        progress: 0,
      };
      items = [...items, item];
    }
  }

  function removeItem(id: string) {
    const item = items.find(i => i.id === id);
    if (item) {
      URL.revokeObjectURL(item.thumbnailUrl);
      if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
    }
    items = items.filter(i => i.id !== id);
  }

  function clearAll() {
    for (const item of items) {
      URL.revokeObjectURL(item.thumbnailUrl);
      if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
    }
    items = [];
  }

  // ─── Drag & Drop ───
  function handleDragEnter(e: DragEvent) { e.preventDefault(); isDragging = true; }
  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    if (e.currentTarget && (e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) return;
    isDragging = false;
  }
  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
    if (e.dataTransfer?.files) addFiles(e.dataTransfer.files);
  }
  function handleFileInput(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files) addFiles(input.files);
    input.value = '';
  }

  function togglePause() {
    isPaused = !isPaused;
  }

  function openBatchPicker() {
    batchFileInput?.click();
  }

  /** Wait until unpaused */
  function waitForResume(): Promise<void> {
    return new Promise(resolve => {
      const check = () => {
        if (!isPaused) { resolve(); return; }
        setTimeout(check, 200);
      };
      check();
    });
  }

  // ─── Process All ───
  async function processAll() {
    if (items.length === 0) return;
    isProcessingAll = true;
    isPaused = false;

    for (let i = 0; i < items.length; i++) {
      // Wait if paused before starting next item
      if (isPaused) await waitForResume();
      if (!isProcessingAll) break; // stopped

      const item = items[i];
      if (item.status === 'done') continue;

      items[i] = { ...item, status: 'processing', error: null, progress: 0 };

      try {
        const src = item.thumbnailUrl;
        const itemId = item.id; // capture stable id for closure
        const result = await processorService.processImage(
          src,
          settings,
          undefined, // onDimensionCapped
          (progress) => {
            const idx = items.findIndex(it => it.id === itemId);
            if (idx !== -1) items[idx] = { ...items[idx], progress };
          },
        );
        if (result) {
          // Clone blob URL so the service's replaceBlobUrl() won't revoke it
          // on the next processImage call
          const resp = await fetch(result);
          const blob = await resp.blob();
          const ownedUrl = URL.createObjectURL(blob);
          items[i] = { ...items[i], status: 'done', resultUrl: ownedUrl, progress: 1 };
        } else {
          items[i] = { ...items[i], status: 'error', error: i18n.t('batch_processing_null') };
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : i18n.t('batch_unknown_error');
        items[i] = { ...items[i], status: 'error', error: msg };
      }
    }

    isProcessingAll = false;
  }

  // ─── Save All ───
  /** Delay between downloads to prevent browser throttling of rapid a.click() */
  const downloadDelayMs = 500;

  function createBatchFilenameBuilder() {
    const seen = new Map<string, number>();
    return (name: string) => {
      const baseName = name.replace(/\.[^.]+$/, '');
      const nextCount = (seen.get(baseName) ?? 0) + 1;
      seen.set(baseName, nextCount);
      return nextCount === 1 ? `retro_${baseName}` : `retro_${baseName}_${nextCount}`;
    };
  }

  async function saveAll() {
    const doneItems = items.filter(i => i.status === 'done' && i.resultUrl);
    if (doneItems.length === 0) {
      onError?.(i18n.t('no_processed'));
      return;
    }

    const buildFilename = createBatchFilenameBuilder();
    for (let i = 0; i < doneItems.length; i++) {
      const item = doneItems[i];
      try {
        await saveImage(item.resultUrl!, {
          format: saveFormat,
          quality: saveQuality,
          filename: buildFilename(item.name),
        });
        // Delay between downloads so the browser processes each one
        if (i < doneItems.length - 1) {
          await new Promise(resolve => setTimeout(resolve, downloadDelayMs));
        }
      } catch (err) {
        console.error(`Failed to save ${item.name}:`, err);
      }
    }
  }

  async function shareAll() {
    const doneItems = items.filter(i => i.status === 'done' && i.resultUrl);
    if (doneItems.length === 0) {
      onError?.(i18n.t('no_processed'));
      return;
    }

    isSharingAll = true;
    try {
      const buildFilename = createBatchFilenameBuilder();
      const message = await shareImageFiles(
        doneItems.map((item) => ({
          processedImageSrc: item.resultUrl!,
          filename: buildFilename(item.name),
        })),
        {
          format: saveFormat,
          quality: saveQuality,
        },
      );
      if (!message) return;
      onMessage?.(message);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : i18n.t('save_error'));
    } finally {
      isSharingAll = false;
    }
  }

  // Cleanup blob URLs on component unmount
  $effect(() => {
    return () => {
      for (const item of items) {
        URL.revokeObjectURL(item.thumbnailUrl);
        if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
      }
    };
  });

  let doneCount = $derived(items.filter(i => i.status === 'done').length);
  let errorCount = $derived(items.filter(i => i.status === 'error').length);
  let processingCount = $derived(items.filter(i => i.status === 'processing').length);

  // Overall batch progress (0–100)
  let overallProgress = $derived.by(() => {
    if (items.length === 0) return 0;
    const total = items.reduce((sum, item) => {
      if (item.status === 'done') return sum + 1;
      if (item.status === 'processing') return sum + item.progress;
      return sum;
    }, 0);
    return Math.round((total / items.length) * 100);
  });
</script>

<div class="batch-root">
  <!-- Settings Info -->
  <div class="batch-settings-info w98-toolbar">
    <div class="batch-settings-copy">
      <span class="w98-toolbar-label">
        <span class="w98-emoji" aria-hidden="true">📦</span>
        <span>{i18n.t('settings_applied')}</span>
      </span>
      <span class="batch-settings-value">{i18n.t('pixel_size')}: {settings.pixelSize}px · {getPaletteName(settings.palette)}</span>
    </div>
    <span class="batch-settings-hint w98-quiet-copy">{i18n.t('change_in_settings')}</span>
  </div>

  <!-- Drop zone / Add area -->
  <div
    class="batch-dropzone w98-inset-panel"
    class:dragging={isDragging}
    ondragenter={handleDragEnter}
    ondragover={(e) => e.preventDefault()}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
    role="button"
    tabindex="0"
    onkeydown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openBatchPicker();
      }
    }}
  >
    <input bind:this={batchFileInput} type="file" accept={acceptedTypes.join(',')} multiple id="batch-upload" onchange={handleFileInput} style="display: none;" />
    {#if items.length === 0}
      <div class="batch-empty">
        <span class="batch-empty-icon w98-emoji">📦</span>
        <p>{i18n.t('drag_drop_multiple')}</p>
        <p class="batch-hint w98-quiet-copy">{i18n.t('batch_empty_hint')}</p>
        <p class="batch-hint w98-kicker">{i18n.t('or')}</p>
        <button class="batch-browse-btn w98-button w98-button--primary" onclick={openBatchPicker}>
          <span class="w98-emoji" aria-hidden="true">📂</span>
          <span>{i18n.t('browse')}</span>
        </button>
      </div>
    {:else}
      <!-- Items grid -->
      <div class="batch-grid">
        {#each items as item (item.id)}
          <div
            class="batch-item"
            class:item-done={item.status === 'done'}
            class:item-error={item.status === 'error'}
            class:item-processing={item.status === 'processing'}
            onclick={() => onItemClick?.(item.file)}
            onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onItemClick?.(item.file); } }}
            role="button"
            tabindex="0"
          >
            <img src={item.thumbnailUrl} alt={item.name} class="batch-thumb" draggable="false" />
            <div class="batch-item-info">
              <span class="batch-item-name">{item.name}</span>
              <span class="batch-item-status">
                {#if item.status === 'pending'}
                  <span class="w98-emoji" aria-hidden="true">⏳</span>
                  <span>{i18n.t('pending')}</span>
                {:else if item.status === 'processing'}
                  <span class="w98-emoji" aria-hidden="true">⚙️</span>
                  <span>{Math.round(item.progress * 100)}%</span>
                {:else if item.status === 'done'}
                  <span class="w98-emoji" aria-hidden="true">ℹ️</span>
                  <span>{i18n.t('done')}</span>
                {:else if item.status === 'error'}
                  <span class="w98-emoji" aria-hidden="true">⚠️</span>
                  <span>{i18n.t('processing_failed')}</span>
                {/if}
              </span>
              {#if item.status === 'processing'}
                <div class="batch-item-progress">
                  <div class="batch-item-progress-fill" style:width="{item.progress * 100}%"></div>
                </div>
              {/if}
            </div>
            <button
              class="batch-item-remove w98-inline-button w98-button--thin"
              onclick={(e) => { e.stopPropagation(); removeItem(item.id); }}
              title={i18n.t('remove')}
              aria-label={`${i18n.t('remove')} ${item.name}`}
            >
              <span class="w98-structural-glyph" aria-hidden="true">✕</span>
            </button>
          </div>
        {/each}
        <!-- Add more button -->
        <button class="batch-add-more w98-button w98-button--thin" onclick={openBatchPicker}>
          <span class="w98-structural-glyph" aria-hidden="true">＋</span>
          <span>{i18n.t('add')}</span>
        </button>
      </div>
    {/if}
  </div>

  <!-- Controls -->
  <div class="batch-controls w98-toolbar">
    {#if isProcessingAll}
      <div class="batch-overall-progress">
        <div class="batch-overall-bar w98-progress-track">
          <div class="batch-overall-fill w98-progress-fill" style:width="{overallProgress}%"></div>
        </div>
        <span class="batch-overall-text">{overallProgress}% ({doneCount}/{items.length})</span>
      </div>
    {/if}
    <div class="batch-status">
      {items.length} {i18n.t('images')} · {doneCount} {i18n.t('done')}
      {#if errorCount > 0} · <span class="error-text">{errorCount} {i18n.t('errors')}</span>{/if}
      {#if processingCount > 0}
        ·
        <span class="w98-emoji" aria-hidden="true">⚙️</span>
        {processingCount} {i18n.t('processing')}
      {/if}
    </div>
    <div class="batch-actions">
      {#if isProcessingAll}
        <button class="w98-inline-button w98-button--thin" onclick={togglePause}>
          <span class="w98-structural-glyph" aria-hidden="true">{isPaused ? '▶' : '⏸'}</span>
          <span>{isPaused ? i18n.t('resume') : i18n.t('pause')}</span>
        </button>
        <button class="w98-inline-button w98-button--thin" onclick={() => { isProcessingAll = false; isPaused = false; }}>
          <span class="w98-structural-glyph" aria-hidden="true">⏹</span>
          <span>{i18n.t('stop')}</span>
        </button>
      {:else}
        <button class="w98-button" onclick={processAll} disabled={items.length === 0}>
          <span class="w98-structural-glyph" aria-hidden="true">▶</span>
          <span>{i18n.t('process_all')}</span>
        </button>
      {/if}
      <button class="w98-inline-button w98-button--thin" onclick={saveAll} disabled={doneCount === 0 || isSharingAll}>
        <span class="w98-emoji" aria-hidden="true">💾</span>
        <span>{i18n.t('save_all')}</span>
      </button>
      <button class="w98-inline-button w98-button--thin" onclick={shareAll} disabled={doneCount === 0 || isSharingAll}>
        <span class="w98-emoji" aria-hidden="true">📤</span>
        <span>{i18n.t('share_all')}</span>
      </button>
      <button class="w98-inline-button w98-button--thin" onclick={clearAll} disabled={items.length === 0 || isProcessingAll}>
        <span class="w98-structural-glyph" aria-hidden="true">✕</span>
        <span>{i18n.t('clear')}</span>
      </button>
    </div>
  </div>
</div>

<style>
  .batch-root {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    font-size: var(--w98-font-size-base);
    background: var(--w98-surface);
  }

  /* Settings Info */
  .batch-settings-info {
    justify-content: space-between;
    flex-wrap: wrap;
  }
  .batch-settings-copy {
    display: flex;
    align-items: center;
    gap: var(--w98-space-6);
    min-width: 0;
    flex-wrap: wrap;
  }
  .batch-settings-value {
    color: var(--w98-text);
  }
  .batch-settings-hint {
    font-size: var(--w98-font-size-caption);
  }

  .batch-dropzone {
    flex: 1;
    overflow-y: auto;
    border: 2px dashed var(--w98-shadow-808);
    margin: var(--w98-space-4);
    min-height: 0;
    padding: var(--w98-space-8);
  }
  .batch-dropzone.dragging {
    background: var(--w98-highlight-alpha);
    border-color: var(--w98-highlight);
    box-shadow: var(--w98-inset-thin);
  }

  .batch-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 4px;
  }
  .batch-empty-icon { font-size: 32px; }
  .batch-hint { font-size: var(--w98-font-size-sm); margin: 0; }
  .batch-browse-btn { min-width: 110px; }

  /* Grid */
  .batch-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 4px;
    align-content: flex-start;
  }

  .batch-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 3px 4px;
    background: var(--w98-surface);
    box-shadow: var(--w98-outset-thin);
    cursor: pointer;
  }
  .batch-item:hover { background: var(--w98-surface-active); }
  .batch-item.item-done { background: var(--w98-color-success-light); }
  .batch-item.item-error { background: var(--w98-color-error-light); }
  .batch-item.item-processing {
    background: var(--w98-surface-active);
    box-shadow: var(--w98-inset-thin);
  }

  .batch-thumb {
    width: 36px;
    height: 36px;
    object-fit: cover;
    box-shadow: var(--w98-inset-thin);
    flex-shrink: 0;
    background: var(--w98-surface-white);
    image-rendering: pixelated;
  }

  .batch-item-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .batch-item-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: bold;
  }
  .batch-item-status {
    font-size: var(--w98-font-size-caption);
    color: var(--w98-text-secondary);
  }
  .batch-item-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--w98-surface-white);
    box-shadow: var(--w98-inset-thin);
  }
  .batch-item-progress-fill {
    height: 100%;
  }
  .batch-item-remove {
    min-width: 16px;
  }
  .batch-item-remove {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 16px;
    height: 16px;
    padding: 0;
    font-size: var(--w98-font-size-base);
    line-height: 1;
    min-height: 16px;
  }

  .batch-add-more {
    width: 100%;
    justify-content: center;
  }

  /* Controls */
  .batch-controls {
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--w98-space-6);
  }
  .batch-overall-progress {
    display: flex;
    align-items: center;
    gap: var(--w98-space-6);
    min-width: min(240px, 100%);
    flex: 1 1 240px;
  }
  .batch-overall-bar {
    flex: 1;
    height: 14px;
  }
  .batch-overall-text {
    font-size: var(--w98-font-size-caption);
    font-weight: bold;
    white-space: nowrap;
    min-width: 54px;
    text-align: right;
  }
  .batch-status {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--w98-space-2);
    font-size: var(--w98-font-size-caption);
  }
  .error-text { color: var(--w98-color-error); }
  .batch-actions {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  @media (max-width: 550px) {
    .batch-settings-info {
      align-items: stretch;
    }
    .batch-overall-progress {
      min-width: 100%;
    }
    .batch-actions {
      width: 100%;
      justify-content: stretch;
    }
    .batch-actions :global(button) {
      flex: 1 1 0;
    }
  }
</style>
