import type { WindowId } from '$lib/types';

export interface MobileWindowSlot {
  top: string;
  height: string;
  left?: string;
  width?: string;
}

const MOBILE_COMPACT_H = 34;
const LANDSCAPE_SETTINGS_WIDTH = 38;

export function getNextMobileFocusId(
  visibleIds: WindowId[],
  focusedId: WindowId | null,
  direction: 'prev' | 'next',
): WindowId | null {
  if (visibleIds.length === 0) return null;

  const currentIndex = Math.max(0, visibleIds.indexOf(focusedId ?? visibleIds[0]));
  const delta = direction === 'next' ? 1 : -1;
  return visibleIds[(currentIndex + delta + visibleIds.length) % visibleIds.length];
}

export function getMobileWindowSlot(params: {
  id: WindowId;
  isMobile: boolean;
  isLandscapeMobile: boolean;
  visibleIds: WindowId[];
  focusedId: WindowId | null;
}): MobileWindowSlot | null {
  const { id, isMobile, isLandscapeMobile, visibleIds, focusedId } = params;
  if (!isMobile) return null;

  const idx = visibleIds.indexOf(id);
  if (idx === -1) return null;

  if (
    isLandscapeMobile &&
    visibleIds.length === 2 &&
    visibleIds.includes('settings') &&
    visibleIds.includes('preview')
  ) {
    if (id === 'settings') {
      return {
        top: '0px',
        left: '0px',
        width: `${LANDSCAPE_SETTINGS_WIDTH}vw`,
        height: 'calc(100dvh - var(--taskbar-h))',
      };
    }

    if (id === 'preview') {
      return {
        top: '0px',
        left: `${LANDSCAPE_SETTINGS_WIDTH}vw`,
        width: `${100 - LANDSCAPE_SETTINGS_WIDTH}vw`,
        height: 'calc(100dvh - var(--taskbar-h))',
      };
    }
  }

  const count = visibleIds.length;
  if (count <= 2) {
    const slotHeight = `calc((100dvh - var(--taskbar-h)) / ${count})`;
    const slotTop = idx === 0 ? '0px' : `calc((100dvh - var(--taskbar-h)) / ${count} * ${idx})`;
    return { top: slotTop, height: slotHeight };
  }

  const compactTotal = (count - 1) * MOBILE_COMPACT_H;
  const currentFocusedId = focusedId && visibleIds.includes(focusedId) ? focusedId : visibleIds[0];
  const focusedIdx = visibleIds.indexOf(currentFocusedId);
  const isFocused = currentFocusedId === id;

  if (isFocused) {
    return {
      top: `${idx * MOBILE_COMPACT_H}px`,
      height: `calc(100dvh - var(--taskbar-h) - ${compactTotal}px)`,
    };
  }

  if (idx < focusedIdx) {
    return { top: `${idx * MOBILE_COMPACT_H}px`, height: `${MOBILE_COMPACT_H}px` };
  }

  const bottomOffset = count - 1 - idx;
  return {
    top: `calc(100dvh - var(--taskbar-h) - ${(bottomOffset + 1) * MOBILE_COMPACT_H}px)`,
    height: `${MOBILE_COMPACT_H}px`,
  };
}
