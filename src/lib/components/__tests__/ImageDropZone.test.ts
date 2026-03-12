// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { fireEvent } from '@testing-library/svelte';
import ImageDropZone from '../ImageDropZone.svelte';

afterEach(() => cleanup());

describe('ImageDropZone', () => {
  it('renders browse button', () => {
    const onImageSelected = vi.fn();
    const { container } = render(ImageDropZone, { props: { onImageSelected } });
    const browseBtn = container.querySelector('.browse-btn');
    expect(browseBtn).toBeTruthy();
  });

  it('renders drop zone with role=button', () => {
    const onImageSelected = vi.fn();
    const { container } = render(ImageDropZone, { props: { onImageSelected } });
    const dropzone = container.querySelector('[role="button"]');
    expect(dropzone).toBeTruthy();
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
