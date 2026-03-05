import type { WindowState, WindowMode, WindowConfig } from "$lib/types";

/** Desktop window definitions */
export const WINDOW_CONFIGS: WindowConfig[] = [
  { id: "preview", title: "Preview", icon: "🖼️" },
  { id: "settings", title: "Settings", icon: "⚙️" },
  { id: "gallery", title: "Palette Gallery", icon: "🎨" },
];

const WINDOW_IDS = WINDOW_CONFIGS.map((c) => c.id);
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

function saveLayout(wins: Record<string, WindowState>) {
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

  let wins = $state<Record<string, WindowState>>({
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
      mode: "closed",
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
  });

  let focusedWindow = $state<string>("settings");

  function focusWindow(id: string) {
    const sorted = WINDOW_IDS.slice().sort((a, b) => wins[a].z - wins[b].z);
    const rest = sorted.filter((w) => w !== id);
    const final = [...rest, id];
    final.forEach((w, i) => {
      wins[w].z = 10 + i;
    });
    focusedWindow = id;
  }

  function openWindow(id: string) {
    const mode = wins[id].mode;
    if (mode === "closed" || mode === "minimized") {
      wins[id].mode = "windowed";
    }
    focusWindow(id);
    saveLayout(wins);
  }

  /** Taskbar X button: close + reset position/size to defaults */
  function closeAndReset(id: string) {
    wins[id].mode = "closed";
    const def = wins[id].defaults;
    wins[id].x = def.x;
    wins[id].y = def.y;
    wins[id].w = def.w;
    wins[id].h = def.h;
  }

  /** Title-bar X button: close only, keep position/size */
  function close(id: string) {
    wins[id].mode = "closed";
    saveLayout(wins);
  }

  function handleTaskbarClick(id: string) {
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
