<script lang="ts">
  import { onDestroy } from 'svelte';
  import Win98Window from '$lib/components/Win98Window.svelte';
  import ControlPanel from '$lib/components/ControlPanel.svelte';
  import Taskbar from '$lib/components/Taskbar.svelte';
  import PaletteGallery from '$lib/components/PaletteGallery.svelte';
  import MessageDialog from '$lib/components/MessageDialog.svelte';
  import BatchProcessor from '$lib/components/BatchProcessor.svelte';
  import HistoryPanel from '$lib/components/HistoryPanel.svelte';
  import DesktopIcons from '$lib/components/DesktopIcons.svelte';
  import PreviewContent from '$lib/components/PreviewContent.svelte';
  import ToastNotification from '$lib/components/ToastNotification.svelte';
  import KeyboardShortcuts from '$lib/components/KeyboardShortcuts.svelte';
  import { createWindowStore, WINDOW_CONFIGS } from '$lib/stores/windowStore.svelte';
  import { createZoomPan } from '$lib/stores/zoomPanStore.svelte';
  import { createImageProcessingStore } from '$lib/stores/imageProcessingStore.svelte';
  import { getPaletteName, registerPaletteTranslator } from '$lib/utils/palettes';
  import { imageDataToSvg, downloadSvg } from '$lib/utils/svgExporter';
  import { createSpritesheet, downloadSpritesheet } from '$lib/utils/spritesheetExporter';
  import { frameToBlobUrl } from '$lib/utils/gifProcessor';
  import type { SaveFormat } from '$lib/services/saveService';
  import type { TaskbarWindowInfo } from '$lib/components/Taskbar.svelte';
  import type { ProcessingSettings, WindowId } from '$lib/types';
  import { i18n } from '$lib/i18n/index.svelte';
  import { getWindowTitle } from '$lib/stores/windowStore.svelte';

  // Register i18n translator for palette names
  registerPaletteTranslator((key) => i18n.t(key));

  // ─── Stores ───
  const wm = createWindowStore();
  const zp = createZoomPan();
  const ip = createImageProcessingStore();

  // ─── Dialog & Toast State ───
  let dialogMessage: string | null = $state(null);
  let dialogTitle = $state('Message');
  let toastMessage: string | null = $state(null);

  // ─── Compare Mode ───
  let compareMode = $state(false);
  let tileMode = $state(false);
  let showShortcuts = $state(false);

  // ─── Error Handling ───
  $effect(() => {
    if (ip.lastError) {
      showDialog(ip.lastError, i18n.t('processing_error'));
      ip.clearError();
    }
  });

  // ─── Desktop icon selection ───
  let selectedIcon = $state<WindowId | null>(null);

  // ─── Mobile / narrow viewport detection ───
  // Match the CSS @media (max-width: 550px) breakpoint for JS layout switching
  const MOBILE_BREAKPOINT = 550;
  const mql = typeof window !== 'undefined' ? window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`) : null;
  let isMobile = $state(mql?.matches ?? false);
  $effect(() => {
    if (!mql) return;
    const handler = (e: MediaQueryListEvent) => { isMobile = e.matches; };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  });

  // ─── Dimension cap callback ───
  ip.setDimensionCapCallback((original, capped) => {
    showDialog(
      i18n.t('image_resized', `${original.w}×${original.h}`, `${capped.w}×${capped.h}px`),
      i18n.t('image_resized_title')
    );
  });

  // ─── Mobile split layout ───
  const WINDOW_ORDER = ['preview', 'settings', 'gallery', 'batch', 'history'] as const;
  let mobileVisibleIds = $derived(
    WINDOW_ORDER.filter(id => wm.wins[id].mode !== 'closed' && wm.wins[id].mode !== 'minimized')
  );

  function getMobileSlot(id: string): { top: string; height: string } | null {
    if (!isMobile) return null;
    const idx = mobileVisibleIds.indexOf(id as typeof WINDOW_ORDER[number]);
    if (idx === -1) return null;
    const count = mobileVisibleIds.length;
    // Evenly divide desktop area (100dvh - taskbar) among visible windows
    const slotHeight = `calc((100dvh - var(--taskbar-h)) / ${count})`;
    const slotTop = idx === 0 ? '0px' : `calc((100dvh - var(--taskbar-h)) / ${count} * ${idx})`;
    return { top: slotTop, height: slotHeight };
  }

  // ─── Taskbar window info ───
  let taskbarWindows = $derived<TaskbarWindowInfo[]>(
    WINDOW_CONFIGS.map(c => ({
      id: c.id, title: getWindowTitle(c.id), icon: c.icon,
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
      showDialog(i18n.t('save_error'), i18n.t('error'));
    }
  }

  async function handleExportSvg() {
    const src = ip.processedImageSrc;
    if (!src) return;
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = src;
      });
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const svgString = imageDataToSvg(imageData);
      downloadSvg(svgString, `pixel-art-${Date.now()}.svg`);
      toastMessage = i18n.t('svg_exported');
    } catch (err) {
      console.error('SVG export error:', err);
      showDialog(i18n.t('save_error'), i18n.t('error'));
    }
  }

  async function handleExportSpritesheet() {
    const gifInfo = ip.gifInfo;
    if (!gifInfo || gifInfo.frames.length === 0) return;
    try {
      // Generate blob URLs for all frames
      const frameSrcs: string[] = [];
      for (const frame of gifInfo.frames) {
        frameSrcs.push(await frameToBlobUrl(frame));
      }
      const canvas = await createSpritesheet(
        frameSrcs,
        gifInfo.width,
        gifInfo.height,
      );
      await downloadSpritesheet(canvas, `spritesheet-${Date.now()}.png`);
      // Cleanup blob URLs
      frameSrcs.forEach(URL.revokeObjectURL);
      toastMessage = i18n.t('spritesheet_exported');
    } catch (err) {
      console.error('Spritesheet export error:', err);
      showDialog(i18n.t('save_error'), i18n.t('error'));
    }
  }

  function handleFormatChange(format: SaveFormat) { ip.setFormat(format); }
  function handleQualityChange(quality: number) { ip.setQuality(quality); }

  function handleLoadNewImage() {
    ip.loadNewImage();
  }

  function handleIconClick(id: WindowId) {
    if (isMobile) {
      selectedIcon = null;
      wm.openWindow(id);
    } else {
      selectedIcon = id;
    }
  }
  function handleIconDblClick(id: WindowId) { selectedIcon = null; wm.openWindow(id); }
  function handleDesktopClick() { selectedIcon = null; }

  // ─── Desktop-wide Drop Zone ───
  const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/bmp', 'image/webp'];
  let dragCounter = 0;
  let isDraggingOverDesktop = $state(false);

  function handleDesktopDragEnter(e: DragEvent) {
    e.preventDefault();
    dragCounter++;
    if (dragCounter === 1) isDraggingOverDesktop = true;
  }

  function handleDesktopDragLeave(e: DragEvent) {
    e.preventDefault();
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      isDraggingOverDesktop = false;
    }
  }

  function handleDesktopDrop(e: DragEvent) {
    e.preventDefault();
    dragCounter = 0;
    isDraggingOverDesktop = false;
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        handleImageSelected(file);
      } else {
        showDialog(i18n.t('unsupported_format'), i18n.t('error'));
      }
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
      e.preventDefault();
      ip.redo();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      ip.undo();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    } else if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
      showShortcuts = !showShortcuts;
    }
  }

  onDestroy(() => { ip.destroy(); });
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- ═══ Desktop ═══ -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="desktop"
  onclick={handleDesktopClick}
  onkeydown={(e) => { if (e.key === 'Escape') handleDesktopClick(); }}
  ondragenter={handleDesktopDragEnter}
  ondragover={(e) => e.preventDefault()}
  ondragleave={handleDesktopDragLeave}
  ondrop={handleDesktopDrop}
  role="application"
  tabindex="-1"
>

  <!-- Desktop Drop Overlay -->
  {#if isDraggingOverDesktop}
    <div class="desktop-drop-overlay">
      <div class="desktop-drop-message">
        <span class="desktop-drop-icon">📥</span>
        <span>{i18n.t('drop_image_here')}</span>
      </div>
    </div>
  {/if}

  <!-- Desktop Icons -->
  <DesktopIcons
    {selectedIcon}
    onIconClick={handleIconClick}
    onIconDblClick={handleIconDblClick}
  />

  <!-- ═══ Settings Window ═══ -->
  {#if wm.wins.settings.mode !== 'closed'}
    <Win98Window
      title={getWindowTitle('settings')}
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
      onLayoutChange={wm.persistLayout}
    >
      <div class="settings-body">
        <div class="settings-toolbar">
          <button
            class="load-new-btn"
            onclick={handleLoadNewImage}
          >
            📂 {i18n.t('load_new_image')}
          </button>
          <button
            class="load-new-btn"
            onclick={(e) => { e.stopPropagation(); wm.openWindow('preview'); }}
          >
            🖼️ {i18n.t('win_preview')}
          </button>
        </div>
        <ControlPanel
          bind:settings={processingSettings}
          bind:postFilters={ip.postFilters}
          bind:autoProcess={ip.autoProcess}
          {saveFormat}
          {saveQuality}
          hasImage={!!originalImageSrc}
          onChange={handleSettingsChange}
          onSave={handleSave}
          onExportSvg={handleExportSvg}
          onOpenGallery={() => { setTimeout(() => wm.openWindow('gallery'), 0); }}
          onFormatChange={handleFormatChange}
          onQualityChange={handleQualityChange}
          onApplyNow={() => ip.applyNow()}
        />
      </div>
    </Win98Window>
  {/if}

  <!-- ═══ Preview Window ═══ -->
  {#if wm.wins.preview.mode !== 'closed'}
    <Win98Window
      title="{getWindowTitle('preview')} - {isProcessing ? i18n.t('rendering') : i18n.t('ready')}"
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
      onLayoutChange={wm.persistLayout}
    >
      <PreviewContent
        {zp}
        originalImageSrc={originalImageSrc}
        processedImageSrc={processedImageSrc}
        isProcessing={isProcessing}
        processingSettings={processingSettings}
        bind:compareMode={compareMode}
        bind:tileMode={tileMode}
        colorCount={ip.colorCount}
        postFilterCss={ip.postFilterCss}
        onImageSelected={handleImageSelected}
        onError={(msg) => showDialog(msg, 'Error')}
        onOpenSettings={() => wm.openWindow('settings')}
        isGif={ip.isGif}
        gifCurrentFrame={ip.gifCurrentFrame}
        gifFrameCount={ip.gifFrameCount}
        gifPlaying={ip.gifPlaying}
        gifIsExporting={ip.gifIsExporting}
        gifExportProgress={ip.gifProcessingProgress}
        onGifPlay={() => ip.playGif()}
        onGifPause={() => ip.pauseGif()}
        onGifSeek={(frame) => ip.seekGifFrame(frame)}
        onGifExport={async () => {
          const msg = await ip.exportGif();
          if (msg) toastMessage = msg;
        }}
        onGifExportSpritesheet={async () => {
          await handleExportSpritesheet();
        }}
        onRotate={(deg) => ip.rotate(deg)}
        onResetTransform={() => ip.resetTransform()}
        onCrop={(rect) => ip.setCrop(rect)}
        currentRotation={ip.rotation}
        hasCrop={ip.cropRect !== null}
      />
    </Win98Window>
  {/if}

  <!-- ═══ Gallery Window ═══ -->
  {#if wm.wins.gallery.mode !== 'closed'}
    <Win98Window
      title={getWindowTitle('gallery')}
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
      onLayoutChange={wm.persistLayout}
    >
      <PaletteGallery
        selectedPaletteId={processingSettings.palette}
        onSelect={handleGallerySelect}
      />
    </Win98Window>
  {/if}

  <!-- ═══ Batch Window ═══ -->
  {#if wm.wins.batch.mode !== 'closed'}
    <Win98Window
      title={getWindowTitle('batch')}
      icon="📦"
      bind:mode={wm.wins.batch.mode}
      bind:x={wm.wins.batch.x}
      bind:y={wm.wins.batch.y}
      bind:width={wm.wins.batch.w}
      bind:height={wm.wins.batch.h}
      zIndex={wm.wins.batch.z}
      mobileSlot={getMobileSlot('batch')}
      onClose={() => wm.close('batch')}
      onFocus={() => wm.focusWindow('batch')}
      onLayoutChange={wm.persistLayout}
    >
      <BatchProcessor
        settings={processingSettings}
        saveFormat={saveFormat}
        saveQuality={saveQuality}
        onError={(msg) => showDialog(msg, 'Error')}
        onItemClick={(file) => {
          handleImageSelected(file);
          wm.openWindow('preview');
        }}
      />
    </Win98Window>
  {/if}

  <!-- ═══ History Window ═══ -->
  {#if wm.wins.history.mode !== 'closed'}
    <Win98Window
      title={getWindowTitle('history')}
      icon="⏱️"
      bind:mode={wm.wins.history.mode}
      bind:x={wm.wins.history.x}
      bind:y={wm.wins.history.y}
      bind:width={wm.wins.history.w}
      bind:height={wm.wins.history.h}
      zIndex={wm.wins.history.z}
      mobileSlot={getMobileSlot('history')}
      onClose={() => wm.close('history')}
      onFocus={() => wm.focusWindow('history')}
      onLayoutChange={wm.persistLayout}
    >
      <HistoryPanel
        history={ip.settingsHistory}
        redoHistory={ip.redoHistory}
        currentSettings={processingSettings}
        onJumpToHistory={(index, isRedo) => ip.jumpToHistory(index, isRedo)}
        onUndo={ip.undo}
        onRedo={ip.redo}
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

<!-- ═══ Keyboard Shortcuts ═══ -->
{#if showShortcuts}
  <KeyboardShortcuts onClose={() => { showShortcuts = false; }} />
{/if}

<style>
  .desktop {
    --taskbar-h: 30px;
    background-color: #008080;
    background-image:
      radial-gradient(circle at 20px 20px, rgba(255,255,255,0.03) 1px, transparent 1px),
      radial-gradient(circle at 10px 10px, rgba(0,0,0,0.04) 1px, transparent 1px);
    background-size: 20px 20px;
    width: 100vw;
    height: calc(100vh - var(--taskbar-h));
    height: calc(100dvh - var(--taskbar-h));
    position: relative;
    overflow: hidden;
  }

  .desktop-drop-overlay {
    position: absolute;
    inset: 0;
    z-index: 9998;
    background: rgba(0, 0, 128, 0.2);
    border: 3px dashed #000080;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .desktop-drop-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 16px 32px;
    background: #c0c0c0;
    border: 2px solid;
    border-color: #dfdfdf #808080 #808080 #dfdfdf;
    box-shadow: 4px 4px 12px rgba(0, 0, 0, 0.4);
    font-size: 14px;
    font-weight: bold;
    color: #000080;
  }

  .desktop-drop-icon {
    font-size: 32px;
    font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
  }
</style>
