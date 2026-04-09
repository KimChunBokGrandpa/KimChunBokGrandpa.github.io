// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { fireEvent } from '@testing-library/svelte';
import DesktopIcons from '../window/DesktopIcons.svelte';
import type { WindowId } from '$lib/types';

afterEach(() => cleanup());

describe('DesktopIcons', () => {
  const defaultProps = () => ({
    selectedIcon: null as WindowId | null,
    onIconClick: vi.fn(),
    onIconDblClick: vi.fn(),
  });

  it('renders with role=toolbar', () => {
    const { container } = render(DesktopIcons, { props: defaultProps() });
    const toolbar = container.querySelector('[role="toolbar"]');
    expect(toolbar).toBeTruthy();
  });

  it('renders only the Pixel Lab desktop icon', () => {
    const { container } = render(DesktopIcons, { props: defaultProps() });
    const buttons = container.querySelectorAll('.desktop-icon');
    expect(buttons.length).toBe(1);
  });

  it('calls onIconClick when icon is clicked', async () => {
    const props = defaultProps();
    const { container } = render(DesktopIcons, { props });
    const buttons = container.querySelectorAll('.desktop-icon');
    await fireEvent.click(buttons[0]);
    expect(props.onIconClick).toHaveBeenCalled();
  });

  it('calls onIconDblClick on double click', async () => {
    const props = defaultProps();
    const { container } = render(DesktopIcons, { props });
    const buttons = container.querySelectorAll('.desktop-icon');
    await fireEvent.dblClick(buttons[0]);
    expect(props.onIconDblClick).toHaveBeenCalled();
  });

  it('applies selected class to the selected icon', () => {
    const props = { ...defaultProps(), selectedIcon: 'preview' as WindowId };
    const { container } = render(DesktopIcons, { props });
    const selected = container.querySelector('.icon-selected');
    expect(selected).toBeTruthy();
  });

  it('does not apply selected class when no icon is selected', () => {
    const { container } = render(DesktopIcons, { props: defaultProps() });
    const selected = container.querySelector('.icon-selected');
    expect(selected).toBeNull();
  });

  it('each icon has an aria-label', () => {
    const { container } = render(DesktopIcons, { props: defaultProps() });
    const buttons = container.querySelectorAll('.desktop-icon');
    buttons.forEach((btn) => {
      expect(btn.getAttribute('aria-label')).toBeTruthy();
    });
  });

  it('calls onIconDblClick on Enter keydown', async () => {
    const props = defaultProps();
    const { container } = render(DesktopIcons, { props });
    const buttons = container.querySelectorAll('.desktop-icon');
    await fireEvent.keyDown(buttons[0], { key: 'Enter' });
    expect(props.onIconDblClick).toHaveBeenCalled();
  });
});
