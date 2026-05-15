import type { WindowState, WindowConfig, WindowId } from '$lib/types';
import { i18n } from '$lib/i18n/index.svelte';
import type { TranslationKey } from '$lib/i18n/en';

const titleKeys: Record<WindowId, TranslationKey> = {
  preview: 'win_preview',
  settings: 'win_settings',
  gallery: 'win_gallery',
  batch: 'win_batch',
  history: 'win_history',
  retrocam: 'win_retrocam',
};

const shellProgramSummaryKeys: Partial<Record<WindowId, TranslationKey>> = {
  preview: 'desktop_summary_preview',
  retrocam: 'desktop_summary_retrocam',
};

export function getWindowTitle(id: WindowId): string {
  return i18n.t(titleKeys[id]);
}

export function getShellProgramSummary(id: WindowId): string {
  return i18n.t(shellProgramSummaryKeys[id] ?? titleKeys[id]);
}

export function getDesktopWindowSummary(id: WindowId): string {
  return getShellProgramSummary(id);
}

/** Desktop window definitions */
export const windowConfigs: WindowConfig[] = [
  { id: 'preview', icon: '🖼️', desktop: true },
  { id: 'retrocam', icon: '📷', desktop: true },
  { id: 'settings', icon: '⚙️', desktop: false },
  { id: 'gallery', icon: '🎨', desktop: false },
  { id: 'batch', icon: '📦', desktop: false },
  { id: 'history', icon: '⏱️', desktop: false },
];

export const desktopWindowConfigs = windowConfigs.filter((config) => config.desktop);
export const mobileWindowOrder = windowConfigs.map((config) => config.id) as WindowId[];

const windowIds = mobileWindowOrder;
const storageKey = 'retro-pixel-window-layout';

interface SavedLayout {
  x: number; y: number; w: number; h: number;
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && isFinite(v);
}

function loadSavedLayout(): Record<string, SavedLayout> | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
    // Validate each layout entry has finite numeric values
    for (const key of Object.keys(parsed)) {
      const v = parsed[key];
      if (!v || !isFiniteNumber(v.x) || !isFiniteNumber(v.y) || !isFiniteNumber(v.w) || !isFiniteNumber(v.h)) {
        delete parsed[key];
      }
    }
    return parsed;
  } catch { return null; }
}

function saveLayout(wins: Record<WindowId, WindowState>) {
  try {
    const data: Record<string, SavedLayout> = {};
    for (const id of windowIds) {
      data[id] = { x: wins[id].x, y: wins[id].y, w: wins[id].w, h: wins[id].h };
    }
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch (err) { console.error('Failed to save window layout:', err); }
}

function findTopVisibleWindow(
  wins: Record<WindowId, WindowState>,
  excludeId?: WindowId,
): WindowId | null {
  const candidates = windowIds
    .filter((id) => id !== excludeId)
    .filter((id) => wins[id].mode !== 'closed' && wins[id].mode !== 'minimized')
    .sort((a, b) => wins[b].z - wins[a].z);
  return candidates[0] ?? null;
}

/**
 * Reactive window manager using Svelte 5 runes.
 * Manages z-ordering, focus, open/close/minimize/maximize state.
 */
export function createWindowStore() {
  const saved = loadSavedLayout();

  let wins = $state<Record<WindowId, WindowState>>({
    settings: {
      mode: 'windowed',
      x: saved?.settings?.x ?? 30,
      y: saved?.settings?.y ?? 30,
      w: saved?.settings?.w ?? 340,
      h: saved?.settings?.h ?? 480,
      z: 9,
      defaults: { x: 30, y: 30, w: 340, h: 480 },
    },
    preview: {
      mode: 'windowed',
      x: saved?.preview?.x ?? 400,
      y: saved?.preview?.y ?? 30,
      w: saved?.preview?.w ?? 600,
      h: saved?.preview?.h ?? 500,
      z: 10,
      defaults: { x: 400, y: 30, w: 600, h: 500 },
    },
    retrocam: {
      mode: 'closed',
      x: saved?.retrocam?.x ?? 220,
      y: saved?.retrocam?.y ?? 90,
      w: saved?.retrocam?.w ?? 760,
      h: saved?.retrocam?.h ?? 520,
      z: 7,
      defaults: { x: 220, y: 90, w: 760, h: 520 },
    },
    gallery: {
      mode: 'closed',
      x: saved?.gallery?.x ?? 100,
      y: saved?.gallery?.y ?? 60,
      w: saved?.gallery?.w ?? 480,
      h: saved?.gallery?.h ?? 460,
      z: 6,
      defaults: { x: 100, y: 60, w: 480, h: 460 },
    },
    batch: {
      mode: 'closed',
      x: saved?.batch?.x ?? 150,
      y: saved?.batch?.y ?? 40,
      w: saved?.batch?.w ?? 520,
      h: saved?.batch?.h ?? 440,
      z: 5,
      defaults: { x: 150, y: 40, w: 520, h: 440 },
    },
    history: {
      mode: 'closed',
      x: saved?.history?.x ?? 50,
      y: saved?.history?.y ?? 60,
      w: saved?.history?.w ?? 280,
      h: saved?.history?.h ?? 360,
      z: 4,
      defaults: { x: 50, y: 60, w: 280, h: 360 },
    },
  });

  let focusedWindow = $state<WindowId>('preview');

  function focusWindow(id: WindowId) {
    const sorted = windowIds.slice().sort((a, b) => wins[a].z - wins[b].z);
    const rest = sorted.filter((w) => w !== id);
    const final = [...rest, id];
    final.forEach((w, i) => {
      wins[w].z = 10 + i;
    });
    focusedWindow = id;
  }

  function focusTopVisibleWindow(excludeId?: WindowId) {
    const next = findTopVisibleWindow(wins, excludeId);
    if (next) {
      focusWindow(next);
    }
  }

  function openWindow(id: WindowId) {
    const mode = wins[id].mode;
    if (mode === 'closed' || mode === 'minimized') {
      wins[id].mode = 'windowed';
    }
    focusWindow(id);
    saveLayout(wins);
  }

  function closeAndReset(id: WindowId) {
    wins[id].mode = 'closed';
    const def = wins[id].defaults;
    wins[id].x = def.x;
    wins[id].y = def.y;
    wins[id].w = def.w;
    wins[id].h = def.h;
    if (focusedWindow === id) {
      focusTopVisibleWindow(id);
    }
  }

  /** Title-bar X button: close only, keep position/size */
  function close(id: WindowId) {
    wins[id].mode = 'closed';
    if (focusedWindow === id) {
      focusTopVisibleWindow(id);
    }
    saveLayout(wins);
  }

  function minimize(id: WindowId) {
    if (wins[id].mode === 'closed') return;
    wins[id].mode = 'minimized';
    if (focusedWindow === id) {
      focusTopVisibleWindow(id);
    }
    saveLayout(wins);
  }

  function handleTaskbarClick(id: WindowId) {
    const mode = wins[id].mode;
    if (mode === "minimized") {
      openWindow(id);
    } else if (focusedWindow === id) {
      minimize(id);
    } else {
      focusWindow(id);
    }
  }

  return {
    get wins() {
      return wins;
    },
    get focusedWindow() {
      return focusedWindow;
    },
    focusWindow,
    openWindow,
    closeAndReset,
    close,
    minimize,
    handleTaskbarClick,
    /** Persist current layout to localStorage (debounced to reduce writes during drag/resize) */
    persistLayout: (() => {
      let timer: ReturnType<typeof setTimeout> | null = null;
      return () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => { timer = null; saveLayout(wins); }, 300);
      };
    })(),
  };
}
