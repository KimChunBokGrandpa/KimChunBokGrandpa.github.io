// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/svelte';
import CompareView from '../editor/CompareView.svelte';

afterEach(() => cleanup());

const defaultProps = {
  originalSrc: 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=',
  processedSrc: 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=',
};

describe('CompareView', () => {
  describe('side-by-side variant', () => {
    it('renders two panels with before/after labels', () => {
      const { container } = render(CompareView, {
        props: { ...defaultProps, variant: 'side-by-side' },
      });
      const panels = container.querySelectorAll('.sbs-panel');
      expect(panels.length).toBe(2);

      const labels = container.querySelectorAll('.sbs-label');
      expect(labels.length).toBe(2);
    });

    it('renders two images', () => {
      const { container } = render(CompareView, {
        props: { ...defaultProps, variant: 'side-by-side' },
      });
      const images = container.querySelectorAll('img');
      expect(images.length).toBe(2);
    });

    it('renders a divider between panels', () => {
      const { container } = render(CompareView, {
        props: { ...defaultProps, variant: 'side-by-side' },
      });
      expect(container.querySelector('.sbs-divider')).toBeTruthy();
    });

    it('applies pixelated rendering by default for processed image', () => {
      const { container } = render(CompareView, {
        props: { ...defaultProps, variant: 'side-by-side' },
      });
      const images = container.querySelectorAll<HTMLElement>('.sbs-img');
      // First image (original) should be auto, second (processed) should be pixelated
      expect(images[0].style.imageRendering).toBe('auto');
      expect(images[1].style.imageRendering).toBe('pixelated');
    });

    it('applies bilinear rendering when renderMode is bilinear', () => {
      const { container } = render(CompareView, {
        props: { ...defaultProps, variant: 'side-by-side', renderMode: 'bilinear' },
      });
      const images = container.querySelectorAll<HTMLElement>('.sbs-img');
      expect(images[1].style.imageRendering).toBe('auto');
    });
  });

  describe('onion variant', () => {
    it('renders onion skin container', () => {
      const { container } = render(CompareView, {
        props: { ...defaultProps, variant: 'onion' },
      });
      expect(container.querySelector('.onion-skin')).toBeTruthy();
    });

    it('renders two images (base and overlay)', () => {
      const { container } = render(CompareView, {
        props: { ...defaultProps, variant: 'onion' },
      });
      expect(container.querySelectorAll('.onion-img').length).toBe(2);
      expect(container.querySelector('.onion-base')).toBeTruthy();
      expect(container.querySelector('.onion-overlay')).toBeTruthy();
    });

    it('renders opacity slider', () => {
      const { container } = render(CompareView, {
        props: { ...defaultProps, variant: 'onion' },
      });
      const slider = container.querySelector('.onion-slider');
      expect(slider).toBeTruthy();
      expect(slider?.getAttribute('type')).toBe('range');
    });

    it('shows 50% opacity value initially', () => {
      const { container } = render(CompareView, {
        props: { ...defaultProps, variant: 'onion' },
      });
      const value = container.querySelector('.onion-value');
      expect(value?.textContent).toBe('50%');
    });

    it('updates overlay opacity and label when slider changes', async () => {
      const { container } = render(CompareView, {
        props: { ...defaultProps, variant: 'onion' },
      });

      const slider = container.querySelector('.onion-slider') as HTMLInputElement;
      const overlay = container.querySelector('.onion-overlay') as HTMLImageElement;
      const value = container.querySelector('.onion-value');

      await fireEvent.input(slider, { target: { value: '0.8' } });

      expect(overlay.style.opacity).toBe('0.8');
      expect(value?.textContent).toBe('80%');
    });

    it('applies postFilterCss to overlay image', () => {
      const { container } = render(CompareView, {
        props: { ...defaultProps, variant: 'onion', postFilterCss: 'brightness(1.2)' },
      });
      const overlay = container.querySelector('.onion-overlay') as HTMLImageElement;
      expect(overlay.style.filter).toBe('brightness(1.2)');
    });
  });

  describe('slider variant', () => {
    it('renders BeforeAfterSlider component', () => {
      const { container } = render(CompareView, {
        props: { ...defaultProps, variant: 'slider' },
      });
      // BeforeAfterSlider renders its own container
      // Just verify no side-by-side or onion elements
      expect(container.querySelector('.side-by-side')).toBeNull();
      expect(container.querySelector('.onion-skin')).toBeNull();
    });
  });
});
