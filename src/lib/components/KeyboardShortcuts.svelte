<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';

  let {
    onClose,
  }: {
    onClose: () => void;
  } = $props();

  let shortcuts = $derived([
    { keys: ['Ctrl', 'Z'], action: i18n.t('undo') },
    { keys: ['Ctrl', 'Shift', 'Z'], action: i18n.t('redo') },
    { keys: ['Ctrl', 'S'], action: i18n.t('save_as') },
    { keys: ['?'], action: i18n.t('shortcut_toggle') },
    { keys: ['+'], action: i18n.t('shortcut_zoom_in') },
    { keys: ['-'], action: i18n.t('shortcut_zoom_out') },
    { keys: ['0'], action: i18n.t('shortcut_zoom_fit') },
    { keys: ['Scroll'], action: i18n.t('shortcut_scroll') },
    { keys: ['Drag'], action: i18n.t('shortcut_drag') },
    { keys: ['←', '→'], action: i18n.t('shortcut_slider') },
  ]);
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="ks-backdrop" onclick={onClose} onkeydown={(e) => { if (e.key === 'Escape' || e.key === '?') onClose(); }} role="dialog" aria-modal="true" aria-labelledby="ks-dialog-title" tabindex="-1">
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="ks-window" onclick={(e) => e.stopPropagation()}>
    <div class="ks-titlebar">
      <span class="ks-title" id="ks-dialog-title">⌨️ {i18n.t('keyboard_shortcuts')}</span>
      <button class="ks-close" onclick={onClose} aria-label={i18n.t('close')}>✕</button>
    </div>
    <div class="ks-body">
      <table class="ks-table">
        <tbody>
          {#each shortcuts as shortcut}
            <tr>
              <td class="ks-keys">
                {#each shortcut.keys as key, i}
                  {#if i > 0}<span class="ks-plus">+</span>{/if}
                  <kbd class="ks-key">{key}</kbd>
                {/each}
              </td>
              <td class="ks-action">{shortcut.action}</td>
            </tr>
          {/each}
        </tbody>
      </table>
      <div class="ks-hint">{i18n.t('press_to_close', '?', 'Esc')}</div>
    </div>
  </div>
</div>

<style>
  .ks-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ks-window {
    background: #c0c0c0;
    border: 2px solid;
    border-color: #dfdfdf #808080 #808080 #dfdfdf;
    box-shadow: 4px 4px 12px rgba(0, 0, 0, 0.5);
    min-width: 280px;
    max-width: 360px;
  }

  .ks-titlebar {
    background: #000080;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 2px 4px;
    font-size: 12px;
    font-weight: bold;
  }

  .ks-title {
    padding-left: 2px;
  }

  .ks-close {
    background: #c0c0c0;
    border: 2px solid;
    border-color: #dfdfdf #808080 #808080 #dfdfdf;
    font-size: 10px;
    width: 16px;
    height: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    line-height: 1;
  }
  .ks-close:active {
    border-color: #808080 #dfdfdf #dfdfdf #808080;
  }

  .ks-body {
    padding: 12px;
  }

  .ks-table {
    width: 100%;
    border-collapse: collapse;
  }
  .ks-table tr {
    border-bottom: 1px solid #a0a0a0;
  }
  .ks-table tr:last-child {
    border-bottom: none;
  }

  .ks-keys {
    padding: 5px 8px 5px 0;
    white-space: nowrap;
    text-align: right;
    width: 1%;
  }

  .ks-action {
    padding: 5px 0 5px 8px;
    font-size: 11px;
    color: #222;
  }

  .ks-key {
    display: inline-block;
    background: #fff;
    border: 1px solid #808080;
    border-bottom-width: 2px;
    border-right-width: 2px;
    border-radius: 2px;
    padding: 1px 5px;
    font-size: 10px;
    font-family: 'Courier New', Courier, monospace;
    font-weight: bold;
    color: #000;
    min-width: 18px;
    text-align: center;
  }

  .ks-plus {
    font-size: 9px;
    color: #808080;
    margin: 0 2px;
  }

  .ks-hint {
    margin-top: 10px;
    text-align: center;
    font-size: 9px;
    color: #808080;
  }
</style>
