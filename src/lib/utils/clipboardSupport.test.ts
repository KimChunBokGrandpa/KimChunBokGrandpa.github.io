import { describe, expect, it, vi } from 'vitest';

import { canWriteImageToClipboard } from './clipboardSupport';

describe('canWriteImageToClipboard', () => {
  it('returns true only when secure context, clipboard.write, and ClipboardItem all exist', () => {
    expect(canWriteImageToClipboard({
      navigatorLike: {
        clipboard: {
          write: vi.fn(),
        },
      },
      clipboardItemCtor: class MockClipboardItem {} as never,
      isSecureContext: true,
    })).toBe(true);
  });

  it('returns false when secure context is missing', () => {
    expect(canWriteImageToClipboard({
      navigatorLike: {
        clipboard: {
          write: vi.fn(),
        },
      },
      clipboardItemCtor: class MockClipboardItem {} as never,
      isSecureContext: false,
    })).toBe(false);
  });

  it('returns false when ClipboardItem is missing', () => {
    expect(canWriteImageToClipboard({
      navigatorLike: {
        clipboard: {
          write: vi.fn(),
        },
      },
      isSecureContext: true,
    })).toBe(false);
  });

  it('returns false when clipboard.write is unavailable', () => {
    expect(canWriteImageToClipboard({
      navigatorLike: {},
      clipboardItemCtor: class MockClipboardItem {} as never,
      isSecureContext: true,
    })).toBe(false);
  });
});
