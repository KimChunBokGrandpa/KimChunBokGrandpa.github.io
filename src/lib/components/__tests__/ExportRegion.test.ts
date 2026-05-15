// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { fireEvent } from '@testing-library/svelte';

vi.mock('$lib/i18n/index.svelte', () => ({
  i18n: {
    t: vi.fn((key: string) => key),
    locale: 'en',
  },
}));

vi.mock('$lib/utils/relativeTime', () => ({
  formatRelativeTime: vi.fn((_iso: string, _locale: string) => '5 minutes ago'),
}));

import ExportRegion from '../editor/ExportRegion.svelte';
import type { ExportViewModel } from '$lib/utils/exportHierarchy';

afterEach(() => cleanup());

function makeStillViewModel(overrides?: Partial<ExportViewModel>): ExportViewModel {
  return {
    mediaKind: 'still',
    hasProcessedImage: true,
    busy: false,
    cancel: null,
    primary: {
      id: 'save-still',
      labelKey: 'save_as',
      subLabel: 'PNG',
      icon: '💾',
      testId: 'save-image-button',
      busy: false,
      blocked: false,
      tooltip: 'Ctrl+S',
      ariaLabel: 'Save As · PNG',
    },
    sections: [],
    formatSelector: {
      visible: true,
      format: 'png',
      showsQualitySlider: false,
      quality: 0.8,
    },
    history: {
      placeholderLabelKey: 'export_history_empty',
      latest: null,
    },
    ...overrides,
  };
}

function makeAnimationViewModel(overrides?: Partial<ExportViewModel>): ExportViewModel {
  return {
    mediaKind: 'animation',
    hasProcessedImage: true,
    busy: false,
    cancel: null,
    primary: {
      id: 'export-gif',
      labelKey: 'export_gif',
      icon: '🎬',
      testId: 'save-image-button',
      busy: false,
      blocked: false,
      tooltip: 'Ctrl+S',
      ariaLabel: 'Export GIF',
    },
    sections: [
      {
        id: 'animation-variants',
        labelKey: 'export_section_animation',
        actions: [
          {
            id: 'export-apng',
            labelKey: 'export_apng',
            icon: '🎞️',
            section: 'animation-variants',
            available: true,
            disabled: false,
          },
          {
            id: 'export-animated-svg',
            labelKey: 'export_animated_svg',
            icon: '🎨',
            section: 'animation-variants',
            available: true,
            disabled: false,
          },
        ],
      },
    ],
    formatSelector: {
      visible: false,
      format: 'png',
      showsQualitySlider: false,
      quality: 0.8,
    },
    history: {
      placeholderLabelKey: 'export_history_empty',
      latest: null,
    },
    ...overrides,
  };
}

function makeNoneViewModel(): ExportViewModel {
  return {
    mediaKind: 'none',
    hasProcessedImage: false,
    busy: false,
    cancel: null,
    primary: null,
    sections: [],
    formatSelector: {
      visible: false,
      format: 'png',
      showsQualitySlider: false,
      quality: 0.8,
    },
    history: {
      placeholderLabelKey: 'export_history_empty',
      latest: null,
    },
  };
}

function defaultCallbacks() {
  return {
    onInvokePrimary: vi.fn(),
    onInvokeSecondary: vi.fn(),
    onCancelAnimationExport: vi.fn(),
    onFormatChange: vi.fn(),
    onQualityChange: vi.fn(),
    onApplyNow: vi.fn(),
  };
}

describe('ExportRegion', () => {
  describe('data-testid anchors', () => {
    it('renders export-region anchor', () => {
      const { getByTestId } = render(ExportRegion, {
        props: { viewModel: makeStillViewModel(), ...defaultCallbacks() },
      });
      expect(getByTestId('export-region')).toBeTruthy();
    });

    it('renders export-primary-action wrapper when primary is not null', () => {
      const { getByTestId } = render(ExportRegion, {
        props: { viewModel: makeStillViewModel(), ...defaultCallbacks() },
      });
      expect(getByTestId('export-primary-action')).toBeTruthy();
    });

    it('renders save-image-button on the primary button element', () => {
      const { getByTestId } = render(ExportRegion, {
        props: { viewModel: makeStillViewModel(), ...defaultCallbacks() },
      });
      expect(getByTestId('save-image-button')).toBeTruthy();
      expect(getByTestId('save-image-button').tagName).toBe('BUTTON');
    });

    it('renders animation-variants-group when animation sections are present', () => {
      const { getByTestId } = render(ExportRegion, {
        props: { viewModel: makeAnimationViewModel(), ...defaultCallbacks() },
      });
      expect(getByTestId('animation-variants-group')).toBeTruthy();
    });

    it('renders export-history-readout', () => {
      const { getByTestId } = render(ExportRegion, {
        props: { viewModel: makeStillViewModel(), ...defaultCallbacks() },
      });
      expect(getByTestId('export-history-readout')).toBeTruthy();
    });
  });

  describe('viewModel.primary=null (empty state)', () => {
    it('renders only export-empty-copy when primary is null', () => {
      const { getByTestId, queryByTestId } = render(ExportRegion, {
        props: { viewModel: makeNoneViewModel(), ...defaultCallbacks() },
      });
      expect(getByTestId('export-empty-copy')).toBeTruthy();
      expect(queryByTestId('export-primary-action')).toBeNull();
      expect(queryByTestId('export-history-readout')).toBeNull();
    });
  });

  describe('primary busy state', () => {
    it('sets aria-busy="true" when primary is busy', () => {
      const vm = makeStillViewModel({
        busy: true,
        primary: {
          id: 'save-still',
          labelKey: 'save_as',
          subLabel: 'PNG',
          icon: '💾',
          testId: 'save-image-button',
          busy: true,
          blocked: false,
          tooltip: 'Ctrl+S',
          ariaLabel: 'Save As · PNG',
        },
      });
      const { getByTestId } = render(ExportRegion, {
        props: { viewModel: vm, ...defaultCallbacks() },
      });
      const btn = getByTestId('save-image-button');
      expect(btn.getAttribute('aria-busy')).toBe('true');
    });

    it('disables the primary button when busy so clicks are blocked', () => {
      const vm = makeStillViewModel({
        busy: true,
        primary: {
          id: 'save-still',
          labelKey: 'save_as',
          subLabel: 'PNG',
          icon: '💾',
          testId: 'save-image-button',
          busy: true,
          blocked: false,
          tooltip: 'Ctrl+S',
          ariaLabel: 'Save As · PNG',
        },
      });
      const { getByTestId } = render(ExportRegion, {
        props: { viewModel: vm, ...defaultCallbacks() },
      });
      const btn = getByTestId('save-image-button') as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });
  });

  describe('format selector quality slider', () => {
    it('does not render quality slider when format is PNG', () => {
      const vm = makeStillViewModel({
        formatSelector: {
          visible: true,
          format: 'png',
          showsQualitySlider: false,
          quality: 0.8,
        },
      });
      const { container } = render(ExportRegion, {
        props: { viewModel: vm, ...defaultCallbacks() },
      });
      const slider = container.querySelector('.export-quality-slider');
      expect(slider).toBeNull();
    });

    it('renders quality slider when format is WebP', () => {
      const vm = makeStillViewModel({
        formatSelector: {
          visible: true,
          format: 'webp',
          showsQualitySlider: true,
          quality: 0.8,
        },
      });
      const { container } = render(ExportRegion, {
        props: { viewModel: vm, ...defaultCallbacks() },
      });
      const slider = container.querySelector('.export-quality-slider');
      expect(slider).toBeTruthy();
    });
  });

  describe('animation busy state', () => {
    it('disables all variant buttons and shows cancel when animation is busy', () => {
      const vm = makeAnimationViewModel({
        busy: true,
        cancel: { visible: true, labelKey: 'cancel' },
        primary: {
          id: 'export-gif',
          labelKey: 'export_gif',
          icon: '🎬',
          testId: 'save-image-button',
          busy: true,
          blocked: false,
          tooltip: 'Ctrl+S',
          ariaLabel: 'Export GIF',
        },
        sections: [
          {
            id: 'animation-variants',
            labelKey: 'export_section_animation',
            actions: [
              {
                id: 'export-apng',
                labelKey: 'export_apng',
                icon: '🎞️',
                section: 'animation-variants',
                available: true,
                disabled: true,
              },
              {
                id: 'export-animated-svg',
                labelKey: 'export_animated_svg',
                icon: '🎨',
                section: 'animation-variants',
                available: true,
                disabled: true,
              },
            ],
          },
        ],
      });
      const { getByTestId, container } = render(ExportRegion, {
        props: { viewModel: vm, ...defaultCallbacks() },
      });

      // All variant buttons should be disabled
      const variantButtons = container.querySelectorAll('.export-variant');
      variantButtons.forEach((btn) => {
        expect((btn as HTMLButtonElement).disabled).toBe(true);
      });

      // Cancel button should be visible
      expect(getByTestId('export-cancel-animation')).toBeTruthy();
    });
  });

  describe('history readout', () => {
    it('renders latest entry format and dimensions', () => {
      const vm = makeStillViewModel({
        history: {
          placeholderLabelKey: 'export_history_empty',
          latest: {
            exportId: 'abc123',
            format: 'PNG',
            createdAtIso: '2024-01-01T00:00:00Z',
            dimensions: '128×128',
          },
        },
      });
      const { getByTestId } = render(ExportRegion, {
        props: { viewModel: vm, ...defaultCallbacks() },
      });
      const readout = getByTestId('export-history-readout');
      expect(readout.textContent).toContain('PNG');
      expect(readout.textContent).toContain('128×128');
    });

    it('renders placeholder when no history', () => {
      const vm = makeStillViewModel({
        history: {
          placeholderLabelKey: 'export_history_empty',
          latest: null,
        },
      });
      const { getByTestId } = render(ExportRegion, {
        props: { viewModel: vm, ...defaultCallbacks() },
      });
      const readout = getByTestId('export-history-readout');
      // i18n.t returns the key itself in our mock
      expect(readout.textContent).toContain('export_history_empty');
    });
  });
});
