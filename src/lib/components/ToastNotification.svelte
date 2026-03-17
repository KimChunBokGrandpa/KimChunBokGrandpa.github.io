<script lang="ts">
  import { onMount } from 'svelte';

  export type ToastVariant = 'success' | 'error' | 'warning';

  const VARIANT_ICONS: Record<ToastVariant, string> = {
    success: '\u2705',
    error: '\u274C',
    warning: '\u26A0\uFE0F',
  };

  let {
    message,
    variant = 'success' as ToastVariant,
    duration = 3000,
    onDone,
  }: {
    message: string;
    variant?: ToastVariant;
    duration?: number;
    onDone: () => void;
  } = $props();

  let visible = $state(true);

  function dismiss() {
    visible = false;
    setTimeout(onDone, 300);
  }

  onMount(() => {
    const timer = setTimeout(dismiss, duration);
    return () => clearTimeout(timer);
  });
</script>

{#if visible}
  <!-- svelte-ignore a11y_no_static_element_interactions a11y_no_noninteractive_element_interactions -->
  <div class="toast toast-{variant}" role="status" aria-live="polite" onclick={dismiss} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') dismiss(); }}>
    <span class="toast-icon">{VARIANT_ICONS[variant]}</span>
    <span class="toast-msg">{message}</span>
    <button class="toast-close" aria-label="Close" onclick={dismiss}>×</button>
  </div>
{/if}

<style>
  .toast {
    position: fixed;
    bottom: 38px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9998;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    background: var(--w98-surface);
    border: 2px solid;
    border-color: var(--w98-shadow-light) var(--w98-shadow-808) var(--w98-shadow-808) var(--w98-shadow-light);
    box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.4);
    font-size: var(--w98-font-size-action);
    font-weight: bold;
    animation: toastIn 0.3s ease-out;
    white-space: normal;
    max-width: calc(100vw - 32px);
    word-break: break-word;
    cursor: pointer;
    font-family: inherit;
    color: inherit;
    text-align: left;
  }

  .toast-error {
    border-color: #ff6b6b var(--w98-shadow-808) var(--w98-shadow-808) #ff6b6b;
  }
  .toast-warning {
    border-color: #ffa500 var(--w98-shadow-808) var(--w98-shadow-808) #ffa500;
  }

  .toast-icon {
    font-size: 14px;
    font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif;
    flex-shrink: 0;
  }

  .toast-msg {
    color: #000;
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

  @keyframes toastIn {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
</style>
