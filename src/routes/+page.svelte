<script lang="ts">
  import { onDestroy } from 'svelte';
  import Win98Window from '$lib/components/window/Win98Window.svelte';
  import ControlPanel from '$lib/components/editor/ControlPanel.svelte';
  import Taskbar from '$lib/components/window/Taskbar.svelte';
  import PaletteGallery from '$lib/components/palette/PaletteGallery.svelte';
  import MessageDialog from '$lib/components/feedback/MessageDialog.svelte';
  import BatchProcessor from '$lib/components/media/BatchProcessor.svelte';
  import HistoryPanel from '$lib/components/feedback/HistoryPanel.svelte';
  import DesktopWorkspace from '$lib/components/window/DesktopWorkspace.svelte';
  import PreviewContent from '$lib/components/editor/PreviewContent.svelte';
  import ToastNotification from '$lib/components/feedback/ToastNotification.svelte';
  import KeyboardShortcuts from '$lib/components/feedback/KeyboardShortcuts.svelte';
  import ContextMenu, { type ContextMenuEntry } from '$lib/components/feedback/ContextMenu.svelte';
  import { createWindowStore, WINDOW_CONFIGS } from '$lib/stores/windowStore.svelte';
  import { createZoomPan } from '$lib/stores/zoomPanStore.svelte';
  import { createImageProcessingStore } from '$lib/stores/imageProcessingStore.svelte';
  import { registerPaletteTranslator } from '$lib/utils/palettes';
  import { exportSvg, exportSpritesheet, exportFrameSequence, exportApng, exportAnimatedWebp } from '$lib/services/exportService';
  import type { SaveFormat } from '$lib/services/saveService';
  import type { TaskbarWindowInfo } from '$lib/components/window/Taskbar.svelte';
  import type { ProcessingSettings, WindowId } from '$lib/types';
  import { i18n } from '$lib/i18n/index.svelte';
  import { getWindowTitle } from '$lib/stores/windowStore.svelte';
  import { getMobileWindowSlot, getNextMobileFocusId } from '$lib/utils/mobileWindowLayout';

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

  // ─── Context Menu ───
  let ctxMenu = $state<{ x: number; y: number; items: ContextMenuEntry[] } | null>(null);

  function handlePreviewContextMenu(e: MouseEvent) {
    if (!ip.processedImageSrc) return;
    e.preventDefault();
    const menuItems: ContextMenuEntry[] = [
      { label: `💾 ${i18n.t('save')}`, icon: '', action: () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true })); } },
      { label: `📋 ${i18n.t('copy')}`, icon: '', action: async () => {
        try {
          const resp = await fetch(ip.processedImageSrc!);
          const blob = await resp.blob();
          await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
          enqueueToast(i18n.t('copied_to_clipboard'), 'success');
        } catch { enqueueToast(i18n.t('copy_failed'), 'error'); }
      }},
      { separator: true },
      { label: `↔ ${i18n.t('compare')}`, icon: '', action: () => { compareMode = !compareMode; } },
      { label: `🔲 ${i18n.t('tile_mode')}`, icon: '', action: () => { tileMode = !tileMode; } },
      { separator: true },
      { label: `↩ ${i18n.t('undo')}`, icon: '', action: () => ip.undo(), disabled: ip.settingsHistory.length === 0 },
      { label: `↪ ${i18n.t('redo')}`, icon: '', action: () => ip.redo(), disabled: ip.redoHistory.length === 0 },
    ];
    ctxMenu = { x: e.clientX, y: e.clientY, items: menuItems };
  }

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
  const mqlLandscape = typeof window !== 'undefined'
    ? window.matchMedia(`(max-width: 900px) and (orientation: landscape)`)
    : null;
  let isLandscapeMobile = $state(mqlLandscape?.matches ?? false);
  $effect(() => {
    if (!mql) return;
    const handler = (e: MediaQueryListEvent) => { isMobile = e.matches; };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  });
  $effect(() => {
    if (!mqlLandscape) return;
    const handler = (e: MediaQueryListEvent) => { isLandscapeMobile = e.matches; };
    mqlLandscape.addEventListener('change', handler);
    return () => mqlLandscape.removeEventListener('change', handler);
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
    return getMobileWindowSlot({
      id: id as WindowId,
      isMobile,
      isLandscapeMobile,
      visibleIds: mobileVisibleIds as WindowId[],
      focusedId: wm.focusedWindow,
    });
  }

  function focusAdjacentMobileWindow(direction: 'prev' | 'next') {
    const nextId = getNextMobileFocusId(
      mobileVisibleIds as WindowId[],
      wm.focusedWindow,
      direction,
    );
    if (nextId) wm.focusWindow(nextId);
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
  let processingProgress = $derived(ip.processingProgress);
  let processingStartTime = $derived(ip.processingStartTime);

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
  function handleDesktopDrop(file: File) {
    if (ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      handleImageSelected(file);
    } else {
      showDialog(i18n.t('unsupported_format'), i18n.t('error'));
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
<DesktopWorkspace
  {selectedIcon}
  onIconClick={handleIconClick}
  onIconDblClick={handleIconDblClick}
  onDesktopClick={handleDesktopClick}
  onImageDropped={handleDesktopDrop}
>

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
      swipeEnabled={isMobile && mobileVisibleIds.length > 1}
      onSwipeLeft={() => focusAdjacentMobileWindow('next')}
      onSwipeRight={() => focusAdjacentMobileWindow('prev')}
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
          hasProcessedImage={!!processedImageSrc && !isProcessing}
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
      swipeEnabled={isMobile && mobileVisibleIds.length > 1}
      onSwipeLeft={() => focusAdjacentMobileWindow('next')}
      onSwipeRight={() => focusAdjacentMobileWindow('prev')}
    >
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div oncontextmenu={handlePreviewContextMenu} style="display:contents;">
      <PreviewContent
        {zp}
        originalImageSrc={originalImageSrc}
        processedImageSrc={processedImageSrc}
        isProcessing={isProcessing}
        {processingProgress}
        {processingStartTime}
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
        onGifExportSequence={async () => {
          if (!ip.gifInfo) return;
          try {
            await exportFrameSequence(ip.gifInfo);
            enqueueToast(i18n.t('sequence_exported'));
          } catch (e) {
            enqueueToast(String(e), 'error');
          }
        }}
        onGifExportApng={async () => {
          if (!ip.gifInfo) return;
          try {
            await exportApng(ip.gifInfo);
            enqueueToast(i18n.t('apng_exported'));
          } catch (e) {
            enqueueToast(String(e), 'error');
          }
        }}
        onGifExportAnimatedWebp={async () => {
          if (!ip.gifInfo) return;
          try {
            await exportAnimatedWebp(ip.gifInfo);
            enqueueToast(i18n.t('animated_webp_exported'));
          } catch (e) {
            enqueueToast(String(e), 'error');
          }
        }}
        onGifDeleteFrame={(frame) => ip.deleteGifFrame(frame)}
        onGifDuplicateFrame={(frame) => ip.duplicateGifFrame(frame)}
        onGifReorderFrame={(from, to) => ip.reorderGifFrame(from, to)}
        onRotate={(deg) => ip.rotate(deg)}
        onResetTransform={() => ip.resetTransform()}
        onCrop={(rect) => ip.setCrop(rect)}
        currentRotation={ip.rotation}
        hasCrop={ip.cropRect !== null}
      />
      </div>
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
      swipeEnabled={isMobile && mobileVisibleIds.length > 1}
      onSwipeLeft={() => focusAdjacentMobileWindow('next')}
      onSwipeRight={() => focusAdjacentMobileWindow('prev')}
    >
      <PaletteGallery
        selectedPaletteId={processingSettings.palette}
        onSelect={handleGallerySelect}
        imageSrc={ip.originalImageSrc}
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
      swipeEnabled={isMobile && mobileVisibleIds.length > 1}
      onSwipeLeft={() => focusAdjacentMobileWindow('next')}
      onSwipeRight={() => focusAdjacentMobileWindow('prev')}
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
      swipeEnabled={isMobile && mobileVisibleIds.length > 1}
      onSwipeLeft={() => focusAdjacentMobileWindow('next')}
      onSwipeRight={() => focusAdjacentMobileWindow('prev')}
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
</DesktopWorkspace>

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

<!-- ═══ Context Menu ═══ -->
{#if ctxMenu}
  <ContextMenu
    items={ctxMenu.items}
    x={ctxMenu.x}
    y={ctxMenu.y}
    onClose={() => { ctxMenu = null; }}
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

<!-- ═══ Mobile Undo/Redo Floating Buttons ═══ -->
{#if isMobile && ip.originalImageSrc}
  <div class="mobile-undo-redo">
    <button
      class="mobile-undo-btn"
      onclick={() => ip.undo()}
      disabled={ip.settingsHistory.length === 0}
      aria-label={i18n.t('undo')}
    >↩</button>
    <button
      class="mobile-redo-btn"
      onclick={() => ip.redo()}
      disabled={ip.redoHistory.length === 0}
      aria-label={i18n.t('redo')}
    >↪</button>
  </div>
{/if}

<style>
  /* ── Mobile Undo/Redo Floating ── */
  .mobile-undo-redo {
    position: fixed;
    bottom: 40px;
    left: 8px;
    display: flex;
    gap: 4px;
    z-index: 9990;
  }
  .mobile-undo-redo button {
    width: 36px;
    height: 36px;
    font-size: 18px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--w98-surface);
    box-shadow: var(--w98-outset-thin);
    border: none;
    cursor: pointer;
  }
  .mobile-undo-redo button:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .mobile-undo-redo button:active:not(:disabled) {
    box-shadow: var(--w98-inset-thin);
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
