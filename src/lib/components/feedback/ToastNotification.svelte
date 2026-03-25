<script lang="ts">
  import { onMount } from 'svelte';

  export type ToastVariant = 'success' | 'error' | 'warning';

  const VARIANT_ICONS: Record<ToastVariant, string> = {
    success: '\u2705',
    error: '\u274C',
    warning: '\u26A0\uFE0F',
  };

  const SHORT_MSG_THRESHOLD = 50;
  const SHORT_DURATION = 3000;
  const LONG_DURATION = 5000;

  let {
    message,
    variant = 'success' as ToastVariant,
    duration,
    action,
    onDone,
  }: {
    message: string;
    variant?: ToastVariant;
    duration?: number;
    action?: { label: string; onclick: () => void };
    onDone: () => void;
  } = $props();

  const effectiveDuration = $derived(
    duration ?? (message.length >= SHORT_MSG_THRESHOLD ? LONG_DURATION : SHORT_DURATION)
  );

  let visible = $state(true);

  function dismiss() {
    visible = false;
    setTimeout(onDone, 300);
  }

  onMount(() => {
    const timer = setTimeout(dismiss, effectiveDuration);
    return () => clearTimeout(timer);
  });
</script>

{#if visible}
  <div class="toast toast-{variant}" role="status" aria-live="polite">
    <span class="toast-icon">{VARIANT_ICONS[variant]}</span>
    <span class="toast-msg">{message}</span>
    {#if action}
      <button class="toast-action" onclick={(e) => { e.stopPropagation(); action.onclick(); dismiss(); }}>{action.label}</button>
    {/if}
    <button class="toast-close" aria-label="Close" onclick={dismiss}>×</button>
  </div>
{/if}

<style>
  .toast {
    position: fixed;
    bottom: 38px;
    right: 12px;
    left: auto;
    transform: none;
    z-index: 9998;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    background: var(--w98-surface);
    border: 2px solid;
    border-color: var(--w98-shadow-light) var(--w98-shadow-808) var(--w98-shadow-808) var(--w98-shadow-light);
    box-shadow: var(--w98-outset);
    font-size: var(--w98-font-size-action);
    font-weight: bold;
    white-space: normal;
    max-width: calc(100vw - 32px);
    word-break: break-word;
    font-family: inherit;
    color: inherit;
    text-align: left;
  }

  .toast-error {
    border-color: var(--w98-color-error) var(--w98-shadow-808) var(--w98-shadow-808) var(--w98-color-error);
  }
  .toast-warning {
    border-color: var(--w98-color-warning-border) var(--w98-shadow-808) var(--w98-shadow-808) var(--w98-color-warning-border);
  }

  .toast-icon {
    font-size: 14px;
    font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif;
    flex-shrink: 0;
  }

  .toast-msg {
    color: var(--w98-text);
  }

  .toast-action {
    margin-left: 4px;
    padding: 1px 8px;
    font-size: var(--w98-font-size-sm);
    font-weight: bold;
    background: var(--w98-surface);
    border: none;
    box-shadow: var(--w98-outset-thin);
    cursor: pointer;
    white-space: nowrap;
  }
  .toast-action:hover {
    background: var(--w98-surface-active);
  }
  .toast-action:active {
    box-shadow: var(--w98-inset-thin);
  }

  .toast-close {
    margin-left: 4px;
    font-size: 14px;
    color: var(--w98-shadow-808);
    flex-shrink: 0;
    background: none;
    border: none;
    padding: 0 2px;
    cursor: pointer;
    font-weight: bold;
    line-height: 1;
  }

  .toast-close:hover {
    color: #000;
  }

</style>
