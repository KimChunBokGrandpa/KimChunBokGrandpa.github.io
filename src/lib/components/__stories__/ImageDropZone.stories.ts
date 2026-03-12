import type { Meta, StoryObj } from '@storybook/sveltekit';
import ImageDropZone from '../ImageDropZone.svelte';

const meta = {
  title: 'Components/ImageDropZone',
  component: ImageDropZone,
  tags: ['autodocs'],
} satisfies Meta<ImageDropZone>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onImageSelected: (file: File) => console.log('Selected:', file.name),
    onError: (msg: string) => console.error('Error:', msg),
  },
};
