/**
 * Formats an ISO timestamp as a locale-aware relative time string.
 * Uses `Intl.RelativeTimeFormat` with second/minute/hour/day buckets.
 */
export function formatRelativeTime(iso: string, locale: string, now: Date = new Date()): string {
  const delta = (now.getTime() - new Date(iso).getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (delta < 60) return rtf.format(-Math.floor(delta), 'second');
  if (delta < 3_600) return rtf.format(-Math.floor(delta / 60), 'minute');
  if (delta < 86_400) return rtf.format(-Math.floor(delta / 3_600), 'hour');
  return rtf.format(-Math.floor(delta / 86_400), 'day');
}
