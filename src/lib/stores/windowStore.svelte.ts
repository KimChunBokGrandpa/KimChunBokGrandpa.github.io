import type { WindowState, WindowMode, WindowConfig } from "$lib/types";

/** Desktop window definitions */
export const WINDOW_CONFIGS: WindowConfig[] = [
  { id: "settings", title: "Settings", icon: "⚙️" },
  { id: "preview", title: "Preview", icon: "🖼️" },
  { id: "gallery", title: "Palette Gallery", icon: "🎨" },
];

const WINDOW_IDS = WINDOW_CONFIGS.map((c) => c.id);

/**
 * Reactive window manager using Svelte 5 runes.
 * Manages z-ordering, focus, open/close/minimize/maximize state.
 */
export function createWindowStore() {
  let wins = $state<Record<string, WindowState>>({
    settings: {
      mode: "windowed",
      x: 30,
      y: 30,
      w: 340,
      h: 480,
      z: 10,
      defaults: { x: 30, y: 30, w: 340, h: 480 },
    },
    preview: {
      mode: "closed",
      x: 400,
      y: 30,
      w: 600,
      h: 500,
      z: 9,
      defaults: { x: 400, y: 30, w: 600, h: 500 },
    },
    gallery: {
      mode: "closed",
      x: 100,
      y: 60,
      w: 480,
      h: 460,
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
  };
}
