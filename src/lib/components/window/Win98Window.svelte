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
    isFocused = true,
    minWidth = 200,
    minHeight = 150,
    mobileSlot = null,
    swipeEnabled = false,
    menuItems = [] as string[],
    onClose,
    onMinimize,
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
    isFocused?: boolean;
    minWidth?: number;
    minHeight?: number;
    mobileSlot?: { top: string; height: string; left?: string; width?: string } | null;
    swipeEnabled?: boolean;
    menuItems?: string[];
    onClose?: () => void;
    onMinimize?: () => void;
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
  const taskbarHeight = 30;
  const snapThreshold = 20;
  let snapPreview = $state<'left' | 'right' | null>(null);
  let preSnapPos: { x: number; y: number; w: number; h: number } | null = null;
  let swipeStartX = 0;
  let swipeStartY = 0;

  // Drag listeners
  $effect(() => {
    if (!isDragging) return;
    const desktopH = window.innerHeight - taskbarHeight;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      x = Math.max(-50, clientX - dragOffsetX);
      y = Math.max(0, clientY - dragOffsetY);
      // Snap preview detection
      if (clientX <= snapThreshold) {
        snapPreview = 'left';
      } else if (clientX >= window.innerWidth - snapThreshold) {
        snapPreview = 'right';
      } else {
        snapPreview = null;
      }
    };
    const onUp = () => {
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
    if (onMinimize) {
      onMinimize();
      return;
    }
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
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="window win98-window"
    class:maximized={mode === 'maximized'}
    class:unfocused={!isFocused}
    class:interacting={isDragging || isResizing}
    class:resizing={isResizing}
    style={windowStyle}
    role="group"
    aria-label={title}
    aria-roledescription="window"
    tabindex="-1"
    onclick={handleWindowClick}
  >
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="title-bar w98-shell-titlebar"
      class:w98-shell-titlebar--unfocused={!isFocused}
      onmousedown={startDrag}
      ontouchstart={(e) => { handleSwipeStart(e); startDrag(e); }}
      ontouchend={handleSwipeEnd}
      ondblclick={handleTitleDblClick}
    >
      <div class="title-bar-text w98-shell-title w98-shell-titleline">
        <span class="window-icon w98-emoji">{icon}</span>
        {title}
        {#if mobileSlot}<span class="compact-expand-arrow" aria-hidden="true">&#9660;</span>{/if}
      </div>
      <div class="title-bar-controls w98-window-control-strip">
        <button type="button" class="w98-window-control-button" aria-label={i18n.t('minimize')} data-control="minimize" onclick={handleMinimize}>
          <span aria-hidden="true">_</span>
        </button>
        <button type="button" class="w98-window-control-button" aria-label={i18n.t('maximize')} data-control="maximize" onclick={handleMaximize}>
          <span aria-hidden="true">▢</span>
        </button>
        <button type="button" class="w98-window-control-button" aria-label={i18n.t('close')} data-control="close" onclick={handleClose}>
          <span aria-hidden="true">✕</span>
        </button>
      </div>
    </div>
    {#if menuItems.length > 0}
      <!-- Presentation-only menubar. Add a real action model before reintroducing interactive menu semantics. -->
      <div class="win98-menubar w98-shell-menubar" aria-hidden="true">
        {#each menuItems as item}
          <span class="win98-menu-item w98-shell-menubar-item">{item}</span>
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
      : '50%'}; top:0; width:50vw; height:calc(100vh - {taskbarHeight}px);"
  ></div>
{/if}

<style>
  .win98-window {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: var(--w98-window-shadow);
    user-select: none;
    background: var(--w98-surface);
  }
  .win98-window.maximized {
    box-shadow: var(--w98-outset);
  }
  .win98-window.resizing {
    outline: 1px dashed var(--w98-highlight);
    outline-offset: -2px;
  }

  /* ── Menu Bar ── */
  .win98-menubar {
    flex-shrink: 0;
  }
  .win98-menu-item {
    flex: 0 0 auto;
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
    min-height: var(--w98-titlebar-height);
  }
  .interacting .title-bar {
    cursor: grabbing;
  }
  .title-bar-text {
    display: flex;
    align-items: center;
    gap: var(--w98-space-4);
    min-width: 0;
    padding-right: var(--w98-space-4);
    font-size: var(--w98-font-size-base);
  }
  .title-bar-controls {
    flex-shrink: 0;
  }
  .title-bar-controls :global(button) {
    flex-shrink: 0;
  }
  .window-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 12px;
    flex-shrink: 0;
    margin-right: 0;
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
      color: #fff;
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
