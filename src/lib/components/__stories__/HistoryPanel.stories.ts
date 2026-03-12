import type { Meta, StoryObj } from '@storybook/sveltekit';
import HistoryPanel from '../HistoryPanel.svelte';
import type { ProcessingSettings } from '$lib/types';

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

const meta = {
  title: 'Components/HistoryPanel',
  component: HistoryPanel,
  tags: ['autodocs'],
  decorators: [
    () => ({
      Component: undefined as any,
      template: '<div style="width:300px;height:400px;"><story/></div>',
    }),
  ],
} satisfies Meta<HistoryPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithHistory: Story = {
  args: {
    history: [
      makeSettings({ pixelSize: 2 }),
      makeSettings({ pixelSize: 3, palette: 'nes' }),
    ],
    redoHistory: [
      makeSettings({ pixelSize: 6 }),
    ],
    currentSettings: makeSettings({ pixelSize: 4, crtEffect: true }),
    onJumpToHistory: () => {},
    onUndo: () => {},
    onRedo: () => {},
  },
};

export const EmptyHistory: Story = {
  args: {
    history: [],
    redoHistory: [],
    currentSettings: makeSettings(),
    onJumpToHistory: () => {},
    onUndo: () => {},
    onRedo: () => {},
  },
};
