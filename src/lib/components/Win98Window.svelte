<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    title = '',
    icon = '',
    mode = $bindable<'windowed' | 'maximized' | 'minimized'>('windowed'),
    x = $bindable(100),
    y = $bindable(100),
    width = $bindable(400),
    height = $bindable(400),
    zIndex = 1,
    minWidth = 200,
    minHeight = 150,
    onClose,
    onFocus,
    children,
  }: {
    title?: string;
    icon?: string;
    mode: 'windowed' | 'maximized' | 'minimized';
    x: number;
    y: number;
    width?: number;
    height?: number;
    zIndex?: number;
    minWidth?: number;
    minHeight?: number;
    onClose?: () => void;
    onFocus?: () => void;
    children: Snippet;
  } = $props();

  let isDragging = $state(false);
  let isResizing = $state(false);
  let resizeDir = ''; // 'r','b','rb','l','lb'
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let resizeStartX = 0;
  let resizeStartY = 0;
  let resizeStartW = 0;
  let resizeStartH = 0;
  let resizeStartLeft = 0;
  let savedPos = { x: 0, y: 0, w: 0, h: 0 };

  // Drag listeners
  $effect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      x = Math.max(-50, e.clientX - dragOffsetX);
      y = Math.max(0, e.clientY - dragOffsetY);
    };
    const onUp = () => { isDragging = false; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  });

  // Resize listeners
  $effect(() => {
    if (!isResizing) return;
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - resizeStartX;
      const dy = e.clientY - resizeStartY;

      if (resizeDir.includes('r')) {
        width = Math.max(minWidth, resizeStartW + dx);
      }
      if (resizeDir.includes('b')) {
        height = Math.max(minHeight, resizeStartH + dy);
      }
      if (resizeDir === 'l' || resizeDir === 'lb') {
        const newW = Math.max(minWidth, resizeStartW - dx);
        const actualDx = resizeStartW - newW;
        x = resizeStartLeft + actualDx;
        width = newW;
      }
    };
    const onUp = () => { isResizing = false; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  });

  function startDrag(e: MouseEvent) {
    if (mode !== 'windowed' || e.button !== 0) return;
    if ((e.target as HTMLElement).closest('.title-bar-controls')) return;
    isDragging = true;
    dragOffsetX = e.clientX - x;
    dragOffsetY = e.clientY - y;
    onFocus?.();
    e.preventDefault();
  }

  function startResize(dir: string, e: MouseEvent) {
    if (mode !== 'windowed' || e.button !== 0) return;
    isResizing = true;
    resizeDir = dir;
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    resizeStartW = width;
    resizeStartH = height;
    resizeStartLeft = x;
    onFocus?.();
    e.preventDefault();
    e.stopPropagation();
  }

  function handleMinimize(e: MouseEvent) { e.stopPropagation(); mode = 'minimized'; }
  function handleMaximize(e: MouseEvent) {
    e.stopPropagation();
    if (mode === 'maximized') {
      mode = 'windowed';
      x = savedPos.x; y = savedPos.y; width = savedPos.w; height = savedPos.h;
    } else {
      savedPos = { x, y, w: width, h: height };
      mode = 'maximized';
    }
  }
  function handleClose(e: MouseEvent) { e.stopPropagation(); onClose?.(); }
  function handleWindowClick() { onFocus?.(); }

  function handleTitleDblClick() {
    if (mode === 'maximized') {
      mode = 'windowed'; x = savedPos.x; y = savedPos.y; width = savedPos.w; height = savedPos.h;
    } else {
      savedPos = { x, y, w: width, h: height }; mode = 'maximized';
    }
  }
</script>

{#if mode !== 'minimized'}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="window win98-window"
    class:maximized={mode === 'maximized'}
    class:interacting={isDragging || isResizing}
    style={mode === 'maximized'
      ? `z-index:${zIndex}; position:absolute; inset:0;`
      : `z-index:${zIndex}; position:absolute; left:${x}px; top:${y}px; width:${width}px; height:${height}px;`}
    onclick={handleWindowClick}
  >
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="title-bar" onmousedown={startDrag} ondblclick={handleTitleDblClick}>
      <div class="title-bar-text">{icon} {title}</div>
      <div class="title-bar-controls">
        <button aria-label="Minimize" onclick={handleMinimize}></button>
        <button aria-label="Maximize" onclick={handleMaximize}></button>
        <button aria-label="Close" onclick={handleClose}></button>
      </div>
    </div>
    <div class="window-body win98-body">
      {@render children()}
    </div>

    <!-- Resize handles (only in windowed mode) -->
    {#if mode === 'windowed'}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="resize-handle rh-right" onmousedown={(e) => startResize('r', e)}></div>
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="resize-handle rh-bottom" onmousedown={(e) => startResize('b', e)}></div>
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="resize-handle rh-corner-rb" onmousedown={(e) => startResize('rb', e)}></div>
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="resize-handle rh-left" onmousedown={(e) => startResize('l', e)}></div>
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="resize-handle rh-corner-lb" onmousedown={(e) => startResize('lb', e)}></div>
    {/if}
  </div>
{/if}

<style>
  .win98-window {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: inset -1px -1px #0a0a0a, inset 1px 1px #dfdfdf,
                inset -2px -2px grey, inset 2px 2px #fff,
                4px 4px 12px rgba(0,0,0,0.4);
    user-select: none;
  }
  .win98-window.maximized {
    box-shadow: inset -1px -1px #0a0a0a, inset 1px 1px #dfdfdf,
                inset -2px -2px grey, inset 2px 2px #fff;
  }
  .win98-window.interacting {
    opacity: 0.92;
  }

  .win98-body {
    flex: 1;
    margin: 0;
    overflow: auto;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .title-bar { cursor: grab; flex-shrink: 0; }
  .interacting .title-bar { cursor: grabbing; }

  /* ===== Resize Handles ===== */
  .resize-handle { position: absolute; z-index: 100; }
  .rh-right { right: 0; top: 0; width: 5px; height: 100%; cursor: ew-resize; }
  .rh-bottom { bottom: 0; left: 0; width: 100%; height: 5px; cursor: ns-resize; }
  .rh-corner-rb { right: 0; bottom: 0; width: 14px; height: 14px; cursor: nwse-resize; }
  .rh-left { left: 0; top: 0; width: 5px; height: 100%; cursor: ew-resize; }
  .rh-corner-lb { left: 0; bottom: 0; width: 14px; height: 14px; cursor: nesw-resize; }

  @media (max-width: 550px) {
    .win98-window {
      width: 100% !important;
      height: 100% !important;
      left: 0 !important;
      top: 0 !important;
    }
    .resize-handle { display: none; }
  }
</style>
