<script lang="ts">
  import { onMount } from 'svelte';
  import type { WindowId, WindowMode } from '$lib/types';
  import { i18n, localeLabels, type Locale } from '$lib/i18n/index.svelte';
  import { tooltip } from '$lib/utils/tooltip';

  const locales: Locale[] = ['ja', 'en', 'ko'];

  function cycleLocale() {
    const idx = locales.indexOf(i18n.locale);
    i18n.locale = locales[(idx + 1) % locales.length];
  }

  function getNextLocaleLabel(): string {
    const idx = locales.indexOf(i18n.locale);
    const next = locales[(idx + 1) % locales.length];
    return localeLabels[next];
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
    startMenuOpen = false,
    onWindowClick,
    onWindowClose,
    onShowShortcuts,
    onStartClick,
  }: {
    windows: TaskbarWindowInfo[];
    startMenuOpen?: boolean;
    onWindowClick: (id: WindowId) => void;
    onWindowClose: (id: WindowId) => void;
    onShowShortcuts?: () => void;
    onStartClick?: (event: MouseEvent) => void;
  } = $props();

  let timeString = $state('');

  function getWindowActionLabel(win: TaskbarWindowInfo): string {
    if (win.mode === 'minimized') {
      return i18n.t('taskbar_restore_window');
    }
    if (win.focused) {
      return i18n.t('taskbar_minimize_window');
    }
    return i18n.t('taskbar_switch_to_window');
  }

  function getTaskbarEntryClass(win: TaskbarWindowInfo): string {
    return [
      'tb-entry',
      'w98-taskbar-entry',
      win.focused && win.mode !== 'minimized' ? 'tb-entry--active w98-taskbar-entry--active' : '',
    ].filter(Boolean).join(' ');
  }

  function getTaskbarButtonClass(win: TaskbarWindowInfo): string {
    return [
      'tb-item',
      'w98-taskbar-button',
      win.focused && win.mode !== 'minimized' ? 'tb-active' : '',
      win.mode === 'minimized' ? 'tb-dim' : '',
      win.focused && win.mode !== 'minimized' ? 'w98-taskbar-button--active' : '',
      win.mode === 'minimized' ? 'w98-taskbar-button--dim' : '',
    ].filter(Boolean).join(' ');
  }

  function getWindowAriaLabel(win: TaskbarWindowInfo): string {
    return `${getWindowActionLabel(win)}: ${win.title}`;
  }

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

<nav class="taskbar" aria-label={i18n.t('taskbar_landmark')}>
  <button
    type="button"
    class="start-btn w98-taskbar-button"
    class:w98-taskbar-button--active={startMenuOpen}
    onclick={(event) => onStartClick?.(event)}
    aria-label={i18n.t('start')}
    aria-pressed={startMenuOpen}
    title={i18n.t(startMenuOpen ? 'start_close_launcher' : 'start_open_launcher')}
    use:tooltip
  >
    <span class="start-logo w98-structural-glyph">⊞</span>
    <span class="start-text">{i18n.t('start')}</span>
  </button>
  <div class="taskbar-grip" aria-hidden="true"><span class="w98-taskbar-grip"></span></div>
  <div class="taskbar-left">
    {#each visibleWindows as win}
      <div class={getTaskbarEntryClass(win)}>
        <button
          type="button"
          class={getTaskbarButtonClass(win)}
          onclick={() => onWindowClick(win.id)}
          aria-label={getWindowAriaLabel(win)}
          title={getWindowAriaLabel(win)}
          aria-pressed={win.focused && win.mode !== 'minimized'}
          use:tooltip
        >
          <span class="tb-icon w98-emoji">{win.icon}</span>
          <span class="tb-label">{win.title}</span>
        </button>
        <button
          type="button"
          class="tb-x w98-inline-button w98-button--thin w98-structural-glyph w98-taskbar-close-button"
          title={`${i18n.t('close')} ${win.title}`}
          onclick={() => onWindowClose(win.id)}
          aria-label={`${i18n.t('close')} ${win.title}`}
          use:tooltip
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>
    {/each}
  </div>

  <div class="taskbar-grip tray-grip" aria-hidden="true"><span class="w98-taskbar-grip"></span></div>
  <div class="taskbar-right">
    <div class="tray w98-taskbar-tray">
      <span class="tray-ico w98-emoji">🔊</span>
      {#if onShowShortcuts}
        <button type="button" class="tray-help w98-inline-button w98-button--thin w98-structural-glyph" onclick={onShowShortcuts} title={`${i18n.t('keyboard_shortcuts')} (?)`} aria-label={i18n.t('keyboard_shortcuts')} use:tooltip>?</button>
      {/if}
      <button type="button" class="tray-lang w98-inline-button w98-button--thin" onclick={cycleLocale} title={`${i18n.t('language')}: ${localeLabels[i18n.locale]} → ${getNextLocaleLabel()}`} aria-label={`${i18n.t('language')}: ${localeLabels[i18n.locale]} → ${getNextLocaleLabel()}`} use:tooltip
        >{i18n.locale.toUpperCase()}</button
      >
      <span class="tray-clock">{timeString}</span>
    </div>
  </div>
</nav>

<style>
  /* ── Taskbar Container ── */
  .taskbar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: var(--w98-taskbar-height);
    background: var(--w98-surface);
    display: flex;
    justify-content: space-between;
    align-items: stretch;
    padding: var(--w98-space-2);
    z-index: 9000;
    gap: var(--w98-space-2);
    box-shadow: var(--w98-outset);
  }

  /* ── Start Button ── */
  .start-btn {
    flex-shrink: 0;
    min-width: 84px;
    justify-content: flex-start;
  }
  .start-logo {
    font-size: 14px;
    font-weight: bold;
    color: var(--w98-highlight);
    line-height: 1;
    width: 13px;
    text-align: center;
  }
  .start-text {
    letter-spacing: 0.5px;
    font-weight: bold;
  }

  /* ── Gripper (drag handle divider) ── */
  .taskbar-grip {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 var(--w98-space-2);
    flex-shrink: 0;
    cursor: default;
  }
  .taskbar-grip span {
    display: block;
  }
  .tray-grip {
    margin-left: auto;
  }

  .taskbar-left {
    display: flex;
    align-items: stretch;
    gap: var(--w98-space-2);
    min-width: 0;
    overflow: hidden;
    flex: 1;
  }

  /* ── Task Item (Win98 button style) ── */
  .tb-entry {
    position: relative;
    min-width: 48px;
    max-width: 160px;
    flex: 0 1 148px;
  }

  .tb-item {
    width: 100%;
    min-width: 100%;
    padding: 0 18px 0 6px;
    font-size: var(--w98-font-size-base);
    overflow: hidden;
    justify-content: flex-start;
  }

  .tb-item.tb-active {
    font-weight: bold;
  }

  .tb-icon {
    font-size: var(--w98-font-size-heading);
    flex-shrink: 0;
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
    right: var(--w98-space-4);
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 14px;
    width: 14px;
    height: 14px;
    padding: 0;
    display: flex;
  }
  .tb-x span {
    font-size: var(--w98-font-size-base);
    font-weight: bold;
    line-height: 1;
    color: var(--w98-text);
  }

  /* ── System Tray ── */
  .taskbar-right {
    display: flex;
    align-items: stretch;
    flex-shrink: 0;
  }
  .tray {
    gap: var(--w98-space-4);
    padding: 0 var(--w98-space-6);
    font-size: var(--w98-font-size-base);
  }
  .tray-ico {
    font-size: var(--w98-font-size-icon);
  }
  .tray-clock {
    cursor: default;
    white-space: nowrap;
    letter-spacing: 0;
    font-variant-numeric: tabular-nums;
  }
  .tray-lang {
    min-height: 18px;
    font-size: var(--w98-font-size-sm);
    font-weight: bold;
    font-family: inherit;
    min-width: 24px;
    text-align: center;
    height: 18px;
    line-height: 1;
  }
  .tray-help {
    min-height: 18px;
    font-size: var(--w98-font-size-sm);
    font-weight: bold;
    font-family: inherit;
    min-width: 18px;
    text-align: center;
    height: 18px;
    line-height: 1;
    color: var(--w98-highlight);
  }

  /* ── Mobile ── */
  @media (max-width: 550px) {
    .start-btn {
      min-width: 32px;
      padding: 0 6px;
      justify-content: center;
    }
    .tb-label {
      display: none;
    }
    .tb-entry {
      min-width: 36px;
      max-width: 50px;
      flex-basis: 40px;
    }
    .tb-item {
      padding: 0 6px;
      justify-content: center;
    }
    .tb-x {
      display: none;
    }
    .tray {
      gap: 4px;
      padding: 0 3px;
    }
    .start-text {
      display: none;
    }
    .taskbar-grip {
      display: none;
    }
    .tray-ico {
      display: none;
    }
    .tray-lang {
      min-width: 22px;
      padding: 0 4px;
    }
  }
</style>
