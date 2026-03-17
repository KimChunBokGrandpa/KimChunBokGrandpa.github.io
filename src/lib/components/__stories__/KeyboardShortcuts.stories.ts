import type { Meta, StoryObj } from '@storybook/sveltekit';
import KeyboardShortcuts from '../feedback/KeyboardShortcuts.svelte';

const meta = {
  title: 'Components/KeyboardShortcuts',
  component: KeyboardShortcuts,
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onClose: () => {},
  },
};
