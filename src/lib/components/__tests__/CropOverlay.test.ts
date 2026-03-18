// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { fireEvent } from '@testing-library/svelte';

vi.mock('$lib/i18n/index.svelte', () => ({
  i18n: { t: vi.fn((key: string) => key) },
}));

import CropOverlay from '../editor/CropOverlay.svelte';

afterEach(() => cleanup());

describe('CropOverlay', () => {
  const defaultProps = () => ({
    imageEl: null as HTMLImageElement | null,
    containerEl: null as HTMLElement | null,
    onApply: vi.fn(),
    onCancel: vi.fn(),
  });

  it('renders the overlay', () => {
    const { container } = render(CropOverlay, { props: defaultProps() });
    expect(container.innerHTML).toBeTruthy();
  });

  it('renders cancel button', () => {
    const { container } = render(CropOverlay, { props: defaultProps() });
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const props = defaultProps();
    const { container } = render(CropOverlay, { props });
    // Find cancel button (typically the last or one with cancel text)
    const buttons = container.querySelectorAll('button');
    for (const btn of buttons) {
      if (btn.textContent?.toLowerCase().includes('cancel') || btn.textContent?.includes('crop_cancel')) {
        await fireEvent.click(btn);
        break;
      }
    }
    expect(props.onCancel).toHaveBeenCalled();
  });

  it('renders with actual image element', () => {
    const img = document.createElement('img');
    Object.defineProperty(img, 'naturalWidth', { value: 100 });
    Object.defineProperty(img, 'naturalHeight', { value: 100 });
    const containerEl = document.createElement('div');
    Object.defineProperty(containerEl, 'getBoundingClientRect', {
      value: () => ({ left: 0, top: 0, width: 400, height: 400 }),
    });

    const props = {
      ...defaultProps(),
      imageEl: img,
      containerEl,
    };
    const { container } = render(CropOverlay, { props });
    expect(container.innerHTML).toBeTruthy();
  });
});
