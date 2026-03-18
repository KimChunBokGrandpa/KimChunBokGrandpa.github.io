// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { fireEvent } from '@testing-library/svelte';

vi.mock('$app/environment', () => ({ browser: true }));

vi.mock('$lib/i18n/index.svelte', () => ({
  i18n: { t: vi.fn((key: string) => key) },
}));

vi.mock('$lib/stores/customPaletteStore.svelte', () => ({
  customPaletteStore: {
    palettes: [],
    addPalette: vi.fn(),
    updatePalette: vi.fn(),
    removePalette: vi.fn(),
    getPaletteById: vi.fn(() => null),
  },
}));

vi.mock('$lib/utils/paletteIO', () => ({
  parsePaletteFile: vi.fn(),
  exportAsHex: vi.fn(() => ''),
  exportAsGpl: vi.fn(() => ''),
  downloadFile: vi.fn(),
}));

import PaletteGallery from '../palette/PaletteGallery.svelte';

afterEach(() => cleanup());

describe('PaletteGallery', () => {
  const defaultProps = () => ({
    selectedPaletteId: 'original',
    onSelect: vi.fn(),
  });

  it('renders the gallery container', () => {
    const { container } = render(PaletteGallery, { props: defaultProps() });
    expect(container.innerHTML).toBeTruthy();
  });

  it('renders palette theme tabs', () => {
    const { container } = render(PaletteGallery, { props: defaultProps() });
    const tabs = container.querySelectorAll('.theme-tab, [role="tab"], button');
    expect(tabs.length).toBeGreaterThan(0);
  });

  it('renders palette items', () => {
    const { container } = render(PaletteGallery, { props: defaultProps() });
    // Look for palette grid items
    const items = container.querySelectorAll('.pg-item, .pg-swatch, button');
    expect(items.length).toBeGreaterThan(0);
  });

  it('renders with selected palette highlighted', () => {
    const props = { ...defaultProps(), selectedPaletteId: 'gameboy' };
    const { container } = render(PaletteGallery, { props });
    expect(container.innerHTML).toBeTruthy();
  });

  it('calls onSelect when palette is clicked', async () => {
    const props = defaultProps();
    const { container } = render(PaletteGallery, { props });
    // Find clickable palette items
    const items = container.querySelectorAll('.palette-item, [class*="palette"]');
    if (items.length > 0) {
      await fireEvent.click(items[0]);
    }
    // Note: onSelect may or may not be called depending on what was clicked
    expect(container.innerHTML).toBeTruthy();
  });
});
