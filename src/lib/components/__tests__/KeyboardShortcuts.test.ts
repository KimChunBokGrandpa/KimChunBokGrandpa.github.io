// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import { fireEvent } from '@testing-library/svelte';
import KeyboardShortcuts from '../KeyboardShortcuts.svelte';

afterEach(() => cleanup());

describe('KeyboardShortcuts', () => {
  it('renders with role=dialog', () => {
    const onClose = vi.fn();
    render(KeyboardShortcuts, { props: { onClose } });
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('renders shortcut keys as kbd elements', () => {
    const onClose = vi.fn();
    const { container } = render(KeyboardShortcuts, { props: { onClose } });
    const kbdElements = container.querySelectorAll('kbd');
    expect(kbdElements.length).toBeGreaterThan(0);
  });

  it('renders all 10 shortcut entries', () => {
    const onClose = vi.fn();
    const { container } = render(KeyboardShortcuts, { props: { onClose } });
    const rows = container.querySelectorAll('tr');
    expect(rows.length).toBe(10);
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    const { container } = render(KeyboardShortcuts, { props: { onClose } });
    const closeBtn = container.querySelector('.ks-close')!;
    await fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const onClose = vi.fn();
    const { container } = render(KeyboardShortcuts, { props: { onClose } });
    const backdrop = container.querySelector('.ks-backdrop')!;
    await fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose on Escape key', async () => {
    const onClose = vi.fn();
    render(KeyboardShortcuts, { props: { onClose } });
    const backdrop = screen.getByRole('dialog');
    await fireEvent.keyDown(backdrop, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose on ? key', async () => {
    const onClose = vi.fn();
    render(KeyboardShortcuts, { props: { onClose } });
    const backdrop = screen.getByRole('dialog');
    await fireEvent.keyDown(backdrop, { key: '?' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('has aria-modal and aria-labelledby', () => {
    const onClose = vi.fn();
    render(KeyboardShortcuts, { props: { onClose } });
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('ks-dialog-title');
  });

  it('has a close button with aria-label', () => {
    const onClose = vi.fn();
    const { container } = render(KeyboardShortcuts, { props: { onClose } });
    const closeBtn = container.querySelector('.ks-close');
    expect(closeBtn?.getAttribute('aria-label')).toBeTruthy();
  });
});
