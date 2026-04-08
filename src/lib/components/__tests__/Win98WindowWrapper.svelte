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
    mobileSlot = null,
    swipeEnabled = false,
    onClose,
    onFocus,
    onSwipeLeft,
    onSwipeRight,
  }: {
    title?: string;
    icon?: string;
    mode?: 'windowed' | 'maximized' | 'minimized';
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    zIndex?: number;
    mobileSlot?: { top: string; height: string; left?: string; width?: string } | null;
    swipeEnabled?: boolean;
    onClose?: () => void;
    onFocus?: () => void;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
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
  {mobileSlot}
  {swipeEnabled}
  {onClose}
  {onFocus}
  {onSwipeLeft}
  {onSwipeRight}
>
  <div class="test-content">Window Content</div>
</Win98Window>
