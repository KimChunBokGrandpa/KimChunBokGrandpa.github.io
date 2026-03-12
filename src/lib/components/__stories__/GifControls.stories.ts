import type { Meta, StoryObj } from '@storybook/sveltekit';
import GifControls from '../GifControls.svelte';

const meta = {
  title: 'Components/GifControls',
  component: GifControls,
  tags: ['autodocs'],
  argTypes: {
    currentFrame: { control: { type: 'range', min: 0, max: 9 } },
    frameCount: { control: 'number' },
    isPlaying: { control: 'boolean' },
    isExporting: { control: 'boolean' },
    exportProgress: { control: { type: 'range', min: 0, max: 1, step: 0.1 } },
  },
  decorators: [
    () => ({
      Component: undefined as any,
      template: '<div style="position:relative;height:200px;background:#333;"><story/></div>',
    }),
  ],
} satisfies Meta<GifControls>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Paused: Story = {
  args: {
    currentFrame: 3,
    frameCount: 10,
    isPlaying: false,
    isExporting: false,
    exportProgress: 0,
    onPlay: () => {},
    onPause: () => {},
    onSeek: () => {},
    onExport: () => {},
  },
};

export const Playing: Story = {
  args: {
    ...Paused.args,
    isPlaying: true,
  },
};

export const Exporting: Story = {
  args: {
    ...Paused.args,
    isExporting: true,
    exportProgress: 0.65,
  },
};
