<script lang="ts">
  /**
   * BatchProcessor — Batch process multiple images with current settings.
   * Drag & drop or browse to add images, then process all with one click.
   */

  import { processorService } from '$lib/services/imageProcessor';
  import { saveImage } from '$lib/services/saveService';
  import { i18n } from '$lib/i18n/index.svelte';
  import { getPaletteName } from '$lib/utils/palettes';
  import type { ProcessingSettings } from '$lib/types';
  import type { SaveFormat } from '$lib/services/saveService';

  let {
    settings,
    saveFormat = 'png' as SaveFormat,
    saveQuality = 0.92,
    onError,
    onItemClick,
  }: {
    settings: ProcessingSettings;
    saveFormat?: SaveFormat;
    saveQuality?: number;
    onError?: (msg: string) => void;
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

  const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/bmp', 'image/webp'];

  function addFiles(files: FileList | File[]) {
    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) continue;
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

  // ─── Process All ───
  async function processAll() {
    if (items.length === 0) return;
    isProcessingAll = true;

    for (let i = 0; i < items.length; i++) {
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
          items[i] = { ...items[i], status: 'done', resultUrl: result, progress: 1 };
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
  const DOWNLOAD_DELAY_MS = 300;

  async function saveAll() {
    const doneItems = items.filter(i => i.status === 'done' && i.resultUrl);
    if (doneItems.length === 0) {
      onError?.(i18n.t('no_processed'));
      return;
    }

    for (let i = 0; i < doneItems.length; i++) {
      const item = doneItems[i];
      try {
        // Strip extension from original filename for custom naming
        const baseName = item.name.replace(/\.[^.]+$/, '');
        await saveImage(item.resultUrl!, {
          format: saveFormat,
          quality: saveQuality,
          filename: `retro_${baseName}`,
        });
        // Delay between downloads so the browser processes each one
        if (i < doneItems.length - 1) {
          await new Promise(resolve => setTimeout(resolve, DOWNLOAD_DELAY_MS));
        }
      } catch (err) {
        console.error(`Failed to save ${item.name}:`, err);
      }
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
  <div class="batch-settings-info">
    <span><strong>{i18n.t('settings_applied')}:</strong> Pixel {settings.pixelSize}x · {getPaletteName(settings.palette)}</span>
    <span class="batch-settings-hint">{i18n.t('change_in_settings')}</span>
  </div>

  <!-- Drop zone / Add area -->
  <div
    class="batch-dropzone"
    class:dragging={isDragging}
    ondragenter={handleDragEnter}
    ondragover={(e) => e.preventDefault()}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
    role="button"
    tabindex="0"
  >
    {#if items.length === 0}
      <div class="batch-empty">
        <span class="batch-empty-icon">📦</span>
        <p>{i18n.t('drag_drop_multiple')}</p>
        <p class="batch-hint">{i18n.t('batch_empty_hint')}</p>
        <p class="batch-hint">{i18n.t('or')}</p>
        <input type="file" accept={ACCEPTED_TYPES.join(',')} multiple id="batch-upload" onchange={handleFileInput} style="display: none;" />
        <button class="batch-browse-btn" onclick={() => document.getElementById('batch-upload')?.click()}>📂 {i18n.t('browse')}</button>
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
                {#if item.status === 'pending'}⏳ {i18n.t('pending')}
                {:else if item.status === 'processing'}⚙️ {Math.round(item.progress * 100)}%
                {:else if item.status === 'done'}✅ {i18n.t('done')}
                {:else if item.status === 'error'}❌ {i18n.t('processing_failed')}
                {/if}
              </span>
              {#if item.status === 'processing'}
                <div class="batch-item-progress">
                  <div class="batch-item-progress-fill" style:width="{item.progress * 100}%"></div>
                </div>
              {/if}
            </div>
            <button
              class="batch-item-remove"
              onclick={(e) => { e.stopPropagation(); removeItem(item.id); }}
              title={i18n.t('remove')}
              aria-label="{i18n.t('remove')} {item.name}"
            >×</button>
          </div>
        {/each}
        <!-- Add more button -->
        <button class="batch-add-more" onclick={() => document.getElementById('batch-upload')?.click()}>
          ＋ {i18n.t('add')}
        </button>
      </div>
    {/if}
  </div>

  <!-- Controls -->
  <div class="batch-controls">
    {#if isProcessingAll}
      <div class="batch-overall-progress">
        <div class="batch-overall-bar">
          <div class="batch-overall-fill" style:width="{overallProgress}%"></div>
        </div>
        <span class="batch-overall-text">{overallProgress}% ({doneCount}/{items.length})</span>
      </div>
    {/if}
    <div class="batch-status">
      {items.length} {i18n.t('images')} · {doneCount} {i18n.t('done')}
      {#if errorCount > 0} · <span class="error-text">{errorCount} {i18n.t('errors')}</span>{/if}
      {#if processingCount > 0} · ⚙️ {processingCount} {i18n.t('processing')}{/if}
    </div>
    <div class="batch-actions">
      <button onclick={processAll} disabled={items.length === 0 || isProcessingAll}>
        {isProcessingAll ? `⚙️ ${overallProgress}%` : '▶️ ' + i18n.t('process_all')}
      </button>
      <button onclick={saveAll} disabled={doneCount === 0}>
        💾 {i18n.t('save_all')}
      </button>
      <button onclick={clearAll} disabled={items.length === 0}>
        🗑️ {i18n.t('clear')}
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
    padding: 4px 6px;
    background: var(--w98-highlight);
    color: #fff;
    font-size: var(--w98-font-size-base);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .batch-settings-hint {
    color: #aaa;
    font-size: var(--w98-font-size-caption);
  }

  .batch-dropzone {
    flex: 1;
    overflow-y: auto;
    border: 2px dashed var(--w98-shadow-808);
    margin: 4px;
    background: #fff;
    transition: all 0.2s;
    min-height: 0;
  }
  .batch-dropzone.dragging {
    background: #d0d8e0;
    border-color: var(--w98-highlight);
  }

  .batch-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 4px;
    color: #555;
  }
  .batch-empty-icon { font-size: 32px; }
  .batch-hint { font-size: var(--w98-font-size-sm); color: #999; margin: 0; }
  .batch-browse-btn { font-weight: bold; padding: 4px 12px; }

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
    background: var(--w98-surface-subtle);
    border: 1px solid var(--w98-shadow-light);
    cursor: pointer;
  }
  .batch-item:hover { background: var(--w98-surface-hover); border-color: var(--w98-highlight); }
  .batch-item.item-done { border-color: var(--w98-color-success-border); background: var(--w98-color-success-light); }
  .batch-item.item-error { border-color: var(--w98-color-error-border); background: var(--w98-color-error-light); }
  .batch-item.item-processing { border-color: #44a; background: #f0f0f8; }

  .batch-thumb {
    width: 36px;
    height: 36px;
    object-fit: cover;
    border: 1px solid #ddd;
    flex-shrink: 0;
    image-rendering: auto;
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
    font-weight: 500;
  }
  .batch-item-status {
    font-size: var(--w98-font-size-caption);
    color: #666;
  }
  .batch-item-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: #ddd;
  }
  .batch-item-progress-fill {
    height: 100%;
    background: var(--w98-highlight);
    transition: width 0.15s ease;
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
    font-weight: bold;
    background: var(--w98-surface);
    border: none;
    cursor: pointer;
    box-shadow: inset 1px 1px var(--w98-shadow-white), inset -1px -1px var(--w98-shadow-808);
    min-width: 0;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .batch-item-remove:hover { background: #d0d0d0; }

  .batch-add-more {
    width: 100%;
    padding: 6px;
    font-size: var(--w98-font-size-base);
    cursor: pointer;
    color: #555;
  }

  /* Controls */
  .batch-controls {
    padding: 4px;
    border-top: 1px solid var(--w98-shadow-808);
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex-shrink: 0;
  }
  .batch-overall-progress {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .batch-overall-bar {
    flex: 1;
    height: 12px;
    background: #000;
    border: 2px inset var(--w98-shadow-light);
    position: relative;
    overflow: hidden;
  }
  .batch-overall-fill {
    height: 100%;
    background: repeating-linear-gradient(
      90deg,
      var(--w98-highlight) 0px, var(--w98-highlight) 8px,
      #0000a0 8px, #0000a0 10px
    );
    transition: width 0.2s ease;
  }
  .batch-overall-text {
    font-size: var(--w98-font-size-sm);
    font-weight: bold;
    color: var(--w98-highlight);
    white-space: nowrap;
    font-family: 'Courier New', monospace;
  }
  .batch-status {
    font-size: var(--w98-font-size-sm);
    color: #444;
  }
  .error-text { color: var(--w98-color-error); }
  .batch-actions {
    display: flex;
    gap: 4px;
  }
  .batch-actions button {
    flex: 1;
    padding: 3px 6px;
    font-size: var(--w98-font-size-sm);
    font-weight: bold;
  }
  .batch-actions button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 550px) {
    .batch-browse-btn {
      padding: 10px 24px;
      font-size: var(--w98-font-size-icon);
    }
    .batch-actions button {
      padding: 8px 6px;
      font-size: var(--w98-font-size-action);
    }
  }
</style>
