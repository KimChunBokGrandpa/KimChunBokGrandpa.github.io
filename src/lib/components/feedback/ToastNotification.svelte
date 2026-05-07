<script lang="ts">
  import { onMount } from 'svelte';
  import { i18n } from '$lib/i18n/index.svelte';

  export type ToastVariant = 'success' | 'error' | 'warning';

  const variantIcons: Record<ToastVariant, string> = {
    success: 'ℹ️',
    error: '⚠️',
    warning: '💡',
  };

  const shortMessageThreshold = 50;
  const shortDurationMs = 3000;
  const longDurationMs = 5000;

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
    duration ?? (message.length >= shortMessageThreshold ? longDurationMs : shortDurationMs)
  );

  let visible = $state(true);

  function dismiss() {
    visible = false;
    onDone();
  }

  onMount(() => {
    const timer = setTimeout(dismiss, effectiveDuration);
    return () => clearTimeout(timer);
  });
</script>

{#if visible}
  <div class="toast toast-{variant} w98-floating-surface" role="status" aria-live="polite">
    <span class="toast-icon-shell w98-dialog-icon-panel w98-dialog-icon-panel--small" aria-hidden="true">
      <span class="toast-icon w98-emoji">{variantIcons[variant]}</span>
    </span>
    <span class="toast-msg">{message}</span>
    {#if action}
      <button type="button" class="toast-action w98-inline-button w98-button--thin w98-toast-action" onclick={(e) => { e.stopPropagation(); action.onclick(); dismiss(); }}>{action.label}</button>
    {/if}
    <button type="button" class="toast-close w98-window-control-button w98-structural-glyph" aria-label={i18n.t('close')} data-control="close" onclick={dismiss}>✕</button>
  </div>
{/if}

<style>
  .toast {
    position: fixed;
    bottom: calc(var(--w98-taskbar-height) + var(--w98-space-8));
    right: var(--w98-space-12);
    left: auto;
    transform: none;
    z-index: 9998;
    display: flex;
    align-items: center;
    gap: var(--w98-space-6);
    padding: var(--w98-space-8) var(--w98-space-12);
    font-size: var(--w98-font-size-base);
    font-weight: bold;
    white-space: normal;
    max-width: calc(100vw - (var(--w98-space-16) * 2));
    word-break: break-word;
    font-family: inherit;
    color: inherit;
    text-align: left;
  }

  .toast-icon-shell {
    flex-shrink: 0;
  }

  .toast-success .toast-icon-shell {
    color: var(--w98-color-success);
  }
  .toast-error .toast-icon-shell {
    color: var(--w98-color-error);
  }
  .toast-warning .toast-icon-shell {
    color: var(--w98-color-warning);
  }

  .toast-icon {
    font-size: var(--w98-font-size-heading);
  }

  .toast-msg {
    color: var(--w98-text);
    flex: 1;
  }

  .toast-action {
    margin-left: var(--w98-space-2);
    font-size: var(--w98-font-size-base);
    white-space: nowrap;
  }

  .toast-close {
    margin-left: var(--w98-space-2);
    font-size: var(--w98-font-size-base);
    color: var(--w98-text);
    flex-shrink: 0;
  }

</style>
