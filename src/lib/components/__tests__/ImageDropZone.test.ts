// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { fireEvent } from '@testing-library/svelte';
import ImageDropZone from '../editor/ImageDropZone.svelte';

afterEach(() => cleanup());

function mockNavigatorPlatform(platform: string) {
  Object.defineProperty(window.navigator, 'platform', {
    configurable: true,
    value: platform,
  });
}

describe('ImageDropZone', () => {
  it('renders browse button', () => {
    const onImageSelected = vi.fn();
    const { container } = render(ImageDropZone, { props: { onImageSelected } });
    const browseBtn = container.querySelector('.browse-btn');
    expect(browseBtn).toBeTruthy();
  });

  it('uses canonical brand emoji for the primary drop actions', () => {
    const onImageSelected = vi.fn();
    const { container } = render(ImageDropZone, { props: { onImageSelected } });
    const buttons = container.querySelectorAll('.browse-btn');
    expect(buttons[0]?.textContent).toContain('📂');
    expect(buttons[1]?.textContent).toContain('🖼️');
  });

  it('renders separate drop target button without nesting action buttons', () => {
    const onImageSelected = vi.fn();
    const { container } = render(ImageDropZone, { props: { onImageSelected } });
    const dropTarget = container.querySelector('[data-testid="drop-target-button"]');
    const browseButton = container.querySelector('[data-testid="browse-image-button"]');
    const sampleButton = container.querySelector('[data-testid="try-sample-button"]');
    expect(dropTarget).toBeTruthy();
    expect(dropTarget?.contains(browseButton)).toBe(false);
    expect(dropTarget?.contains(sampleButton)).toBe(false);
  });

  it('gives the onboarding dismiss control an accessible label', () => {
    const onImageSelected = vi.fn();
    const { getByLabelText } = render(ImageDropZone, { props: { onImageSelected } });
    expect(getByLabelText("Don't show again")).toBeTruthy();
  });

  it('shows platform-aware paste guidance', () => {
    mockNavigatorPlatform('MacIntel');

    const onImageSelected = vi.fn();
    const { container } = render(ImageDropZone, { props: { onImageSelected } });
    expect(container.textContent).toContain('Cmd+V');
  });

  it('has hidden file input with correct accept types', () => {
    const onImageSelected = vi.fn();
    const { container } = render(ImageDropZone, { props: { onImageSelected } });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.accept).toContain('image/png');
    expect(input.accept).toContain('image/jpeg');
    expect(input.accept).toContain('image/gif');
  });

  it('shows dragging state on dragenter', async () => {
    const onImageSelected = vi.fn();
    const { container } = render(ImageDropZone, { props: { onImageSelected } });
    const dropzone = container.querySelector('.dropzone')!;
    await fireEvent.dragEnter(dropzone);
    expect(dropzone.classList.contains('dragging')).toBe(true);
  });

  it('calls onImageSelected when valid file is dropped', async () => {
    const onImageSelected = vi.fn();
    const { container } = render(ImageDropZone, { props: { onImageSelected } });
    const dropzone = container.querySelector('.dropzone')!;

    const file = new File(['dummy'], 'test.png', { type: 'image/png' });
    const dataTransfer = { files: [file] } as unknown as DataTransfer;

    await fireEvent.drop(dropzone, { dataTransfer });
    expect(onImageSelected).toHaveBeenCalledWith(file);
  });

  it('calls onError when invalid file type is dropped', async () => {
    const onImageSelected = vi.fn();
    const onError = vi.fn();
    const { container } = render(ImageDropZone, { props: { onImageSelected, onError } });
    const dropzone = container.querySelector('.dropzone')!;

    const file = new File(['dummy'], 'test.txt', { type: 'text/plain' });
    const dataTransfer = { files: [file] } as unknown as DataTransfer;

    await fireEvent.drop(dropzone, { dataTransfer });
    expect(onImageSelected).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
  });

  it('rejects invalid file types from the file picker too', async () => {
    const onImageSelected = vi.fn();
    const onError = vi.fn();
    const { container } = render(ImageDropZone, { props: { onImageSelected, onError } });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File(['dummy'], 'test.txt', { type: 'text/plain' });
    await fireEvent.change(input, { target: { files: [file] } });

    expect(onImageSelected).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
  });

  it('rejects oversized images from clipboard and picker flows', async () => {
    const onImageSelected = vi.fn();
    const onError = vi.fn();
    const { container } = render(ImageDropZone, { props: { onImageSelected, onError } });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const largeFile = new File(['dummy'], 'large.png', { type: 'image/png' });
    Object.defineProperty(largeFile, 'size', { value: 51 * 1024 * 1024 });

    await fireEvent.change(input, { target: { files: [largeFile] } });

    expect(onImageSelected).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
  });

  it('removes dragging state on drop', async () => {
    const onImageSelected = vi.fn();
    const { container } = render(ImageDropZone, { props: { onImageSelected } });
    const dropzone = container.querySelector('.dropzone')!;

    await fireEvent.dragEnter(dropzone);
    expect(dropzone.classList.contains('dragging')).toBe(true);

    const file = new File(['dummy'], 'test.png', { type: 'image/png' });
    const dataTransfer = { files: [file] } as unknown as DataTransfer;
    await fireEvent.drop(dropzone, { dataTransfer });
    expect(dropzone.classList.contains('dragging')).toBe(false);
  });
});
