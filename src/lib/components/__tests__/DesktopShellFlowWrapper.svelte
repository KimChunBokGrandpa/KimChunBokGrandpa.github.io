<script lang="ts">
  import DesktopWorkspace from '../window/DesktopWorkspace.svelte';
  import Taskbar, { type TaskbarWindowInfo } from '../window/Taskbar.svelte';
  import Win98Window from '../window/Win98Window.svelte';
  import { createWindowStore, WINDOW_CONFIGS, getWindowTitle } from '$lib/stores/windowStore.svelte';
  import type { WindowId } from '$lib/types';

  const wm = createWindowStore();

  let selectedIcon = $state<WindowId | null>(null);

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

  let taskbarWindows = $derived<TaskbarWindowInfo[]>(
    WINDOW_CONFIGS.map((config) => ({
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
      <div>Preview Content</div>
    </Win98Window>
  {/if}

  {#if wm.wins.poster_maker.mode !== 'closed'}
    <Win98Window
      title={getWindowTitle('poster_maker')}
      icon="📰"
      bind:mode={wm.wins.poster_maker.mode}
      bind:x={wm.wins.poster_maker.x}
      bind:y={wm.wins.poster_maker.y}
      bind:width={wm.wins.poster_maker.w}
      bind:height={wm.wins.poster_maker.h}
      zIndex={wm.wins.poster_maker.z}
      onClose={() => wm.close('poster_maker')}
      onFocus={() => wm.focusWindow('poster_maker')}
    >
      <div>Poster Content</div>
    </Win98Window>
  {/if}
</DesktopWorkspace>

<Taskbar
  windows={taskbarWindows}
  onWindowClick={wm.handleTaskbarClick}
  onWindowClose={wm.closeAndReset}
/>
