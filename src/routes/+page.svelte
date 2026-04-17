<script lang="ts">
  import { browser } from '$app/environment';
  import { onDestroy } from 'svelte';
  import Win98Window from '$lib/components/window/Win98Window.svelte';
  import ControlPanel from '$lib/components/editor/ControlPanel.svelte';
  import Taskbar from '$lib/components/window/Taskbar.svelte';
  import PaletteGallery from '$lib/components/palette/PaletteGallery.svelte';
  import MessageDialog from '$lib/components/feedback/MessageDialog.svelte';
  import BatchProcessor from '$lib/components/media/BatchProcessor.svelte';
  import HistoryPanel from '$lib/components/feedback/HistoryPanel.svelte';
  import PosterMaker from '$lib/components/poster/PosterMaker.svelte';
  import RetroCam from '$lib/components/retrocam/RetroCam.svelte';
  import DesktopWorkspace from '$lib/components/window/DesktopWorkspace.svelte';
  import PreviewContent from '$lib/components/editor/PreviewContent.svelte';
  import ToastNotification from '$lib/components/feedback/ToastNotification.svelte';
  import KeyboardShortcuts from '$lib/components/feedback/KeyboardShortcuts.svelte';
  import ContextMenu, { type ContextMenuEntry } from '$lib/components/feedback/ContextMenu.svelte';
  import { createWindowStore, windowConfigs } from '$lib/stores/windowStore.svelte';
  import { createZoomPan } from '$lib/stores/zoomPanStore.svelte';
  import { createImageProcessingStore } from '$lib/stores/imageProcessingStore.svelte';
  import { registerPaletteTranslator } from '$lib/utils/palettes';
  import { exportSvg, exportSpritesheet, exportFrameSequence, exportApng, exportAnimatedSvg, exportAnimatedWebp } from '$lib/services/exportService';
  import type { SaveFormat } from '$lib/services/saveService';
  import type { TaskbarWindowInfo } from '$lib/components/window/Taskbar.svelte';
  import type { ProcessingSettings, WindowId } from '$lib/types';
  import { i18n } from '$lib/i18n/index.svelte';
  import { getWindowTitle, getShellProgramLaunchLabel } from '$lib/stores/windowStore.svelte';
  import { getMobileWindowSlot, getNextMobileFocusId } from '$lib/utils/mobileWindowLayout';
  import { applyCloudPresetByShortId } from '$lib/services/cloudPresetService';
  import { importSharedPreset } from '$lib/stores/sharedPresetStore.svelte';
  import { getProjectStorageAdapter } from '$lib/projects/runtime';
  import { getHandoffBus } from '$lib/handoffs/runtime';
  import { launchPosterMakerFromPixelLab } from '$lib/handoffs/pixelLabToPosterMakerFlow';
  import { launchPixelLabFromRetroCam } from '$lib/handoffs/retroCamToPixelLabFlow';
  import { launchPosterMakerFromRetroCam } from '$lib/handoffs/retroCamToPosterMakerFlow';
  import { consumePixelLabCaptureHandoff } from '$lib/handoffs/consumePixelLabCaptureHandoff';
  import { openRecentProjectFromShell } from '$lib/projects/openRecentProject';
  import type { RecentProjectEntryV1 } from '$lib/projects/schema';
  import { retroCamStore, type RetroCamPresetId } from '$lib/stores/retroCamStore.svelte';
  import { posterMakerStore } from '$lib/stores/posterMakerStore.svelte';
  import { buildPreviewContextMenu } from '$lib/shell/previewContextMenu';
  import { dialogStore } from '$lib/stores/dialogStore.svelte';

  // Register i18n translator for palette names
  registerPaletteTranslator((key) => i18n.t(key));

  // ─── Stores ───
  const wm = createWindowStore();
  const zp = createZoomPan();
  const ip = createImageProcessingStore();
  const projectStorage = getProjectStorageAdapter();
  const handoffBus = getHandoffBus();

  // Toast queue: max 3 items, drop oldest if exceeded
  const toastQueueMax = 3;
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
      while (toastQueue.length > toastQueueMax) {
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
  let shellRecentProjects = $state<RecentProjectEntryV1[]>([]);

  // ─── Context Menu ───
  let ctxMenu = $state<{ x: number; y: number; items: ContextMenuEntry[] } | null>(null);

  function handlePreviewContextMenu(e: MouseEvent) {
    if (!ip.processedImageSrc) return;
    e.preventDefault();
    const menuItems: ContextMenuEntry[] = buildPreviewContextMenu({
      strings: {
        save: i18n.t('save'),
        copy: i18n.t('copy'),
        compare: i18n.t('compare'),
        tileMode: i18n.t('tile_mode'),
        undo: i18n.t('undo'),
        redo: i18n.t('redo'),
        openWith: i18n.t('open_with'),
        sendToPosterMaker: i18n.t('send_to_poster_maker'),
      },
      actions: {
        onSave: () => {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true }));
        },
        onCopy: async () => {
          try {
            const resp = await fetch(ip.processedImageSrc!);
            const blob = await resp.blob();
            await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
            enqueueToast(i18n.t('copied_to_clipboard'), 'success');
          } catch {
            enqueueToast(i18n.t('copy_failed'), 'error');
          }
        },
        onToggleCompare: () => {
          compareMode = !compareMode;
        },
        onToggleTileMode: () => {
          tileMode = !tileMode;
        },
        onUndo: () => ip.undo(),
        onRedo: () => ip.redo(),
        onSendToPosterMaker: () => {
          void handleSendToPosterMaker();
        },
      },
      canUndo: ip.settingsHistory.length > 0,
      canRedo: ip.redoHistory.length > 0,
    });
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
  const mobileBreakpoint = 550;
  const mql = typeof window !== 'undefined' ? window.matchMedia(`(max-width: ${mobileBreakpoint}px)`) : null;
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
  const windowOrder = ['preview', 'poster_maker', 'retrocam', 'settings', 'gallery', 'batch', 'history'] as const;
  let mobileVisibleIds = $derived(
    windowOrder.filter(id => wm.wins[id].mode !== 'closed' && wm.wins[id].mode !== 'minimized')
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
    windowConfigs.map(c => ({
      id: c.id, title: getWindowTitle(c.id), icon: c.icon,
      mode: wm.wins[c.id].mode, focused: wm.focusedWindow === c.id,
    }))
  );

  async function refreshShellRecentProjects() {
    const recentProjects = await projectStorage.listRecentProjects({ limit: 6 });
    shellRecentProjects = recentProjects.filter((entry) => (
      entry.appId === 'poster-maker' || entry.appId === 'pixel-lab' || entry.appId === 'retrocam'
    ));
  }

  $effect(() => {
    if (!browser) return;
    void refreshShellRecentProjects();
  });

  $effect(() => {
    const posterRecentProjects = posterMakerStore.recentProjects;
    void posterRecentProjects;
    if (!browser) return;
    void refreshShellRecentProjects();
  });

  // ─── Convenience aliases for template ───
  let originalImageSrc = $derived(ip.originalImageSrc);
  let processedImageSrc = $derived(ip.processedImageSrc);
  let isProcessing = $derived(ip.isProcessing);
  let processingSettings = $derived(ip.settings);
  let saveFormat = $derived(ip.saveFormat);
  let saveQuality = $derived(ip.saveQuality);
  let processingProgress = $derived(ip.processingProgress);
  let processingStartTime = $derived(ip.processingStartTime);
  let handledIncomingSharedPreset = $state(false);
  let handledIncomingCloudPreset = $state(false);

  function consumeIncomingSharedPreset() {
    if (!browser || handledIncomingSharedPreset) return;
    handledIncomingSharedPreset = true;

    const url = new URL(window.location.href);
    const presetParam = url.searchParams.get('preset');
    if (!presetParam) return;

    try {
      const sharedPreset = importSharedPreset(url.toString());
      ip.updateSettings({
        ...sharedPreset.settings,
        glitchFilters: sharedPreset.settings.glitchFilters.map((filter) => ({ ...filter })),
        effectLayers: sharedPreset.settings.effectLayers?.map((layer) => ({ ...layer })) ?? [],
      });
      enqueueToast(i18n.t('preset_share_imported'));
      url.searchParams.delete('preset');
      window.history.replaceState({}, '', url.toString());
      wm.openWindow('settings');
    } catch {
      enqueueToast(i18n.t('preset_error_invalid_share'), 'error');
      url.searchParams.delete('preset');
      window.history.replaceState({}, '', url.toString());
    }
  }

  $effect(() => {
    consumeIncomingSharedPreset();
  });

  async function consumeIncomingCloudPreset() {
    if (!browser || handledIncomingCloudPreset) return;
    handledIncomingCloudPreset = true;

    const url = new URL(window.location.href);
    const cloudPresetParam = url.searchParams.get('cloudPreset');
    if (!cloudPresetParam) return;

    try {
      const cloudPreset = await applyCloudPresetByShortId(cloudPresetParam);
      if (!cloudPreset) throw new Error('missing');

      ip.updateSettings({
        ...cloudPreset.settings,
        glitchFilters: cloudPreset.settings.glitchFilters.map((filter) => ({ ...filter })),
        effectLayers: cloudPreset.settings.effectLayers?.map((layer) => ({ ...layer })) ?? [],
      });
      enqueueToast(i18n.t('cloud_preset_applied'));
      url.searchParams.delete('cloudPreset');
      window.history.replaceState({}, '', url.toString());
      wm.openWindow('settings');
    } catch {
      enqueueToast(i18n.t('cloud_preset_not_found'), 'error');
      url.searchParams.delete('cloudPreset');
      window.history.replaceState({}, '', url.toString());
    }
  }

  $effect(() => {
    void consumeIncomingCloudPreset();
  });

  $effect(() => {
    const pending = handoffBus.current;
    if (!pending || pending.toAppId !== 'pixel-lab' || pending.intent !== 'edit_capture') return;
    void consumePixelLabCaptureHandoff({
      handoffBus,
      projectStorage,
      loadImage: (file) => handleImageSelected(file),
      notifyMissingAsset: (message) => enqueueToast(message, 'error'),
      missingAssetMessage: i18n.t('retrocam_open_in_pixel_lab_missing'),
    });
  });

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

  function showDialog(message: string, title = i18n.t('dialog_notice_title')) {
    dialogStore.showNotice(message, title);
  }

  function showErrorDialog(message: string) {
    dialogStore.showError(message, i18n.t('dialog_error_title'));
  }

  async function handleSave() {
    try {
      const message = await ip.save();
      if (message) enqueueToast(message);
    } catch (err) {
      console.error('Failed to save file:', err);
      showErrorDialog(i18n.t('save_error'));
    }
  }

  async function handleShare() {
    try {
      const message = await ip.share();
      if (message) enqueueToast(message);
    } catch (err) {
      console.error('Failed to share file:', err);
      showErrorDialog(err instanceof Error ? err.message : i18n.t('save_error'));
    }
  }

  async function handleSendToPosterMaker() {
    await launchPosterMakerFromPixelLab({
      createTransferFile: (filename) => ip.createTransferFile(filename),
      snapshot: {
        settings: ip.settings,
        postFilters: ip.postFilters,
        rotation: ip.rotation,
        cropRect: ip.cropRect,
        saveFormat: ip.saveFormat,
        saveQuality: ip.saveQuality,
      },
      projectStorage,
      handoffBus,
      openPosterMaker: () => wm.openWindow('poster_maker'),
      notify: (message) => enqueueToast(message),
      successMessage: i18n.t('send_to_poster_maker'),
    });
  }

  async function handleOpenRetroCamSnapshotInPixelLab(file: File, presetId: RetroCamPresetId) {
    await launchPixelLabFromRetroCam({
      snapshotFile: file,
      activePresetId: presetId,
      projectStorage,
      handoffBus,
      openPixelLab: () => {
        wm.openWindow('settings');
        wm.openWindow('preview');
      },
      notify: (message) => enqueueToast(message),
      successMessage: i18n.t('retrocam_sent_to_pixel_lab'),
    });
  }

  async function handleUseRetroCamSnapshotInPosterMaker(file: File, presetId: RetroCamPresetId) {
    await launchPosterMakerFromRetroCam({
      snapshotFile: file,
      activePresetId: presetId,
      projectStorage,
      handoffBus,
      openPosterMaker: () => wm.openWindow('poster_maker'),
      notify: (message) => enqueueToast(message),
      successMessage: i18n.t('retrocam_sent_to_poster_maker'),
    });
  }

  async function handleExportSvg() {
    if (!ip.processedImageSrc) return;
    try {
      await exportSvg(ip.processedImageSrc, ip.getLastCanvas());
      enqueueToast(i18n.t('svg_exported'));
    } catch (err) {
      console.error('SVG export error:', err);
      showErrorDialog(i18n.t('save_error'));
    }
  }

  async function handleExportSpritesheet() {
    if (!ip.gifInfo || ip.gifInfo.frames.length === 0) return;
    try {
      await exportSpritesheet(ip.gifInfo);
      enqueueToast(i18n.t('spritesheet_exported'));
    } catch (err) {
      console.error('Spritesheet export error:', err);
      showErrorDialog(i18n.t('save_error'));
    }
  }

  function handleFormatChange(format: SaveFormat) { ip.setFormat(format); }
  function handleQualityChange(quality: number) { ip.setQuality(quality); }

  async function handleLoadNewImage() {
    if (originalImageSrc) {
      const shouldLoad = await dialogStore.requestConfirm({
        title: i18n.t('confirm_load_new_title'),
        message: i18n.t('confirm_load_new_image'),
        confirmLabel: i18n.t('load_new_image'),
        cancelLabel: i18n.t('cancel'),
      });
      if (shouldLoad) {
        ip.loadNewImage();
      }
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
  const acceptedImageTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/bmp', 'image/webp'];
  function handleDesktopDrop(file: File) {
    if (acceptedImageTypes.includes(file.type)) {
      handleImageSelected(file);
    } else {
      showErrorDialog(i18n.t('unsupported_format'));
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

  function getRecentProjectIcon(entry: RecentProjectEntryV1): string {
    switch (entry.appId) {
      case 'poster-maker':
        return '📰';
      case 'pixel-lab':
        return '🖼️';
      case 'retrocam':
        return '📷';
    }
  }

  async function handleOpenRecentProject(entry: RecentProjectEntryV1) {
    await openRecentProjectFromShell({
      entry,
      loadPixelLabProject: async (projectId) => {
        const manifest = await projectStorage.loadProject(projectId);
        if (!manifest || manifest.appId !== 'pixel-lab' || manifest.programState.kind !== 'pixel-lab') {
          return null;
        }

        const assetId = manifest.primaryAssetId
          ?? manifest.previewAssetId
          ?? manifest.programState.activeSourceAssetId
          ?? manifest.programState.lastProcessedAssetId;
        if (!assetId) return null;

        const resolved = await projectStorage.resolveAsset(assetId);
        if (!resolved) return null;

        const restoredFile = new File(
          [resolved.blob],
          resolved.asset.filename ?? 'pixel-lab-project.png',
          { type: resolved.asset.mimeType || resolved.blob.type || 'image/png' },
        );
        await ip.loadPixelLabProject(manifest, restoredFile);
        return manifest;
      },
      loadPosterProject: (projectId) => posterMakerStore.loadProject(projectId),
      loadRetroCamProject: (projectId) => retroCamStore.loadProject(projectId),
      openWindow: (id) => wm.openWindow(id),
      notifySuccess: (message) => enqueueToast(message),
      notifyError: (message) => enqueueToast(message, 'error'),
      messages: {
        pixelLabProjectReopened: i18n.t('pixel_lab_project_reopened'),
        pixelLabProjectMissing: i18n.t('pixel_lab_project_missing'),
        posterProjectReopened: i18n.t('poster_project_reopened'),
        posterProjectMissing: i18n.t('poster_project_missing'),
        retroCamProjectReopened: i18n.t('retrocam_project_reopened'),
        retroCamProjectMissing: i18n.t('retrocam_project_missing'),
        projectUnsupported: i18n.t('start_recent_projects_unsupported'),
      },
    });
  }

  function handleStartClick(event: MouseEvent) {
    const button = event.currentTarget as HTMLElement | null;
    const rect = button?.getBoundingClientRect();
    const launchItems: ContextMenuEntry[] = [
      {
        label: i18n.t('start_programs'),
        icon: '⊞',
        action: () => {},
        disabled: true,
      },
      {
        label: getShellProgramLaunchLabel('preview'),
        icon: '🖼️',
        action: () => wm.openWindow('preview'),
      },
      {
        label: getShellProgramLaunchLabel('poster_maker'),
        icon: '📰',
        action: () => wm.openWindow('poster_maker'),
      },
      {
        label: getShellProgramLaunchLabel('retrocam'),
        icon: '📷',
        action: () => wm.openWindow('retrocam'),
      },
      { separator: true },
      {
        label: i18n.t('start_recent_projects'),
        icon: '🗂️',
        action: () => {},
        disabled: true,
      },
    ];

    const recentItems: ContextMenuEntry[] = shellRecentProjects.length > 0
      ? shellRecentProjects.map((entry) => ({
          label: entry.name,
          icon: getRecentProjectIcon(entry),
          action: () => {
            void handleOpenRecentProject(entry);
          },
        }))
      : [{
          label: i18n.t('start_recent_projects_empty'),
          icon: '·',
          action: () => {},
          disabled: true,
        }];

    const menuItems = [...launchItems, ...recentItems];
    const estimatedHeight = menuItems.length * 28 + 12;
    ctxMenu = {
      x: rect?.left ?? 4,
      y: Math.max(8, (rect?.top ?? window.innerHeight) - estimatedHeight),
      items: menuItems,
    };
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
          <span class="settings-toolbar-label">{i18n.t('pixel_lab_utilities')}</span>
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
          <button
            class="load-new-btn"
            onclick={(e) => { e.stopPropagation(); wm.openWindow('gallery'); }}
          >
            <span aria-hidden="true">🎨</span> {i18n.t('win_gallery')}
          </button>
          <button
            class="load-new-btn"
            onclick={(e) => { e.stopPropagation(); wm.openWindow('batch'); }}
          >
            <span aria-hidden="true">📦</span> {i18n.t('win_batch')}
          </button>
          <button
            class="load-new-btn"
            onclick={(e) => { e.stopPropagation(); wm.openWindow('history'); }}
          >
            <span aria-hidden="true">⏱️</span> {i18n.t('win_history')}
          </button>
        </div>
        <ControlPanel
          bind:settings={processingSettings}
          bind:postFilters={ip.postFilters}
          bind:autoProcess={ip.autoProcess}
          imageSrc={originalImageSrc}
          hasUnappliedChanges={ip.hasUnappliedChanges}
          {saveFormat}
          {saveQuality}
          hasImage={!!originalImageSrc}
          hasProcessedImage={!!processedImageSrc && !isProcessing}
          onChange={handleSettingsChange}
          onSave={handleSave}
          onShare={handleShare}
          onExportSvg={handleExportSvg}
          onSendToPosterMaker={handleSendToPosterMaker}
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
        onError={(msg) => showErrorDialog(msg)}
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
        onGifExportAnimatedSvg={async () => {
          if (!ip.gifInfo) return;
          try {
            await exportAnimatedSvg(ip.gifInfo);
            enqueueToast(i18n.t('animated_svg_exported'));
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

  <!-- ═══ Poster Maker Window ═══ -->
  {#if wm.wins.poster_maker.mode !== 'closed'}
    <Win98Window
      title={getWindowTitle('poster_maker')}
      icon="📰"
      bind:mode={wm.wins.poster_maker.mode}
      bind:x={wm.wins.poster_maker.x}
      bind:y={wm.wins.poster_maker.y}
      bind:width={wm.wins.poster_maker.w}
      bind:height={wm.wins.poster_maker.h}
      zIndex={wm.wins.poster_maker.z}
      mobileSlot={getMobileSlot('poster_maker')}
      menuItems={[i18n.t('menu_file'), i18n.t('menu_view'), i18n.t('menu_help')]}
      onClose={() => wm.close('poster_maker')}
      onFocus={() => wm.focusWindow('poster_maker')}
      onLayoutChange={wm.persistLayout}
      swipeEnabled={isMobile && mobileVisibleIds.length > 1}
      onSwipeLeft={() => focusAdjacentMobileWindow('next')}
      onSwipeRight={() => focusAdjacentMobileWindow('prev')}
    >
      <PosterMaker
        onMessage={(msg) => enqueueToast(msg)}
        onError={(msg) => showErrorDialog(msg)}
        onSwitchToPixelLab={async () => {
          const sourceProjectId = posterMakerStore.sourceContext?.sourceProjectId;
          if (sourceProjectId) {
            await handleOpenRecentProject({
              projectId: sourceProjectId,
              appId: 'pixel-lab',
              name: posterMakerStore.sourceContext?.sourceLabel ?? 'Pixel Lab Transfer',
              lastOpenedAt: new Date().toISOString(),
            });
            return;
          }

          wm.openWindow('settings');
          wm.openWindow('preview');
          enqueueToast(i18n.t('poster_switch_to_pixel_lab_done'));
        }}
      />
    </Win98Window>
  {/if}

  <!-- ═══ RetroCam Window ═══ -->
  {#if wm.wins.retrocam.mode !== 'closed'}
    <Win98Window
      title={getWindowTitle('retrocam')}
      icon="📷"
      bind:mode={wm.wins.retrocam.mode}
      bind:x={wm.wins.retrocam.x}
      bind:y={wm.wins.retrocam.y}
      bind:width={wm.wins.retrocam.w}
      bind:height={wm.wins.retrocam.h}
      zIndex={wm.wins.retrocam.z}
      mobileSlot={getMobileSlot('retrocam')}
      menuItems={[i18n.t('menu_file'), i18n.t('menu_view'), i18n.t('menu_help')]}
      onClose={() => wm.close('retrocam')}
      onFocus={() => wm.focusWindow('retrocam')}
      onLayoutChange={wm.persistLayout}
      swipeEnabled={isMobile && mobileVisibleIds.length > 1}
      onSwipeLeft={() => focusAdjacentMobileWindow('next')}
      onSwipeRight={() => focusAdjacentMobileWindow('prev')}
    >
      <RetroCam
        onMessage={(msg) => enqueueToast(msg)}
        onError={(msg) => showErrorDialog(msg)}
        onOpenInPixelLab={handleOpenRetroCamSnapshotInPixelLab}
        onUseInPosterMaker={handleUseRetroCamSnapshotInPosterMaker}
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
        onError={(msg) => showErrorDialog(msg)}
        onMessage={(msg) => enqueueToast(msg)}
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
  onStartClick={handleStartClick}
/>

<!-- ═══ Dialog ═══ -->
{#if dialogStore.currentDialog}
  <MessageDialog
    message={dialogStore.currentDialog.message}
    title={dialogStore.currentDialog.title}
    confirmLabel={dialogStore.currentDialog.confirmLabel}
    cancelLabel={dialogStore.currentDialog.cancelLabel}
    onConfirm={dialogStore.currentDialog.isConfirm ? () => dialogStore.confirmDialog() : undefined}
    onClose={() => dialogStore.closeDialog()}
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
  .settings-toolbar-label {
    display: inline-flex;
    align-items: center;
    align-self: stretch;
    padding: 0 6px;
    margin-right: 2px;
    background: var(--w98-surface-active);
    color: var(--w98-text-secondary);
    border-right: 1px solid var(--w98-shadow-808);
    font-size: var(--w98-font-size-sm);
    font-weight: bold;
    white-space: nowrap;
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
  @media (max-width: 700px) {
    .settings-toolbar-label {
      display: none;
    }
  }
</style>
