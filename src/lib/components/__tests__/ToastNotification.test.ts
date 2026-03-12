// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import ToastNotification from '../ToastNotification.svelte';

afterEach(() => cleanup());

describe('ToastNotification', () => {
  it('renders message text', () => {
    const onDone = vi.fn();
    render(ToastNotification, { props: { message: 'Test saved!', onDone } });
    expect(screen.getByText('Test saved!')).toBeTruthy();
  });

  it('renders with role=status for accessibility', () => {
    const onDone = vi.fn();
    render(ToastNotification, { props: { message: 'Hello', onDone } });
    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('shows success icon by default', () => {
    const onDone = vi.fn();
    render(ToastNotification, { props: { message: 'OK', onDone } });
    const toast = screen.getByRole('status');
    expect(toast.textContent).toContain('\u2705'); // ✅
  });

  it('shows error icon for error variant', () => {
    const onDone = vi.fn();
    render(ToastNotification, { props: { message: 'Fail', variant: 'error', onDone } });
    const toast = screen.getByRole('status');
    expect(toast.textContent).toContain('\u274C'); // ❌
  });

  it('shows warning icon for warning variant', () => {
    const onDone = vi.fn();
    render(ToastNotification, { props: { message: 'Warn', variant: 'warning', onDone } });
    const toast = screen.getByRole('status');
    expect(toast.textContent).toContain('\u26A0'); // ⚠
  });

  it('applies variant CSS class', () => {
    const onDone = vi.fn();
    render(ToastNotification, { props: { message: 'Err', variant: 'error', onDone } });
    const toast = screen.getByRole('status');
    expect(toast.className).toContain('toast-error');
  });

  it('calls onDone after duration', async () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    render(ToastNotification, { props: { message: 'Auto', duration: 1000, onDone } });

    expect(onDone).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    vi.advanceTimersByTime(300);
    expect(onDone).toHaveBeenCalledOnce();

    vi.useRealTimers();
  });
});
