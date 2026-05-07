<script lang="ts">
  import { onMount } from 'svelte';
  import { i18n } from '$lib/i18n/index.svelte';
  import { getPrimaryModifierLabel } from '$lib/utils/platformShortcuts';

  let {
    onClose,
  }: {
    onClose: () => void;
  } = $props();

  let closeBtn: HTMLButtonElement | undefined = $state();
  let dialogEl: HTMLDivElement | undefined = $state();
  let previousFocus: HTMLElement | null = null;
  let hiddenSiblings: Element[] = [];

  let primaryModifierLabel = $derived(getPrimaryModifierLabel());
  let shortcuts = $derived([
    { keys: [primaryModifierLabel, 'Z'], action: i18n.t('undo') },
    { keys: [primaryModifierLabel, 'Shift', 'Z'], action: i18n.t('redo') },
    { keys: [primaryModifierLabel, 'S'], action: i18n.t('save_as') },
    { keys: ['?'], action: i18n.t('shortcut_toggle') },
    { keys: ['+'], action: i18n.t('shortcut_zoom_in') },
    { keys: ['-'], action: i18n.t('shortcut_zoom_out') },
    { keys: ['0'], action: i18n.t('shortcut_zoom_fit') },
    { keys: ['Scroll'], action: i18n.t('shortcut_scroll') },
    { keys: ['Drag'], action: i18n.t('shortcut_drag') },
    { keys: ['←', '→'], action: i18n.t('shortcut_slider') },
  ]);
  function getFocusableElements(): HTMLElement[] {
    if (!dialogEl) return [];
    return Array.from(
      dialogEl.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    );
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' || event.key === '?') {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key === 'Tab') {
      const focusable = getFocusableElements();
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  onMount(() => {
    previousFocus = document.activeElement as HTMLElement | null;

    const parent = dialogEl?.closest('.ks-backdrop')?.parentElement;
    if (parent) {
      for (const child of parent.children) {
        if (child.contains(dialogEl!) || child.getAttribute('aria-hidden') === 'true') continue;
        child.setAttribute('aria-hidden', 'true');
        hiddenSiblings.push(child);
      }
    }

    closeBtn?.focus();

    return () => {
      for (const element of hiddenSiblings) {
        element.removeAttribute('aria-hidden');
      }
      hiddenSiblings = [];
      previousFocus?.focus?.();
    };
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="ks-backdrop w98-overlay-scrim" onclick={onClose}>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="window ks-window w98-floating-surface w98-dialog-window w98-dialog-window--compact"
    bind:this={dialogEl}
    onclick={(e) => e.stopPropagation()}
    role="dialog"
    aria-modal="true"
    aria-labelledby="ks-dialog-title"
    tabindex="-1"
  >
    <div class="title-bar w98-shell-titlebar">
      <div class="title-bar-text ks-title w98-shell-title w98-dialog-titleline" id="ks-dialog-title"><span class="w98-structural-glyph">?</span> {i18n.t('keyboard_shortcuts')}</div>
      <div class="title-bar-controls w98-window-control-strip">
        <button
          type="button"
          class="ks-close w98-window-control-button"
          bind:this={closeBtn}
          onclick={onClose}
          aria-label={i18n.t('close')}
          data-control="close"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>
    </div>
    <div class="window-body ks-body w98-dialog-body-shell">
      <table class="ks-table">
        <tbody>
          {#each shortcuts as shortcut}
            <tr>
              <td class="ks-keys">
                {#each shortcut.keys as key, i}
                  {#if i > 0}<span class="ks-plus">+</span>{/if}
                  <kbd class="ks-key w98-kbd">{key}</kbd>
                {/each}
              </td>
              <td class="ks-action">{shortcut.action}</td>
            </tr>
          {/each}
        </tbody>
      </table>
      <div class="ks-hint w98-note">{i18n.t('press_to_close', '?', 'Esc')}</div>
    </div>
  </div>
</div>

<style>
  .ks-backdrop {
    z-index: 9999;
  }

  .ks-title {
    flex: 1;
  }

  .title-bar-controls :global(button) {
    flex-shrink: 0;
  }

  .ks-table {
    width: 100%;
    border-collapse: collapse;
  }
  .ks-table tr {
    border-bottom: 1px solid var(--w98-shadow-808);
  }
  .ks-table tr:last-child {
    border-bottom: none;
  }

  .ks-keys {
    padding: var(--w98-space-4) var(--w98-space-8) var(--w98-space-4) 0;
    white-space: nowrap;
    text-align: right;
    width: 1%;
  }

  .ks-action {
    padding: var(--w98-space-4) 0 var(--w98-space-4) var(--w98-space-8);
    font-size: var(--w98-font-size-base);
    color: var(--w98-text);
  }

  .ks-key {
    text-align: center;
  }

  .ks-plus {
    font-size: var(--w98-font-size-caption);
    color: var(--w98-shadow-808);
    margin: 0 var(--w98-space-2);
  }

  .ks-hint {
    margin-top: var(--w98-space-8);
    text-align: center;
    font-size: var(--w98-font-size-caption);
  }
</style>
