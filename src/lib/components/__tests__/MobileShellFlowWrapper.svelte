<script lang="ts">
  import DesktopWorkspace from '../window/DesktopWorkspace.svelte';
  import Taskbar, { type TaskbarWindowInfo } from '../window/Taskbar.svelte';
  import Win98Window from '../window/Win98Window.svelte';
  import { createWindowStore, windowConfigs, getWindowTitle } from '$lib/stores/windowStore.svelte';
  import { getMobileWindowSlot } from '$lib/utils/mobileWindowLayout';
  import type { WindowId } from '$lib/types';

  const wm = createWindowStore();
  wm.close('settings');
  wm.openWindow('poster_maker');
  wm.openWindow('history');
  wm.focusWindow('preview');

  const windowOrder: WindowId[] = ['preview', 'poster_maker', 'settings', 'gallery', 'batch', 'history'];
  let visibleIds = $derived(
    windowOrder.filter((id) => wm.wins[id].mode !== 'closed' && wm.wins[id].mode !== 'minimized')
  );

  function getSlot(id: WindowId) {
    return getMobileWindowSlot({
      id,
      isMobile: true,
      isLandscapeMobile: false,
      visibleIds: visibleIds as WindowId[],
      focusedId: wm.focusedWindow,
    });
  }

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
  selectedIcon={null}
  onIconClick={() => {}}
  onIconDblClick={() => {}}
  onDesktopClick={() => {}}
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
      mobileSlot={getSlot('preview')}
      menuItems={['File', 'View', 'Help']}
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
      mobileSlot={getSlot('poster_maker')}
      menuItems={['File', 'Poster', 'View']}
      onClose={() => wm.close('poster_maker')}
      onFocus={() => wm.focusWindow('poster_maker')}
    >
      <div>Poster Content</div>
    </Win98Window>
  {/if}

  {#if wm.wins.history.mode !== 'closed'}
    <Win98Window
      title={getWindowTitle('history')}
      icon="⏱️"
      bind:mode={wm.wins.history.mode}
      bind:x={wm.wins.history.x}
      bind:y={wm.wins.history.y}
      bind:width={wm.wins.history.w}
      bind:height={wm.wins.history.h}
      zIndex={wm.wins.history.z}
      mobileSlot={getSlot('history')}
      menuItems={['File', 'Edit']}
      onClose={() => wm.close('history')}
      onFocus={() => wm.focusWindow('history')}
    >
      <div>History Content</div>
    </Win98Window>
  {/if}
</DesktopWorkspace>

<Taskbar
  windows={taskbarWindows}
  onWindowClick={wm.handleTaskbarClick}
  onWindowClose={wm.closeAndReset}
/>
