<script lang="ts">
  /**
   * BatchProcessor — Batch process multiple images with current settings.
   * Drag & drop or browse to add images, then process all with one click.
   */

  import { processorService } from '$lib/utils/imageProcessor';
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

      items[i] = { ...item, status: 'processing', error: null };

      try {
        const src = item.thumbnailUrl;
        const result = await processorService.processImage(src, settings);
        if (result) {
          items[i] = { ...items[i], status: 'done', resultUrl: result };
        } else {
          items[i] = { ...items[i], status: 'error', error: 'Processing returned null' };
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        items[i] = { ...items[i], status: 'error', error: msg };
      }
    }

    isProcessingAll = false;
  }

  // ─── Save All ───
  async function saveAll() {
    const doneItems = items.filter(i => i.status === 'done' && i.resultUrl);
    if (doneItems.length === 0) {
      onError?.('No processed images to save.');
      return;
    }

    for (const item of doneItems) {
      try {
        await saveImage(item.resultUrl!, { format: saveFormat, quality: saveQuality });
      } catch (err) {
        console.error(`Failed to save ${item.name}:`, err);
      }
    }
  }

  let doneCount = $derived(items.filter(i => i.status === 'done').length);
  let errorCount = $derived(items.filter(i => i.status === 'error').length);
  let processingCount = $derived(items.filter(i => i.status === 'processing').length);
</script>

<div class="batch-root">
  <!-- Settings Info -->
  <div class="batch-settings-info">
    <span><strong>Settings applied:</strong> Pixel {settings.pixelSize}x · {getPaletteName(settings.palette)}</span>
    <span class="batch-settings-hint">(Change in Settings window)</span>
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
        <p>Drag & Drop multiple images here</p>
        <p class="batch-hint">or</p>
        <input type="file" accept={ACCEPTED_TYPES.join(',')} multiple id="batch-upload" onchange={handleFileInput} style="display: none;" />
        <button class="batch-browse-btn" onclick={() => document.getElementById('batch-upload')?.click()}>📂 Browse...</button>
      </div>
    {:else}
      <!-- Items grid -->
      <div class="batch-grid">
        {#each items as item (item.id)}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_interactive_supports_focus -->
          <div
            class="batch-item"
            class:item-done={item.status === 'done'}
            class:item-error={item.status === 'error'}
            class:item-processing={item.status === 'processing'}
            onclick={() => onItemClick?.(item.file)}
            role="button"
          >
            <img src={item.thumbnailUrl} alt={item.name} class="batch-thumb" draggable="false" />
            <div class="batch-item-info">
              <span class="batch-item-name">{item.name}</span>
              <span class="batch-item-status">
                {#if item.status === 'pending'}⏳ Pending
                {:else if item.status === 'processing'}⚙️ Processing...
                {:else if item.status === 'done'}✅ Done
                {:else if item.status === 'error'}❌ {item.error}
                {/if}
              </span>
            </div>
            <button
              class="batch-item-remove"
              onclick={(e) => { e.stopPropagation(); removeItem(item.id); }}
              title="Remove"
              aria-label="Remove {item.name}"
            >×</button>
          </div>
        {/each}
        <!-- Add more button -->
        <button class="batch-add-more" onclick={() => document.getElementById('batch-upload')?.click()}>
          ＋ Add
        </button>
      </div>
    {/if}
  </div>

  <!-- Controls -->
  <div class="batch-controls">
    <div class="batch-status">
      {items.length} image(s) · {doneCount} done
      {#if errorCount > 0} · <span class="error-text">{errorCount} error(s)</span>{/if}
      {#if processingCount > 0} · ⚙️ {processingCount} processing{/if}
    </div>
    <div class="batch-actions">
      <button onclick={processAll} disabled={items.length === 0 || isProcessingAll}>
        {isProcessingAll ? '⚙️ Processing...' : '▶️ Process All'}
      </button>
      <button onclick={saveAll} disabled={doneCount === 0}>
        💾 Save All
      </button>
      <button onclick={clearAll} disabled={items.length === 0}>
        🗑️ Clear
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
    font-size: 11px;
    background: #c0c0c0;
  }

  /* Settings Info */
  .batch-settings-info {
    padding: 4px 6px;
    background: #000080;
    color: #fff;
    font-size: 11px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .batch-settings-hint {
    color: #aaa;
    font-size: 9px;
  }

  .batch-dropzone {
    flex: 1;
    overflow-y: auto;
    border: 2px dashed #808080;
    margin: 4px;
    background: #fff;
    transition: all 0.2s;
    min-height: 0;
  }
  .batch-dropzone.dragging {
    background: #d0d8e0;
    border-color: #000080;
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
  .batch-hint { font-size: 10px; color: #999; margin: 0; }
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
    background: #f8f8f8;
    border: 1px solid #ccc;
    cursor: pointer;
  }
  .batch-item:hover { background: #e0e8f0; border-color: #000080; }
  .batch-item.item-done { border-color: #4a4; background: #f0f8f0; }
  .batch-item.item-error { border-color: #a44; background: #f8f0f0; }
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
    font-size: 9px;
    color: #666;
  }
  .batch-item-remove {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 16px;
    height: 16px;
    padding: 0;
    font-size: 11px;
    line-height: 1;
    font-weight: bold;
    background: #c0c0c0;
    border: none;
    cursor: pointer;
    box-shadow: inset 1px 1px #fff, inset -1px -1px #808080;
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
    font-size: 11px;
    cursor: pointer;
    color: #555;
  }

  /* Controls */
  .batch-controls {
    padding: 4px;
    border-top: 1px solid #808080;
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex-shrink: 0;
  }
  .batch-status {
    font-size: 10px;
    color: #444;
  }
  .error-text { color: #a00; }
  .batch-actions {
    display: flex;
    gap: 4px;
  }
  .batch-actions button {
    flex: 1;
    padding: 3px 6px;
    font-size: 10px;
    font-weight: bold;
  }
  .batch-actions button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
