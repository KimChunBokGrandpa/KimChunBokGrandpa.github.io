// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';

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

import { resetRetroCamStore } from '$lib/stores/retroCamStore.svelte';
import RetroCamPixelLabFlowWrapper from './RetroCamPixelLabFlowWrapper.svelte';

const OriginalPlay = HTMLMediaElement.prototype.play;
const OriginalGetContext = HTMLCanvasElement.prototype.getContext;
const OriginalToBlob = HTMLCanvasElement.prototype.toBlob;
const OriginalCreateObjectURL = URL.createObjectURL;
const OriginalRevokeObjectURL = URL.revokeObjectURL;

describe('RetroCam to Pixel Lab desktop flow', () => {
  beforeEach(() => {
    mockStorage.clear();
    vi.clearAllMocks();
    Object.defineProperty(HTMLMediaElement.prototype, 'srcObject', {
      configurable: true,
      writable: true,
      value: null,
    });
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      filter: '',
      drawImage: vi.fn(),
    })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
      callback?.(new Blob(['snapshot'], { type: 'image/png' }));
    }) as typeof HTMLCanvasElement.prototype.toBlob;
    URL.createObjectURL = vi.fn(() => 'blob:retrocam-snapshot');
    URL.revokeObjectURL = vi.fn();

    resetRetroCamStore({
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: vi.fn() }],
      } as unknown as MediaStream),
    });
  });

  afterEach(() => {
    cleanup();
    resetRetroCamStore(null);
    HTMLMediaElement.prototype.play = OriginalPlay;
    HTMLCanvasElement.prototype.getContext = OriginalGetContext;
    HTMLCanvasElement.prototype.toBlob = OriginalToBlob;
    URL.createObjectURL = OriginalCreateObjectURL;
    URL.revokeObjectURL = OriginalRevokeObjectURL;
  });

  it('launches RetroCam from desktop and hands the captured snapshot into Pixel Lab', async () => {
    render(RetroCamPixelLabFlowWrapper);

    await fireEvent.dblClick(screen.getByRole('button', { name: /open win_retrocam/i }));
    expect(screen.getByRole('button', { name: /taskbar_minimize_window: win_retrocam/i }).className).toContain('tb-active');

    await screen.findByTestId('retrocam-video');
    await fireEvent.click(screen.getByText('retrocam_capture_snapshot'));
    await fireEvent.click(screen.getByTestId('retrocam-open-in-pixel-lab-button'));

    await waitFor(() => {
      expect(screen.getByTestId('pixel-lab-loaded-capture').textContent).toMatch(/^retrocam_snapshot_/);
    });

    expect(screen.getByText('Settings Surface')).toBeTruthy();
    const previewTaskbar = screen.getByRole('button', { name: /taskbar_minimize_window: win_preview/i });
    expect(previewTaskbar.className).toContain('tb-active');
  }, 15000);
});
