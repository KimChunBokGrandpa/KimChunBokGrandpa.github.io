<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { i18n } from '$lib/i18n/index.svelte';
  import ContextMenu, { type ContextMenuEntry } from '$lib/components/feedback/ContextMenu.svelte';
  import { saveImage, type SaveFormat } from '$lib/services/saveService';
  import { buildOpenWithSection } from '$lib/shell/openWithMenu';
  import {
    retroCamPresets,
    retroCamStore,
    type RetroCamDeviceId,
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
  let ctxMenu = $state<{ x: number; y: number; items: ContextMenuEntry[] } | null>(null);

  function currentPreset() {
    return (
      retroCamPresets.find((preset) => preset.id === retroCamStore.activePresetId) ??
      retroCamPresets[0]
    );
  }

  function reportRetroCamError(
    fallbackKey: 'retrocam_snapshot_failed' | 'retrocam_open_in_pixel_lab_failed',
    error?: unknown,
  ) {
    if (error) {
      console.error(`[RetroCam] ${fallbackKey}`, error);
    }
    onError?.(i18n.t(fallbackKey));
  }

  function permissionMessageKey() {
    switch (retroCamStore.permissionState) {
      case 'idle':
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

  function getSnapshotSaveFormat(file: File): SaveFormat {
    switch (file.type) {
      case 'image/jpeg':
        return 'jpeg';
      case 'image/webp':
        return 'webp';
      default:
        return 'png';
    }
  }

  async function retryCamera() {
    const stream = await retroCamStore.requestCamera();
    if (stream) {
      onMessage?.(i18n.t('retrocam_camera_ready'));
    } else {
      onError?.(i18n.t(permissionMessageKey()));
    }
  }

  async function handleDeviceChange(nextDeviceId: RetroCamDeviceId) {
    const stream = await retroCamStore.selectDevice(nextDeviceId);
    if (stream) {
      onMessage?.(i18n.t('retrocam_camera_ready'));
    } else {
      onError?.(i18n.t(permissionMessageKey()));
    }
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
      reportRetroCamError('retrocam_snapshot_failed');
      return;
    }

    ctx.filter = preset.filter;
    ctx.drawImage(videoEl, 0, 0, width, height);

    captureCanvas.toBlob((blob) => {
      if (!blob) {
        reportRetroCamError('retrocam_snapshot_failed');
        return;
      }
      const file = new File([blob], `retrocam_snapshot_${Date.now()}.png`, { type: 'image/png' });
      const objectUrl = URL.createObjectURL(blob);
      retroCamStore.setSnapshot(file, objectUrl, preset.id);
      onMessage?.(i18n.t('retrocam_snapshot_captured'));
    }, 'image/png');
  }

  async function saveSnapshot() {
    const snapshotFile = retroCamStore.lastSnapshotFile;
    if (!snapshotFile) return;

    const snapshotUrl = retroCamStore.lastSnapshotUrl ?? URL.createObjectURL(snapshotFile);
    const shouldRevokeSnapshotUrl = !retroCamStore.lastSnapshotUrl;
    try {
      const message = await saveImage(snapshotUrl, {
        format: getSnapshotSaveFormat(snapshotFile),
        quality: 0.92,
        filename: snapshotFile.name.replace(/\.[^.]+$/, ''),
      });
      if (message) onMessage?.(message);
    } catch (error) {
      reportRetroCamError('retrocam_snapshot_failed', error);
    } finally {
      if (shouldRevokeSnapshotUrl) {
        URL.revokeObjectURL(snapshotUrl);
      }
    }
  }

  async function openSnapshotInPixelLab() {
    if (!retroCamStore.lastSnapshotFile || !onOpenInPixelLab) return;
    try {
      await onOpenInPixelLab(
        retroCamStore.lastSnapshotFile,
        retroCamStore.lastSnapshotPresetId ?? retroCamStore.activePresetId,
      );
    } catch (error) {
      reportRetroCamError('retrocam_open_in_pixel_lab_failed', error);
    }
  }

  function handleSnapshotContextMenu(event: MouseEvent) {
    if (!retroCamStore.lastSnapshotFile) return;
    event.preventDefault();

    const items: ContextMenuEntry[] = [
      {
        label: i18n.t('retrocam_save_snapshot'),
        icon: '💾',
        action: () => {
          void saveSnapshot();
        },
      },
      ...buildOpenWithSection(i18n.t('open_with'), [
        {
          label: i18n.t('retrocam_open_in_pixel_lab'),
          icon: '🖼️',
          action: () => {
            void openSnapshotInPixelLab();
          },
        },
      ]),
      { separator: true },
      {
        label: i18n.t('retrocam_clear_snapshot'),
        icon: '✕',
        action: () => retroCamStore.clearSnapshot(),
      },
    ];

    ctxMenu = {
      x: event.clientX,
      y: event.clientY,
      items,
    };
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
  <div class="retrocam-toolbar w98-toolbar">
    <div class="retrocam-status w98-status-panel">
      <div class="retrocam-status-title">
        <span class="w98-emoji" aria-hidden="true">📷</span>
        <strong>{i18n.t('win_retrocam')}</strong>
      </div>
      <span class="w98-quiet-copy">{i18n.t(permissionMessageKey())}</span>
    </div>

    <div class="retrocam-actions w98-toolbar-group">
      <label class="retrocam-device-picker w98-form-stack">
        <span class="w98-form-label">{i18n.t('retrocam_camera_source')}</span>
        <select
          class="w98-select"
          data-testid="retrocam-device-select"
          value={retroCamStore.selectedDeviceId}
          onchange={(event) =>
            handleDeviceChange((event.target as HTMLSelectElement).value as RetroCamDeviceId)}
          disabled={retroCamStore.permissionState === 'requesting' ||
            retroCamStore.availableDevices.length === 0}
        >
          <option value="auto">{i18n.t('retrocam_camera_auto')}</option>
          {#each retroCamStore.availableDevices as device}
            <option value={device.deviceId}>{device.label}</option>
          {/each}
        </select>
      </label>
      <button
        class="toolbar-btn w98-button"
        onclick={retryCamera}
        disabled={retroCamStore.permissionState === 'requesting'}
      >
        <span class="w98-emoji" aria-hidden="true">📷</span>
        <span
          >{i18n.t(
            retroCamStore.permissionState === 'ready'
              ? 'retrocam_retry_camera'
              : 'retrocam_start_camera',
          )}</span
        >
      </button>
      <button
        class="toolbar-btn w98-button w98-button--primary"
        onclick={captureSnapshot}
        disabled={!retroCamStore.stream}
      >
        <span class="w98-emoji" aria-hidden="true">📸</span>
        <span>{i18n.t('retrocam_capture_snapshot')}</span>
      </button>
      <button
        class="toolbar-btn w98-inline-button w98-button--thin"
        onclick={saveSnapshot}
        disabled={!retroCamStore.lastSnapshotFile}
      >
        <span class="w98-emoji" aria-hidden="true">💾</span>
        <span>{i18n.t('retrocam_save_snapshot')}</span>
      </button>
      <button
        class="toolbar-btn w98-inline-button w98-button--thin"
        data-testid="retrocam-open-in-pixel-lab-button"
        onclick={openSnapshotInPixelLab}
        disabled={!retroCamStore.lastSnapshotFile}
      >
        <span class="w98-emoji" aria-hidden="true">🖼️</span>
        <span>{i18n.t('retrocam_open_in_pixel_lab')}</span>
      </button>
      <button
        class="toolbar-btn w98-inline-button w98-button--thin"
        onclick={() => retroCamStore.clearSnapshot()}
        disabled={!retroCamStore.lastSnapshotFile}
      >
        <span class="w98-structural-glyph" aria-hidden="true">✕</span>
        <span>{i18n.t('retrocam_clear_snapshot')}</span>
      </button>
    </div>
  </div>

  <div class="retrocam-layout">
    <section class="retrocam-panel w98-frame">
      <div class="retrocam-panel-titlebar w98-panel-titlebar">
        <strong class="w98-panel-title">
          <span class="w98-emoji" aria-hidden="true">📷</span>
          <span>{i18n.t('retrocam_live_preview')}</span>
        </strong>
      </div>
      <div class="retrocam-panel-body">
        <div class="retrocam-media-frame w98-inset-panel">
          {#if retroCamStore.stream}
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
            <div class="retrocam-empty-state w98-note" data-testid="retrocam-empty-state">
              <div class="empty-icon w98-emoji">📷</div>
              <div>{i18n.t(permissionMessageKey())}</div>
            </div>
          {/if}
        </div>
        <canvas bind:this={captureCanvas} class="retrocam-capture-canvas" aria-hidden="true"
        ></canvas>
      </div>
    </section>

    <div class="retrocam-sidebar">
      <section class="retrocam-panel w98-frame">
        <div class="retrocam-panel-titlebar w98-panel-titlebar">
          <strong class="w98-panel-title">
            <span class="w98-emoji" aria-hidden="true">🎨</span>
            <span>{i18n.t('tab_presets')}</span>
          </strong>
        </div>
        <div class="retrocam-panel-body">
          <div class="retrocam-preset-strip">
            {#each retroCamPresets as preset}
              <button
                class="preset-btn w98-inline-button w98-button--thin"
                class:w98-inline-button--active={retroCamStore.activePresetId === preset.id}
                onclick={() => retroCamStore.setPreset(preset.id)}
              >
                {i18n.t(preset.labelKey)}
              </button>
            {/each}
          </div>
        </div>
      </section>

      <section class="retrocam-panel w98-frame">
        <div class="retrocam-panel-titlebar w98-panel-titlebar">
          <strong class="w98-panel-title">
            <span class="w98-emoji" aria-hidden="true">💾</span>
            <span>{i18n.t('retrocam_last_snapshot')}</span>
          </strong>
        </div>
        <div class="retrocam-panel-body">
          <div class="retrocam-media-frame w98-inset-panel">
            {#if retroCamStore.lastSnapshotUrl}
              <img
                src={retroCamStore.lastSnapshotUrl}
                alt={i18n.t('retrocam_last_snapshot')}
                class="retrocam-snapshot-image"
                data-testid="retrocam-snapshot-image"
                oncontextmenu={handleSnapshotContextMenu}
              />
            {:else}
              <div class="retrocam-snapshot-placeholder w98-note">
                {i18n.t('retrocam_no_snapshot')}
              </div>
            {/if}
          </div>
        </div>
      </section>
    </div>
  </div>
</div>

{#if ctxMenu}
  <ContextMenu
    items={ctxMenu.items}
    x={ctxMenu.x}
    y={ctxMenu.y}
    onClose={() => {
      ctxMenu = null;
    }}
  />
{/if}

<style>
  .retrocam-root {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--w98-space-6);
    padding: var(--w98-space-4);
    box-sizing: border-box;
    background: var(--w98-surface);
  }

  .retrocam-toolbar {
    justify-content: space-between;
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .retrocam-status {
    min-width: 180px;
    padding: var(--w98-space-6);
  }

  .retrocam-status-title {
    display: inline-flex;
    align-items: center;
    gap: var(--w98-space-4);
  }

  .retrocam-actions,
  .retrocam-preset-strip {
    display: flex;
    gap: var(--w98-space-4);
    flex-wrap: wrap;
  }

  .retrocam-device-picker {
    min-width: 150px;
  }

  .toolbar-btn {
    white-space: nowrap;
  }

  .retrocam-layout {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 260px;
    gap: var(--w98-space-6);
  }

  .retrocam-sidebar {
    display: flex;
    flex-direction: column;
    gap: var(--w98-space-6);
    min-height: 0;
  }

  .retrocam-panel {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .retrocam-panel-body {
    display: flex;
    flex-direction: column;
    gap: var(--w98-space-8);
    min-height: 0;
    padding: var(--w98-space-8);
  }

  .retrocam-media-frame {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: stretch;
    justify-content: center;
    padding: var(--w98-space-4);
    background: var(--w98-surface-white);
  }

  .retrocam-video,
  .retrocam-snapshot-image {
    width: 100%;
    min-height: 0;
    flex: 1;
    object-fit: cover;
    background: var(--w98-surface-dark);
  }

  .retrocam-empty-state,
  .retrocam-snapshot-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: var(--w98-space-16);
    width: 100%;
    min-height: 160px;
  }

  .empty-icon {
    font-size: 28px;
    margin-bottom: var(--w98-space-8);
  }

  .retrocam-capture-canvas {
    display: none;
  }

  @media (max-width: 760px) {
    .retrocam-layout {
      grid-template-columns: minmax(0, 1fr);
    }

    .retrocam-device-picker {
      min-width: 100%;
    }
  }
</style>
