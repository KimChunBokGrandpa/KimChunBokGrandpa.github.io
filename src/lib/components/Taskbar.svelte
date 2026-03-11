<script lang="ts">
  import { onMount } from 'svelte';
  import type { WindowId, WindowMode } from '../types';
  import { i18n, LOCALE_LABELS, type Locale } from '$lib/i18n/index.svelte';
  import { getWindowTitle } from '$lib/stores/windowStore.svelte';

  const LOCALES: Locale[] = ['ja', 'en', 'ko'];

  function cycleLocale() {
    const idx = LOCALES.indexOf(i18n.locale);
    i18n.locale = LOCALES[(idx + 1) % LOCALES.length];
  }

  export interface TaskbarWindowInfo {
    id: WindowId;
    title: string;
    icon: string;
    mode: WindowMode;
    focused: boolean;
  }

  let {
    windows = [],
    onWindowClick,
    onWindowClose,
  }: {
    windows: TaskbarWindowInfo[];
    onWindowClick: (id: WindowId) => void;
    onWindowClose: (id: WindowId) => void;
  } = $props();

  let timeString = $state('');

  // 12h for EN, 24h for KO/JA
  function updateTime() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    if (i18n.locale === 'en') {
      const h12 = hours % 12 || 12;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      timeString = `${h12}:${minutes} ${ampm}`;
    } else {
      timeString = `${hours.toString().padStart(2, '0')}:${minutes}`;
    }
  }

  // Re-format when locale changes
  $effect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    i18n.locale;
    updateTime();
  });

  onMount(() => {
    updateTime();
    // Align to next minute boundary, then update every 60s
    let interval: ReturnType<typeof setInterval>;
    const msToNextMinute = 60000 - (Date.now() % 60000);
    const firstTimeout = setTimeout(() => {
      updateTime();
      interval = setInterval(updateTime, 60000);
    }, msToNextMinute);
    return () => {
      clearTimeout(firstTimeout);
      clearInterval(interval);
    };
  });

  let visibleWindows = $derived(windows.filter((w) => w.mode !== 'closed'));
</script>

<div class="taskbar">
  <div class="taskbar-left">
    {#each visibleWindows as win}
      <div
        class="tb-item"
        class:tb-active={win.focused && win.mode !== 'minimized'}
        class:tb-dim={win.mode === 'minimized'}
        onclick={() => onWindowClick(win.id)}
        onkeydown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onWindowClick(win.id);
          }
        }}
        role="button"
        tabindex="0"
        aria-label="{getWindowTitle(win.id)} window"
      >
        <span class="tb-icon">{win.icon}</span>
        <span class="tb-label">{getWindowTitle(win.id)}</span>
        <button
          class="tb-x"
          title="{i18n.t('close')} {getWindowTitle(win.id)}"
          onclick={(e) => {
            e.stopPropagation();
            onWindowClose(win.id);
          }}
          aria-label="{i18n.t('close')} {getWindowTitle(win.id)}"
        ></button>
      </div>
    {/each}
  </div>

  <div class="taskbar-right">
    <div class="tray">
      <span class="tray-ico">🔊</span>
      <button class="tray-lang" onclick={cycleLocale} title={i18n.t('language')}
        >{i18n.locale.toUpperCase()}</button
      >
      <span class="tray-clock">{timeString}</span>
    </div>
  </div>
</div>

<style>
  /* ── Taskbar Container ── */
  .taskbar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: var(--w98-taskbar-height);
    background: var(--w98-surface);
    border-top: 1px solid var(--w98-shadow-white);
    display: flex;
    justify-content: space-between;
    align-items: stretch;
    padding: 2px 2px 2px 2px;
    z-index: 9000;
    gap: 2px;
    box-shadow: inset 0 1px 0 var(--w98-shadow-light);
  }

  .taskbar-left {
    display: flex;
    align-items: stretch;
    gap: 3px;
    min-width: 0;
    overflow: hidden;
    flex: 1;
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
    background: var(--w98-surface);
    border: none;
    cursor: pointer;
    font-size: var(--w98-font-size-base);
    font-family: inherit;
    overflow: hidden;
    box-shadow: var(--w98-outset);
    transition: flex-basis 0.15s ease;
  }

  .tb-item.tb-active {
    box-shadow: var(--w98-inset);
    background: var(--w98-surface-active);
    font-weight: bold;
  }
  .tb-item.tb-dim {
    opacity: 0.65;
  }

  .tb-icon {
    font-size: 14px;
    flex-shrink: 0;
    font-family: var(--w98-emoji-font);
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
    background: var(--w98-surface);
    border: none;
    cursor: pointer;
    box-shadow: var(--w98-outset-thin);
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
    background: var(--w98-surface);
    box-shadow: var(--w98-inset-thin);
  }
  .tb-x:hover::after {
    color: var(--w98-text);
  }
  .tb-x:active {
    box-shadow:
      inset -1px -1px var(--w98-shadow-light),
      inset 1px 1px var(--w98-shadow-808);
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
    box-shadow: var(--w98-inset-thin);
    font-size: var(--w98-font-size-base);
    font-family: 'Segoe UI', 'MS Sans Serif', Arial, sans-serif;
  }
  .tray-ico {
    font-size: var(--w98-font-size-icon);
    font-family: var(--w98-emoji-font);
  }
  .tray-clock {
    cursor: default;
    white-space: nowrap;
    letter-spacing: 0;
    font-variant-numeric: tabular-nums;
  }
  .tray-lang {
    font-size: var(--w98-font-size-sm);
    font-weight: bold;
    font-family: inherit;
    padding: 1px 4px;
    background: var(--w98-surface);
    border: none;
    box-shadow: var(--w98-outset-thin);
    cursor: pointer;
    min-width: 24px;
    text-align: center;
    height: 18px;
    line-height: 1;
  }
  .tray-lang:active {
    box-shadow: var(--w98-inset-thin);
  }

  /* ── Mobile ── */
  @media (max-width: 550px) {
    .tb-label {
      display: none;
    }
    .tb-item {
      min-width: 36px;
      max-width: 50px;
      flex-basis: 40px;
      padding-right: 4px;
    }
    .tb-x {
      display: none;
    }
    .tray {
      gap: 4px;
      padding: 0 4px;
    }
    .tray-ico {
      display: none;
    }
  }
</style>
