import type { SaveFormat } from '$lib/services/saveService';
import type { ProcessingSettings, PostProcessFilters } from '$lib/types';
import { DEFAULT_POST_FILTERS } from '$lib/types';
import { normalizePaletteId } from '$lib/utils/palettes';

export const DEFAULT_PROCESSING_SETTINGS: ProcessingSettings = {
  pixelSize: 1,
  palette: 'original',
  crtEffect: 'none',
  glitchFilters: [],
  renderMode: 'pixel_perfect',
  glitchSeed: null,
  ditherType: 'none',
  effectLayers: [],
};

function cloneSettings(settings: ProcessingSettings): ProcessingSettings {
  return {
    ...settings,
    palette: normalizePaletteId(settings.palette),
    glitchFilters: settings.glitchFilters.map((filter) => ({ ...filter })),
    effectLayers: settings.effectLayers?.map((layer) => ({ ...layer })) ?? [],
  };
}

export function createSettingsStore(initialSettings: ProcessingSettings = DEFAULT_PROCESSING_SETTINGS) {
  let settings = $state<ProcessingSettings>(cloneSettings(initialSettings));
  let saveFormat = $state<SaveFormat>('png');
  let saveQuality = $state(0.92);
  let postFilters = $state<PostProcessFilters>({ ...DEFAULT_POST_FILTERS });
  let autoProcess = $state(true);
  let hasUnappliedChanges = $state(false);

  function setSettings(nextSettings: ProcessingSettings) {
    settings = cloneSettings(nextSettings);
  }

  function selectPalette(paletteId: string) {
    settings = {
      ...settings,
      palette: normalizePaletteId(paletteId),
    };
  }

  function setFormat(format: SaveFormat) {
    saveFormat = format;
  }

  function setQuality(quality: number) {
    saveQuality = quality;
  }

  function setPostFilters(nextPostFilters: PostProcessFilters) {
    postFilters = { ...nextPostFilters };
  }

  function setAutoProcess(nextAutoProcess: boolean) {
    autoProcess = nextAutoProcess;
  }

  function markUnappliedChanges() {
    hasUnappliedChanges = true;
  }

  function clearUnappliedChanges() {
    hasUnappliedChanges = false;
  }

  function postFilterCssString(): string {
    const filters = postFilters;
    const parts: string[] = [];
    if (filters.brightness !== 100) parts.push(`brightness(${filters.brightness}%)`);
    if (filters.contrast !== 100) parts.push(`contrast(${filters.contrast}%)`);
    if (filters.saturation !== 100) parts.push(`saturate(${filters.saturation}%)`);
    if (filters.hueRotate !== 0) parts.push(`hue-rotate(${filters.hueRotate}deg)`);
    return parts.join(' ');
  }

  function settingsHash(): string {
    return JSON.stringify({
      p: settings.pixelSize,
      pal: settings.palette,
      crt: settings.crtEffect,
      g: settings.glitchFilters,
      r: settings.renderMode,
      s: settings.glitchSeed,
      d: settings.ditherType,
      el: settings.effectLayers,
    });
  }

  return {
    get settings() { return settings; },
    set settings(value: ProcessingSettings) { setSettings(value); },
    get saveFormat() { return saveFormat; },
    get saveQuality() { return saveQuality; },
    get postFilters() { return postFilters; },
    set postFilters(value: PostProcessFilters) { setPostFilters(value); },
    get autoProcess() { return autoProcess; },
    set autoProcess(value: boolean) { setAutoProcess(value); },
    get hasUnappliedChanges() { return hasUnappliedChanges; },
    get postFilterCss() { return postFilterCssString(); },
    get settingsHash() { return settingsHash(); },
    setSettings,
    selectPalette,
    setFormat,
    setQuality,
    setPostFilters,
    setAutoProcess,
    markUnappliedChanges,
    clearUnappliedChanges,
  };
}
