import type { SaveFormat } from '$lib/services/saveService';
import type { ExportHistoryEntry } from '$lib/projects/schema';
import type { ExportCapability } from '$lib/utils/exportCapability';

export type ExportMediaKind = 'none' | 'still' | 'animation';

export type ExportPrimaryActionId = 'save-still' | 'export-gif';

export type ExportSecondaryActionId =
  | 'share-still'
  | 'export-svg-still'
  | 'export-apng'
  | 'export-animated-svg'
  | 'export-animated-webp'
  | 'export-spritesheet'
  | 'export-frame-sequence';

export type ExportSectionId = 'still-variants' | 'animation-variants';

export interface ExportPrimaryAction {
  id: ExportPrimaryActionId;
  labelKey: 'save_as' | 'export_gif';
  subLabel?: string;
  icon: string;
  testId: 'save-image-button';
  busy: boolean;
  blocked: boolean;
  tooltip: string;
  ariaLabel: string;
}

export interface ExportSecondaryAction {
  id: ExportSecondaryActionId;
  labelKey: string;
  icon: string;
  section: ExportSectionId;
  testId?: 'share-image-button';
  available: boolean;
  disabled: boolean;
  tooltip?: string;
}

export interface ExportSection {
  id: ExportSectionId;
  labelKey: 'export_section_still' | 'export_section_animation';
  actions: ExportSecondaryAction[];
}

export interface ExportHistoryViewEntry {
  exportId: string;
  format: string;
  createdAtIso: string;
  dimensions: string | null;
}

export interface ExportViewModel {
  mediaKind: ExportMediaKind;
  hasProcessedImage: boolean;
  busy: boolean;
  cancel: { visible: boolean; labelKey: 'cancel' } | null;
  primary: ExportPrimaryAction | null;
  sections: ExportSection[];
  formatSelector: {
    visible: boolean;
    format: SaveFormat;
    showsQualitySlider: boolean;
    quality: number;
  };
  history: {
    placeholderLabelKey: 'export_history_empty';
    latest: ExportHistoryViewEntry | null;
  };
}

export interface ExportStoreSnapshot {
  hasLoadedImage: boolean;
  hasProcessedImage: boolean;
  hasUnappliedChanges: boolean;
  autoProcess: boolean;
  stillSaveBusy: boolean;
  animationSaveBusy: boolean;
  mediaKind: ExportMediaKind;
  saveFormat: SaveFormat;
  saveQuality: number;
  exportHistory: ReadonlyArray<ExportHistoryEntry>;
}

export interface ExportViewModelInput {
  snapshot: ExportStoreSnapshot;
  capability: ExportCapability;
  t: (key: string, ...args: unknown[]) => string;
  primaryShortcutHint: string;
}

// ─── Builder ───

function buildHistoryLatest(
  exportHistory: ReadonlyArray<ExportHistoryEntry>,
): ExportHistoryViewEntry | null {
  if (exportHistory.length === 0) return null;
  const entry = exportHistory[0];
  return {
    exportId: entry.exportId,
    format: entry.format.toUpperCase(),
    createdAtIso: entry.createdAt,
    dimensions:
      entry.width != null && entry.height != null
        ? `${entry.width}×${entry.height}`
        : null,
  };
}

function buildStillSections(
  capability: ExportCapability,
): ExportSection[] {
  const actions: ExportSecondaryAction[] = [];

  if (capability.canShareStill) {
    actions.push({
      id: 'share-still',
      labelKey: 'share',
      icon: '📤',
      section: 'still-variants',
      testId: 'share-image-button',
      available: true,
      disabled: false,
    });
  }

  if (capability.canExportSvgStill) {
    actions.push({
      id: 'export-svg-still',
      labelKey: 'export_svg',
      icon: '🖼️',
      section: 'still-variants',
      available: true,
      disabled: false,
    });
  }

  if (actions.length === 0) return [];

  return [
    {
      id: 'still-variants',
      labelKey: 'export_section_still',
      actions,
    },
  ];
}

function buildAnimationSections(
  capability: ExportCapability,
  animationBusy: boolean,
): ExportSection[] {
  const actions: ExportSecondaryAction[] = [];

  if (capability.canExportApng) {
    actions.push({
      id: 'export-apng',
      labelKey: 'export_apng',
      icon: '🎞️',
      section: 'animation-variants',
      available: true,
      disabled: animationBusy,
    });
  }

  if (capability.canExportAnimatedSvg) {
    actions.push({
      id: 'export-animated-svg',
      labelKey: 'export_animated_svg',
      icon: '🎨',
      section: 'animation-variants',
      available: true,
      disabled: animationBusy,
    });
  }

  if (capability.canExportAnimatedWebp) {
    actions.push({
      id: 'export-animated-webp',
      labelKey: 'export_animated_webp',
      icon: '🌐',
      section: 'animation-variants',
      available: true,
      disabled: animationBusy,
    });
  }

  if (capability.canExportSpritesheet) {
    actions.push({
      id: 'export-spritesheet',
      labelKey: 'export_spritesheet',
      icon: '🧩',
      section: 'animation-variants',
      available: true,
      disabled: animationBusy,
    });
  }

  if (capability.canExportFrameSequence) {
    actions.push({
      id: 'export-frame-sequence',
      labelKey: 'export_frame_sequence',
      icon: '📁',
      section: 'animation-variants',
      available: true,
      disabled: animationBusy,
    });
  }

  if (actions.length === 0) return [];

  return [
    {
      id: 'animation-variants',
      labelKey: 'export_section_animation',
      actions,
    },
  ];
}

export function buildExportViewModel(input: ExportViewModelInput): ExportViewModel {
  const { snapshot, capability, t, primaryShortcutHint } = input;
  const { mediaKind, saveFormat, saveQuality, exportHistory } = snapshot;

  const blocked = !snapshot.autoProcess && snapshot.hasUnappliedChanges;
  const historyLatest = buildHistoryLatest(exportHistory);

  // Media kind: none
  if (mediaKind === 'none') {
    return {
      mediaKind,
      hasProcessedImage: false,
      busy: false,
      cancel: null,
      primary: null,
      sections: [],
      formatSelector: {
        visible: false,
        format: saveFormat,
        showsQualitySlider: saveFormat !== 'png',
        quality: saveQuality,
      },
      history: {
        placeholderLabelKey: 'export_history_empty',
        latest: historyLatest,
      },
    };
  }

  // Media kind: still
  if (mediaKind === 'still') {
    const busy = snapshot.stillSaveBusy;
    const ariaLabel = t('save_as') + (saveFormat ? ` · ${saveFormat.toUpperCase()}` : '');

    return {
      mediaKind,
      hasProcessedImage: snapshot.hasProcessedImage,
      busy,
      cancel: null,
      primary: {
        id: 'save-still',
        labelKey: 'save_as',
        subLabel: saveFormat.toUpperCase(),
        icon: '💾',
        testId: 'save-image-button',
        busy,
        blocked,
        tooltip: primaryShortcutHint,
        ariaLabel,
      },
      sections: buildStillSections(capability),
      formatSelector: {
        visible: true,
        format: saveFormat,
        showsQualitySlider: saveFormat !== 'png',
        quality: saveQuality,
      },
      history: {
        placeholderLabelKey: 'export_history_empty',
        latest: historyLatest,
      },
    };
  }

  // Media kind: animation
  const animationBusy = snapshot.animationSaveBusy;
  const ariaLabel = t('export_gif');

  return {
    mediaKind,
    hasProcessedImage: snapshot.hasProcessedImage,
    busy: animationBusy,
    cancel: animationBusy ? { visible: true, labelKey: 'cancel' } : null,
    primary: {
      id: 'export-gif',
      labelKey: 'export_gif',
      icon: '🎬',
      testId: 'save-image-button',
      busy: animationBusy,
      blocked,
      tooltip: primaryShortcutHint,
      ariaLabel,
    },
    sections: buildAnimationSections(capability, animationBusy),
    formatSelector: {
      visible: false,
      format: saveFormat,
      showsQualitySlider: saveFormat !== 'png',
      quality: saveQuality,
    },
    history: {
      placeholderLabelKey: 'export_history_empty',
      latest: historyLatest,
    },
  };
}
