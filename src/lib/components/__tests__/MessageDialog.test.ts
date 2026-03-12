// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import { fireEvent } from '@testing-library/svelte';
import MessageDialog from '../MessageDialog.svelte';

afterEach(() => cleanup());

describe('MessageDialog', () => {
  it('renders with role=dialog', () => {
    const onClose = vi.fn();
    render(MessageDialog, { props: { message: 'Test message', onClose } });
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('displays the message text', () => {
    const onClose = vi.fn();
    render(MessageDialog, { props: { message: 'Something happened', onClose } });
    expect(screen.getByText('Something happened')).toBeTruthy();
  });

  it('displays custom title', () => {
    const onClose = vi.fn();
    render(MessageDialog, { props: { message: 'msg', title: 'Custom Title', onClose } });
    expect(screen.getByText('Custom Title')).toBeTruthy();
  });

  it('calls onClose when OK button is clicked', async () => {
    const onClose = vi.fn();
    render(MessageDialog, { props: { message: 'msg', onClose } });
    const okBtn = screen.getByText('OK');
    await fireEvent.click(okBtn);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when overlay is clicked', async () => {
    const onClose = vi.fn();
    render(MessageDialog, { props: { message: 'msg', onClose } });
    const overlay = document.querySelector('.dialog-overlay')!;
    await fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not close when dialog body is clicked (stopPropagation)', async () => {
    const onClose = vi.fn();
    render(MessageDialog, { props: { message: 'msg', onClose } });
    const dialogWin = document.querySelector('.dialog-win')!;
    await fireEvent.click(dialogWin);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose on Escape key', async () => {
    const onClose = vi.fn();
    render(MessageDialog, { props: { message: 'msg', onClose } });
    await fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('has aria-modal and aria-labelledby attributes', () => {
    const onClose = vi.fn();
    render(MessageDialog, { props: { message: 'msg', onClose } });
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('msg-dialog-title');
  });

  it('has a close button with aria-label', () => {
    const onClose = vi.fn();
    render(MessageDialog, { props: { message: 'msg', onClose } });
    const dialog = screen.getByRole('dialog');
    const titleBarBtn = dialog.querySelector('.title-bar-controls button');
    expect(titleBarBtn).toBeTruthy();
    expect(titleBarBtn?.getAttribute('aria-label')).toBeTruthy();
  });
});
