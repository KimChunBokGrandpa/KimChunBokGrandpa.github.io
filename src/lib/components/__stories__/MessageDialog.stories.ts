import type { Meta, StoryObj } from '@storybook/sveltekit';
import MessageDialog from '../MessageDialog.svelte';

const meta = {
  title: 'Components/MessageDialog',
  component: MessageDialog,
  tags: ['autodocs'],
  argTypes: {
    message: { control: 'text' },
    title: { control: 'text' },
  },
} satisfies Meta<MessageDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    message: 'Processing complete. Your image has been saved.',
    onClose: () => {},
  },
};

export const CustomTitle: Story = {
  args: {
    message: 'Are you sure you want to reset all settings?',
    title: 'Confirm Reset',
    onClose: () => {},
  },
};

export const LongMessage: Story = {
  args: {
    message: 'The image you are trying to process exceeds the maximum supported dimensions (2048x2048). It will be automatically resized before processing.',
    title: 'Warning',
    onClose: () => {},
  },
};
