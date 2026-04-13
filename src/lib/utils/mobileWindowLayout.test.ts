import { describe, expect, it } from 'vitest';
import { getMobileWindowSlot, getNextMobileFocusId } from './mobileWindowLayout';

describe('getNextMobileFocusId', () => {
  it('returns null when no visible windows exist', () => {
    expect(getNextMobileFocusId([], 'preview', 'next')).toBeNull();
  });

  it('cycles forward through visible windows', () => {
    expect(getNextMobileFocusId(['preview', 'settings', 'gallery'], 'settings', 'next')).toBe('gallery');
    expect(getNextMobileFocusId(['preview', 'settings', 'gallery'], 'gallery', 'next')).toBe('preview');
  });

  it('cycles backward through visible windows', () => {
    expect(getNextMobileFocusId(['preview', 'settings', 'gallery'], 'settings', 'prev')).toBe('preview');
    expect(getNextMobileFocusId(['preview', 'settings', 'gallery'], 'preview', 'prev')).toBe('gallery');
  });
});

describe('getMobileWindowSlot', () => {
  it('returns null outside mobile mode', () => {
    expect(
      getMobileWindowSlot({
        id: 'preview',
        isMobile: false,
        isLandscapeMobile: false,
        visibleIds: ['preview', 'settings'],
        focusedId: 'preview',
      }),
    ).toBeNull();
  });

  it('returns split-pane slots for mobile landscape settings/preview pair', () => {
    expect(
      getMobileWindowSlot({
        id: 'settings',
        isMobile: true,
        isLandscapeMobile: true,
        visibleIds: ['settings', 'preview'],
        focusedId: 'preview',
      }),
    ).toEqual({
      top: '0px',
      left: '0px',
      width: '38vw',
      height: 'calc(100dvh - var(--taskbar-h))',
    });

    expect(
      getMobileWindowSlot({
        id: 'preview',
        isMobile: true,
        isLandscapeMobile: true,
        visibleIds: ['settings', 'preview'],
        focusedId: 'preview',
      }),
    ).toEqual({
      top: '0px',
      left: '38vw',
      width: '62vw',
      height: 'calc(100dvh - var(--taskbar-h))',
    });
  });

  it('falls back to stacked slots when mobile landscape has other windows open', () => {
    expect(
      getMobileWindowSlot({
        id: 'preview',
        isMobile: true,
        isLandscapeMobile: true,
        visibleIds: ['preview', 'settings', 'gallery'],
        focusedId: 'preview',
      }),
    ).toEqual({
      top: '0px',
      height: 'calc(100dvh - var(--taskbar-h) - 68px)',
    });
  });

  it('gives poster maker the primary height in a two-window mobile pair', () => {
    expect(
      getMobileWindowSlot({
        id: 'poster_maker',
        isMobile: true,
        isLandscapeMobile: false,
        visibleIds: ['preview', 'poster_maker'],
        focusedId: 'poster_maker',
      }),
    ).toEqual({
      top: '34px',
      height: 'calc(100dvh - var(--taskbar-h) - 34px)',
    });

    expect(
      getMobileWindowSlot({
        id: 'preview',
        isMobile: true,
        isLandscapeMobile: false,
        visibleIds: ['preview', 'poster_maker'],
        focusedId: 'poster_maker',
      }),
    ).toEqual({
      top: '0px',
      height: '34px',
    });
  });

  it('collapses poster maker to a compact strip when another window is focused', () => {
    expect(
      getMobileWindowSlot({
        id: 'poster_maker',
        isMobile: true,
        isLandscapeMobile: false,
        visibleIds: ['poster_maker', 'history'],
        focusedId: 'history',
      }),
    ).toEqual({
      top: '0px',
      height: '34px',
    });
  });

  it('returns compact slots around the focused window', () => {
    expect(
      getMobileWindowSlot({
        id: 'settings',
        isMobile: true,
        isLandscapeMobile: false,
        visibleIds: ['preview', 'settings', 'gallery'],
        focusedId: 'settings',
      }),
    ).toEqual({
      top: '34px',
      height: 'calc(100dvh - var(--taskbar-h) - 68px)',
    });

    expect(
      getMobileWindowSlot({
        id: 'gallery',
        isMobile: true,
        isLandscapeMobile: false,
        visibleIds: ['preview', 'settings', 'gallery'],
        focusedId: 'settings',
      }),
    ).toEqual({
      top: 'calc(100dvh - var(--taskbar-h) - 34px)',
      height: '34px',
    });
  });
});
