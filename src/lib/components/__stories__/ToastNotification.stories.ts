import type { Meta, StoryObj } from '@storybook/sveltekit';
import ToastNotification from '../ToastNotification.svelte';

const meta = {
  title: 'Components/ToastNotification',
  component: ToastNotification,
  tags: ['autodocs'],
  argTypes: {
    message: { control: 'text' },
    variant: { control: 'select', options: ['success', 'error', 'warning'] },
    duration: { control: 'number' },
  },
} satisfies Meta<ToastNotification>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: {
    message: 'Image saved successfully!',
    variant: 'success',
    duration: 999999,
    onDone: () => {},
  },
};

export const Error: Story = {
  args: {
    message: 'Failed to export image.',
    variant: 'error',
    duration: 999999,
    onDone: () => {},
  },
};

export const Warning: Story = {
  args: {
    message: 'Large file may take longer to process.',
    variant: 'warning',
    duration: 999999,
    onDone: () => {},
  },
};
