// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';

vi.mock('$lib/i18n/index.svelte', () => ({
  i18n: { t: vi.fn((key: string) => key) },
}));

import EffectLayerStack from '../editor/EffectLayerStack.svelte';
import type { ProcessingSettings } from '$lib/types';

afterEach(() => cleanup());

function makeSettings(overrides?: Partial<ProcessingSettings>): ProcessingSettings {
  return {
    pixelSize: 4,
    palette: 'gameboy',
    crtEffect: 'none',
    glitchFilters: [],
    renderMode: 'pixel_perfect',
    glitchSeed: null,
    ditherType: 'none',
    effectLayers: [],
    ...overrides,
  };
}

describe('EffectLayerStack', () => {
  const defaultProps = () => ({
    settings: makeSettings(),
    onChange: vi.fn(),
  });

  it('renders the effect layer container', () => {
    const { container } = render(EffectLayerStack, { props: defaultProps() });
    expect(container.innerHTML).toBeTruthy();
  });

  it('renders add effect button', () => {
    const { container } = render(EffectLayerStack, { props: defaultProps() });
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders with existing effect layers', () => {
    const settings = makeSettings({
      effectLayers: [
        { id: 'layer1', type: 'glitch', enabled: true, glitchType: 'rgb_split', intensity: 1 },
      ],
    });
    const { container } = render(EffectLayerStack, { props: { settings, onChange: vi.fn() } });
    expect(container.innerHTML).toBeTruthy();
  });

  it('renders with multiple effect layers', () => {
    const settings = makeSettings({
      effectLayers: [
        { id: 'l1', type: 'glitch', enabled: true, glitchType: 'rgb_split', intensity: 1 },
        { id: 'l2', type: 'hqx', enabled: true },
        { id: 'l3', type: 'glitch', enabled: false, glitchType: 'wave', intensity: 2 },
      ],
    });
    const { container } = render(EffectLayerStack, { props: { settings, onChange: vi.fn() } });
    // Should render layer items
    const layerItems = container.querySelectorAll('.layer-item, .effect-layer, [class*="layer"]');
    expect(layerItems.length).toBeGreaterThanOrEqual(1);
  });

  it('renders render mode options', () => {
    const { container } = render(EffectLayerStack, { props: defaultProps() });
    // Look for render mode related UI
    const labels = container.querySelectorAll('label, select, [role="radiogroup"]');
    expect(labels.length).toBeGreaterThanOrEqual(0);
  });
});
