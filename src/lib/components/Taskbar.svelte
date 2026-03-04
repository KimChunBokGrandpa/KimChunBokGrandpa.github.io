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
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
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
      >
        <button class="tb-main" onclick={() => onWindowClick(win.id)}>
          <span class="tb-icon">{win.icon}</span>
          <span class="tb-label">{win.title}</span>
        </button>
        <button
          class="tb-x"
          title="Close & reset {win.title}"
          onclick={(e) => { e.stopPropagation(); onWindowClose(win.id); }}
        ><!-- x via ::after --></button>
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
  .taskbar {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    height: 32px;
    background: #c0c0c0;
    border-top: 2px solid #fff;
    display: flex;
    justify-content: space-between;
    align-items: stretch;
    padding: 2px 3px;
    z-index: 9000;
    gap: 2px;
  }

  .taskbar-left {
    display: flex;
    align-items: stretch;
    gap: 2px;
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
    font-size: 13px;
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
  .start-logo { font-size: 15px; color: #000080; }

  .sep {
    width: 2px;
    align-self: stretch;
    margin: 1px 2px;
    background: #808080;
    border-right: 1px solid #fff;
    flex-shrink: 0;
  }

  /* ── Task Item ── */
  .tb-item {
    display: flex;
    align-items: stretch;
    min-width: 44px;
    max-width: 130px;
    flex: 0 1 100px;
    background: #c0c0c0;
    box-shadow: inset 1px 1px #fff, inset -1px -1px #0a0a0a,
                inset 2px 2px #dfdfdf, inset -2px -2px grey;
    transition: flex-basis 0.15s ease;
  }

  .tb-item.tb-active {
    box-shadow: inset -1px -1px #fff, inset 1px 1px #0a0a0a,
                inset -2px -2px #dfdfdf, inset 2px 2px grey;
    background: linear-gradient(180deg, #e8e4dc 0%, #d4d0c8 100%);
    border-left: 2px solid #000080;
  }
  .tb-item.tb-dim {
    opacity: 0.65;
  }

  .tb-main {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0 4px;
    font-size: 11px;
    font-family: inherit;
    background: transparent;
    border: none;
    cursor: pointer;
    min-width: 0;
    overflow: hidden;
  }
  .tb-active .tb-main {
    font-weight: bold;
  }

  .tb-icon { font-size: 14px; flex-shrink: 0; }
  .tb-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  .tb-x {
    flex-shrink: 0;
    flex-grow: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 13px;
    min-height: 13px;
    box-sizing: border-box;
    font-size: 0;
    padding: 0;
    margin: auto 1px auto 0;
    background: #c0c0c0;
    border: 1px outset #dfdfdf;
    cursor: pointer;
    position: relative;
  }
  .tb-x::after {
    content: '×';
    font-size: 10px;
    line-height: 1;
    color: #000;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  .tb-x:hover {
    background: #e04040;
    border-color: #a00;
  }
  .tb-x:hover::after {
    color: #fff;
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
    font-size: 12px;
  }
  .tray-ico { font-size: 13px; }
  .tray-clock { cursor: default; white-space: nowrap; }

  /* ── Mobile ── */
  @media (max-width: 400px) {
    .tb-label { display: none; }
    .tb-item { min-width: 36px; max-width: 50px; flex-basis: 40px; }
    .tb-x { display: none; }
  }
</style>
