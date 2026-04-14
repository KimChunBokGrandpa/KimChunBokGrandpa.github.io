// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';

vi.mock('$lib/i18n/index.svelte', () => ({
  i18n: { t: vi.fn((key: string) => key) },
}));

vi.mock('$lib/services/saveService', () => ({
  saveImage: vi.fn().mockResolvedValue('image_downloaded'),
}));

import { resetRetroCamStore } from '$lib/stores/retroCamStore.svelte';
import RetroCam from '../retrocam/RetroCam.svelte';

const OriginalPlay = HTMLMediaElement.prototype.play;
const OriginalGetContext = HTMLCanvasElement.prototype.getContext;
const OriginalToBlob = HTMLCanvasElement.prototype.toBlob;

beforeEach(() => {
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
});

afterEach(() => {
  cleanup();
  resetRetroCamStore(null);
  HTMLMediaElement.prototype.play = OriginalPlay;
  HTMLCanvasElement.prototype.getContext = OriginalGetContext;
  HTMLCanvasElement.prototype.toBlob = OriginalToBlob;
});

describe('RetroCam', () => {
  it('renders live preview and preset buttons when camera becomes ready', async () => {
    resetRetroCamStore({
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: vi.fn() }],
      } as unknown as MediaStream),
      enumerateDevices: vi.fn().mockResolvedValue([
        { kind: 'videoinput', deviceId: 'front-cam', label: 'Front Camera' },
      ] as MediaDeviceInfo[]),
    });

    render(RetroCam, { props: {} });

    expect(await screen.findByTestId('retrocam-video')).toBeTruthy();
    expect(screen.getByTestId('retrocam-device-select')).toBeTruthy();
    expect(screen.getByText('retrocam_preset_clean_pixel')).toBeTruthy();
    expect(screen.getByText('retrocam_preset_crt_pop')).toBeTruthy();
    expect(screen.getByText('retrocam_preset_game_boy')).toBeTruthy();
    expect(screen.getByText('retrocam_preset_warm_poster')).toBeTruthy();
  });

  it('shows retry-able denied state when webcam permission is rejected', async () => {
    resetRetroCamStore({
      getUserMedia: vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError')),
    });

    render(RetroCam, { props: {} });

    expect((await screen.findAllByText('retrocam_status_denied')).length).toBeGreaterThan(0);
    expect(screen.getByText('retrocam_start_camera')).toBeTruthy();
  });

  it('captures a snapshot and shows the saved preview area', async () => {
    const onMessage = vi.fn();
    resetRetroCamStore({
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: vi.fn() }],
      } as unknown as MediaStream),
    });

    render(RetroCam, { props: { onMessage } });

    await screen.findByTestId('retrocam-video');
    await fireEvent.click(screen.getByText('retrocam_capture_snapshot'));

    await waitFor(() => expect(onMessage).toHaveBeenCalledWith('retrocam_snapshot_captured'));
    expect(screen.getByAltText('retrocam_last_snapshot')).toBeTruthy();
  });

  it('calls the pixel lab handoff callback with the latest snapshot', async () => {
    const onOpenInPixelLab = vi.fn();
    resetRetroCamStore({
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: vi.fn() }],
      } as unknown as MediaStream),
    });

    render(RetroCam, { props: { onOpenInPixelLab } });

    await screen.findByTestId('retrocam-video');
    await fireEvent.click(screen.getByText('retrocam_capture_snapshot'));
    await fireEvent.click(screen.getByTestId('retrocam-open-in-pixel-lab-button'));

    await waitFor(() => expect(onOpenInPixelLab).toHaveBeenCalledTimes(1));
    const [file, presetId] = onOpenInPixelLab.mock.calls[0] as [File, string];
    expect(file.name).toMatch(/^retrocam_snapshot_/);
    expect(presetId).toBe('clean_pixel');
  });

  it('switches camera devices through the selector', async () => {
    const getUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    } as unknown as MediaStream);

    resetRetroCamStore({
      getUserMedia,
      enumerateDevices: vi.fn().mockResolvedValue([
        { kind: 'videoinput', deviceId: 'front-cam', label: 'Front Camera' },
        { kind: 'videoinput', deviceId: 'rear-cam', label: 'Rear Camera' },
      ] as MediaDeviceInfo[]),
    });

    render(RetroCam, { props: {} });

    const select = await screen.findByTestId('retrocam-device-select') as HTMLSelectElement;
    await waitFor(() => expect(select.options.length).toBe(3));
    select.value = 'rear-cam';
    await fireEvent.change(select);

    await waitFor(() => {
      expect(getUserMedia).toHaveBeenLastCalledWith({
        video: { deviceId: { exact: 'rear-cam' } },
        audio: false,
      });
    });
  });
});
