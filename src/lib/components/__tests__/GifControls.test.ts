// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { fireEvent } from '@testing-library/svelte';
import GifControls from '../media/GifControls.svelte';

afterEach(() => cleanup());

function defaultProps() {
  return {
    currentFrame: 2,
    frameCount: 10,
    isPlaying: false,
    isExporting: false,
    exportProgress: 0,
    onPlay: vi.fn(),
    onPause: vi.fn(),
    onSeek: vi.fn(),
    onExport: vi.fn(),
  };
}

function reorderProps() {
  return {
    ...defaultProps(),
    onExportAnimatedWebp: vi.fn(),
    onDeleteFrame: vi.fn(),
    onDuplicateFrame: vi.fn(),
    onReorderFrame: vi.fn(),
  };
}

describe('GifControls', () => {
  it('displays current frame info', () => {
    const { container } = render(GifControls, { props: defaultProps() });
    const frameInfo = container.querySelector('.gif-frame-info');
    expect(frameInfo?.textContent).toBe('3/10'); // currentFrame + 1
  });

  it('calls onPlay when play button is clicked while paused', async () => {
    const props = defaultProps();
    const { container } = render(GifControls, { props });
    const playBtn = container.querySelector('.gif-btn')!;
    await fireEvent.click(playBtn);
    expect(props.onPlay).toHaveBeenCalledOnce();
  });

  it('calls onPause when play button is clicked while playing', async () => {
    const props = { ...defaultProps(), isPlaying: true };
    const { container } = render(GifControls, { props });
    const playBtn = container.querySelector('.gif-btn')!;
    await fireEvent.click(playBtn);
    expect(props.onPause).toHaveBeenCalledOnce();
  });

  it('calls onSeek(0) for first frame button', async () => {
    const props = defaultProps();
    const { container } = render(GifControls, { props });
    const buttons = container.querySelectorAll('.gif-btn');
    // buttons: play, first, prev, next, last, export
    await fireEvent.click(buttons[1]); // ⏮ first frame
    expect(props.onSeek).toHaveBeenCalledWith(0);
  });

  it('calls onSeek for previous frame button', async () => {
    const props = defaultProps();
    const { container } = render(GifControls, { props });
    const buttons = container.querySelectorAll('.gif-btn');
    await fireEvent.click(buttons[2]); // ◀ prev
    expect(props.onSeek).toHaveBeenCalledWith(1); // Math.max(0, 2-1)
  });

  it('calls onSeek for next frame button', async () => {
    const props = defaultProps();
    const { container } = render(GifControls, { props });
    const buttons = container.querySelectorAll('.gif-btn');
    await fireEvent.click(buttons[3]); // ▶ next
    expect(props.onSeek).toHaveBeenCalledWith(3); // Math.min(9, 2+1)
  });

  it('calls onSeek(frameCount-1) for last frame button', async () => {
    const props = defaultProps();
    const { container } = render(GifControls, { props });
    const buttons = container.querySelectorAll('.gif-btn');
    await fireEvent.click(buttons[4]); // ⏭ last
    expect(props.onSeek).toHaveBeenCalledWith(9);
  });

  it('calls onExport when export button is clicked', async () => {
    const props = defaultProps();
    const { container } = render(GifControls, { props });
    const exportBtn = container.querySelector('.gif-export-btn')!;
    await fireEvent.click(exportBtn);
    expect(props.onExport).toHaveBeenCalledOnce();
  });

  it('disables buttons when exporting', () => {
    const props = { ...defaultProps(), isExporting: true, exportProgress: 0.5 };
    const { container } = render(GifControls, { props });
    const buttons = container.querySelectorAll('.gif-btn:not(.gif-cancel-btn)');
    buttons.forEach((btn) => {
      expect((btn as HTMLButtonElement).disabled).toBe(true);
    });
  });

  it('shows export progress when exporting', () => {
    const props = { ...defaultProps(), isExporting: true, exportProgress: 0.75 };
    const { container } = render(GifControls, { props });
    const exportStatus = container.querySelector('.gif-export-status');
    expect(exportStatus?.textContent).toContain('75%');
  });

  it('renders progress bar when exporting', () => {
    const props = { ...defaultProps(), isExporting: true, exportProgress: 0.5 };
    const { container } = render(GifControls, { props });
    const progressBar = container.querySelector('.gif-export-bar');
    expect(progressBar).toBeTruthy();
  });

  it('renders range slider', () => {
    const { container } = render(GifControls, { props: defaultProps() });
    const slider = container.querySelector('input[type="range"]') as HTMLInputElement;
    expect(slider).toBeTruthy();
    expect(slider.min).toBe('0');
    expect(slider.max).toBe('9');
  });

  it('renders draggable frame strip when reorder callback exists', () => {
    const { container } = render(GifControls, { props: reorderProps() });
    const chips = container.querySelectorAll('.gif-frame-chip');
    expect(chips).toHaveLength(10);
    expect(container.querySelector('.gif-frame-strip-label')?.textContent).toBeTruthy();
  });

  it('calls onReorderFrame when frame chip is dropped on another chip', async () => {
    const props = reorderProps();
    const { container } = render(GifControls, { props });
    const chips = container.querySelectorAll('.gif-frame-chip');
    const dataTransfer = {
      setData: vi.fn(),
      effectAllowed: 'move',
      dropEffect: 'move',
    } as unknown as DataTransfer;

    await fireEvent.dragStart(chips[2], { dataTransfer });
    await fireEvent.dragOver(chips[5], { dataTransfer });
    await fireEvent.drop(chips[5], { dataTransfer });

    expect(props.onReorderFrame).toHaveBeenCalledWith(2, 5);
  });

  it('seeks when frame chip is clicked', async () => {
    const props = reorderProps();
    const { container } = render(GifControls, { props });
    const chips = container.querySelectorAll('.gif-frame-chip');
    await fireEvent.click(chips[4]);
    expect(props.onSeek).toHaveBeenCalledWith(4);
  });

  it('calls animated WebP export callback when button is clicked', async () => {
    const props = reorderProps();
    const { container } = render(GifControls, { props });
    const buttons = Array.from(container.querySelectorAll('.gif-export-btn'));
    const animatedWebpBtn = buttons.at(-1) as HTMLButtonElement;
    await fireEvent.click(animatedWebpBtn);
    expect(props.onExportAnimatedWebp).toHaveBeenCalledOnce();
  });
});
