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
    swipeEnabled = false,
    menuItems = [] as string[],
    onClose,
    onFocus,
    onLayoutChange,
    onSwipeLeft,
    onSwipeRight,
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
    mobileSlot?: { top: string; height: string; left?: string; width?: string } | null;
    swipeEnabled?: boolean;
    menuItems?: string[];
    onClose?: () => void;
    onFocus?: () => void;
    onLayoutChange?: () => void;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
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
  let swipeStartX = 0;
  let swipeStartY = 0;

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
    if (mobileSlot) {
      onFocus?.();
      return;
    }
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
      x = clientX - Math.floor(preSnapPos.w * ratioX);
      y = clientY;
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
    if (mobileSlot) return;
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
      ? `--mobile-t:${mobileSlot.top}; --mobile-h:${mobileSlot.height}; --mobile-l:${mobileSlot.left ?? '0px'}; --mobile-w:${mobileSlot.width ?? 'auto'};`
      : '';
    return mode === 'maximized'
      ? `z-index:${zIndex}; position:absolute; inset:0; ${mobileVars}`
      : `z-index:${zIndex}; position:absolute; left:${x}px; top:${y}px; width:${width}px; height:${height}px; ${mobileVars}`;
  });

  function handleSwipeStart(e: TouchEvent) {
    if (!swipeEnabled || e.touches.length !== 1) return;
    swipeStartX = e.touches[0].clientX;
    swipeStartY = e.touches[0].clientY;
  }

  function handleSwipeEnd(e: TouchEvent) {
    if (!swipeEnabled || e.changedTouches.length !== 1 || isDragging || isResizing) return;
    const dx = e.changedTouches[0].clientX - swipeStartX;
    const dy = e.changedTouches[0].clientY - swipeStartY;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
    if (dx < 0) onSwipeLeft?.();
    else onSwipeRight?.();
  }
</script>

{#if mode !== 'minimized'}
  <div
    class="window win98-window"
    class:maximized={mode === 'maximized'}
    class:interacting={isDragging || isResizing}
    class:resizing={isResizing}
    style={windowStyle}
    role="dialog"
    aria-label={title}
    tabindex="-1"
    onclick={handleWindowClick}
    onkeydown={handleKeydown}
  >
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="title-bar"
      onmousedown={startDrag}
      ontouchstart={(e) => { handleSwipeStart(e); startDrag(e); }}
      ontouchend={handleSwipeEnd}
      ondblclick={handleTitleDblClick}
    >
      <div class="title-bar-text">
        <span class="window-icon">{icon}</span>
        {title}
        {#if mobileSlot}<span class="compact-expand-arrow" aria-hidden="true">&#9660;</span>{/if}
      </div>
      <div class="title-bar-controls">
        <button aria-label={i18n.t('minimize')} onclick={handleMinimize}></button>
        <button aria-label={i18n.t('maximize')} onclick={handleMaximize}></button>
        <button aria-label={i18n.t('close')} onclick={handleClose}></button>
      </div>
    </div>
    {#if menuItems.length > 0}
      <div class="win98-menubar" role="menubar">
        {#each menuItems as item, idx}
          <button
            class="win98-menu-item"
            role="menuitem"
            tabindex={idx === 0 ? 0 : -1}
            onkeydown={(e) => {
              const items = (e.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLElement>('[role="menuitem"]');
              if (!items) return;
              if (e.key === 'ArrowRight') {
                e.preventDefault();
                items[(idx + 1) % items.length].focus();
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                items[(idx - 1 + items.length) % items.length].focus();
              }
            }}
          >{item}</button>
        {/each}
      </div>
    {/if}
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
  }
  .win98-window.maximized {
    box-shadow: var(--w98-outset);
  }
  .win98-window.resizing {
    outline: 2px dashed var(--w98-highlight);
    outline-offset: -2px;
  }

  /* ── Menu Bar ── */
  .win98-menubar {
    display: flex;
    align-items: stretch;
    background: var(--w98-surface);
    padding: 0;
    border-bottom: 1px solid var(--w98-shadow-808);
    flex-shrink: 0;
  }
  .win98-menu-item {
    display: flex;
    align-items: center;
    padding: 2px 8px;
    font-size: var(--w98-font-size-base);
    font-family: inherit;
    background: transparent;
    border: none;
    box-shadow: none;
    cursor: default;
    color: var(--w98-text);
    white-space: nowrap;
  }
  .win98-menu-item:hover {
    background: var(--w98-highlight);
    color: #fff;
  }
  .win98-menu-item:active {
    box-shadow: var(--w98-inset-thin);
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
    position: relative;
  }
  .interacting .title-bar {
    cursor: grabbing;
  }
  .title-bar-controls {
    position: relative;
    z-index: 110;
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
    top: -6px;
    left: 0;
    width: 100%;
    height: 8px;
    cursor: ns-resize;
  }
  .rh-right {
    right: -6px;
    top: 0;
    width: 8px;
    height: 100%;
    cursor: ew-resize;
  }
  .rh-bottom {
    bottom: -6px;
    left: 0;
    width: 100%;
    height: 8px;
    cursor: ns-resize;
  }
  .rh-left {
    left: -6px;
    top: 0;
    width: 8px;
    height: 100%;
    cursor: ew-resize;
  }
  .rh-corner-rt {
    right: -6px;
    top: -6px;
    width: 18px;
    height: 18px;
    cursor: nesw-resize;
  }
  .rh-corner-rb {
    right: -6px;
    bottom: -6px;
    width: 18px;
    height: 18px;
    cursor: nwse-resize;
  }
  .rh-corner-lt {
    left: -6px;
    top: -6px;
    width: 18px;
    height: 18px;
    cursor: nwse-resize;
  }
  .rh-corner-lb {
    left: -6px;
    bottom: -6px;
    width: 18px;
    height: 18px;
    cursor: nesw-resize;
  }

  /* ── Compact expand arrow (mobile collapsed windows) ── */
  .compact-expand-arrow {
    display: none;
  }

  @media (max-width: 550px) {
    .win98-window {
      left: var(--mobile-l, 0) !important;
      right: auto !important;
      width: var(--mobile-w, auto) !important;
      height: var(--mobile-h, 100%) !important;
      top: var(--mobile-t, 0) !important;
      box-sizing: border-box !important;
    }
    .title-bar {
      min-height: 34px;
      display: flex;
      align-items: center;
    }
    .resize-handle {
      display: none;
    }
    .compact-expand-arrow {
      display: inline;
      font-size: 8px;
      margin-left: 4px;
      color: var(--w98-text-muted);
      vertical-align: middle;
    }
  }

  /* ===== Snap Preview ===== */
  .snap-preview {
    position: fixed;
    background: var(--w98-highlight-alpha);
    border: 2px solid var(--w98-highlight-border);
    z-index: 8999;
    pointer-events: none;
  }
</style>
