<script lang="ts">
  import { onMount } from 'svelte';
  import { i18n } from '$lib/i18n/index.svelte';

  let { message, title = i18n.t('message'), onClose }: {
    message: string;
    title?: string;
    onClose: () => void;
  } = $props();

  let okBtn: HTMLButtonElement | undefined = $state();
  let dialogEl: HTMLDivElement | undefined = $state();

  // ESC key to close
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
    // Focus trap: keep Tab within dialog
    if (e.key === 'Tab' && dialogEl) {
      const focusable = dialogEl.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  // Auto-focus OK button on mount
  onMount(() => {
    okBtn?.focus();
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="dialog-overlay" onclick={onClose}>
  <div class="window dialog-win" bind:this={dialogEl} onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="msg-dialog-title" tabindex="-1">
    <div class="title-bar">
      <div class="title-bar-text" id="msg-dialog-title">{title}</div>
      <div class="title-bar-controls">
        <button aria-label={i18n.t('close')} onclick={onClose}></button>
      </div>
    </div>
    <div class="window-body" style="padding: 12px;">
      <p style="margin: 0 0 16px 0;">{message}</p>
      <div class="field-row" style="justify-content: flex-end;">
        <button bind:this={okBtn} onclick={onClose} style="min-width: 75px;">{i18n.t('ok')}</button>
      </div>
    </div>
  </div>
</div>

<style>
  .dialog-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  }
  .dialog-win {
    min-width: 280px;
    max-width: 400px;
    box-shadow: 4px 4px 12px rgba(0,0,0,0.5);
  }
</style>
