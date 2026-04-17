import type { WindowId } from '$lib/types';

export interface MobileWindowSlot {
  top: string;
  height: string;
  left?: string;
  width?: string;
}

const mobileCompactHeight = 34;
const landscapeSettingsWidth = 38;

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
  const count = visibleIds.length;
  const currentFocusedId = focusedId && visibleIds.includes(focusedId) ? focusedId : visibleIds[0];

  if (
    isLandscapeMobile &&
    count === 2 &&
    visibleIds.includes('settings') &&
    visibleIds.includes('preview')
  ) {
    if (id === 'settings') {
      return {
        top: '0px',
        left: '0px',
        width: `${landscapeSettingsWidth}vw`,
        height: 'calc(100dvh - var(--taskbar-h))',
      };
    }

    if (id === 'preview') {
      return {
        top: '0px',
        left: `${landscapeSettingsWidth}vw`,
        width: `${100 - landscapeSettingsWidth}vw`,
        height: 'calc(100dvh - var(--taskbar-h))',
      };
    }
  }

  if (count === 2 && visibleIds.includes('poster_maker')) {
    const focusedIdx = visibleIds.indexOf(currentFocusedId);
    const isFocused = currentFocusedId === id;

    if (isFocused) {
      return {
        top: `${focusedIdx === 0 ? 0 : mobileCompactHeight}px`,
        height: `calc(100dvh - var(--taskbar-h) - ${mobileCompactHeight}px)`,
      };
    }

    return idx < focusedIdx
      ? { top: '0px', height: `${mobileCompactHeight}px` }
      : {
          top: `calc(100dvh - var(--taskbar-h) - ${mobileCompactHeight}px)`,
          height: `${mobileCompactHeight}px`,
        };
  }

  if (count <= 2) {
    const slotHeight = `calc((100dvh - var(--taskbar-h)) / ${count})`;
    const slotTop = idx === 0 ? '0px' : `calc((100dvh - var(--taskbar-h)) / ${count} * ${idx})`;
    return { top: slotTop, height: slotHeight };
  }

  const compactTotal = (count - 1) * mobileCompactHeight;
  const focusedIdx = visibleIds.indexOf(currentFocusedId);
  const isFocused = currentFocusedId === id;

  if (isFocused) {
    return {
      top: `${idx * mobileCompactHeight}px`,
      height: `calc(100dvh - var(--taskbar-h) - ${compactTotal}px)`,
    };
  }

  if (idx < focusedIdx) {
    return { top: `${idx * mobileCompactHeight}px`, height: `${mobileCompactHeight}px` };
  }

  const bottomOffset = count - 1 - idx;
  return {
    top: `calc(100dvh - var(--taskbar-h) - ${(bottomOffset + 1) * mobileCompactHeight}px)`,
    height: `${mobileCompactHeight}px`,
  };
}
