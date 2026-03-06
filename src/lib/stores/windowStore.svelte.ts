import type { WindowState, WindowMode, WindowConfig, WindowId } from "$lib/types";

/** Desktop window definitions */
export const WINDOW_CONFIGS: WindowConfig[] = [
  { id: "preview", title: "Preview", icon: "🖼️" },
  { id: "settings", title: "Settings", icon: "⚙️" },
  { id: "gallery", title: "Palette Gallery", icon: "🎨" },
  { id: "batch", title: "Batch", icon: "📦" },
  { id: "history", title: "History", icon: "⏱️" },
];

const WINDOW_IDS = WINDOW_CONFIGS.map((c) => c.id) as WindowId[];
const STORAGE_KEY = "retro-pixel-window-layout";

interface SavedLayout {
  x: number; y: number; w: number; h: number;
}

function loadSavedLayout(): Record<string, SavedLayout> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveLayout(wins: Record<WindowId, WindowState>) {
  try {
    const data: Record<string, SavedLayout> = {};
    for (const id of WINDOW_IDS) {
      data[id] = { x: wins[id].x, y: wins[id].y, w: wins[id].w, h: wins[id].h };
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore storage errors */ }
}

/**
 * Reactive window manager using Svelte 5 runes.
 * Manages z-ordering, focus, open/close/minimize/maximize state.
 */
export function createWindowStore() {
  const saved = loadSavedLayout();

  let wins = $state<Record<WindowId, WindowState>>({
    settings: {
      mode: "windowed",
      x: saved?.settings?.x ?? 30,
      y: saved?.settings?.y ?? 30,
      w: saved?.settings?.w ?? 340,
      h: saved?.settings?.h ?? 480,
      z: 10,
      defaults: { x: 30, y: 30, w: 340, h: 480 },
    },
    preview: {
      mode: "windowed",
      x: saved?.preview?.x ?? 400,
      y: saved?.preview?.y ?? 30,
      w: saved?.preview?.w ?? 600,
      h: saved?.preview?.h ?? 500,
      z: 9,
      defaults: { x: 400, y: 30, w: 600, h: 500 },
    },
    gallery: {
      mode: "closed",
      x: saved?.gallery?.x ?? 100,
      y: saved?.gallery?.y ?? 60,
      w: saved?.gallery?.w ?? 480,
      h: saved?.gallery?.h ?? 460,
      z: 8,
      defaults: { x: 100, y: 60, w: 480, h: 460 },
    },
    batch: {
      mode: "closed",
      x: saved?.batch?.x ?? 150,
      y: saved?.batch?.y ?? 40,
      w: saved?.batch?.w ?? 520,
      h: saved?.batch?.h ?? 440,
      z: 7,
      defaults: { x: 150, y: 40, w: 520, h: 440 },
    },
    history: {
      mode: "closed",
      x: saved?.history?.x ?? 50,
      y: saved?.history?.y ?? 60,
      w: saved?.history?.w ?? 280,
      h: saved?.history?.h ?? 360,
      z: 6,
      defaults: { x: 50, y: 60, w: 280, h: 360 },
    },
  });

  let focusedWindow = $state<WindowId>("settings");

  function focusWindow(id: WindowId) {
    const sorted = WINDOW_IDS.slice().sort((a, b) => wins[a].z - wins[b].z);
    const rest = sorted.filter((w) => w !== id);
    const final = [...rest, id];
    final.forEach((w, i) => {
      wins[w].z = 10 + i;
    });
    focusedWindow = id;
  }

  function openWindow(id: WindowId) {
    const mode = wins[id].mode;
    if (mode === "closed" || mode === "minimized") {
      wins[id].mode = "windowed";
    }
    focusWindow(id);
    saveLayout(wins);
  }

  function closeAndReset(id: WindowId) {
    wins[id].mode = "closed";
    const def = wins[id].defaults;
    wins[id].x = def.x;
    wins[id].y = def.y;
    wins[id].w = def.w;
    wins[id].h = def.h;
  }

  /** Title-bar X button: close only, keep position/size */
  function close(id: WindowId) {
    wins[id].mode = "closed";
    saveLayout(wins);
  }

  function handleTaskbarClick(id: WindowId) {
    const mode = wins[id].mode;
    if (mode === "minimized") {
      openWindow(id);
    } else if (focusedWindow === id) {
      wins[id].mode = "minimized";
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
    handleTaskbarClick,
    /** Persist current layout to localStorage (call after drag/resize) */
    persistLayout() { saveLayout(wins); },
  };
}
