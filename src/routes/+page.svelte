<script lang="ts">
  import { onDestroy } from 'svelte';
  import Win98Window from '$lib/components/Win98Window.svelte';
  import ImageDropZone from '$lib/components/ImageDropZone.svelte';
  import ControlPanel from '$lib/components/ControlPanel.svelte';
  import CrtDisplay from '$lib/components/CrtDisplay.svelte';
  import Taskbar from '$lib/components/Taskbar.svelte';
  import PaletteGallery from '$lib/components/PaletteGallery.svelte';
  import MessageDialog from '$lib/components/MessageDialog.svelte';
  import { processorService } from '$lib/utils/imageProcessor';
  import { createWindowStore, WINDOW_CONFIGS } from '$lib/stores/windowStore.svelte';
  import type { TaskbarWindowInfo } from '$lib/components/Taskbar.svelte';
  import type { ProcessingSettings } from '$lib/types';

  // Tauri 환경 검증
  const isTauri = typeof window !== 'undefined' && !!(window as any).__TAURI__;

  // ─── Window Manager ───
  const wm = createWindowStore();

  // ─── Image & Processing State ───
  let originalImageSrc: string | null = $state(null);
  let currentObjectUrl: string | null = null;
  let processedImageSrc: string | null = $state(null);
  let isProcessing = $state(false);
  let processingSettings = $state<ProcessingSettings>({
    pixelSize: 1,
    palette: 'original',
    crtEffect: false,
    glitchFilters: [],
    renderMode: 'pixel_perfect'
  });

  // ─── Dialog State ───
  let dialogMessage: string | null = $state(null);
  let dialogTitle = $state('Message');

  // ─── Desktop icon selection ───
  let selectedIcon = $state<string | null>(null);

  // ─── Mobile detection ───
  const isMobile = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  // ─── Zoom & Pan State ───
  let zoomLevel = $state(1);
  let panX = $state(0);
  let panY = $state(0);
  let isPanning = $state(false);
  let panStartX = 0;
  let panStartY = 0;

  // ─── Touch State ───
  let lastTouchDist = 0;
  let lastTouchCenter = { x: 0, y: 0 };
  let isTouchPanning = $state(false);

  // ─── Preview container & image refs ───
  let previewContainer: HTMLDivElement | undefined = $state();
  let previewImg: HTMLImageElement | undefined = $state();

  // ─── Dimension cap notification (show only once per image) ───
  let dimensionCapShown = false;

  // ─── Mobile split layout ───
  const WINDOW_ORDER = ['settings', 'preview', 'gallery'] as const;
  let mobileVisibleIds = $derived(
    WINDOW_ORDER.filter(id => wm.wins[id].mode !== 'closed' && wm.wins[id].mode !== 'minimized')
  );

  function getMobileSlot(id: string): { top: string; height: string } | null {
    if (!isMobile) return null;
    const idx = mobileVisibleIds.indexOf(id as typeof WINDOW_ORDER[number]);
    if (idx === -1) return null;
    const count = mobileVisibleIds.length;
    const heightPct = 100 / count;
    return {
      top: `${idx * heightPct}%`,
      height: `${heightPct}%`,
    };
  }

  // ─── Taskbar window info ───
  let taskbarWindows = $derived<TaskbarWindowInfo[]>(
    WINDOW_CONFIGS.map(c => ({
      id: c.id,
      title: c.title,
      icon: c.icon,
      mode: wm.wins[c.id].mode,
      focused: wm.focusedWindow === c.id,
    }))
  );

  // ─── Processing Logic ───
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function handleImageSelected(file: File) {
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      processorService.clearImageCache();
    }
    currentObjectUrl = URL.createObjectURL(file);
    originalImageSrc = currentObjectUrl;
    dimensionCapShown = false;
    processImmediate();
    wm.openWindow('preview');
  }

  function handleSettingsChange(newSettings: ProcessingSettings) {
    processingSettings = { ...newSettings };
    applyProcessingDebounced();
  }

  function handleDimensionCapped(original: { w: number; h: number }, capped: { w: number; h: number }) {
    if (dimensionCapShown) return;
    dimensionCapShown = true;
    showDialog(
      `Image resized: ${original.w}×${original.h} → ${capped.w}×${capped.h}px (max 2048px)`,
      'Image Resized'
    );
  }

  async function processImmediate() {
    if (!originalImageSrc) return;
    if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
    isProcessing = true;
    try {
      const result = await processorService.processImage(originalImageSrc, processingSettings, handleDimensionCapped);
      if (result !== null) processedImageSrc = result;
    } catch (err) { console.error(err); }
    finally { isProcessing = false; }
  }

  function applyProcessingDebounced() {
    if (!originalImageSrc) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    isProcessing = true;
    debounceTimer = setTimeout(async () => {
      debounceTimer = null;
      try {
        const result = await processorService.processImage(originalImageSrc!, processingSettings, handleDimensionCapped);
        if (result !== null) processedImageSrc = result;
      } catch (err) { console.error(err); }
      finally { isProcessing = false; }
    }, 150);
  }

  function handleGallerySelect(paletteId: string) {
    processingSettings.palette = paletteId;
    processImmediate();
    wm.close('gallery');
  }

  function showDialog(message: string, title = 'Retro Pixel Converter') {
    dialogMessage = message;
    dialogTitle = title;
  }

  async function handleSave() {
    if (!processedImageSrc) return;
    try {
      // Load image into canvas to get raw blob data (avoids blob: URL fetch issues in Tauri)
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const blobData = await new Promise<Blob>((resolve, reject) => {
        img.onload = () => {
          const c = document.createElement('canvas');
          c.width = img.naturalWidth;
          c.height = img.naturalHeight;
          const ctx = c.getContext('2d')!;
          ctx.drawImage(img, 0, 0);
          c.toBlob(blob => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create blob'));
          }, 'image/png');
        };
        img.onerror = () => reject(new Error('Failed to load image for save'));
        img.src = processedImageSrc!;
      });

      if (isTauri) {
        const { save } = await import('@tauri-apps/plugin-dialog');
        const { writeFile } = await import('@tauri-apps/plugin-fs');
        const filePath = await save({
          filters: [{ name: 'Image', extensions: ['png'] }],
          defaultPath: `retro_pixel_${Date.now()}.png`
        });
        if (filePath) {
          const arrayBuffer = await blobData.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          await writeFile(filePath, bytes);
          showDialog('File saved successfully!');
        }
      } else {
        const url = URL.createObjectURL(blobData);
        const a = document.createElement('a');
        a.href = url;
        a.download = `retro_pixel_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showDialog('Image downloaded successfully!');
      }
    } catch (err) {
      console.error('Failed to save file:', err);
      showDialog('Error saving file. Please try again.', 'Error');
    }
  }

  function handleLoadNewImage() {
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = null;
      processorService.clearImageCache();
    }
    originalImageSrc = null;
    processedImageSrc = null;
  }

  function handleIconClick(id: string) {
    if (isMobile) {
      // 모바일: 싱글 탭으로 바로 열기 (분할화면으로 자동 배치)
      selectedIcon = null;
      wm.openWindow(id);
    } else {
      selectedIcon = id;
    }
  }
  function handleIconDblClick(id: string) { selectedIcon = null; wm.openWindow(id); }
  function handleDesktopClick() { selectedIcon = null; }

  // ─── Zoom & Pan Handlers (Mouse) ───
  function handlePreviewWheel(e: WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    zoomLevel = Math.min(8, Math.max(0.25, zoomLevel + delta));
    if (zoomLevel <= 1) { panX = 0; panY = 0; }
  }

  function handlePreviewMouseDown(e: MouseEvent) {
    if (zoomLevel <= 1 || e.button !== 0) return;
    isPanning = true;
    panStartX = e.clientX - panX;
    panStartY = e.clientY - panY;
    e.preventDefault();
  }

  function handlePreviewMouseMove(e: MouseEvent) {
    if (!isPanning) return;
    panX = e.clientX - panStartX;
    panY = e.clientY - panStartY;
  }

  function handlePreviewMouseUp() { isPanning = false; }

  // ─── Touch Handlers (Pinch Zoom + Pan) ───
  function handleTouchStart(e: TouchEvent) {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist = Math.hypot(dx, dy);
      lastTouchCenter = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
      isTouchPanning = false;
    } else if (e.touches.length === 1 && zoomLevel > 1) {
      isTouchPanning = true;
      panStartX = e.touches[0].clientX - panX;
      panStartY = e.touches[0].clientY - panY;
    }
  }

  function handleTouchMove(e: TouchEvent) {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (lastTouchDist > 0) {
        const scale = dist / lastTouchDist;
        zoomLevel = Math.min(8, Math.max(0.25, zoomLevel * scale));
        if (zoomLevel <= 1) { panX = 0; panY = 0; }
      }
      lastTouchDist = dist;
    } else if (e.touches.length === 1 && isTouchPanning) {
      panX = e.touches[0].clientX - panStartX;
      panY = e.touches[0].clientY - panStartY;
    }
  }

  function handleTouchEnd(e: TouchEvent) {
    if (e.touches.length < 2) {
      lastTouchDist = 0;
    }
    if (e.touches.length === 0) {
      isTouchPanning = false;
    }
  }

  function resetZoom() { zoomLevel = 1; panX = 0; panY = 0; }
  function zoomToFit() {
    if (previewContainer && previewImg && previewImg.naturalWidth > 0) {
      const containerW = previewContainer.clientWidth;
      const containerH = previewContainer.clientHeight;
      const imgW = previewImg.naturalWidth;
      const imgH = previewImg.naturalHeight;
      zoomLevel = Math.min(containerW / imgW, containerH / imgH, 8);
    } else {
      zoomLevel = 1;
    }
    panX = 0;
    panY = 0;
  }
  function zoomIn() { zoomLevel = Math.min(8, zoomLevel + 0.5); }
  function zoomOut() {
    zoomLevel = Math.max(0.25, zoomLevel - 0.5);
    if (zoomLevel <= 1) { panX = 0; panY = 0; }
  }

  onDestroy(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
    processorService.destroy();
  });
</script>

<!-- ═══ Desktop ═══ -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="desktop" onclick={handleDesktopClick}>

  <!-- Desktop Icons -->
  <div class="desktop-icons" role="toolbar" aria-label="Desktop shortcuts">
    {#each WINDOW_CONFIGS as cfg}
      <button
        class="desktop-icon"
        class:icon-selected={selectedIcon === cfg.id}
        onclick={(e) => { e.stopPropagation(); handleIconClick(cfg.id); }}
        ondblclick={() => handleIconDblClick(cfg.id)}
        aria-label="Open {cfg.title}"
      >
        <span class="icon-img" aria-hidden="true">{cfg.icon}</span>
        <span class="icon-label">{cfg.title}</span>
      </button>
    {/each}
  </div>

  <!-- ═══ Settings Window ═══ -->
  {#if wm.wins.settings.mode !== 'closed'}
    <Win98Window
      title="Settings"
      icon="⚙️"
      bind:mode={wm.wins.settings.mode}
      bind:x={wm.wins.settings.x}
      bind:y={wm.wins.settings.y}
      bind:width={wm.wins.settings.w}
      bind:height={wm.wins.settings.h}
      zIndex={wm.wins.settings.z}
      mobileSlot={getMobileSlot('settings')}
      onClose={() => wm.close('settings')}
      onFocus={() => wm.focusWindow('settings')}
    >
      {#if !originalImageSrc}
        <ImageDropZone onImageSelected={handleImageSelected} onError={(msg) => showDialog(msg, 'Error')} />
      {:else}
        <div style="padding: 4px; overflow-y: auto; flex: 1;">
          <button
            style="margin-bottom:6px; padding:4px; font-weight:bold; width:100%; text-align:left;"
            onclick={handleLoadNewImage}
          >
            📂 Load New Image...
          </button>
          <ControlPanel
            bind:settings={processingSettings}
            onChange={handleSettingsChange}
            onSave={handleSave}
            onOpenGallery={() => { setTimeout(() => wm.openWindow('gallery'), 0); }}
          />
        </div>
      {/if}
    </Win98Window>
  {/if}

  <!-- ═══ Preview Window ═══ -->
  {#if wm.wins.preview.mode !== 'closed'}
    <Win98Window
      title="Preview - {isProcessing ? 'Rendering...' : 'Ready'}"
      icon="🖼️"
      bind:mode={wm.wins.preview.mode}
      bind:x={wm.wins.preview.x}
      bind:y={wm.wins.preview.y}
      bind:width={wm.wins.preview.w}
      bind:height={wm.wins.preview.h}
      zIndex={wm.wins.preview.z}
      mobileSlot={getMobileSlot('preview')}
      onClose={() => wm.close('preview')}
      onFocus={() => wm.focusWindow('preview')}
    >
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="preview-body"
        class:panning={isPanning}
        bind:this={previewContainer}
        onwheel={handlePreviewWheel}
        onmousedown={handlePreviewMouseDown}
        onmousemove={handlePreviewMouseMove}
        onmouseup={handlePreviewMouseUp}
        onmouseleave={handlePreviewMouseUp}
        ontouchstart={handleTouchStart}
        ontouchmove={handleTouchMove}
        ontouchend={handleTouchEnd}
      >
        {#if processedImageSrc}
          <CrtDisplay active={processingSettings.crtEffect}>
            {#snippet children()}
              <img
                bind:this={previewImg}
                src={processedImageSrc}
                alt="Processed Pixel Art"
                style="max-width:100%; max-height:100%; width:100%; height:100%; image-rendering:{processingSettings.renderMode === 'bilinear' ? 'auto' : 'pixelated'}; object-fit:contain; transform: scale({zoomLevel}) translate({panX / zoomLevel}px, {panY / zoomLevel}px); transform-origin: center center; transition: {isPanning || isTouchPanning ? 'none' : 'transform 0.1s ease'};"
                draggable="false"
              />
            {/snippet}
          </CrtDisplay>
          {#if isProcessing}
            <div class="processing-overlay">
              <div class="processing-indicator">
                <div class="progress-container">
                  <div class="progress-bar"></div>
                </div>
                <span class="processing-text">Rendering...</span>
              </div>
            </div>
          {/if}
          <!-- Zoom Controls -->
          <div class="zoom-controls">
            <button class="zoom-btn" onclick={zoomIn} title="Zoom In">+</button>
            <button class="zoom-btn zoom-label" onclick={resetZoom} title="Reset Zoom">{Math.round(zoomLevel * 100)}%</button>
            <button class="zoom-btn" onclick={zoomOut} title="Zoom Out">−</button>
            <button class="zoom-btn" onclick={zoomToFit} title="Fit to Window">⊡</button>
          </div>
        {:else if originalImageSrc}
          <div class="initial-processing">
            <div class="processing-indicator">
              <span style="font-size: 24px; margin-bottom: 8px;">⏳</span>
              <div class="progress-container" style="width: 200px;">
                <div class="progress-bar"></div>
              </div>
              <span class="processing-text">Processing image...</span>
            </div>
          </div>
        {:else}
          <p style="color:#fff; font-weight:bold; text-shadow:1px 1px 0 #000;">No Image Loaded</p>
        {/if}
      </div>
    </Win98Window>
  {/if}

  <!-- ═══ Gallery Window ═══ -->
  {#if wm.wins.gallery.mode !== 'closed'}
    <Win98Window
      title="Palette Gallery"
      icon="🎨"
      bind:mode={wm.wins.gallery.mode}
      bind:x={wm.wins.gallery.x}
      bind:y={wm.wins.gallery.y}
      bind:width={wm.wins.gallery.w}
      bind:height={wm.wins.gallery.h}
      zIndex={wm.wins.gallery.z}
      mobileSlot={getMobileSlot('gallery')}
      onClose={() => wm.close('gallery')}
      onFocus={() => wm.focusWindow('gallery')}
    >
      <PaletteGallery
        selectedPaletteId={processingSettings.palette}
        onSelect={handleGallerySelect}
      />
    </Win98Window>
  {/if}
</div>

<!-- ═══ Taskbar ═══ -->
<Taskbar
  windows={taskbarWindows}
  onWindowClick={wm.handleTaskbarClick}
  onWindowClose={wm.closeAndReset}
/>

<!-- ═══ Dialog ═══ -->
{#if dialogMessage}
  <MessageDialog
    message={dialogMessage}
    title={dialogTitle}
    onClose={() => { dialogMessage = null; }}
  />
{/if}

<style>
  .desktop {
    background-color: #008080;
    background-image:
      radial-gradient(circle at 20px 20px, rgba(255,255,255,0.03) 1px, transparent 1px),
      radial-gradient(circle at 10px 10px, rgba(0,0,0,0.04) 1px, transparent 1px);
    background-size: 20px 20px;
    width: 100vw;
    height: calc(100vh - 30px);
    position: relative;
    overflow: hidden;
    box-sizing: border-box;
  }

  /* ===== Desktop Icons ===== */
  .desktop-icons {
    position: absolute;
    top: 16px;
    left: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 1;
  }

  .desktop-icon {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 72px;
    padding: 4px;
    cursor: default;
    border: 1px solid transparent;
    border-radius: 2px;
    user-select: none;
    background: transparent;
    font-family: inherit;
    /* 버튼 스타일 초기화 */
    min-width: 0;
    min-height: 0;
    box-shadow: none;
    box-sizing: border-box;
    /* 클릭 시 내려가는 98.css 기본 효과 방지 */
  }
  .desktop-icon:active {
    padding: 4px;
  }
  .desktop-icon:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }
  .desktop-icon:focus-visible {
    outline: 1px dotted #fff;
    outline-offset: -1px;
  }

  /* Icon selected state */
  .desktop-icon.icon-selected {
    border-color: rgba(255, 255, 255, 0.5);
  }
  .desktop-icon.icon-selected .icon-img {
    filter: contrast(0.5) sepia(1) hue-rotate(180deg) saturate(4);
  }
  .desktop-icon.icon-selected .icon-label {
    background: #000080;
    color: #fff;
  }

  .icon-img {
    font-size: 32px;
    font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
    color: initial;
    filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.5));
  }

  .icon-label {
    font-size: 11px;
    color: #fff;
    text-align: center;
    text-shadow: 1px 1px 2px #000;
    word-break: break-word;
    margin-top: 2px;
    line-height: 1.2;
    padding: 0 2px;
  }

  /* ===== Preview Body ===== */
  .preview-body {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #000;
    overflow: hidden;
    min-height: 0;
    cursor: default;
    touch-action: none;
  }
  .preview-body.panning {
    cursor: grabbing;
  }

  /* ===== Zoom Controls ===== */
  .zoom-controls {
    position: absolute;
    bottom: 6px;
    right: 6px;
    display: flex;
    gap: 2px;
    z-index: 6;
  }
  .zoom-btn {
    min-width: 22px;
    height: 20px;
    padding: 0 4px;
    font-size: 11px;
    font-weight: bold;
    font-family: inherit;
    background: #c0c0c0;
    border: none;
    cursor: pointer;
    box-shadow: inset 1px 1px #fff, inset -1px -1px #0a0a0a;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .zoom-btn:active {
    box-shadow: inset -1px -1px #fff, inset 1px 1px #0a0a0a;
  }
  .zoom-label {
    min-width: 40px;
    font-size: 10px;
    font-weight: normal;
  }

  /* ===== Processing Overlay ===== */
  .processing-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 5;
    animation: fadeIn 0.15s ease;
  }

  .initial-processing {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  .processing-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 12px 20px;
    background: #c0c0c0;
    border: 2px solid;
    border-color: #dfdfdf #808080 #808080 #dfdfdf;
    box-shadow: 1px 1px 0 #000;
  }

  .processing-text {
    font-size: 11px;
    color: #000;
    font-weight: bold;
  }

  .progress-container {
    width: 140px;
    height: 16px;
    background: #fff;
    border: 2px solid;
    border-color: #808080 #dfdfdf #dfdfdf #808080;
    padding: 1px;
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    background: repeating-linear-gradient(
      90deg,
      #000080 0px, #000080 8px,
      transparent 8px, transparent 10px
    );
    animation: progressSlide 1.5s linear infinite;
    width: 200%;
  }

  @keyframes progressSlide {
    from { transform: translateX(-50%); }
    to { transform: translateX(0); }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* ===== Mobile ===== */
  @media (max-width: 550px) {
    .desktop-icons {
      top: 8px;
      left: 8px;
      flex-direction: row;
      gap: 6px;
    }
    .desktop-icon { width: 56px; }
    .icon-img { font-size: 24px; }
  }
</style>
