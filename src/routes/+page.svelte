<script lang="ts">
  import { browser } from '$app/environment';
  import { onDestroy } from 'svelte';
  import Win98Window from '$lib/components/window/Win98Window.svelte';
  import ControlPanel from '$lib/components/editor/ControlPanel.svelte';
  import Taskbar from '$lib/components/window/Taskbar.svelte';
  import MessageDialog from '$lib/components/feedback/MessageDialog.svelte';
  import DesktopWorkspace from '$lib/components/window/DesktopWorkspace.svelte';
  import PreviewContent from '$lib/components/editor/PreviewContent.svelte';
  import ToastNotification from '$lib/components/feedback/ToastNotification.svelte';
  import KeyboardShortcuts from '$lib/components/feedback/KeyboardShortcuts.svelte';
  import ContextMenu, { type ContextMenuEntry } from '$lib/components/feedback/ContextMenu.svelte';
  import {
    createWindowStore,
    desktopWindowConfigs,
    getShellProgramSummary,
    getWindowTitle,
    mobileWindowOrder,
    windowConfigs,
  } from '$lib/stores/windowStore.svelte';
  import { createZoomPan } from '$lib/stores/zoomPanStore.svelte';
  import { createImageProcessingStore } from '$lib/stores/imageProcessingStore.svelte';
  import { registerPaletteTranslator } from '$lib/utils/palettes';
  import {
    exportSvg,
    exportSpritesheet,
    exportFrameSequence,
    exportApng,
    exportAnimatedSvg,
    exportAnimatedWebp,
  } from '$lib/services/exportService';
  import type { SaveFormat } from '$lib/services/saveService';
  import type { TaskbarWindowInfo } from '$lib/components/window/Taskbar.svelte';
  import type { ProcessingSettings, WindowId } from '$lib/types';
  import { i18n } from '$lib/i18n/index.svelte';
  import { getMobileWindowSlot, getNextMobileFocusId } from '$lib/utils/mobileWindowLayout';
  import { applyCloudPresetByShortId } from '$lib/services/cloudPresetService';
  import { importSharedPreset } from '$lib/stores/sharedPresetStore.svelte';
  import { getProjectStorageAdapter } from '$lib/projects/runtime';
  import { getHandoffBus } from '$lib/handoffs/runtime';
  import { launchPixelLabFromRetroCam } from '$lib/handoffs/retroCamToPixelLabFlow';
  import { consumePixelLabCaptureHandoff } from '$lib/handoffs/consumePixelLabCaptureHandoff';
  import { openRecentProjectFromShell } from '$lib/projects/openRecentProject';
  import type { RecentProjectEntryV1 } from '$lib/projects/schema';
  import { retroCamStore, type RetroCamPresetId } from '$lib/stores/retroCamStore.svelte';

  import {
    buildExportViewModel,
    type ExportViewModel,
    type ExportPrimaryActionId,
    type ExportSecondaryActionId,
  } from '$lib/utils/exportHierarchy';
  import { detectExportCapability } from '$lib/utils/exportCapability';
  import { replacePrimaryModifierShortcutLabel } from '$lib/utils/platformShortcuts';
  import ExportRegion from '$lib/components/editor/ExportRegion.svelte';

  import { buildPreviewContextMenu } from '$lib/shell/previewContextMenu';
  import { dialogStore } from '$lib/stores/dialogStore.svelte';
  import { validateImageFile } from '$lib/utils/imageFileValidation';
  import { canWriteImageToClipboard } from '$lib/utils/clipboardSupport';
  import { getShellShortcutAction } from '$lib/utils/shellShortcuts';
  type PaletteGalleryComponent =
    typeof import('$lib/components/palette/PaletteGallery.svelte').default;
  type BatchProcessorComponent =
    typeof import('$lib/components/media/BatchProcessor.svelte').default;
  type HistoryPanelComponent =
    typeof import('$lib/components/feedback/HistoryPanel.svelte').default;
  type RetroCamComponent = typeof import('$lib/components/retrocam/RetroCam.svelte').default;

  // Register i18n translator for palette names
  registerPaletteTranslator((key) => i18n.t(key));

  // ─── Stores ───
  const wm = createWindowStore();
  const zp = createZoomPan();
  const ip = createImageProcessingStore();
  const projectStorage = getProjectStorageAdapter();
  const handoffBus = getHandoffBus();

  // ─── Export ViewModel ───
  let saveInFlight = $state(false);
  let exportCapability = $state(detectExportCapability());
  let primaryShortcutHint = $derived(
    replacePrimaryModifierShortcutLabel(i18n.t('shortcut_hint_save')),
  );

  let exportViewModel: ExportViewModel = $derived(
    buildExportViewModel({
      snapshot: {
        hasLoadedImage: !!ip.originalImageSrc,
        hasProcessedImage: !!ip.processedImageSrc && !ip.isProcessing,
        hasUnappliedChanges: ip.hasUnappliedChanges,
        autoProcess: ip.autoProcess,
        stillSaveBusy: saveInFlight,
        animationSaveBusy: ip.gifIsExporting,
        mediaKind:
          ip.isGif && ip.gifFrameCount > 1 ? 'animation' : ip.processedImageSrc ? 'still' : 'none',
        saveFormat: ip.saveFormat,
        saveQuality: ip.saveQuality,
        exportHistory: ip.exportHistory,
      },
      capability: exportCapability,
      t: (key, ...args) => i18n.t(key as never, ...(args as [])),
      primaryShortcutHint,
    }),
  );

  // ─── Media-kind transition focus management (Requirement 5.8) ───
  let currentPrimaryId: ExportPrimaryActionId | null = null;
  $effect(() => {
    const nextId = exportViewModel.primary?.id ?? null;
    if (!currentPrimaryId) {
      currentPrimaryId = nextId;
      return;
    }
    if (currentPrimaryId !== nextId) {
      const target =
        document.querySelector<HTMLElement>('[data-testid="export-primary-action"]') ??
        document.querySelector<HTMLElement>('[data-testid="preview-export-primary-action"]');
      if (target && document.activeElement && target !== document.activeElement) {
        const focusHoldsInsideExportSurface =
          (document.activeElement as HTMLElement).closest('[data-testid="export-region"]') ||
          (document.activeElement as HTMLElement).closest('.preview-bottom-stack');
        if (focusHoldsInsideExportSurface) target.focus();
      }
      currentPrimaryId = nextId;
    }
  });

  const lazyWindowIds = ['gallery', 'retrocam', 'batch', 'history'] as const;
  type LazyWindowId = (typeof lazyWindowIds)[number];
  let lazyWindowComponents = $state<{
    gallery: PaletteGalleryComponent | null;
    retrocam: RetroCamComponent | null;
    batch: BatchProcessorComponent | null;
    history: HistoryPanelComponent | null;
  }>({
    gallery: null,
    retrocam: null,
    batch: null,
    history: null,
  });
  let GalleryWindow = $derived(lazyWindowComponents.gallery);
  let RetroCamWindow = $derived(lazyWindowComponents.retrocam);
  let BatchWindow = $derived(lazyWindowComponents.batch);
  let HistoryWindow = $derived(lazyWindowComponents.history);

  const lazyWindowLoaders: Record<LazyWindowId, () => Promise<{ default: unknown }>> = {
    gallery: () => import('$lib/components/palette/PaletteGallery.svelte'),
    retrocam: () => import('$lib/components/retrocam/RetroCam.svelte'),
    batch: () => import('$lib/components/media/BatchProcessor.svelte'),
    history: () => import('$lib/components/feedback/HistoryPanel.svelte'),
  };

  async function ensureLazyWindowLoaded(id: LazyWindowId) {
    if (lazyWindowComponents[id]) return lazyWindowComponents[id];

    const mod = await lazyWindowLoaders[id]();
    lazyWindowComponents[id] = mod.default as never;
    return lazyWindowComponents[id];
  }

  function isLazyWindowId(id: WindowId): id is LazyWindowId {
    return (lazyWindowIds as readonly WindowId[]).includes(id);
  }

  function warmWindow(id: WindowId) {
    if (isLazyWindowId(id)) {
      void ensureLazyWindowLoaded(id);
    }
  }

  function openShellWindow(id: WindowId) {
    selectedIcon = null;
    warmWindow(id);
    wm.openWindow(id);
  }

  function getWindowLoadingIcon(id: LazyWindowId): string {
    return windowConfigs.find((config) => config.id === id)?.icon ?? '🖼️';
  }

  function getWindowLoadingSummary(id: LazyWindowId): string | null {
    const summary = getShellProgramSummary(id);
    return summary === getWindowTitle(id) ? null : summary;
  }

  // Toast queue: max 3 items, drop oldest if exceeded
  const toastQueueMax = 3;
  type ToastItem = {
    message: string;
    variant: 'success' | 'error' | 'warning';
    action?: { label: string; onclick: () => void };
  };
  let toastQueue: ToastItem[] = $state([]);
  let activeToast: ToastItem | null = $state(null);

  function enqueueToast(
    message: string,
    variant: 'success' | 'error' | 'warning' = 'success',
    action?: { label: string; onclick: () => void },
  ) {
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
  let shellRecentProjectsRefreshTimer: ReturnType<typeof setTimeout> | null = null;

  // ─── Context Menu ───
  let ctxMenu = $state<{
    x: number;
    y: number;
    items: ContextMenuEntry[];
    banner?: string | null;
    kind?: 'context' | 'start';
  } | null>(null);

  async function handleCopyProcessedImage() {
    if (!ip.processedImageSrc) return;

    try {
      if (!canWriteImageToClipboard()) {
        enqueueToast(i18n.t('copy_failed'), 'error');
        return;
      }

      const resp = await fetch(ip.processedImageSrc);
      const blob = await resp.blob();
      const ClipboardItemCtor = globalThis.ClipboardItem;
      if (!ClipboardItemCtor) throw new Error('ClipboardItem unavailable');
      await navigator.clipboard.write([new ClipboardItemCtor({ [blob.type]: blob })]);
      enqueueToast(i18n.t('copied_to_clipboard'), 'success');
    } catch {
      enqueueToast(i18n.t('copy_failed'), 'error');
    }
  }

  function handlePreviewContextMenu(e: MouseEvent) {
    if (!ip.processedImageSrc) return;
    e.preventDefault();
    const canCopyImage = canWriteImageToClipboard();
    const menuItems: ContextMenuEntry[] = buildPreviewContextMenu({
      strings: {
        save: i18n.t('save'),
        copy: i18n.t('copy'),
        compare: i18n.t('compare'),
        tileMode: i18n.t('tile_mode'),
        undo: i18n.t('undo'),
        redo: i18n.t('redo'),
      },
      actions: {
        onSave: () => {
          void handleSave();
        },
        onCopy: () => {
          void handleCopyProcessedImage();
        },
        onToggleCompare: () => {
          compareMode = !compareMode;
        },
        onToggleTileMode: () => {
          tileMode = !tileMode;
        },
        onUndo: () => ip.undo(),
        onRedo: () => ip.redo(),
      },
      canUndo: ip.settingsHistory.length > 0,
      canRedo: ip.redoHistory.length > 0,
      canCopy: canCopyImage,
    });
    ctxMenu = { x: e.clientX, y: e.clientY, items: menuItems, banner: null, kind: 'context' };
  }

  // ─── Error Handling ───
  function getUserFriendlyError(rawError: string): string {
    const lower = rawError.toLowerCase();
    if (lower.includes('worker') || lower.includes('retries exceeded'))
      return i18n.t('error_worker_crashed');
    if (lower.includes('failed to load image') || lower.includes('failed to load frame'))
      return i18n.t('error_image_load');
    if (lower.includes('2d context')) return i18n.t('error_canvas_context');
    if (lower.includes('gif export') || lower.includes('gif encoding'))
      return i18n.t('error_gif_export');
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
  const mql =
    typeof window !== 'undefined' ? window.matchMedia(`(max-width: ${mobileBreakpoint}px)`) : null;
  let isMobile = $state(mql?.matches ?? false);
  const mqlLandscape =
    typeof window !== 'undefined'
      ? window.matchMedia(`(max-width: 900px) and (orientation: landscape)`)
      : null;
  let isLandscapeMobile = $state(mqlLandscape?.matches ?? false);
  $effect(() => {
    if (!mql) return;
    const handler = (e: MediaQueryListEvent) => {
      isMobile = e.matches;
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  });
  $effect(() => {
    if (!mqlLandscape) return;
    const handler = (e: MediaQueryListEvent) => {
      isLandscapeMobile = e.matches;
    };
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
  let mobileVisibleIds = $derived(
    mobileWindowOrder.filter(
      (id) => wm.wins[id].mode !== 'closed' && wm.wins[id].mode !== 'minimized',
    ),
  );

  $effect(() => {
    if (!browser) return;

    for (const id of lazyWindowIds) {
      if (wm.wins[id].mode !== 'closed') {
        void ensureLazyWindowLoaded(id);
      }
    }
  });

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
    windowConfigs.map((c) => ({
      id: c.id,
      title: getWindowTitle(c.id),
      icon: c.icon,
      mode: wm.wins[c.id].mode,
      focused: wm.focusedWindow === c.id,
    })),
  );

  async function refreshShellRecentProjects() {
    const recentProjects = await projectStorage.listRecentProjects({ limit: 6 });
    shellRecentProjects = recentProjects.filter(
      (entry) => entry.appId === 'pixel-lab' || entry.appId === 'retrocam',
    );
  }

  function scheduleShellRecentProjectsRefresh() {
    if (!browser || shellRecentProjectsRefreshTimer) return;
    shellRecentProjectsRefreshTimer = setTimeout(() => {
      shellRecentProjectsRefreshTimer = null;
      void refreshShellRecentProjects();
    }, 120);
  }

  $effect(() => {
    if (!browser) return;
    void refreshShellRecentProjects();
  });

  $effect(() => {
    if (!browser || !projectStorage.subscribe) return;
    return projectStorage.subscribe(() => {
      scheduleShellRecentProjectsRefresh();
    });
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
      openShellWindow('settings');
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
      openShellWindow('settings');
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
    openShellWindow('preview');
  }

  function handleSettingsChange(newSettings: ProcessingSettings) {
    ip.updateSettings(newSettings);
  }

  function handleGallerySelect(paletteId: string) {
    ip.selectPalette(paletteId);
    openShellWindow('preview');
  }

  function showDialog(message: string, title = i18n.t('dialog_notice_title')) {
    dialogStore.showNotice(message, title);
  }

  function showErrorDialog(message: string) {
    dialogStore.showError(message, i18n.t('dialog_error_title'));
  }

  async function handleSave() {
    try {
      saveInFlight = true;
      const message = await ip.save();
      if (message) {
        const formatLabel = ip.saveFormat.toUpperCase();
        enqueueToast(i18n.t('export_saved_format', formatLabel), 'success');
      }
    } catch (err) {
      console.error('Failed to save file:', err);
      enqueueToast(i18n.t('export_error'), 'error');
    } finally {
      saveInFlight = false;
    }
  }

  async function handleShare() {
    try {
      const message = await ip.share();
      if (message) {
        const formatLabel = ip.saveFormat.toUpperCase();
        enqueueToast(i18n.t('export_shared_format', formatLabel), 'success');
      }
    } catch (err) {
      console.error('Failed to share file:', err);
      enqueueToast(err instanceof Error ? err.message : i18n.t('export_error'), 'error');
    }
  }

  // ─── Export Dispatchers ───
  async function handleExportPrimary() {
    if (!exportViewModel.primary || exportViewModel.primary.busy) return;
    if (exportViewModel.primary.id === 'save-still') {
      await handleSave();
    } else {
      // animation: export GIF
      try {
        const msg = await ip.exportGif();
        if (msg) enqueueToast(msg, 'success');
      } catch (err) {
        console.error('GIF export error:', err);
        enqueueToast(i18n.t('export_error'), 'error');
      }
    }
  }

  async function handleExportSecondary(id: ExportSecondaryActionId) {
    switch (id) {
      case 'share-still':
        return handleShare();
      case 'export-svg-still':
        return handleExportSvg();
      case 'export-apng':
        return handleExportApng();
      case 'export-animated-svg':
        return handleExportAnimatedSvg();
      case 'export-animated-webp':
        return handleExportAnimatedWebp();
      case 'export-spritesheet':
        return handleExportSpritesheet();
      case 'export-frame-sequence':
        return handleExportFrameSequence();
    }
  }

  async function handleExportApng() {
    if (!ip.gifInfo || ip.gifInfo.frames.length === 0) return;
    try {
      await exportApng(ip.gifInfo);
      enqueueToast(i18n.t('apng_exported'), 'success');
    } catch (err) {
      console.error('APNG export error:', err);
      enqueueToast(i18n.t('export_error'), 'error');
    }
  }

  async function handleExportAnimatedSvg() {
    if (!ip.gifInfo || ip.gifInfo.frames.length === 0) return;
    try {
      await exportAnimatedSvg(ip.gifInfo);
      enqueueToast(i18n.t('animated_svg_exported'), 'success');
    } catch (err) {
      console.error('Animated SVG export error:', err);
      enqueueToast(i18n.t('export_error'), 'error');
    }
  }

  async function handleExportAnimatedWebp() {
    if (!ip.gifInfo || ip.gifInfo.frames.length === 0) return;
    try {
      await exportAnimatedWebp(ip.gifInfo);
      enqueueToast(i18n.t('animated_webp_exported'), 'success');
    } catch (err) {
      console.error('Animated WebP export error:', err);
      enqueueToast(i18n.t('export_error'), 'error');
    }
  }

  async function handleExportFrameSequence() {
    if (!ip.gifInfo || ip.gifInfo.frames.length === 0) return;
    try {
      await exportFrameSequence(ip.gifInfo);
      enqueueToast(i18n.t('sequence_exported'), 'success');
    } catch (err) {
      console.error('Frame sequence export error:', err);
      enqueueToast(i18n.t('export_error'), 'error');
    }
  }

  async function handleOpenRetroCamSnapshotInPixelLab(file: File, presetId: RetroCamPresetId) {
    await launchPixelLabFromRetroCam({
      snapshotFile: file,
      activePresetId: presetId,
      projectStorage,
      handoffBus,
      openPixelLab: () => {
        openShellWindow('settings');
        openShellWindow('preview');
      },
      notify: (message) => enqueueToast(message),
      successMessage: i18n.t('retrocam_sent_to_pixel_lab'),
    });
  }

  async function handleExportSvg() {
    if (!ip.processedImageSrc) return;
    try {
      await exportSvg(ip.processedImageSrc, ip.getLastCanvas());
      enqueueToast(i18n.t('svg_exported'), 'success');
    } catch (err) {
      console.error('SVG export error:', err);
      enqueueToast(i18n.t('export_error'), 'error');
    }
  }

  async function handleExportSpritesheet() {
    if (!ip.gifInfo || ip.gifInfo.frames.length === 0) return;
    try {
      await exportSpritesheet(ip.gifInfo);
      enqueueToast(i18n.t('spritesheet_exported'), 'success');
    } catch (err) {
      console.error('Spritesheet export error:', err);
      enqueueToast(i18n.t('export_error'), 'error');
    }
  }

  function handleFormatChange(format: SaveFormat) {
    ip.setFormat(format);
  }
  function handleQualityChange(quality: number) {
    ip.setQuality(quality);
  }

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
      openShellWindow(id);
    } else {
      selectedIcon = id;
      warmWindow(id);
    }
  }
  function handleIconDblClick(id: WindowId) {
    openShellWindow(id);
  }
  function handleDesktopClick() {
    selectedIcon = null;
  }

  // ─── Desktop-wide Drop Zone ───
  function handleDesktopDrop(file: File) {
    const validation = validateImageFile(file);
    if (!validation.ok) {
      showErrorDialog(
        i18n.t(validation.reason === 'size' ? 'image_too_large' : 'unsupported_format'),
      );
      return;
    }

    handleImageSelected(file);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (dialogStore.currentDialog || showShortcuts || ctxMenu) {
      return;
    }

    switch (getShellShortcutAction(e)) {
      case 'redo':
        e.preventDefault();
        ip.redo();
        return;
      case 'undo':
        e.preventDefault();
        ip.undo();
        return;
      case 'save':
        e.preventDefault();
        if (exportViewModel.primary?.busy) return;
        handleExportPrimary();
        return;
      case 'copy':
        e.preventDefault();
        void handleCopyProcessedImage();
        return;
      case 'toggleShortcuts':
        showShortcuts = !showShortcuts;
        return;
      default:
        return;
    }
  }

  function getRecentProjectIcon(entry: RecentProjectEntryV1): string {
    switch (entry.appId) {
      case 'pixel-lab':
        return '🖼️';
      case 'retrocam':
        return '📷';
      default:
        return '📄';
    }
  }

  async function handleOpenRecentProject(entry: RecentProjectEntryV1) {
    await openRecentProjectFromShell({
      entry,
      loadPixelLabProject: async (projectId) => {
        const manifest = await projectStorage.loadProject(projectId);
        if (
          !manifest ||
          manifest.appId !== 'pixel-lab' ||
          manifest.programState.kind !== 'pixel-lab'
        ) {
          return null;
        }

        const assetId =
          manifest.primaryAssetId ??
          manifest.previewAssetId ??
          manifest.programState.activeSourceAssetId ??
          manifest.programState.lastProcessedAssetId;
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
      loadRetroCamProject: (projectId) => retroCamStore.loadProject(projectId),
      openWindow: (id) => openShellWindow(id),
      notifySuccess: (message) => enqueueToast(message),
      notifyError: (message) => enqueueToast(message, 'error'),
      messages: {
        pixelLabProjectReopened: i18n.t('pixel_lab_project_reopened'),
        pixelLabProjectMissing: i18n.t('pixel_lab_project_missing'),
        retroCamProjectReopened: i18n.t('retrocam_project_reopened'),
        retroCamProjectMissing: i18n.t('retrocam_project_missing'),
        projectUnsupported: i18n.t('start_recent_projects_unsupported'),
      },
    });
  }

  function handleStartClick(event: MouseEvent) {
    if (ctxMenu?.kind === 'start') {
      ctxMenu = null;
      return;
    }

    for (const config of desktopWindowConfigs) {
      warmWindow(config.id);
    }

    const button = event.currentTarget as HTMLElement | null;
    const rect = button?.getBoundingClientRect();
    const launchItems: ContextMenuEntry[] = [
      {
        label: i18n.t('start_programs'),
        icon: '⊞',
        heading: true,
      },
      ...desktopWindowConfigs.map((config) => ({
        label: getWindowTitle(config.id),
        icon: config.icon,
        action: () => openShellWindow(config.id),
      })),
      { separator: true },
      {
        label: i18n.t('start_recent_projects'),
        icon: '📂',
        heading: true,
      },
    ];

    const recentItems: ContextMenuEntry[] =
      shellRecentProjects.length > 0
        ? shellRecentProjects.map((entry) => ({
            label: entry.name,
            icon: getRecentProjectIcon(entry),
            action: () => {
              void handleOpenRecentProject(entry);
            },
          }))
        : [
            {
              label: i18n.t('start_recent_projects_empty'),
              icon: '·',
              disabled: true,
            },
          ];

    const menuItems = [...launchItems, ...recentItems];
    const estimatedHeight = menuItems.length * 28 + 12;
    ctxMenu = {
      x: rect?.left ?? 4,
      y: Math.max(8, (rect?.top ?? window.innerHeight) - estimatedHeight),
      items: menuItems,
      banner: 'Retro Pixel',
      kind: 'start',
    };
  }

  onDestroy(() => {
    if (shellRecentProjectsRefreshTimer) {
      clearTimeout(shellRecentProjectsRefreshTimer);
    }
    ip.destroy();
  });
</script>

<svelte:window onkeydown={handleKeydown} />

{#snippet exportSnippet()}
  <ExportRegion
    viewModel={exportViewModel}
    onInvokePrimary={handleExportPrimary}
    onInvokeSecondary={handleExportSecondary}
    onCancelAnimationExport={() => ip.cancelGifExport()}
    onFormatChange={(fmt) => {
      ip.setFormat(fmt);
    }}
    onQualityChange={(q) => {
      ip.setQuality(q);
    }}
    onApplyNow={() => ip.applyNow()}
  />
{/snippet}

<!-- ═══ Desktop ═══ -->
<DesktopWorkspace
  {selectedIcon}
  onIconClick={handleIconClick}
  onIconDblClick={handleIconDblClick}
  onIconIntent={warmWindow}
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
      isFocused={wm.focusedWindow === 'settings'}
      mobileSlot={getMobileSlot('settings')}
      menuItems={[
        i18n.t('menu_file'),
        i18n.t('menu_edit'),
        i18n.t('menu_view'),
        i18n.t('menu_help'),
      ]}
      onClose={() => wm.close('settings')}
      onMinimize={() => wm.minimize('settings')}
      onFocus={() => wm.focusWindow('settings')}
      onLayoutChange={wm.persistLayout}
      swipeEnabled={isMobile && mobileVisibleIds.length > 1}
      onSwipeLeft={() => focusAdjacentMobileWindow('next')}
      onSwipeRight={() => focusAdjacentMobileWindow('prev')}
    >
      <div class="settings-body">
        <div class="settings-toolbar w98-toolbar">
          <span class="settings-toolbar-label w98-toolbar-label"
            >{i18n.t('pixel_lab_utilities')}</span
          >
          <button class="load-new-btn w98-button w98-button--thin" onclick={handleLoadNewImage}>
            <span class="w98-emoji" aria-hidden="true">📂</span>
            {i18n.t('load_new_image')}
          </button>
          <button
            class="load-new-btn w98-button w98-button--thin"
            onclick={(e) => {
              e.stopPropagation();
              openShellWindow('preview');
            }}
          >
            <span class="w98-emoji" aria-hidden="true">🖼️</span>
            {i18n.t('win_preview')}
          </button>
          <button
            class="load-new-btn w98-button w98-button--thin"
            onclick={(e) => {
              e.stopPropagation();
              openShellWindow('gallery');
            }}
          >
            <span class="w98-emoji" aria-hidden="true">🎨</span>
            {i18n.t('win_gallery')}
          </button>
          <button
            class="load-new-btn w98-button w98-button--thin"
            onclick={(e) => {
              e.stopPropagation();
              openShellWindow('batch');
            }}
          >
            <span class="w98-emoji" aria-hidden="true">📦</span>
            {i18n.t('win_batch')}
          </button>
          <button
            class="load-new-btn w98-button w98-button--thin"
            onclick={(e) => {
              e.stopPropagation();
              openShellWindow('history');
            }}
          >
            <span class="w98-emoji" aria-hidden="true">⏱️</span>
            {i18n.t('win_history')}
          </button>
        </div>
        <ControlPanel
          bind:settings={processingSettings}
          bind:postFilters={ip.postFilters}
          bind:autoProcess={ip.autoProcess}
          imageSrc={originalImageSrc}
          hasUnappliedChanges={ip.hasUnappliedChanges}
          hasImage={!!originalImageSrc}
          onChange={handleSettingsChange}
          onOpenGallery={() => {
            queueMicrotask(() => openShellWindow('gallery'));
          }}
          onApplyNow={() => ip.applyNow()}
          onError={(msg) => {
            enqueueToast(msg, 'error');
          }}
          export={exportSnippet}
        />
      </div>
    </Win98Window>
  {/if}

  <!-- ═══ Preview Window ═══ -->
  {#if wm.wins.preview.mode !== 'closed'}
    <Win98Window
      title={`${getWindowTitle('preview')} - ${isProcessing ? i18n.t('rendering') : i18n.t('ready')}`}
      icon="🖼️"
      bind:mode={wm.wins.preview.mode}
      bind:x={wm.wins.preview.x}
      bind:y={wm.wins.preview.y}
      bind:width={wm.wins.preview.w}
      bind:height={wm.wins.preview.h}
      zIndex={wm.wins.preview.z}
      isFocused={wm.focusedWindow === 'preview'}
      mobileSlot={getMobileSlot('preview')}
      menuItems={[
        i18n.t('menu_file'),
        i18n.t('menu_view'),
        i18n.t('menu_image'),
        i18n.t('menu_help'),
      ]}
      onClose={() => wm.close('preview')}
      onMinimize={() => wm.minimize('preview')}
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
          {originalImageSrc}
          {processedImageSrc}
          {isProcessing}
          {processingProgress}
          {processingStartTime}
          {processingSettings}
          bind:compareMode
          bind:tileMode
          colorCount={ip.colorCount}
          postFilterCss={ip.postFilterCss}
          onImageSelected={handleImageSelected}
          onError={(msg) => showErrorDialog(msg)}
          onOpenSettings={() => openShellWindow('settings')}
          isGif={ip.isGif}
          gifCurrentFrame={ip.gifCurrentFrame}
          gifFrameCount={ip.gifFrameCount}
          gifPlaying={ip.gifPlaying}
          gifIsExporting={ip.gifIsExporting}
          gifExportProgress={ip.gifProcessingProgress}
          onGifPlay={() => ip.playGif()}
          onGifPause={() => ip.pauseGif()}
          onGifSeek={(frame) => ip.seekGifFrame(frame)}
          onGifDeleteFrame={(frame) => ip.deleteGifFrame(frame)}
          onGifDuplicateFrame={(frame) => ip.duplicateGifFrame(frame)}
          onGifReorderFrame={(from, to) => ip.reorderGifFrame(from, to)}
          onRotate={(deg) => ip.rotate(deg)}
          onResetTransform={() => ip.resetTransform()}
          onCrop={(rect) => ip.setCrop(rect)}
          currentRotation={ip.rotation}
          hasCrop={ip.cropRect !== null}
          exportPrimary={exportViewModel.primary}
          onInvokeExportPrimary={handleExportPrimary}
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
      isFocused={wm.focusedWindow === 'gallery'}
      mobileSlot={getMobileSlot('gallery')}
      menuItems={[
        i18n.t('menu_file'),
        i18n.t('menu_edit'),
        i18n.t('menu_view'),
        i18n.t('menu_help'),
      ]}
      onClose={() => wm.close('gallery')}
      onMinimize={() => wm.minimize('gallery')}
      onFocus={() => wm.focusWindow('gallery')}
      onLayoutChange={wm.persistLayout}
      swipeEnabled={isMobile && mobileVisibleIds.length > 1}
      onSwipeLeft={() => focusAdjacentMobileWindow('next')}
      onSwipeRight={() => focusAdjacentMobileWindow('prev')}
    >
      {#if GalleryWindow}
        <GalleryWindow
          selectedPaletteId={processingSettings.palette}
          onSelect={handleGallerySelect}
          imageSrc={ip.originalImageSrc}
        />
      {:else}
        <div class="window-loading w98-status-panel" role="status" aria-live="polite">
          <div class="window-loading-icon" aria-hidden="true">
            {getWindowLoadingIcon('gallery')}
          </div>
          <div class="w98-section-title">{i18n.t('loading')}</div>
          <div class="window-loading-title">{getWindowTitle('gallery')}</div>
          {#if getWindowLoadingSummary('gallery')}
            <div class="window-loading-summary w98-quiet-copy">
              {getWindowLoadingSummary('gallery')}
            </div>
          {/if}
        </div>
      {/if}
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
      isFocused={wm.focusedWindow === 'retrocam'}
      mobileSlot={getMobileSlot('retrocam')}
      menuItems={[i18n.t('menu_file'), i18n.t('menu_view'), i18n.t('menu_help')]}
      onClose={() => wm.close('retrocam')}
      onMinimize={() => wm.minimize('retrocam')}
      onFocus={() => wm.focusWindow('retrocam')}
      onLayoutChange={wm.persistLayout}
      swipeEnabled={isMobile && mobileVisibleIds.length > 1}
      onSwipeLeft={() => focusAdjacentMobileWindow('next')}
      onSwipeRight={() => focusAdjacentMobileWindow('prev')}
    >
      {#if RetroCamWindow}
        <RetroCamWindow
          onMessage={(msg) => enqueueToast(msg)}
          onError={(msg) => showErrorDialog(msg)}
          onOpenInPixelLab={handleOpenRetroCamSnapshotInPixelLab}
        />
      {:else}
        <div class="window-loading w98-status-panel" role="status" aria-live="polite">
          <div class="window-loading-icon" aria-hidden="true">
            {getWindowLoadingIcon('retrocam')}
          </div>
          <div class="w98-section-title">{i18n.t('loading')}</div>
          <div class="window-loading-title">{getWindowTitle('retrocam')}</div>
          {#if getWindowLoadingSummary('retrocam')}
            <div class="window-loading-summary w98-quiet-copy">
              {getWindowLoadingSummary('retrocam')}
            </div>
          {/if}
        </div>
      {/if}
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
      isFocused={wm.focusedWindow === 'batch'}
      mobileSlot={getMobileSlot('batch')}
      onClose={() => wm.close('batch')}
      onMinimize={() => wm.minimize('batch')}
      onFocus={() => wm.focusWindow('batch')}
      onLayoutChange={wm.persistLayout}
      swipeEnabled={isMobile && mobileVisibleIds.length > 1}
      onSwipeLeft={() => focusAdjacentMobileWindow('next')}
      onSwipeRight={() => focusAdjacentMobileWindow('prev')}
    >
      {#if BatchWindow}
        <BatchWindow
          settings={processingSettings}
          {saveFormat}
          {saveQuality}
          onError={(msg) => showErrorDialog(msg)}
          onMessage={(msg) => enqueueToast(msg)}
          onItemClick={(file) => {
            handleImageSelected(file);
            wm.openWindow('preview');
          }}
        />
      {:else}
        <div class="window-loading w98-status-panel" role="status" aria-live="polite">
          <div class="window-loading-icon" aria-hidden="true">{getWindowLoadingIcon('batch')}</div>
          <div class="w98-section-title">{i18n.t('loading')}</div>
          <div class="window-loading-title">{getWindowTitle('batch')}</div>
          {#if getWindowLoadingSummary('batch')}
            <div class="window-loading-summary w98-quiet-copy">
              {getWindowLoadingSummary('batch')}
            </div>
          {/if}
        </div>
      {/if}
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
      isFocused={wm.focusedWindow === 'history'}
      mobileSlot={getMobileSlot('history')}
      onClose={() => wm.close('history')}
      onMinimize={() => wm.minimize('history')}
      onFocus={() => wm.focusWindow('history')}
      onLayoutChange={wm.persistLayout}
      swipeEnabled={isMobile && mobileVisibleIds.length > 1}
      onSwipeLeft={() => focusAdjacentMobileWindow('next')}
      onSwipeRight={() => focusAdjacentMobileWindow('prev')}
    >
      {#if HistoryWindow}
        <HistoryWindow
          history={ip.settingsHistory}
          redoHistory={ip.redoHistory}
          currentSettings={processingSettings}
          onJumpToHistory={(index, isRedo) => ip.jumpToHistory(index, isRedo)}
          onUndo={ip.undo}
          onRedo={ip.redo}
        />
      {:else}
        <div class="window-loading w98-status-panel" role="status" aria-live="polite">
          <div class="window-loading-icon" aria-hidden="true">
            {getWindowLoadingIcon('history')}
          </div>
          <div class="w98-section-title">{i18n.t('loading')}</div>
          <div class="window-loading-title">{getWindowTitle('history')}</div>
          {#if getWindowLoadingSummary('history')}
            <div class="window-loading-summary w98-quiet-copy">
              {getWindowLoadingSummary('history')}
            </div>
          {/if}
        </div>
      {/if}
    </Win98Window>
  {/if}
</DesktopWorkspace>

<!-- ═══ Taskbar ═══ -->
<Taskbar
  windows={taskbarWindows}
  startMenuOpen={ctxMenu?.kind === 'start'}
  onWindowClick={wm.handleTaskbarClick}
  onWindowClose={wm.closeAndReset}
  onShowShortcuts={() => {
    showShortcuts = !showShortcuts;
  }}
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
    banner={ctxMenu.banner}
    onClose={() => {
      ctxMenu = null;
    }}
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
  <KeyboardShortcuts
    onClose={() => {
      showShortcuts = false;
    }}
  />
{/if}

<!-- ═══ Mobile Undo/Redo Floating Buttons ═══ -->
{#if isMobile && ip.originalImageSrc}
  <div class="mobile-undo-redo">
    <button
      class="mobile-undo-btn w98-inline-button w98-button--thin"
      onclick={() => ip.undo()}
      disabled={ip.settingsHistory.length === 0}
      aria-label={i18n.t('undo')}
      ><span class="w98-structural-glyph" aria-hidden="true">↺</span></button
    >
    <button
      class="mobile-redo-btn w98-inline-button w98-button--thin"
      onclick={() => ip.redo()}
      disabled={ip.redoHistory.length === 0}
      aria-label={i18n.t('redo')}
      ><span class="w98-structural-glyph" aria-hidden="true">↻</span></button
    >
  </div>
{/if}

<style>
  .window-loading {
    height: 100%;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: var(--w98-space-8);
    padding: var(--w98-space-16);
  }

  .window-loading-icon {
    width: 40px;
    height: 40px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    box-shadow: var(--w98-inset-thin);
    background: var(--w98-surface);
  }

  .window-loading-title {
    max-width: 20ch;
  }

  .window-loading-summary {
    max-width: 28ch;
  }

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
  }
  .mobile-undo-redo button:disabled {
    color: #6d6d6d;
    cursor: default;
  }

  /* ── Settings Window Toolbar ── */
  .settings-body {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }
  .settings-toolbar {
    gap: var(--w98-space-4);
    padding: var(--w98-space-4);
    border-bottom: 1px solid var(--w98-shadow-808);
    flex-shrink: 0;
    flex-wrap: wrap;
  }
  .settings-toolbar-label {
    margin-right: var(--w98-space-2);
  }
  .settings-toolbar :global(.load-new-btn) {
    display: flex;
    align-items: center;
    gap: var(--w98-space-4);
    font-size: var(--w98-font-size-base);
    white-space: nowrap;
  }
  @media (max-width: 700px) {
    .settings-toolbar-label {
      display: none;
    }
  }
</style>
