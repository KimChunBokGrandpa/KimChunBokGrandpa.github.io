<script lang="ts">
  import { onMount } from 'svelte';

  export interface TaskbarWindowInfo {
    id: string;
    title: string;
    icon: string;
    mode: 'windowed' | 'maximized' | 'minimized' | 'closed';
    focused: boolean;
  }

  let {
    windows = [],
    onWindowClick,
    onWindowClose,
    onStartClick,
  }: {
    windows: TaskbarWindowInfo[];
    onWindowClick: (id: string) => void;
    onWindowClose: (id: string) => void;
    onStartClick?: () => void;
  } = $props();

  let timeString = $state('');

  function updateTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    timeString = `${hours}:${minutes} ${ampm}`;
  }

  onMount(() => {
    updateTime();
    // Align to next minute boundary, then update every 60s
    const msToNextMinute = 60000 - (Date.now() % 60000);
    const firstTimeout = setTimeout(() => {
      updateTime();
      interval = setInterval(updateTime, 60000);
    }, msToNextMinute);
    let interval: ReturnType<typeof setInterval>;
    return () => {
      clearTimeout(firstTimeout);
      clearInterval(interval);
    };
  });

  let visibleWindows = $derived(windows.filter(w => w.mode !== 'closed'));
</script>

<div class="taskbar">
  <div class="taskbar-left">
    {#if onStartClick}
      <button class="start-btn" onclick={onStartClick}>
        <span class="start-logo">⊞</span><b>Start</b>
      </button>
      <div class="sep"></div>
    {/if}

    {#each visibleWindows as win}
      <div
        class="tb-item"
        class:tb-active={win.focused && win.mode !== 'minimized'}
        class:tb-dim={win.mode === 'minimized'}
        onclick={() => onWindowClick(win.id)}
        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onWindowClick(win.id); } }}
        role="button"
        tabindex="0"
        aria-label="{win.title} window"
      >
        <span class="tb-icon">{win.icon}</span>
        <span class="tb-label">{win.title}</span>
        <button
          class="tb-x"
          title="Close {win.title}"
          onclick={(e) => { e.stopPropagation(); onWindowClose(win.id); }}
          aria-label="Close {win.title}"
        ></button>
      </div>
    {/each}
  </div>

  <div class="taskbar-right">
    <div class="tray">
      <span class="tray-ico">🔊</span>
      <span class="tray-clock">{timeString}</span>
    </div>
  </div>
</div>

<style>
  /* ── Taskbar Container ── */
  .taskbar {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    height: 30px;
    background: #c0c0c0;
    border-top: 1px solid #fff;
    display: flex;
    justify-content: space-between;
    align-items: stretch;
    padding: 2px 2px 2px 2px;
    z-index: 9000;
    gap: 2px;
    box-shadow: inset 0 1px 0 #dfdfdf;
  }

  .taskbar-left {
    display: flex;
    align-items: stretch;
    gap: 3px;
    min-width: 0;
    overflow: hidden;
    flex: 1;
  }

  /* ── Start Button ── */
  .start-btn {
    display: flex;
    align-items: center;
    gap: 3px;
    padding: 0 8px;
    font-size: 12px;
    background: #c0c0c0;
    border: none;
    cursor: pointer;
    flex-shrink: 0;
    box-shadow: inset 1px 1px #fff, inset -1px -1px #0a0a0a,
                inset 2px 2px #dfdfdf, inset -2px -2px grey;
  }
  .start-btn:active {
    box-shadow: inset -1px -1px #fff, inset 1px 1px #0a0a0a,
                inset -2px -2px #dfdfdf, inset 2px 2px grey;
    padding: 2px 6px 0 10px;
  }
  .start-logo { font-size: 14px; color: #000080; }

  .sep {
    width: 2px;
    align-self: stretch;
    margin: 1px 1px;
    background: #808080;
    border-right: 1px solid #fff;
    flex-shrink: 0;
  }

  /* ── Task Item (Win98 button style) ── */
  .tb-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 44px;
    max-width: 160px;
    flex: 0 1 140px;
    padding: 0 18px 0 4px; /* right padding for X overlay */
    background: #c0c0c0;
    border: none;
    cursor: pointer;
    font-size: 11px;
    font-family: inherit;
    overflow: hidden;
    box-shadow: inset 1px 1px #fff, inset -1px -1px #0a0a0a,
                inset 2px 2px #dfdfdf, inset -2px -2px grey;
    transition: flex-basis 0.15s ease;
  }

  .tb-item.tb-active {
    box-shadow: inset -1px -1px #fff, inset 1px 1px #0a0a0a,
                inset -2px -2px #dfdfdf, inset 2px 2px grey;
    background: #d4d0c8;
    font-weight: bold;
  }
  .tb-item.tb-dim {
    opacity: 0.65;
  }

  .tb-icon {
    font-size: 14px;
    flex-shrink: 0;
    font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
    color: initial;
  }
  .tb-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
    flex: 1;
  }

  /* ── X button overlaid on task item (title-bar style) ── */
  .tb-x {
    position: absolute;
    right: 3px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    width: 14px;
    height: 14px;
    padding: 0;
    font-size: 0;
    background: #c0c0c0;
    border: none;
    cursor: pointer;
    box-shadow: inset 1px 1px #fff, inset -1px -1px #0a0a0a;
    opacity: 0;
    transition: opacity 0.1s;
  }
  .tb-item:hover .tb-x {
    opacity: 1;
  }
  .tb-x::after {
    content: '×';
    font-size: 11px;
    font-weight: bold;
    line-height: 1;
    color: #000;
  }
  .tb-x:hover {
    background: #c0c0c0;
    box-shadow: inset -1px -1px #fff, inset 1px 1px #0a0a0a;
  }
  .tb-x:hover::after {
    color: #000;
  }
  .tb-x:active {
    box-shadow: inset -1px -1px #dfdfdf, inset 1px 1px #808080;
  }

  /* ── System Tray ── */
  .taskbar-right {
    display: flex;
    align-items: stretch;
    flex-shrink: 0;
  }
  .tray {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 8px;
    box-shadow: inset -1px -1px #fff, inset 1px 1px #808080;
    font-size: 11px;
    font-family: 'Segoe UI', 'MS Sans Serif', Arial, sans-serif;
  }
  .tray-ico { font-size: 13px; font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif; }
  .tray-clock { cursor: default; white-space: nowrap; letter-spacing: 0; font-variant-numeric: tabular-nums; }

  /* ── Mobile ── */
  @media (max-width: 400px) {
    .tb-label { display: none; }
    .tb-item { min-width: 36px; max-width: 50px; flex-basis: 40px; padding-right: 4px; }
    .tb-x { display: none; }
  }
</style>
