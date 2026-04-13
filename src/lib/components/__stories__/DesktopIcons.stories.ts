import type { Meta, StoryObj } from '@storybook/sveltekit';
import DesktopIcons from '../window/DesktopIcons.svelte';

const meta = {
  title: 'Components/DesktopIcons',
  component: DesktopIcons,
  tags: ['autodocs'],
  argTypes: {
    selectedIcon: {
      control: 'select',
      options: [null, 'preview', 'poster_maker', 'settings', 'gallery', 'batch', 'history'],
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoSelection: Story = {
  args: {
    selectedIcon: null,
    onIconClick: (id) => console.log('Click:', id),
    onIconDblClick: (id) => console.log('DblClick:', id),
  },
};

export const PreviewSelected: Story = {
  args: {
    ...NoSelection.args,
    selectedIcon: 'preview',
  },
};
