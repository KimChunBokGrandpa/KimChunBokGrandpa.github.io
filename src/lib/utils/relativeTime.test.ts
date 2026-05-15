import { describe, expect, it } from 'vitest';

import { formatRelativeTime } from './relativeTime';

describe('formatRelativeTime', () => {
  const now = new Date('2024-06-15T12:00:00.000Z');

  it('formats seconds ago (-30s)', () => {
    const iso = new Date(now.getTime() - 30_000).toISOString();
    const result = formatRelativeTime(iso, 'en', now);
    expect(result).toBe('30 seconds ago');
  });

  it('formats minutes ago (-5m)', () => {
    const iso = new Date(now.getTime() - 5 * 60_000).toISOString();
    const result = formatRelativeTime(iso, 'en', now);
    expect(result).toBe('5 minutes ago');
  });

  it('formats hours ago (-3h)', () => {
    const iso = new Date(now.getTime() - 3 * 3_600_000).toISOString();
    const result = formatRelativeTime(iso, 'en', now);
    expect(result).toBe('3 hours ago');
  });

  it('formats days ago (-2d)', () => {
    const iso = new Date(now.getTime() - 2 * 86_400_000).toISOString();
    const result = formatRelativeTime(iso, 'en', now);
    expect(result).toBe('2 days ago');
  });
});
