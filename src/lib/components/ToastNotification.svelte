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

  onMount(() => {
    const timer = setTimeout(() => {
      visible = false;
      setTimeout(onDone, 300); // wait for fade-out animation
    }, duration);
    return () => clearTimeout(timer);
  });
</script>

{#if visible}
  <div class="toast toast-{variant}" role="status" aria-live="polite">
    <span class="toast-icon">{VARIANT_ICONS[variant]}</span>
    <span class="toast-msg">{message}</span>
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
    background: #c0c0c0;
    border: 2px solid;
    border-color: #dfdfdf #808080 #808080 #dfdfdf;
    box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.4);
    font-size: 12px;
    font-weight: bold;
    animation: toastIn 0.3s ease-out;
    white-space: normal;
    max-width: calc(100vw - 32px);
    word-break: break-word;
  }

  .toast-error {
    border-color: #ff6b6b #808080 #808080 #ff6b6b;
  }
  .toast-warning {
    border-color: #ffa500 #808080 #808080 #ffa500;
  }

  .toast-icon {
    font-size: 14px;
    font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif;
    flex-shrink: 0;
  }

  .toast-msg {
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
