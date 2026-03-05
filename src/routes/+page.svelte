<script lang="ts">
  import { onDestroy } from 'svelte';
  import Win98Window from '$lib/components/Win98Window.svelte';
  import ImageDropZone from '$lib/components/ImageDropZone.svelte';
  import ControlPanel from '$lib/components/ControlPanel.svelte';
  import CrtDisplay from '$lib/components/CrtDisplay.svelte';
  import Taskbar from '$lib/components/Taskbar.svelte';
  import PaletteGallery from '$lib/components/PaletteGallery.svelte';
  import MessageDialog from '$lib/components/MessageDialog.svelte';
  import ToastNotification from '$lib/components/ToastNotification.svelte';
  import { createWindowStore, WINDOW_CONFIGS } from '$lib/stores/windowStore.svelte';
  import { createZoomPan } from '$lib/stores/zoomPanStore.svelte';
  import { createImageProcessingStore } from '$lib/stores/imageProcessingStore.svelte';
  import { getPaletteName } from '$lib/utils/palettes';
  import type { SaveFormat } from '$lib/services/saveService';
  import type { TaskbarWindowInfo } from '$lib/components/Taskbar.svelte';
  import type { ProcessingSettings } from '$lib/types';
  import { isTauri } from '$lib/utils/env';

  // ─── Stores ───
  const wm = createWindowStore();
  const zp = createZoomPan();
  const ip = createImageProcessingStore();

  // ─── Dialog & Toast State ───
  let dialogMessage: string | null = $state(null);
  let dialogTitle = $state('Message');
  let toastMessage: string | null = $state(null);

  // ─── Desktop icon selection ───
  let selectedIcon = $state<string | null>(null);

  // ─── Mobile detection ───
  const isMobile = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  // ─── Dimension cap callback ───
  ip.setDimensionCapCallback((original, capped) => {
    showDialog(
      `Image resized: ${original.w}×${original.h} → ${capped.w}×${capped.h}px (max 2048px)`,
      'Image Resized'
    );
  });

  // ─── Mobile split layout ───
  const WINDOW_ORDER = ['preview', 'settings', 'gallery'] as const;
  let mobileVisibleIds = $derived(
    WINDOW_ORDER.filter(id => wm.wins[id].mode !== 'closed' && wm.wins[id].mode !== 'minimized')
  );

  function getMobileSlot(id: string): { top: string; height: string } | null {
    if (!isMobile) return null;
    const idx = mobileVisibleIds.indexOf(id as typeof WINDOW_ORDER[number]);
    if (idx === -1) return null;
    const count = mobileVisibleIds.length;
    const heightPct = 100 / count;
    return { top: `${idx * heightPct}%`, height: `${heightPct}%` };
  }

  // ─── Taskbar window info ───
  let taskbarWindows = $derived<TaskbarWindowInfo[]>(
    WINDOW_CONFIGS.map(c => ({
      id: c.id, title: c.title, icon: c.icon,
      mode: wm.wins[c.id].mode, focused: wm.focusedWindow === c.id,
    }))
  );

  // ─── Convenience aliases for template ───
  let originalImageSrc = $derived(ip.originalImageSrc);
  let processedImageSrc = $derived(ip.processedImageSrc);
  let isProcessing = $derived(ip.isProcessing);
  let processingSettings = $derived(ip.settings);
  let saveFormat = $derived(ip.saveFormat);
  let saveQuality = $derived(ip.saveQuality);

  // ─── Event Handlers ───
  function handleImageSelected(file: File) {
    ip.loadImage(file);
    wm.openWindow('preview');
  }

  function handleSettingsChange(newSettings: ProcessingSettings) {
    ip.updateSettings(newSettings);
  }

  function handleGallerySelect(paletteId: string) {
    ip.selectPalette(paletteId);
    wm.openWindow('preview');
  }

  function showDialog(message: string, title = 'Retro Pixel Converter') {
    dialogMessage = message;
    dialogTitle = title;
  }

  async function handleSave() {
    try {
      const message = await ip.save();
      if (message) toastMessage = message;
    } catch (err) {
      console.error('Failed to save file:', err);
      showDialog('Error saving file. Please try again.', 'Error');
    }
  }

  function handleFormatChange(format: SaveFormat) { ip.setFormat(format); }
  function handleQualityChange(quality: number) { ip.setQuality(quality); }

  function handleLoadNewImage() {
    ip.loadNewImage();
  }

  function handleIconClick(id: string) {
    if (isMobile) {
      selectedIcon = null;
      wm.openWindow(id);
    } else {
      selectedIcon = id;
    }
  }
  function handleIconDblClick(id: string) { selectedIcon = null; wm.openWindow(id); }
  function handleDesktopClick() { selectedIcon = null; }

  function handleKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      ip.undo();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
      e.preventDefault();
      ip.redo();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  }

  onDestroy(() => { ip.destroy(); });
</script>

<svelte:window onkeydown={handleKeydown} />

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
        <div class="settings-body">
          <button
            class="load-new-btn"
            onclick={handleLoadNewImage}
          >
            📂 Load New Image...
          </button>
          <ControlPanel
            bind:settings={processingSettings}
            {saveFormat}
            {saveQuality}
            onChange={handleSettingsChange}
            onSave={handleSave}
            onOpenGallery={() => { setTimeout(() => wm.openWindow('gallery'), 0); }}
            onFormatChange={handleFormatChange}
            onQualityChange={handleQualityChange}
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
        class:panning={zp.isPanning}
        bind:this={zp.previewContainer}
        onwheel={zp.handleWheel}
        onmousedown={zp.handleMouseDown}
        onmousemove={zp.handleMouseMove}
        onmouseup={zp.handleMouseUp}
        onmouseleave={zp.handleMouseUp}
        ontouchstart={zp.handleTouchStart}
        ontouchmove={zp.handleTouchMove}
        ontouchend={zp.handleTouchEnd}
      >
        {#if processedImageSrc}
          <CrtDisplay active={processingSettings.crtEffect}>
            {#snippet children()}
              <img
                bind:this={zp.previewImg}
                src={processedImageSrc}
                alt="Pixel Art - {getPaletteName(processingSettings.palette)}"
                class="preview-image"
                style:image-rendering={processingSettings.renderMode === 'bilinear' ? 'auto' : 'pixelated'}
                style:transform="scale({zp.zoomLevel}) translate({zp.panX / zp.zoomLevel}px, {zp.panY / zp.zoomLevel}px)"
                style:transition={zp.isPanning || zp.isTouchPanning ? 'none' : 'transform 0.1s ease'}
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
                <span class="processing-palette">🎨 {getPaletteName(processingSettings.palette)}</span>
              </div>
            </div>
          {/if}
          <!-- Zoom Controls -->
          <div class="zoom-controls">
            <button class="zoom-btn" onclick={zp.zoomIn} title="Zoom In">+</button>
            <button class="zoom-btn zoom-label" onclick={zp.resetZoom} title="Reset Zoom">{Math.round(zp.zoomLevel * 100)}%</button>
            <button class="zoom-btn" onclick={zp.zoomOut} title="Zoom Out">−</button>
            <button class="zoom-btn" onclick={zp.zoomToFit} title="Fit to Window">⊡</button>
          </div>
        {:else if originalImageSrc}
          <div class="initial-processing">
            <div class="processing-indicator">
              <span class="initial-spinner">⏳</span>
              <div class="progress-container progress-wide">
                <div class="progress-bar"></div>
              </div>
              <span class="processing-text">Processing image...</span>
            </div>
          </div>
        {:else}
          <div class="empty-preview">
            <span class="empty-icon">🖼️</span>
            <p class="empty-title">No Image Loaded</p>
            <p class="empty-hint">Open an image from Settings window<br/>or drag & drop to start</p>
          </div>
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

<!-- ═══ Toast ═══ -->
{#if toastMessage}
  <ToastNotification
    message={toastMessage}
    onDone={() => { toastMessage = null; }}
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

  /* ===== Preview Image ===== */
  .preview-image {
    max-width: 100%;
    max-height: 100%;
    width: 100%;
    height: 100%;
    object-fit: contain;
    transform-origin: center center;
  }

  /* ===== Empty Preview State ===== */
  .empty-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 20px;
    text-align: center;
  }
  .empty-icon {
    font-size: 40px;
    opacity: 0.6;
    font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
  }
  .empty-title {
    color: #fff;
    font-weight: bold;
    font-size: 14px;
    text-shadow: 1px 1px 0 #000;
    margin: 4px 0 2px 0;
  }
  .empty-hint {
    color: #a0a0a0;
    font-size: 11px;
    line-height: 1.4;
    margin: 0;
  }

  /* ===== Settings Panel Body ===== */
  .settings-body {
    padding: 4px;
    overflow-y: auto;
    flex: 1;
  }
  .load-new-btn {
    margin-bottom: 6px;
    padding: 4px;
    font-weight: bold;
    width: 100%;
    text-align: left;
  }

  /* ===== Initial Processing ===== */
  .initial-spinner {
    font-size: 24px;
    margin-bottom: 8px;
  }
  .progress-wide {
    width: 200px;
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

  .processing-palette {
    font-size: 10px;
    color: #444;
    margin-top: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 180px;
    text-align: center;
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
