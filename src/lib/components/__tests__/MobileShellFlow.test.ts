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

  it('renders stacked mobile windows with compact strips around focused window', () => {
    const { container } = render(MobileShellFlowWrapper);

    const previewWindow = screen.getByRole('dialog', { name: 'win_preview' });
    const posterWindow = screen.getByRole('dialog', { name: 'win_poster_maker' });
    const historyWindow = screen.getByRole('dialog', { name: 'win_history' });

    expect(previewWindow.getAttribute('style')).toContain('--mobile-t: 0px');
    expect(previewWindow.getAttribute('style')).toContain('--mobile-h: calc(100dvh - var(--taskbar-h) - 68px)');
    expect(posterWindow.getAttribute('style')).toContain('--mobile-h: 34px');
    expect(historyWindow.getAttribute('style')).toContain('--mobile-h: 34px');
    expect(container.querySelectorAll('.compact-expand-arrow')).toHaveLength(3);
    expect(container.querySelectorAll('[role="menubar"]')).toHaveLength(3);
  }, 15000);

  it('recomputes mobile slot placement when taskbar focus changes', async () => {
    render(MobileShellFlowWrapper);

    const previewWindow = screen.getByRole('dialog', { name: 'win_preview' });
    const posterWindow = screen.getByRole('dialog', { name: 'win_poster_maker' });
    const historyWindow = screen.getByRole('dialog', { name: 'win_history' });

    await fireEvent.click(screen.getByRole('button', { name: /taskbar_switch_to_window: win_poster_maker/i }));

    expect(previewWindow.getAttribute('style')).toContain('--mobile-h: 34px');
    expect(posterWindow.getAttribute('style')).toContain('--mobile-t: 34px');
    expect(posterWindow.getAttribute('style')).toContain('--mobile-h: calc(100dvh - var(--taskbar-h) - 68px)');
    expect(historyWindow.getAttribute('style')).toContain('--mobile-h: 34px');
  }, 15000);
});
