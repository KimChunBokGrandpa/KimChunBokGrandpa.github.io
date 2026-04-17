// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { fireEvent } from '@testing-library/svelte';

vi.mock('$lib/i18n/index.svelte', () => ({
  i18n: { t: vi.fn((key: string) => key) },
}));

const { dialogStore } = vi.hoisted(() => ({
  dialogStore: {
    requestConfirm: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('$lib/stores/dialogStore.svelte', () => ({
  dialogStore,
}));

import CustomPaletteEditor from '../palette/CustomPaletteEditor.svelte';

afterEach(() => cleanup());

describe('CustomPaletteEditor', () => {
  const defaultProps = () => ({
    onSave: vi.fn(),
    onCancel: vi.fn(),
  });

  it('renders the editor', () => {
    const { container } = render(CustomPaletteEditor, { props: defaultProps() });
    expect(container.innerHTML).toBeTruthy();
  });

  it('renders name input field', () => {
    const { container } = render(CustomPaletteEditor, { props: defaultProps() });
    const nameInput = container.querySelector('input[type="text"]');
    expect(nameInput).toBeTruthy();
  });

  it('renders with initial name and colors', () => {
    const props = {
      ...defaultProps(),
      initialName: 'Test Palette',
      initialColors: [
        { r: 255, g: 0, b: 0 },
        { r: 0, g: 255, b: 0 },
        { r: 0, g: 0, b: 255 },
      ],
    };
    const { container } = render(CustomPaletteEditor, { props });
    const nameInput = container.querySelector('input[type="text"]') as HTMLInputElement;
    expect(nameInput?.value).toBe('Test Palette');
  });

  it('renders add color button', () => {
    const { container } = render(CustomPaletteEditor, { props: defaultProps() });
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2); // at least cancel + save/add
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const props = defaultProps();
    const { container } = render(CustomPaletteEditor, { props });
    const buttons = container.querySelectorAll('button');
    for (const btn of buttons) {
      if (btn.textContent?.toLowerCase().includes('cancel') || btn.textContent?.includes('palette_cancel')) {
        await fireEvent.click(btn);
        break;
      }
    }
    expect(props.onCancel).toHaveBeenCalled();
  });

  it('uses shell confirm before discarding dirty changes', async () => {
    const props = {
      ...defaultProps(),
      initialName: 'Old Name',
      initialColors: [
        { r: 255, g: 0, b: 0 },
        { r: 0, g: 255, b: 0 },
      ],
    };
    const { container } = render(CustomPaletteEditor, { props });
    const nameInput = container.querySelector('input[type="text"]') as HTMLInputElement;
    nameInput.value = 'New Name';
    await fireEvent.input(nameInput);

    const buttons = container.querySelectorAll('button');
    for (const btn of buttons) {
      if (btn.textContent?.toLowerCase().includes('cancel') || btn.textContent?.includes('cancel')) {
        await fireEvent.click(btn);
        break;
      }
    }

    expect(dialogStore.requestConfirm).toHaveBeenCalledWith({
      title: 'dialog_unsaved_changes_title',
      message: 'unsaved_changes_confirm',
      confirmLabel: 'discard_changes',
      cancelLabel: 'cancel',
    });
    expect(props.onCancel).toHaveBeenCalled();
  });

  it('renders color entries for initial colors', () => {
    const props = {
      ...defaultProps(),
      initialColors: [
        { r: 255, g: 0, b: 0 },
        { r: 0, g: 255, b: 0 },
      ],
    };
    const { container } = render(CustomPaletteEditor, { props });
    // Look for color-related inputs or swatches
    const colorInputs = container.querySelectorAll('input[type="color"], .color-swatch, [class*="color"]');
    expect(colorInputs.length).toBeGreaterThan(0);
  });
});
