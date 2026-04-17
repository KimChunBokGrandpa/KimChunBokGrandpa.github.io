/**
 * History Store — Manages undo/redo stack for ProcessingSettings.
 * Extracted from imageProcessingStore for separation of concerns.
 */
import type { ProcessingSettings } from '$lib/types';

const maxHistory = 20;

function cloneSettings(s: ProcessingSettings): ProcessingSettings {
  return {
    ...s,
    glitchFilters: s.glitchFilters.map(f => ({ ...f })),
    effectLayers: s.effectLayers?.map(l => ({ ...l })),
  };
}

export function createHistoryStore() {
  let undoStack = $state<ProcessingSettings[]>([]);
  let redoStack = $state<ProcessingSettings[]>([]);

  function push(s: ProcessingSettings) {
    undoStack.push(cloneSettings(s));
    if (undoStack.length > maxHistory) undoStack.shift();
    redoStack.length = 0;
  }

  function undo(current: ProcessingSettings): ProcessingSettings | null {
    if (undoStack.length === 0) return null;
    redoStack.push(cloneSettings(current));
    return undoStack.pop()!;
  }

  function redo(current: ProcessingSettings): ProcessingSettings | null {
    if (redoStack.length === 0) return null;
    undoStack.push(cloneSettings(current));
    return redoStack.pop()!;
  }

  function reset() {
    undoStack.length = 0;
    redoStack.length = 0;
  }

  return {
    get undoStack() { return undoStack; },
    get redoStack() { return redoStack; },
    push,
    undo,
    redo,
    reset,
    clone: cloneSettings,
  };
}
