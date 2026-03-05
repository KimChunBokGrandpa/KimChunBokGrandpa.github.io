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
    mobileSlot = null,
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
    mobileSlot?: { top: string; height: string } | null;
    onClose?: () => void;
    onFocus?: () => void;
    children: Snippet;
  } = $props();

  let isDragging = $state(false);
  let isResizing = $state(false);
  let resizeDir = '';
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let resizeStartX = 0;
  let resizeStartY = 0;
  let resizeStartW = 0;
  let resizeStartH = 0;
  let resizeStartLeft = 0;
  let resizeStartTop = 0;
  let savedPos = { x: 0, y: 0, w: 0, h: 0 };

  // Snap state
  const SNAP_THRESHOLD = 20;
  let snapPreview = $state<'left' | 'right' | null>(null);
  let preSnapPos: { x: number; y: number; w: number; h: number } | null = null;

  // Drag listeners
  $effect(() => {
    if (!isDragging) return;
    const desktopH = window.innerHeight - 30; // taskbar height
    const onMove = (e: MouseEvent) => {
      x = Math.max(-50, e.clientX - dragOffsetX);
      y = Math.max(0, e.clientY - dragOffsetY);
      // Snap preview detection
      if (e.clientX <= SNAP_THRESHOLD) {
        snapPreview = 'left';
      } else if (e.clientX >= window.innerWidth - SNAP_THRESHOLD) {
        snapPreview = 'right';
      } else {
        snapPreview = null;
      }
    };
    const onUp = (e: MouseEvent) => {
      isDragging = false;
      // Apply snap
      if (snapPreview) {
        preSnapPos = { x, y, w: width, h: height };
        const halfW = Math.floor(window.innerWidth / 2);
        if (snapPreview === 'left') {
          x = 0; y = 0; width = halfW; height = desktopH;
        } else {
          x = halfW; y = 0; width = window.innerWidth - halfW; height = desktopH;
        }
        snapPreview = null;
      }
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  });

  // Resize listeners (8-direction)
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
      if (resizeDir.includes('l')) {
        const newW = Math.max(minWidth, resizeStartW - dx);
        const actualDx = resizeStartW - newW;
        x = resizeStartLeft + actualDx;
        width = newW;
      }
      if (resizeDir.includes('t')) {
        const newH = Math.max(minHeight, resizeStartH - dy);
        const actualDy = resizeStartH - newH;
        y = resizeStartTop + actualDy;
        height = newH;
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
    // If currently snapped, unsnap and adjust drag offset for smooth move
    if (preSnapPos) {
      const ratioX = e.clientX / width;
      width = preSnapPos.w;
      height = preSnapPos.h;
      y = e.clientY - dragOffsetY;
      x = e.clientX - Math.floor(preSnapPos.w * ratioX);
      preSnapPos = null;
    }
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
    resizeStartTop = y;
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
    style={(() => {
      const mobileVars = mobileSlot ? `--mobile-t:${mobileSlot.top}; --mobile-h:${mobileSlot.height};` : '';
      return mode === 'maximized'
        ? `z-index:${zIndex}; position:absolute; inset:0; ${mobileVars}`
        : `z-index:${zIndex}; position:absolute; left:${x}px; top:${y}px; width:${width}px; height:${height}px; ${mobileVars}`;
    })()}
    onclick={handleWindowClick}
  >
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="title-bar" onmousedown={startDrag} ondblclick={handleTitleDblClick}>
      <div class="title-bar-text">
        <span class="window-icon">{icon}</span> {title}
      </div>
      <div class="title-bar-controls">
        <button aria-label="Minimize" onclick={handleMinimize}></button>
        <button aria-label="Maximize" onclick={handleMaximize}></button>
        <button aria-label="Close" onclick={handleClose}></button>
      </div>
    </div>
    <div class="window-body win98-body">
      {@render children()}
    </div>

    <!-- Resize handles: 8-direction (only in windowed mode, hidden from screen readers) -->
    {#if mode === 'windowed'}
      <div class="resize-handle rh-top" aria-hidden="true" onmousedown={(e) => startResize('t', e)}></div>
      <div class="resize-handle rh-right" aria-hidden="true" onmousedown={(e) => startResize('r', e)}></div>
      <div class="resize-handle rh-bottom" aria-hidden="true" onmousedown={(e) => startResize('b', e)}></div>
      <div class="resize-handle rh-left" aria-hidden="true" onmousedown={(e) => startResize('l', e)}></div>
      <div class="resize-handle rh-corner-rt" aria-hidden="true" onmousedown={(e) => startResize('rt', e)}></div>
      <div class="resize-handle rh-corner-rb" aria-hidden="true" onmousedown={(e) => startResize('rb', e)}></div>
      <div class="resize-handle rh-corner-lt" aria-hidden="true" onmousedown={(e) => startResize('lt', e)}></div>
      <div class="resize-handle rh-corner-lb" aria-hidden="true" onmousedown={(e) => startResize('lb', e)}></div>
    {/if}
  </div>
{/if}

{#if snapPreview}
  <div
    class="snap-preview"
    style="left:{snapPreview === 'left' ? '0' : '50%'}; top:0; width:50vw; height:calc(100vh - 30px);"
  ></div>
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
    animation: windowOpen 0.12s ease-out;
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
  .window-icon {
    font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
    color: initial;
    margin-right: 4px;
  }

  /* ===== Resize Handles (8-direction) ===== */
  .resize-handle { position: absolute; z-index: 100; }
  .rh-top { top: 0; left: 0; width: 100%; height: 5px; cursor: ns-resize; }
  .rh-right { right: 0; top: 0; width: 5px; height: 100%; cursor: ew-resize; }
  .rh-bottom { bottom: 0; left: 0; width: 100%; height: 5px; cursor: ns-resize; }
  .rh-left { left: 0; top: 0; width: 5px; height: 100%; cursor: ew-resize; }
  .rh-corner-rt { right: 0; top: 0; width: 14px; height: 14px; cursor: nesw-resize; }
  .rh-corner-rb { right: 0; bottom: 0; width: 14px; height: 14px; cursor: nwse-resize; }
  .rh-corner-lt { left: 0; top: 0; width: 14px; height: 14px; cursor: nwse-resize; }
  .rh-corner-lb { left: 0; bottom: 0; width: 14px; height: 14px; cursor: nesw-resize; }

  @media (max-width: 550px) {
    .win98-window {
      width: 100% !important;
      height: var(--mobile-h, 100%) !important;
      left: 0 !important;
      top: var(--mobile-t, 0) !important;
    }
    .resize-handle { display: none; }
  }

  /* ===== Snap Preview ===== */
  .snap-preview {
    position: fixed;
    background: rgba(0, 0, 128, 0.18);
    border: 2px solid rgba(0, 0, 128, 0.5);
    z-index: 8999;
    pointer-events: none;
    transition: opacity 0.1s;
  }

  /* ===== Window Animations ===== */
  @keyframes windowOpen {
    from {
      opacity: 0;
      transform: scale(0.92);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
</style>
