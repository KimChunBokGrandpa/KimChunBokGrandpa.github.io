<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { i18n } from '$lib/i18n/index.svelte';
  import { saveImage } from '$lib/services/saveService';
  import {
    RETROCAM_PRESETS,
    retroCamStore,
    type RetroCamPresetId,
  } from '$lib/stores/retroCamStore.svelte';

  let {
    onMessage,
    onError,
    onOpenInPixelLab,
  }: {
    onMessage?: (message: string) => void;
    onError?: (message: string) => void;
    onOpenInPixelLab?: (file: File, presetId: RetroCamPresetId) => void | Promise<void>;
  } = $props();

  let videoEl = $state<HTMLVideoElement | null>(null);
  let captureCanvas = $state<HTMLCanvasElement | null>(null);

  function currentPreset() {
    return RETROCAM_PRESETS.find((preset) => preset.id === retroCamStore.activePresetId) ?? RETROCAM_PRESETS[0];
  }

  function permissionMessageKey() {
    switch (retroCamStore.permissionState) {
      case 'requesting':
        return 'retrocam_status_requesting';
      case 'ready':
        return 'retrocam_status_ready';
      case 'denied':
        return 'retrocam_status_denied';
      case 'unavailable':
        return 'retrocam_status_unavailable';
      case 'busy':
        return 'retrocam_status_busy';
      case 'unsupported':
        return 'retrocam_status_unsupported';
      default:
        return 'retrocam_status_error';
    }
  }

  async function retryCamera() {
    const stream = await retroCamStore.requestCamera();
    if (stream) onMessage?.(i18n.t('retrocam_camera_ready'));
  }

  async function captureSnapshot() {
    if (!videoEl || !captureCanvas) return;
    const preset = currentPreset();
    const width = videoEl.videoWidth || 960;
    const height = videoEl.videoHeight || 720;
    captureCanvas.width = width;
    captureCanvas.height = height;

    const ctx = captureCanvas.getContext('2d');
    if (!ctx) {
      onError?.(i18n.t('retrocam_snapshot_failed'));
      return;
    }

    ctx.filter = preset.filter;
    ctx.drawImage(videoEl, 0, 0, width, height);

    captureCanvas.toBlob((blob) => {
      if (!blob) {
        onError?.(i18n.t('retrocam_snapshot_failed'));
        return;
      }
      const file = new File([blob], `retrocam_snapshot_${Date.now()}.png`, { type: 'image/png' });
      const objectUrl = URL.createObjectURL(blob);
      retroCamStore.setSnapshot(file, objectUrl);
      onMessage?.(i18n.t('retrocam_snapshot_captured'));
    }, 'image/png');
  }

  async function saveSnapshot() {
    if (!captureCanvas || !retroCamStore.lastSnapshotFile) return;
    try {
      const message = await saveImage(
        '',
        { format: 'png', quality: 0.92, filename: retroCamStore.lastSnapshotFile.name.replace(/\.png$/, '') },
        captureCanvas,
      );
      if (message) onMessage?.(message);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : i18n.t('retrocam_snapshot_failed'));
    }
  }

  async function openSnapshotInPixelLab() {
    if (!retroCamStore.lastSnapshotFile || !onOpenInPixelLab) return;
    try {
      await onOpenInPixelLab(retroCamStore.lastSnapshotFile, retroCamStore.activePresetId);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : i18n.t('retrocam_open_in_pixel_lab_failed'));
    }
  }

  $effect(() => {
    const stream = retroCamStore.stream;
    if (!videoEl) return;
    if (stream) {
      (videoEl as HTMLVideoElement & { srcObject?: MediaStream | null }).srcObject = stream;
      void videoEl.play().catch(() => {});
    } else {
      (videoEl as HTMLVideoElement & { srcObject?: MediaStream | null }).srcObject = null;
    }
  });

  onMount(() => {
    void retryCamera();
  });

  onDestroy(() => {
    retroCamStore.destroy();
  });
</script>

<div class="retrocam-root">
  <div class="retrocam-toolbar">
    <div class="retrocam-status">
      <strong>{i18n.t('win_retrocam')}</strong>
      <span>{i18n.t(permissionMessageKey())}</span>
    </div>

    <div class="retrocam-actions">
      <button class="toolbar-btn" onclick={retryCamera}>
        {i18n.t(retroCamStore.permissionState === 'ready' ? 'retrocam_retry_camera' : 'retrocam_start_camera')}
      </button>
      <button class="toolbar-btn" onclick={captureSnapshot} disabled={retroCamStore.permissionState !== 'ready'}>
        {i18n.t('retrocam_capture_snapshot')}
      </button>
      <button class="toolbar-btn" onclick={saveSnapshot} disabled={!retroCamStore.lastSnapshotFile}>
        {i18n.t('retrocam_save_snapshot')}
      </button>
      <button
        class="toolbar-btn"
        data-testid="retrocam-open-in-pixel-lab-button"
        onclick={openSnapshotInPixelLab}
        disabled={!retroCamStore.lastSnapshotFile}
      >
        {i18n.t('retrocam_open_in_pixel_lab')}
      </button>
      <button class="toolbar-btn" onclick={() => retroCamStore.clearSnapshot()} disabled={!retroCamStore.lastSnapshotFile}>
        {i18n.t('retrocam_clear_snapshot')}
      </button>
    </div>
  </div>

  <div class="retrocam-layout">
    <div class="retrocam-preview-shell">
      <div class="retrocam-preview-label">{i18n.t('retrocam_live_preview')}</div>
      {#if retroCamStore.permissionState === 'ready'}
        <video
          bind:this={videoEl}
          class="retrocam-video"
          autoplay
          muted
          playsinline
          style:filter={currentPreset().filter}
          data-testid="retrocam-video"
        ></video>
      {:else}
        <div class="retrocam-empty-state" data-testid="retrocam-empty-state">
          <div class="empty-icon">📷</div>
          <div>{i18n.t(permissionMessageKey())}</div>
        </div>
      {/if}
      <canvas bind:this={captureCanvas} class="retrocam-capture-canvas" aria-hidden="true"></canvas>
    </div>

    <div class="retrocam-sidebar">
      <div class="retrocam-preset-strip">
        {#each RETROCAM_PRESETS as preset}
          <button
            class="preset-btn"
            class:preset-btn-active={retroCamStore.activePresetId === preset.id}
            onclick={() => retroCamStore.setPreset(preset.id)}
          >
            {i18n.t(preset.labelKey)}
          </button>
        {/each}
      </div>

      <div class="retrocam-snapshot-panel">
        <div class="retrocam-preview-label">{i18n.t('retrocam_last_snapshot')}</div>
        {#if retroCamStore.lastSnapshotUrl}
          <img
            src={retroCamStore.lastSnapshotUrl}
            alt={i18n.t('retrocam_last_snapshot')}
            class="retrocam-snapshot-image"
          />
        {:else}
          <div class="retrocam-snapshot-placeholder">{i18n.t('retrocam_no_snapshot')}</div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .retrocam-root {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px;
    box-sizing: border-box;
    background:
      radial-gradient(circle at top left, rgba(255, 255, 255, 0.5), transparent 32%),
      linear-gradient(180deg, #d7dfef 0%, #b8c4d7 100%);
  }

  .retrocam-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }

  .retrocam-status {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 12px;
  }

  .retrocam-actions,
  .retrocam-preset-strip {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .toolbar-btn,
  .preset-btn {
    border: none;
    box-shadow: var(--w98-outset-thin);
    background: var(--w98-surface);
    padding: 4px 10px;
    cursor: pointer;
    font: inherit;
  }

  .toolbar-btn:disabled {
    cursor: not-allowed;
    color: var(--w98-text-disabled);
  }

  .preset-btn-active,
  .toolbar-btn:active,
  .preset-btn:active {
    box-shadow: var(--w98-inset-thin);
  }

  .retrocam-layout {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 260px;
    gap: 10px;
  }

  .retrocam-preview-shell,
  .retrocam-sidebar {
    box-shadow: var(--w98-inset-thin);
    background: rgba(255, 255, 255, 0.78);
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 0;
  }

  .retrocam-preview-label {
    font-weight: bold;
    font-size: 12px;
    letter-spacing: 0.02em;
  }

  .retrocam-video,
  .retrocam-snapshot-image,
  .retrocam-empty-state {
    width: 100%;
    min-height: 0;
    flex: 1;
    object-fit: cover;
    background: #101218;
  }

  .retrocam-empty-state,
  .retrocam-snapshot-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 16px;
    color: #1b2b40;
    background:
      linear-gradient(135deg, rgba(0, 0, 0, 0.08), transparent),
      #d7dfef;
  }

  .empty-icon {
    font-size: 28px;
    margin-bottom: 8px;
  }

  .retrocam-capture-canvas {
    display: none;
  }

  @media (max-width: 760px) {
    .retrocam-layout {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
