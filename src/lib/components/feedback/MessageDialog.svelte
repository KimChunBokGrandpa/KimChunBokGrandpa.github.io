<script lang="ts">
  import { onMount } from 'svelte';
  import { i18n } from '$lib/i18n/index.svelte';

  let {
    message,
    title = i18n.t('dialog_notice_title'),
    confirmLabel,
    cancelLabel,
    onClose,
    onConfirm,
  }: {
    message: string;
    title?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onClose: () => void;
    onConfirm?: () => void;
  } = $props();

  let okBtn: HTMLButtonElement | undefined = $state();
  let dialogEl: HTMLDivElement | undefined = $state();
  let dialogToneIcon = $derived(onConfirm ? '⚠️' : 'ℹ️');

  // ESC key to close
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
    // Focus trap: keep Tab within dialog
    if (e.key === 'Tab' && dialogEl) {
      const focusable = dialogEl.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
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

  // Auto-focus OK button on mount, restore focus on unmount
  // Also apply aria-hidden to background content for screen readers
  let previousFocus: HTMLElement | null = null;
  let hiddenSiblings: Element[] = [];
  onMount(() => {
    previousFocus = document.activeElement as HTMLElement | null;

    // Hide sibling elements from screen readers while dialog is open
    const parent = dialogEl?.closest('.dialog-overlay')?.parentElement;
    if (parent) {
      for (const child of parent.children) {
        if (child.contains(dialogEl!) || child.getAttribute('aria-hidden') === 'true') continue;
        child.setAttribute('aria-hidden', 'true');
        hiddenSiblings.push(child);
      }
    }

    okBtn?.focus();
    return () => {
      // Restore aria-hidden on unmount
      for (const el of hiddenSiblings) {
        el.removeAttribute('aria-hidden');
      }
      hiddenSiblings = [];
      previousFocus?.focus?.();
    };
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="dialog-overlay w98-overlay-scrim" onclick={onClose}>
  <div
    class="window dialog-win w98-floating-surface w98-dialog-window"
    bind:this={dialogEl}
    onclick={(e) => e.stopPropagation()}
    role="dialog"
    aria-modal="true"
    aria-labelledby="msg-dialog-title"
    tabindex="-1"
  >
    <div class="title-bar w98-shell-titlebar">
      <div class="title-bar-text dialog-title w98-shell-title w98-dialog-titleline" id="msg-dialog-title">
        <span class="dialog-title-icon w98-emoji" aria-hidden="true">{dialogToneIcon}</span>
        <span>{title}</span>
      </div>
      <div class="title-bar-controls w98-window-control-strip">
        <button type="button" class="w98-window-control-button" aria-label={i18n.t('close')} data-control="close" onclick={onClose}>
          <span aria-hidden="true">✕</span>
        </button>
      </div>
    </div>
    <div class="window-body dialog-body w98-dialog-body-shell">
      <div class="dialog-content w98-dialog-layout">
        <div class="dialog-icon-shell w98-dialog-icon-panel" aria-hidden="true">
          <span class="dialog-icon w98-emoji">{dialogToneIcon}</span>
        </div>
        <div class="dialog-copy-stack w98-dialog-copy-stack">
          <p class="dialog-message w98-dialog-copy">{message}</p>
        </div>
      </div>
      <div class="field-row dialog-actions w98-action-row w98-dialog-actions">
        {#if onConfirm}
          <button type="button" class="dialog-ok-btn w98-button" bind:this={okBtn} onclick={onConfirm}>{confirmLabel ?? i18n.t('ok')}</button>
          <button type="button" class="dialog-ok-btn w98-button" onclick={onClose}>{cancelLabel ?? i18n.t('cancel')}</button>
        {:else}
          <button type="button" class="dialog-ok-btn w98-button" bind:this={okBtn} onclick={onClose}>{i18n.t('ok')}</button>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .dialog-overlay {
    z-index: 9999;
  }
  .dialog-title {
    flex: 1;
  }
  .dialog-title-icon {
    flex-shrink: 0;
  }
  .dialog-content {
    align-items: stretch;
    margin-bottom: 0;
  }
  .dialog-icon {
    font-size: 26px;
    flex-shrink: 0;
    line-height: 1;
  }
  .dialog-message {
    padding-top: 2px;
  }
  .dialog-ok-btn {
    min-width: 75px;
  }
  .title-bar-controls :global(button) {
    flex-shrink: 0;
  }
</style>
