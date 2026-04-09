// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, fireEvent, waitFor } from '@testing-library/svelte';

vi.mock('$lib/i18n/index.svelte', () => ({
  i18n: { t: vi.fn((key: string) => key) },
}));

import EyedropperOverlay from '../editor/EyedropperOverlay.svelte';

function makePreviewImage(): HTMLImageElement {
  const img = document.createElement('img');
  Object.defineProperty(img, 'naturalWidth', { value: 4, configurable: true });
  Object.defineProperty(img, 'naturalHeight', { value: 4, configurable: true });
  img.getBoundingClientRect = () =>
    ({
      left: 10,
      top: 20,
      width: 40,
      height: 40,
      right: 50,
      bottom: 60,
      x: 10,
      y: 20,
      toJSON: () => {},
    }) as DOMRect;
  return img;
}

describe('EyedropperOverlay', () => {
  let writeTextMock: ReturnType<typeof vi.fn>;
  let getImageDataMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
    });

    getImageDataMock = vi.fn(() => ({
      data: new Uint8ClampedArray([17, 34, 51, 255]),
    }));

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
      getImageData: getImageDataMock,
    } as unknown as CanvasRenderingContext2D);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('picks a color and renders tooltip info', async () => {
    const previewImg = makePreviewImage();
    const view = render(EyedropperOverlay, {
      props: {
        active: true,
        previewImg,
        processedImageSrc: 'blob:processed',
        isPanning: false,
      },
    });

    await (view.component as unknown as { pick: (e: MouseEvent) => void }).pick(
      new MouseEvent('click', { clientX: 22, clientY: 34 }),
    );

    await waitFor(() => {
      expect(view.container.querySelector('.color-tooltip')).toBeTruthy();
    });
    expect(view.container.querySelector('.color-hex')?.textContent).toBe('#112233');
    expect(view.container.querySelector('.color-rgb')?.textContent).toBe('RGB(17, 34, 51)');
  });

  it('copies the picked color to clipboard', async () => {
    const previewImg = makePreviewImage();
    const view = render(EyedropperOverlay, {
      props: {
        active: true,
        previewImg,
        processedImageSrc: 'blob:processed',
        isPanning: false,
      },
    });

    await (view.component as unknown as { pick: (e: MouseEvent) => void }).pick(
      new MouseEvent('click', { clientX: 22, clientY: 34 }),
    );

    const copyButton = view.container.querySelector('[aria-label="btn_copy_color"]') as HTMLButtonElement;
    await fireEvent.click(copyButton);

    expect(writeTextMock).toHaveBeenCalledWith('#112233');
  });

  it('dismisses the tooltip from the close button', async () => {
    const previewImg = makePreviewImage();
    const view = render(EyedropperOverlay, {
      props: {
        active: true,
        previewImg,
        processedImageSrc: 'blob:processed',
        isPanning: false,
      },
    });

    await (view.component as unknown as { pick: (e: MouseEvent) => void }).pick(
      new MouseEvent('click', { clientX: 22, clientY: 34 }),
    );

    const closeButton = view.container.querySelector('[aria-label="btn_dismiss_color"]') as HTMLButtonElement;
    await fireEvent.click(closeButton);

    await waitFor(() => {
      expect(view.container.querySelector('.color-tooltip')).toBeNull();
    });
  });

  it('does not pick a color while panning', async () => {
    const previewImg = makePreviewImage();
    const view = render(EyedropperOverlay, {
      props: {
        active: true,
        previewImg,
        processedImageSrc: 'blob:processed',
        isPanning: true,
      },
    });

    await (view.component as unknown as { pick: (e: MouseEvent) => void }).pick(
      new MouseEvent('click', { clientX: 22, clientY: 34 }),
    );

    expect(view.container.querySelector('.color-tooltip')).toBeNull();
    expect(getImageDataMock).not.toHaveBeenCalled();
  });
});
