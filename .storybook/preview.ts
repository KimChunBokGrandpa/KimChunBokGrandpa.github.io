import type { Preview } from '@storybook/sveltekit'
import '98.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'win98',
      values: [
        { name: 'win98', value: '#008080' },
        { name: 'white', value: '#ffffff' },
        { name: 'dark', value: '#1a1a1a' },
      ],
    },
    a11y: {
      test: 'todo'
    }
  },
};

export default preview;