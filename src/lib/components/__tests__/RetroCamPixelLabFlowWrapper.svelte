<script lang="ts">
  import DesktopWorkspace from '../window/DesktopWorkspace.svelte';
  import Taskbar, { type TaskbarWindowInfo } from '../window/Taskbar.svelte';
  import Win98Window from '../window/Win98Window.svelte';
  import RetroCam from '../retrocam/RetroCam.svelte';
  import { createWindowStore, windowConfigs, getWindowTitle } from '$lib/stores/windowStore.svelte';
  import { createInMemoryProjectStorageAdapter } from '$lib/projects/storageAdapter';
  import { createHandoffBus } from '$lib/handoffs/handoffBus.svelte';
  import { consumePixelLabCaptureHandoff } from '$lib/handoffs/consumePixelLabCaptureHandoff';
  import { launchPixelLabFromRetroCam } from '$lib/handoffs/retroCamToPixelLabFlow';
  import type { RetroCamPresetId } from '$lib/stores/retroCamStore.svelte';
  import type { WindowId } from '$lib/types';

  const wm = createWindowStore();
  const projectStorage = createInMemoryProjectStorageAdapter();
  const handoffBus = createHandoffBus();

  wm.close('preview');
  wm.close('settings');

  let selectedIcon = $state<WindowId | null>(null);
  let loadedCaptureName = $state<string | null>(null);

  function handleIconClick(id: WindowId) {
    selectedIcon = id;
  }

  function handleIconDblClick(id: WindowId) {
    selectedIcon = null;
    wm.openWindow(id);
  }

  function handleDesktopClick() {
    selectedIcon = null;
  }

  async function handleOpenInPixelLab(file: File, presetId: RetroCamPresetId) {
    await launchPixelLabFromRetroCam({
      snapshotFile: file,
      activePresetId: presetId,
      projectStorage,
      handoffBus,
      openPixelLab: () => {
        wm.openWindow('settings');
        wm.openWindow('preview');
      },
      notify: () => {},
      successMessage: 'retrocam_sent_to_pixel_lab',
    });
  }

  $effect(() => {
    const pending = handoffBus.current;
    if (!pending || pending.toAppId !== 'pixel-lab' || pending.intent !== 'edit_capture') return;
    void consumePixelLabCaptureHandoff({
      handoffBus,
      projectStorage,
      loadImage: (file) => {
        loadedCaptureName = file.name;
      },
    });
  });

  let taskbarWindows = $derived<TaskbarWindowInfo[]>(
    windowConfigs.map((config) => ({
      id: config.id,
      title: getWindowTitle(config.id),
      icon: config.icon,
      mode: wm.wins[config.id].mode,
      focused: wm.focusedWindow === config.id,
    }))
  );
</script>

<DesktopWorkspace
  {selectedIcon}
  onIconClick={handleIconClick}
  onIconDblClick={handleIconDblClick}
  onDesktopClick={handleDesktopClick}
  onImageDropped={() => {}}
>
  {#if wm.wins.preview.mode !== 'closed'}
    <Win98Window
      title={getWindowTitle('preview')}
      icon="🖼️"
      bind:mode={wm.wins.preview.mode}
      bind:x={wm.wins.preview.x}
      bind:y={wm.wins.preview.y}
      bind:width={wm.wins.preview.w}
      bind:height={wm.wins.preview.h}
      zIndex={wm.wins.preview.z}
      onClose={() => wm.close('preview')}
      onFocus={() => wm.focusWindow('preview')}
    >
      <div data-testid="pixel-lab-loaded-capture">{loadedCaptureName ?? 'No Capture'}</div>
    </Win98Window>
  {/if}

  {#if wm.wins.settings.mode !== 'closed'}
    <Win98Window
      title={getWindowTitle('settings')}
      icon="⚙️"
      bind:mode={wm.wins.settings.mode}
      bind:x={wm.wins.settings.x}
      bind:y={wm.wins.settings.y}
      bind:width={wm.wins.settings.w}
      bind:height={wm.wins.settings.h}
      zIndex={wm.wins.settings.z}
      onClose={() => wm.close('settings')}
      onFocus={() => wm.focusWindow('settings')}
    >
      <div>Settings Surface</div>
    </Win98Window>
  {/if}

  {#if wm.wins.retrocam.mode !== 'closed'}
    <Win98Window
      title={getWindowTitle('retrocam')}
      icon="📷"
      bind:mode={wm.wins.retrocam.mode}
      bind:x={wm.wins.retrocam.x}
      bind:y={wm.wins.retrocam.y}
      bind:width={wm.wins.retrocam.w}
      bind:height={wm.wins.retrocam.h}
      zIndex={wm.wins.retrocam.z}
      onClose={() => wm.close('retrocam')}
      onFocus={() => wm.focusWindow('retrocam')}
    >
      <RetroCam onOpenInPixelLab={handleOpenInPixelLab} />
    </Win98Window>
  {/if}
</DesktopWorkspace>

<Taskbar
  windows={taskbarWindows}
  onWindowClick={wm.handleTaskbarClick}
  onWindowClose={wm.closeAndReset}
/>
