import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { detectExportCapability } from './exportCapability';

describe('detectExportCapability', () => {
  const originalNavigator = globalThis.navigator;

  afterEach(() => {
    // Restore original navigator
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  it('returns canShareStill=true when navigator.share and navigator.canShare support files', () => {
    const mockNavigator = {
      ...originalNavigator,
      share: vi.fn(),
      canShare: vi.fn().mockReturnValue(true),
    };
    Object.defineProperty(globalThis, 'navigator', {
      value: mockNavigator,
      writable: true,
      configurable: true,
    });

    const capability = detectExportCapability();

    expect(capability.canShareStill).toBe(true);
    expect(mockNavigator.canShare).toHaveBeenCalledWith({
      files: [expect.any(File)],
    });
  });

  it('returns canShareStill=false when navigator.canShare returns false', () => {
    const mockNavigator = {
      ...originalNavigator,
      share: vi.fn(),
      canShare: vi.fn().mockReturnValue(false),
    };
    Object.defineProperty(globalThis, 'navigator', {
      value: mockNavigator,
      writable: true,
      configurable: true,
    });

    const capability = detectExportCapability();

    expect(capability.canShareStill).toBe(false);
  });

  it('returns canShareStill=false when navigator.canShare is not a function', () => {
    const mockNavigator = {
      ...originalNavigator,
      share: vi.fn(),
      canShare: undefined,
    };
    Object.defineProperty(globalThis, 'navigator', {
      value: mockNavigator,
      writable: true,
      configurable: true,
    });

    const capability = detectExportCapability();

    expect(capability.canShareStill).toBe(false);
  });

  it('returns canShareStill=false when navigator.share is not a function', () => {
    const mockNavigator = {
      ...originalNavigator,
      share: undefined,
      canShare: vi.fn().mockReturnValue(true),
    };
    Object.defineProperty(globalThis, 'navigator', {
      value: mockNavigator,
      writable: true,
      configurable: true,
    });

    const capability = detectExportCapability();

    expect(capability.canShareStill).toBe(false);
  });

  it('returns canShareStill=false when navigator is undefined', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const capability = detectExportCapability();

    expect(capability.canShareStill).toBe(false);
  });

  it('always returns true for all other capabilities', () => {
    const capability = detectExportCapability();

    expect(capability.canExportSvgStill).toBe(true);
    expect(capability.canExportApng).toBe(true);
    expect(capability.canExportAnimatedSvg).toBe(true);
    expect(capability.canExportAnimatedWebp).toBe(true);
    expect(capability.canExportSpritesheet).toBe(true);
    expect(capability.canExportFrameSequence).toBe(true);
  });
});
