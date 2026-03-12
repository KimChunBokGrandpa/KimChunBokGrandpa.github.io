// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import { fireEvent } from '@testing-library/svelte';
import BeforeAfterSlider from '../BeforeAfterSlider.svelte';

afterEach(() => cleanup());

const defaultProps = () => ({
  originalSrc: 'data:image/png;base64,iVBORw0KGgo=',
  processedSrc: 'data:image/png;base64,iVBORw0KGgo=',
});

describe('BeforeAfterSlider', () => {
  it('renders with role=slider', () => {
    render(BeforeAfterSlider, { props: defaultProps() });
    const slider = screen.getByRole('slider');
    expect(slider).toBeTruthy();
  });

  it('has aria-valuemin, aria-valuemax, aria-valuenow', () => {
    render(BeforeAfterSlider, { props: defaultProps() });
    const slider = screen.getByRole('slider');
    expect(slider.getAttribute('aria-valuemin')).toBe('0');
    expect(slider.getAttribute('aria-valuemax')).toBe('100');
    expect(slider.getAttribute('aria-valuenow')).toBe('50'); // default 50%
  });

  it('renders before and after images', () => {
    const { container } = render(BeforeAfterSlider, { props: defaultProps() });
    const images = container.querySelectorAll('img');
    expect(images.length).toBe(2);
  });

  it('renders before and after labels', () => {
    const { container } = render(BeforeAfterSlider, { props: defaultProps() });
    const labels = container.querySelectorAll('.ba-label');
    expect(labels.length).toBe(2);
  });

  it('renders the divider handle', () => {
    const { container } = render(BeforeAfterSlider, { props: defaultProps() });
    const handle = container.querySelector('.ba-handle');
    expect(handle).toBeTruthy();
  });

  it('uses custom imageRendering prop', () => {
    const { container } = render(BeforeAfterSlider, {
      props: { ...defaultProps(), imageRendering: 'crisp-edges' },
    });
    const afterImg = container.querySelector('.ba-after') as HTMLImageElement;
    expect(afterImg.style.imageRendering).toBe('crisp-edges');
  });

  it('is keyboard focusable (tabindex=0)', () => {
    render(BeforeAfterSlider, { props: defaultProps() });
    const slider = screen.getByRole('slider');
    expect(slider.getAttribute('tabindex')).toBe('0');
  });

  it('updates aria-valuenow on ArrowRight key', async () => {
    render(BeforeAfterSlider, { props: defaultProps() });
    const slider = screen.getByRole('slider');
    await fireEvent.keyDown(slider, { key: 'ArrowRight' });
    // 50 + 2 = 52
    expect(slider.getAttribute('aria-valuenow')).toBe('52');
  });

  it('updates aria-valuenow on ArrowLeft key', async () => {
    render(BeforeAfterSlider, { props: defaultProps() });
    const slider = screen.getByRole('slider');
    await fireEvent.keyDown(slider, { key: 'ArrowLeft' });
    // 50 - 2 = 48
    expect(slider.getAttribute('aria-valuenow')).toBe('48');
  });

  it('sets aria-valuenow to 0 on Home key', async () => {
    render(BeforeAfterSlider, { props: defaultProps() });
    const slider = screen.getByRole('slider');
    await fireEvent.keyDown(slider, { key: 'Home' });
    expect(slider.getAttribute('aria-valuenow')).toBe('0');
  });

  it('sets aria-valuenow to 100 on End key', async () => {
    render(BeforeAfterSlider, { props: defaultProps() });
    const slider = screen.getByRole('slider');
    await fireEvent.keyDown(slider, { key: 'End' });
    expect(slider.getAttribute('aria-valuenow')).toBe('100');
  });
});
