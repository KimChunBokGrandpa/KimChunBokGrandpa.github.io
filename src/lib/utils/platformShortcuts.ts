export type PrimaryModifierLabel = 'Ctrl' | 'Cmd';

interface NavigatorPlatformLike {
  platform?: string;
  userAgent?: string;
  userAgentData?: {
    platform?: string;
  };
}

function readPlatformLabel(navigatorLike?: NavigatorPlatformLike): string {
  if (!navigatorLike) return '';

  return navigatorLike.userAgentData?.platform
    ?? navigatorLike.platform
    ?? navigatorLike.userAgent
    ?? '';
}

export function getPrimaryModifierLabel(
  navigatorLike: NavigatorPlatformLike | undefined = typeof navigator !== 'undefined' ? navigator : undefined,
): PrimaryModifierLabel {
  const platform = readPlatformLabel(navigatorLike);
  return /(Mac|iPhone|iPad|iPod)/i.test(platform) ? 'Cmd' : 'Ctrl';
}

export function buildShortcutLabel(
  keys: readonly string[],
  primaryModifierLabel = getPrimaryModifierLabel(),
): string {
  return keys
    .map((key) => (key === 'Primary' ? primaryModifierLabel : key))
    .join('+');
}

export function replacePrimaryModifierShortcutLabel(
  text: string,
  primaryModifierLabel = getPrimaryModifierLabel(),
): string {
  return text.replaceAll('Ctrl+', `${primaryModifierLabel}+`);
}
