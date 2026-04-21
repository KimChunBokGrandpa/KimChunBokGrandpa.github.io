// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';

vi.mock('$lib/i18n/index.svelte', () => ({
  i18n: {
    t: vi.fn((key: string, ...args: (string | number)[]) => {
      if (key === 'desktop_open_program') return `open ${args[0]}`;
      if (key.startsWith('taskbar_') && args[0]) return `${key}: ${args[0]}`;
      return key;
    }),
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

    const previewTaskbar = screen.getByRole('button', { name: /taskbar_.*win_preview/i });
    expect(previewTaskbar.className).toContain('tb-active');
  }, 15000);

  it('launches Poster Maker from desktop icon and drives taskbar focus/minimize/restore flow', async () => {
    render(DesktopShellFlowWrapper);

    await fireEvent.dblClick(screen.getByRole('button', { name: /open win_poster_maker/i }));

    const posterTaskbar = screen.getByRole('button', { name: /taskbar_.*win_poster_maker/i });
    expect(posterTaskbar.className).toContain('tb-active');
    expect(screen.getByText('Poster Content')).toBeTruthy();

    const previewTaskbar = screen.getByRole('button', { name: /taskbar_.*win_preview/i });
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

  it('shows a launch strip for the selected desktop shortcut and opens from its button', async () => {
    render(DesktopShellFlowWrapper);

    await fireEvent.click(screen.getByRole('button', { name: /open win_retrocam/i }));

    expect(screen.getByTestId('desktop-launch-strip')).toBeTruthy();
    expect(screen.getByText('desktop_summary_retrocam')).toBeTruthy();

    await fireEvent.click(screen.getByTestId('desktop-launch-open-button'));

    const retroCamTaskbar = screen.getByRole('button', { name: /taskbar_.*win_retrocam/i });
    expect(retroCamTaskbar.className).toContain('tb-active');
  }, 15000);

  it('shows a first-run desktop guide that can relaunch Pixel Lab and then hides itself', async () => {
    render(DesktopShellFlowWrapper);

    expect(screen.getByTestId('desktop-first-run-guide')).toBeTruthy();

    await fireEvent.click(screen.getByRole('button', { name: /close win_preview/i }));
    expect(screen.queryByRole('button', { name: /taskbar_.*win_preview/i })).toBeNull();

    await fireEvent.click(screen.getByTestId('desktop-first-run-open-preview'));

    const previewTaskbar = screen.getByRole('button', { name: /taskbar_.*win_preview/i });
    expect(previewTaskbar.className).toContain('tb-active');
    expect(screen.queryByTestId('desktop-first-run-guide')).toBeNull();
  }, 15000);

  it('persists dismissal of the first-run desktop guide', async () => {
    render(DesktopShellFlowWrapper);

    await fireEvent.click(screen.getByTestId('desktop-first-run-dismiss'));
    expect(screen.queryByTestId('desktop-first-run-guide')).toBeNull();

    cleanup();
    render(DesktopShellFlowWrapper);

    expect(screen.queryByTestId('desktop-first-run-guide')).toBeNull();
  }, 15000);
});
