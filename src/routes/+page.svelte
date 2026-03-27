<script lang="ts">
  import { onDestroy } from 'svelte';
  import Win98Window from '$lib/components/window/Win98Window.svelte';
  import ControlPanel from '$lib/components/editor/ControlPanel.svelte';
  import Taskbar from '$lib/components/window/Taskbar.svelte';
  import PaletteGallery from '$lib/components/palette/PaletteGallery.svelte';
  import MessageDialog from '$lib/components/feedback/MessageDialog.svelte';
  import BatchProcessor from '$lib/components/media/BatchProcessor.svelte';
  import HistoryPanel from '$lib/components/feedback/HistoryPanel.svelte';
  import DesktopIcons from '$lib/components/window/DesktopIcons.svelte';
  import PreviewContent from '$lib/components/editor/PreviewContent.svelte';
  import ToastNotification from '$lib/components/feedback/ToastNotification.svelte';
  import KeyboardShortcuts from '$lib/components/feedback/KeyboardShortcuts.svelte';
  import { createWindowStore, WINDOW_CONFIGS } from '$lib/stores/windowStore.svelte';
  import { createZoomPan } from '$lib/stores/zoomPanStore.svelte';
  import { createImageProcessingStore } from '$lib/stores/imageProcessingStore.svelte';
  import { getPaletteName, registerPaletteTranslator } from '$lib/utils/palettes';
  import { exportSvg, exportSpritesheet } from '$lib/services/exportService';
  import type { SaveFormat } from '$lib/services/saveService';
  import type { TaskbarWindowInfo } from '$lib/components/window/Taskbar.svelte';
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
  let dialogConfirmCallback: (() => void) | undefined = $state(undefined);

  // Toast queue: max 3 items, drop oldest if exceeded
  const TOAST_QUEUE_MAX = 3;
  type ToastItem = { message: string; variant: 'success' | 'error' | 'warning'; action?: { label: string; onclick: () => void } };
  let toastQueue: ToastItem[] = $state([]);
  let activeToast: ToastItem | null = $state(null);

  function enqueueToast(message: string, variant: 'success' | 'error' | 'warning' = 'success', action?: { label: string; onclick: () => void }) {
    const item: ToastItem = { message, variant, action };
    if (!activeToast) {
      activeToast = item;
    } else {
      toastQueue.push(item);
      // Drop oldest queued items if exceeding max
      while (toastQueue.length > TOAST_QUEUE_MAX) {
        toastQueue.shift();
      }
    }
  }

  function advanceToastQueue() {
    if (toastQueue.length > 0) {
      activeToast = toastQueue.shift()!;
    } else {
      activeToast = null;
    }
  }

  // ─── Compare Mode ───
  let compareMode = $state(false);
  let tileMode = $state(false);
  let showShortcuts = $state(false);

  // ─── Error Handling ───
  function getUserFriendlyError(rawError: string): string {
    const lower = rawError.toLowerCase();
    if (lower.includes('worker') || lower.includes('retries exceeded')) return i18n.t('error_worker_crashed');
    if (lower.includes('failed to load image') || lower.includes('failed to load frame')) return i18n.t('error_image_load');
    if (lower.includes('2d context')) return i18n.t('error_canvas_context');
    if (lower.includes('gif export') || lower.includes('gif encoding')) return i18n.t('error_gif_export');
    return rawError;
  }

  $effect(() => {
    if (ip.lastError) {
      showDialog(getUserFriendlyError(ip.lastError), i18n.t('processing_error'));
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
    enqueueToast(
      i18n.t('image_resized', `${original.w}×${original.h}`, `${capped.w}×${capped.h}px`),
      'warning',
      { label: i18n.t('undo'), onclick: () => ip.undo() },
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

    if (count <= 2) {
      // 2 windows or fewer: evenly divide
      const slotHeight = `calc((100dvh - var(--taskbar-h)) / ${count})`;
      const slotTop = idx === 0 ? '0px' : `calc((100dvh - var(--taskbar-h)) / ${count} * ${idx})`;
      return { top: slotTop, height: slotHeight };
    }

    // 3+ windows: focused window expands, others collapse to title bar
    const COMPACT_H = 34;
    const compactTotal = (count - 1) * COMPACT_H;
    const isFocused = wm.focusedWindow === id;
    const focusedIdx = Math.max(0, mobileVisibleIds.indexOf(wm.focusedWindow as typeof WINDOW_ORDER[number]));

    if (isFocused) {
      return {
        top: `${idx * COMPACT_H}px`,
        height: `calc(100dvh - var(--taskbar-h) - ${compactTotal}px)`,
      };
    }

    // Compact: before focused stacks from top, after focused stacks from bottom
    if (idx < focusedIdx) {
      return { top: `${idx * COMPACT_H}px`, height: `${COMPACT_H}px` };
    }
    const bottomOffset = count - 1 - idx;
    return {
      top: `calc(100dvh - var(--taskbar-h) - ${(bottomOffset + 1) * COMPACT_H}px)`,
      height: `${COMPACT_H}px`,
    };
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
      if (message) enqueueToast(message);
    } catch (err) {
      console.error('Failed to save file:', err);
      showDialog(i18n.t('save_error'), i18n.t('error'));
    }
  }

  async function handleExportSvg() {
    if (!ip.processedImageSrc) return;
    try {
      await exportSvg(ip.processedImageSrc, ip.getLastCanvas());
      enqueueToast(i18n.t('svg_exported'));
    } catch (err) {
      console.error('SVG export error:', err);
      showDialog(i18n.t('save_error'), i18n.t('error'));
    }
  }

  async function handleExportSpritesheet() {
    if (!ip.gifInfo || ip.gifInfo.frames.length === 0) return;
    try {
      await exportSpritesheet(ip.gifInfo);
      enqueueToast(i18n.t('spritesheet_exported'));
    } catch (err) {
      console.error('Spritesheet export error:', err);
      showDialog(i18n.t('save_error'), i18n.t('error'));
    }
  }

  function handleFormatChange(format: SaveFormat) { ip.setFormat(format); }
  function handleQualityChange(quality: number) { ip.setQuality(quality); }

  function handleLoadNewImage() {
    if (originalImageSrc) {
      dialogTitle = i18n.t('confirm_load_new_title');
      dialogMessage = i18n.t('confirm_load_new_image');
      dialogConfirmCallback = () => {
        dialogMessage = null;
        dialogConfirmCallback = undefined;
        ip.loadNewImage();
      };
    } else {
      ip.loadNewImage();
    }
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
      // Don't trigger when typing in input fields or contenteditable elements
      const target = e.target as HTMLElement;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target.isContentEditable) return;
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
      menuItems={[i18n.t('menu_file'), i18n.t('menu_edit'), i18n.t('menu_view'), i18n.t('menu_help')]}
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
            <span aria-hidden="true">📂</span> {i18n.t('load_new_image')}
          </button>
          <button
            class="load-new-btn"
            onclick={(e) => { e.stopPropagation(); wm.openWindow('preview'); }}
          >
            <span aria-hidden="true">🖼️</span> {i18n.t('win_preview')}
          </button>
        </div>
        <ControlPanel
          bind:settings={processingSettings}
          bind:postFilters={ip.postFilters}
          bind:autoProcess={ip.autoProcess}
          hasUnappliedChanges={ip.hasUnappliedChanges}
          {saveFormat}
          {saveQuality}
          hasImage={!!originalImageSrc}
          onChange={handleSettingsChange}
          onSave={handleSave}
          onExportSvg={handleExportSvg}
          onOpenGallery={() => { queueMicrotask(() => wm.openWindow('gallery')); }}
          onFormatChange={handleFormatChange}
          onQualityChange={handleQualityChange}
          onApplyNow={() => ip.applyNow()}
          onError={(msg) => { enqueueToast(msg, 'error'); }}
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
      menuItems={[i18n.t('menu_file'), i18n.t('menu_view'), i18n.t('menu_image'), i18n.t('menu_help')]}
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
          if (msg) enqueueToast(msg);
        }}
        onGifCancelExport={() => ip.cancelGifExport()}
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
      menuItems={[i18n.t('menu_file'), i18n.t('menu_edit'), i18n.t('menu_view'), i18n.t('menu_help')]}
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
  onShowShortcuts={() => { showShortcuts = !showShortcuts; }}
/>

<!-- ═══ Dialog ═══ -->
{#if dialogMessage}
  <MessageDialog
    message={dialogMessage}
    title={dialogTitle}
    onConfirm={dialogConfirmCallback}
    onClose={() => { dialogMessage = null; dialogConfirmCallback = undefined; }}
  />
{/if}

<!-- ═══ Toast ═══ -->
{#if activeToast}
  {#key activeToast}
    <ToastNotification
      message={activeToast.message}
      variant={activeToast.variant}
      action={activeToast.action}
      onDone={advanceToastQueue}
    />
  {/key}
{/if}

<!-- ═══ Keyboard Shortcuts ═══ -->
{#if showShortcuts}
  <KeyboardShortcuts onClose={() => { showShortcuts = false; }} />
{/if}

<style>
  .desktop {
    --taskbar-h: 30px;
    background-color: var(--w98-desktop-bg);
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
    border: 3px dashed var(--w98-highlight);
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
    background: var(--w98-surface);
    border: 2px solid;
    border-color: var(--w98-shadow-light) var(--w98-shadow-808) var(--w98-shadow-808) var(--w98-shadow-light);
    box-shadow: 4px 4px 12px rgba(0, 0, 0, 0.4);
    font-size: 14px;
    font-weight: bold;
    color: var(--w98-highlight);
  }

  .desktop-drop-icon {
    font-size: 32px;
    font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
  }

  /* ── Settings Window Toolbar ── */
  .settings-body {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }
  .settings-toolbar {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 2px 4px;
    background: var(--w98-surface);
    border-bottom: 1px solid var(--w98-shadow-808);
    flex-shrink: 0;
  }
  .settings-toolbar :global(.load-new-btn) {
    display: flex;
    align-items: center;
    gap: 3px;
    padding: 2px 6px;
    font-size: var(--w98-font-size-base);
    font-family: inherit;
    background: var(--w98-surface);
    border: none;
    box-shadow: none;
    cursor: pointer;
    white-space: nowrap;
  }
  .settings-toolbar :global(.load-new-btn:hover) {
    box-shadow: var(--w98-outset-thin);
  }
  .settings-toolbar :global(.load-new-btn:active) {
    box-shadow: var(--w98-inset-thin);
  }
</style>
