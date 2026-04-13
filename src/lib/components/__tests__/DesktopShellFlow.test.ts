// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';

vi.mock('$lib/i18n/index.svelte', () => ({
  i18n: {
    t: vi.fn((key: string) => key),
    locale: 'en',
    setLocale: vi.fn(),
  },
  LOCALE_LABELS: { en: 'English', ko: '한국어', ja: '日本語' },
}));

const mockStorage = new Map<string, string>();
const localStorageMock = {
  getItem: vi.fn((key: string) => mockStorage.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => mockStorage.set(key, value)),
  removeItem: vi.fn((key: string) => mockStorage.delete(key)),
  clear: vi.fn(() => mockStorage.clear()),
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

import DesktopShellFlowWrapper from './DesktopShellFlowWrapper.svelte';

describe('Desktop shell flow', () => {
  beforeEach(() => {
    mockStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('relaunches Pixel Lab from desktop icon and shows focused taskbar entry', async () => {
    render(DesktopShellFlowWrapper);

    await fireEvent.click(screen.getByRole('button', { name: /close win_preview/i }));
    expect(screen.queryByRole('button', { name: /win_preview window/i })).toBeNull();

    await fireEvent.dblClick(screen.getByRole('button', { name: /open win_preview/i }));

    const previewTaskbar = screen.getByRole('button', { name: /win_preview window/i });
    expect(previewTaskbar.className).toContain('tb-active');
  }, 15000);

  it('launches Poster Maker from desktop icon and drives taskbar focus/minimize/restore flow', async () => {
    render(DesktopShellFlowWrapper);

    await fireEvent.dblClick(screen.getByRole('button', { name: /open win_poster_maker/i }));

    const posterTaskbar = screen.getByRole('button', { name: /win_poster_maker window/i });
    expect(posterTaskbar.className).toContain('tb-active');
    expect(screen.getByText('Poster Content')).toBeTruthy();

    const previewTaskbar = screen.getByRole('button', { name: /win_preview window/i });
    await fireEvent.click(previewTaskbar);
    expect(previewTaskbar.className).toContain('tb-active');
    expect(posterTaskbar.className).not.toContain('tb-active');

    await fireEvent.click(previewTaskbar);
    expect(previewTaskbar.className).toContain('tb-dim');
    expect(previewTaskbar.className).not.toContain('tb-active');

    await fireEvent.click(previewTaskbar);
    expect(previewTaskbar.className).toContain('tb-active');
    expect(previewTaskbar.className).not.toContain('tb-dim');
  }, 15000);
});
