<script lang="ts">
  import type { Snippet } from 'svelte';
  import { i18n } from '$lib/i18n/index.svelte';

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
    onLayoutChange,
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
    onLayoutChange?: () => void;
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

  // Layout constants
  const TASKBAR_HEIGHT = 30;
  const SNAP_THRESHOLD = 20;
  let snapPreview = $state<'left' | 'right' | null>(null);
  let preSnapPos: { x: number; y: number; w: number; h: number } | null = null;

  // Drag listeners
  $effect(() => {
    if (!isDragging) return;
    const desktopH = window.innerHeight - TASKBAR_HEIGHT;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      x = Math.max(-50, clientX - dragOffsetX);
      y = Math.max(0, clientY - dragOffsetY);
      // Snap preview detection
      if (clientX <= SNAP_THRESHOLD) {
        snapPreview = 'left';
      } else if (clientX >= window.innerWidth - SNAP_THRESHOLD) {
        snapPreview = 'right';
      } else {
        snapPreview = null;
      }
    };
    const onUp = (e: MouseEvent | TouchEvent) => {
      isDragging = false;
      // Apply snap
      if (snapPreview) {
        preSnapPos = { x, y, w: width, h: height };
        const halfW = Math.floor(window.innerWidth / 2);
        if (snapPreview === 'left') {
          x = 0;
          y = 0;
          width = halfW;
          height = desktopH;
        } else {
          x = halfW;
          y = 0;
          width = window.innerWidth - halfW;
          height = desktopH;
        }
        snapPreview = null;
      }
      onLayoutChange?.();
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchend', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchend', onUp);
    };
  });

  // Resize listeners (8-direction)
  $effect(() => {
    if (!isResizing) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const dx = clientX - resizeStartX;
      const dy = clientY - resizeStartY;

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
    const onUp = () => {
      isResizing = false;
      onLayoutChange?.();
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchend', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchend', onUp);
    };
  });

  function startDrag(e: MouseEvent | TouchEvent) {
    if (mode !== 'windowed') return;
    if ('button' in e && e.button !== 0) return;
    if ((e.target as HTMLElement).closest('.title-bar-controls')) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

    // If currently snapped, unsnap and adjust drag offset for smooth move
    if (preSnapPos) {
      const ratioX = clientX / width;
      width = preSnapPos.w;
      height = preSnapPos.h;
      y = clientY - dragOffsetY;
      x = clientX - Math.floor(preSnapPos.w * ratioX);
      preSnapPos = null;
    }
    isDragging = true;
    dragOffsetX = clientX - x;
    dragOffsetY = clientY - y;
    onFocus?.();
    e.preventDefault();
  }

  function startResize(dir: string, e: MouseEvent | TouchEvent) {
    if (mode !== 'windowed') return;
    if ('button' in e && e.button !== 0) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

    isResizing = true;
    resizeDir = dir;
    resizeStartX = clientX;
    resizeStartY = clientY;
    resizeStartW = width;
    resizeStartH = height;
    resizeStartLeft = x;
    resizeStartTop = y;
    onFocus?.();
    e.preventDefault();
    e.stopPropagation();
  }

  function handleMinimize(e: MouseEvent) {
    e.stopPropagation();
    mode = 'minimized';
  }
  function handleMaximize(e: MouseEvent) {
    e.stopPropagation();
    if (mode === 'maximized') {
      mode = 'windowed';
      x = savedPos.x;
      y = savedPos.y;
      width = savedPos.w;
      height = savedPos.h;
    } else {
      savedPos = { x, y, w: width, h: height };
      mode = 'maximized';
    }
  }
  function handleClose(e: MouseEvent) {
    e.stopPropagation();
    onClose?.();
  }
  function handleWindowClick() {
    onFocus?.();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose?.();
    }
  }

  function handleTitleDblClick() {
    if (mode === 'maximized') {
      mode = 'windowed';
      x = savedPos.x;
      y = savedPos.y;
      width = savedPos.w;
      height = savedPos.h;
    } else {
      savedPos = { x, y, w: width, h: height };
      mode = 'maximized';
    }
  }

  let windowStyle = $derived.by(() => {
    const mobileVars = mobileSlot
      ? `--mobile-t:${mobileSlot.top}; --mobile-h:${mobileSlot.height};`
      : '';
    return mode === 'maximized'
      ? `z-index:${zIndex}; position:absolute; inset:0; ${mobileVars}`
      : `z-index:${zIndex}; position:absolute; left:${x}px; top:${y}px; width:${width}px; height:${height}px; ${mobileVars}`;
  });
</script>

{#if mode !== 'minimized'}
  <div
    class="window win98-window"
    class:maximized={mode === 'maximized'}
    class:interacting={isDragging || isResizing}
    class:resizing={isResizing}
    style={windowStyle}
    role="dialog"
    tabindex="-1"
    onclick={handleWindowClick}
    onkeydown={handleKeydown}
  >
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="title-bar" onmousedown={startDrag} ontouchstart={startDrag} ondblclick={handleTitleDblClick}>
      <div class="title-bar-text">
        <span class="window-icon">{icon}</span>
        {title}
      </div>
      <div class="title-bar-controls">
        <button aria-label={i18n.t('minimize')} onclick={handleMinimize}></button>
        <button aria-label={i18n.t('maximize')} onclick={handleMaximize}></button>
        <button aria-label={i18n.t('close')} onclick={handleClose}></button>
      </div>
    </div>
    <div class="window-body win98-body">
      {@render children()}
    </div>

    <!-- Resize handles: 8-direction (only in windowed mode, hidden from screen readers) -->
    {#if mode === 'windowed'}
      <div
        class="resize-handle rh-top"
        aria-hidden="true"
        onmousedown={(e) => startResize('t', e)}
        ontouchstart={(e) => startResize('t', e)}
      ></div>
      <div
        class="resize-handle rh-right"
        aria-hidden="true"
        onmousedown={(e) => startResize('r', e)}
        ontouchstart={(e) => startResize('r', e)}
      ></div>
      <div
        class="resize-handle rh-bottom"
        aria-hidden="true"
        onmousedown={(e) => startResize('b', e)}
        ontouchstart={(e) => startResize('b', e)}
      ></div>
      <div
        class="resize-handle rh-left"
        aria-hidden="true"
        onmousedown={(e) => startResize('l', e)}
        ontouchstart={(e) => startResize('l', e)}
      ></div>
      <div
        class="resize-handle rh-corner-rt"
        aria-hidden="true"
        onmousedown={(e) => startResize('rt', e)}
        ontouchstart={(e) => startResize('rt', e)}
      ></div>
      <div
        class="resize-handle rh-corner-rb"
        aria-hidden="true"
        onmousedown={(e) => startResize('rb', e)}
        ontouchstart={(e) => startResize('rb', e)}
      ></div>
      <div
        class="resize-handle rh-corner-lt"
        aria-hidden="true"
        onmousedown={(e) => startResize('lt', e)}
        ontouchstart={(e) => startResize('lt', e)}
      ></div>
      <div
        class="resize-handle rh-corner-lb"
        aria-hidden="true"
        onmousedown={(e) => startResize('lb', e)}
        ontouchstart={(e) => startResize('lb', e)}
      ></div>
    {/if}
  </div>
{/if}

{#if snapPreview}
  <div
    class="snap-preview"
    style="left:{snapPreview === 'left'
      ? '0'
      : '50%'}; top:0; width:50vw; height:calc(100vh - {TASKBAR_HEIGHT}px);"
  ></div>
{/if}

<style>
  .win98-window {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: var(--w98-window-shadow);
    user-select: none;
    animation: windowOpen 0.12s ease-out;
  }
  .win98-window.maximized {
    box-shadow: var(--w98-outset);
  }
  .win98-window.interacting {
    opacity: 0.92;
  }
  .win98-window.resizing {
    outline: 2px dashed var(--w98-highlight);
    outline-offset: -2px;
  }

  .win98-body {
    flex: 1;
    margin: 0;
    overflow: auto;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .title-bar {
    cursor: grab;
    flex-shrink: 0;
  }
  .interacting .title-bar {
    cursor: grabbing;
  }
  .window-icon {
    font-family: var(--w98-emoji-font);
    color: initial;
    margin-right: 4px;
  }

  /* ===== Resize Handles (8-direction) ===== */
  .resize-handle {
    position: absolute;
    z-index: 100;
    touch-action: none;
  }
  .rh-top {
    top: -4px;
    left: 0;
    width: 100%;
    height: 12px;
    cursor: ns-resize;
  }
  .rh-right {
    right: -4px;
    top: 0;
    width: 12px;
    height: 100%;
    cursor: ew-resize;
  }
  .rh-bottom {
    bottom: -4px;
    left: 0;
    width: 100%;
    height: 12px;
    cursor: ns-resize;
  }
  .rh-left {
    left: -4px;
    top: 0;
    width: 12px;
    height: 100%;
    cursor: ew-resize;
  }
  .rh-corner-rt {
    right: -4px;
    top: -4px;
    width: 24px;
    height: 24px;
    cursor: nesw-resize;
  }
  .rh-corner-rb {
    right: -4px;
    bottom: -4px;
    width: 24px;
    height: 24px;
    cursor: nwse-resize;
  }
  .rh-corner-lt {
    left: -4px;
    top: -4px;
    width: 24px;
    height: 24px;
    cursor: nwse-resize;
  }
  .rh-corner-lb {
    left: -4px;
    bottom: -4px;
    width: 24px;
    height: 24px;
    cursor: nesw-resize;
  }

  @media (max-width: 550px) {
    .win98-window {
      width: 100% !important;
      height: var(--mobile-h, 100%) !important;
      left: 0 !important;
      top: var(--mobile-t, 0) !important;
    }
    .resize-handle {
      display: none;
    }
  }

  /* ===== Snap Preview ===== */
  .snap-preview {
    position: fixed;
    background: var(--w98-highlight-alpha);
    border: 2px solid var(--w98-highlight-border);
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
