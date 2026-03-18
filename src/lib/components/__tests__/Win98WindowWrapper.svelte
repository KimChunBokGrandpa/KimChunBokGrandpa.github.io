<script lang="ts">
  import Win98Window from '../window/Win98Window.svelte';

  let {
    title = 'Test Window',
    icon = '📁',
    mode = $bindable('windowed' as 'windowed' | 'maximized' | 'minimized'),
    x = $bindable(100),
    y = $bindable(100),
    width = 400,
    height = 300,
    zIndex = 1,
    onClose,
    onFocus,
  }: {
    title?: string;
    icon?: string;
    mode?: 'windowed' | 'maximized' | 'minimized';
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    zIndex?: number;
    onClose?: () => void;
    onFocus?: () => void;
  } = $props();
</script>

<Win98Window
  {title}
  {icon}
  bind:mode
  bind:x
  bind:y
  {width}
  {height}
  {zIndex}
  {onClose}
  {onFocus}
>
  <div class="test-content">Window Content</div>
</Win98Window>
