<script lang="ts">
  let { message, title = 'Message', onClose }: {
    message: string;
    title?: string;
    onClose: () => void;
  } = $props();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="dialog-overlay" onclick={onClose}>
  <div class="window dialog-win" onclick={(e) => e.stopPropagation()}>
    <div class="title-bar">
      <div class="title-bar-text">{title}</div>
      <div class="title-bar-controls">
        <button aria-label="Close" onclick={onClose}></button>
      </div>
    </div>
    <div class="window-body" style="padding: 12px;">
      <p style="margin: 0 0 16px 0;">{message}</p>
      <div class="field-row" style="justify-content: flex-end;">
        <button onclick={onClose} style="min-width: 75px;">OK</button>
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
