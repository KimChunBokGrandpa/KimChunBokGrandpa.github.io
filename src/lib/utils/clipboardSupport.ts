interface ClipboardLike {
  write?: (data: ClipboardItem[]) => Promise<void>;
}

interface NavigatorLike {
  clipboard?: ClipboardLike;
}

interface ClipboardItemLike {
  new (items: Record<string, Blob>): ClipboardItem;
}

export interface ClipboardImageSupportContext {
  navigatorLike?: NavigatorLike;
  clipboardItemCtor?: ClipboardItemLike;
  isSecureContext?: boolean;
}

export function canWriteImageToClipboard(
  context: ClipboardImageSupportContext = {
    navigatorLike: typeof navigator !== 'undefined' ? navigator : undefined,
    clipboardItemCtor: typeof ClipboardItem !== 'undefined' ? ClipboardItem : undefined,
    isSecureContext: typeof window !== 'undefined' ? window.isSecureContext : false,
  },
): boolean {
  if (!context.isSecureContext) return false;
  if (!context.clipboardItemCtor) return false;
  return typeof context.navigatorLike?.clipboard?.write === 'function';
}
