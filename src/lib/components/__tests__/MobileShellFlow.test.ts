// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';

vi.mock('$lib/i18n/index.svelte', () => ({
  i18n: {
    t: vi.fn((key: string) => key),
    locale: 'en',
    setLocale: vi.fn(),
  },
  localeLabels: { en: 'English', ko: '한국어', ja: '日本語' },
}));

const mockStorage = new Map<string, string>();
const localStorageMock = {
  getItem: vi.fn((key: string) => mockStorage.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => mockStorage.set(key, value)),
  removeItem: vi.fn((key: string) => mockStorage.delete(key)),
  clear: vi.fn(() => mockStorage.clear()),
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

import MobileShellFlowWrapper from './MobileShellFlowWrapper.svelte';

describe('Mobile shell flow', () => {
  beforeEach(() => {
    mockStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders stacked mobile windows with equal height when only two are visible', () => {
    const { container } = render(MobileShellFlowWrapper);

    const previewWindow = screen.getByRole('group', { name: 'win_preview' });
    const historyWindow = screen.getByRole('group', { name: 'win_history' });

    expect(previewWindow.getAttribute('style')).toContain('--mobile-t: 0px');
    expect(previewWindow.getAttribute('style')).toContain('--mobile-h: calc((100dvh - var(--taskbar-h)) / 2)');
    expect(historyWindow.getAttribute('style')).toContain('--mobile-h: calc((100dvh - var(--taskbar-h)) / 2)');
    expect(container.querySelectorAll('.win98-menubar')).toHaveLength(2);
  }, 15000);

  it('maintains equal slot placement regardless of taskbar focus with two windows', async () => {
    render(MobileShellFlowWrapper);

    const previewWindow = screen.getByRole('group', { name: 'win_preview' });
    const historyWindow = screen.getByRole('group', { name: 'win_history' });

    await fireEvent.click(screen.getByRole('button', { name: /taskbar_switch_to_window: win_history/i }));

    expect(previewWindow.getAttribute('style')).toContain('--mobile-h: calc((100dvh - var(--taskbar-h)) / 2)');
    expect(historyWindow.getAttribute('style')).toContain('--mobile-h: calc((100dvh - var(--taskbar-h)) / 2)');
  }, 15000);
});
