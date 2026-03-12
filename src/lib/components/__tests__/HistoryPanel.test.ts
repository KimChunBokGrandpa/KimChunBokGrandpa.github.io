// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { fireEvent } from '@testing-library/svelte';
import HistoryPanel from '../HistoryPanel.svelte';
import type { ProcessingSettings } from '$lib/types';

afterEach(() => cleanup());

function makeSettings(overrides: Partial<ProcessingSettings> = {}): ProcessingSettings {
  return {
    pixelSize: 4,
    palette: 'gameboy',
    crtEffect: false,
    glitchFilters: [],
    renderMode: 'pixel_perfect',
    glitchSeed: null,
    ditherType: 'none',
    ...overrides,
  };
}

function defaultProps() {
  return {
    history: [makeSettings({ pixelSize: 2 }), makeSettings({ pixelSize: 3 })],
    redoHistory: [makeSettings({ pixelSize: 5 })],
    currentSettings: makeSettings({ pixelSize: 4 }),
    onJumpToHistory: vi.fn(),
    onUndo: vi.fn(),
    onRedo: vi.fn(),
  };
}

describe('HistoryPanel', () => {
  it('renders undo and redo buttons', () => {
    const { container } = render(HistoryPanel, { props: defaultProps() });
    const buttons = container.querySelectorAll('.history-controls button');
    expect(buttons.length).toBe(2);
  });

  it('renders history items (past + current + redo)', () => {
    const { container } = render(HistoryPanel, { props: defaultProps() });
    const items = container.querySelectorAll('.history-item');
    // 2 past + 1 current + 1 redo = 4
    expect(items.length).toBe(4);
  });

  it('marks current item with current class', () => {
    const { container } = render(HistoryPanel, { props: defaultProps() });
    const current = container.querySelector('.history-item.current');
    expect(current).toBeTruthy();
  });

  it('calls onUndo when undo button is clicked', async () => {
    const props = defaultProps();
    const { container } = render(HistoryPanel, { props });
    const buttons = container.querySelectorAll('.history-controls button');
    await fireEvent.click(buttons[0]); // undo button
    expect(props.onUndo).toHaveBeenCalledOnce();
  });

  it('calls onRedo when redo button is clicked', async () => {
    const props = defaultProps();
    const { container } = render(HistoryPanel, { props });
    const buttons = container.querySelectorAll('.history-controls button');
    await fireEvent.click(buttons[1]); // redo button
    expect(props.onRedo).toHaveBeenCalledOnce();
  });

  it('disables undo button when history is empty', () => {
    const props = { ...defaultProps(), history: [] };
    const { container } = render(HistoryPanel, { props });
    const undoBtn = container.querySelectorAll('.history-controls button')[0] as HTMLButtonElement;
    expect(undoBtn.disabled).toBe(true);
  });

  it('disables redo button when redoHistory is empty', () => {
    const props = { ...defaultProps(), redoHistory: [] };
    const { container } = render(HistoryPanel, { props });
    const redoBtn = container.querySelectorAll('.history-controls button')[1] as HTMLButtonElement;
    expect(redoBtn.disabled).toBe(true);
  });

  it('calls onJumpToHistory when a past item is clicked', async () => {
    const props = defaultProps();
    const { container } = render(HistoryPanel, { props });
    const pastItems = container.querySelectorAll('.history-item.past');
    await fireEvent.click(pastItems[0]);
    expect(props.onJumpToHistory).toHaveBeenCalledWith(0, false);
  });

  it('shows step numbers starting from 1', () => {
    const { container } = render(HistoryPanel, { props: defaultProps() });
    const nums = container.querySelectorAll('.step-num');
    expect(nums[0].textContent).toBe('1');
    expect(nums[1].textContent).toBe('2');
    expect(nums[2].textContent).toBe('3'); // current
  });

  it('shows current badge on current item', () => {
    const { container } = render(HistoryPanel, { props: defaultProps() });
    const badge = container.querySelector('.current-badge');
    expect(badge).toBeTruthy();
  });
});
