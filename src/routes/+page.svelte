<script lang="ts">
  import { onDestroy } from 'svelte';
  import Win98Window from '$lib/components/Win98Window.svelte';
  import ImageDropZone from '$lib/components/ImageDropZone.svelte';
  import ControlPanel from '$lib/components/ControlPanel.svelte';
  import CrtDisplay from '$lib/components/CrtDisplay.svelte';
  import Taskbar from '$lib/components/Taskbar.svelte';
  import PaletteGallery from '$lib/components/PaletteGallery.svelte';
  import MessageDialog from '$lib/components/MessageDialog.svelte';
  import { processorService } from '$lib/utils/imageProcessor';
  import type { TaskbarWindowInfo } from '$lib/components/Taskbar.svelte';

  // Tauri 환경 검증 (IDE window 타입 경고 우회)
  const isTauri = typeof window !== 'undefined' && !!(window as any).__TAURI__;

  // ─── Image & Processing State ───
  let originalImageSrc: string | null = $state(null);
  let currentObjectUrl: string | null = null;
  let processedImageSrc: string | null = $state(null);
  let isProcessing = $state(false);
  let processingSettings = $state({
    pixelSize: 1,
    palette: 'original',
    crtEffect: false,
  });

  // ─── Dialog State ───
  let dialogMessage: string | null = $state(null);
  let dialogTitle = $state('Message');

  // ─── Desktop icon selection ───
  let selectedIcon = $state<string | null>(null);

  // ─── Window State Management ───
  type WindowMode = 'windowed' | 'maximized' | 'minimized' | 'closed';

  interface WindowState {
    mode: WindowMode;
    x: number;
    y: number;
    w: number;
    h: number;
    z: number;
    defaults: { x: number; y: number; w: number; h: number };
  }

  let wins = $state<Record<string, WindowState>>({
    settings: { mode: 'windowed', x: 30, y: 30, w: 340, h: 480, z: 10, defaults: { x: 30, y: 30, w: 340, h: 480 } },
    preview: { mode: 'closed', x: 400, y: 30, w: 600, h: 500, z: 9, defaults: { x: 400, y: 30, w: 600, h: 500 } },
    gallery: { mode: 'closed', x: 100, y: 60, w: 480, h: 460, z: 8, defaults: { x: 100, y: 60, w: 480, h: 460 } },
  });

  let focusedWindow = $state<string>('settings');

  function focusWindow(id: string) {
    const order = ['settings', 'preview', 'gallery'];
    const sorted = order.slice().sort((a, b) => wins[a].z - wins[b].z);
    const rest = sorted.filter(w => w !== id);
    const final = [...rest, id];
    final.forEach((w, i) => {
      wins[w].z = 10 + i;
    });
    focusedWindow = id;
  }

  function openWindow(id: string) {
    const mode = wins[id].mode;
    if (mode === 'closed' || mode === 'minimized') {
      wins[id].mode = 'windowed';
    }
    focusWindow(id);
  }

  function closeAndResetWindow(id: string) {
    wins[id].mode = 'closed';
    const def = wins[id].defaults;
    wins[id].x = def.x;
    wins[id].y = def.y;
    wins[id].w = def.w;
    wins[id].h = def.h;
  }

  function closeWindow(id: string) {
    wins[id].mode = 'closed';
  }

  function handleTaskbarClick(id: string) {
    const mode = wins[id].mode;
    if (mode === 'minimized') {
      openWindow(id);
    } else if (focusedWindow === id) {
      wins[id].mode = 'minimized';
    } else {
      focusWindow(id);
    }
  }

  // ─── Taskbar window info ───
  let taskbarWindows = $derived<TaskbarWindowInfo[]>([
    { id: 'settings', title: 'Settings', icon: '⚙️', mode: wins.settings.mode, focused: focusedWindow === 'settings' },
    { id: 'preview', title: 'Preview', icon: '🖼️', mode: wins.preview.mode, focused: focusedWindow === 'preview' },
    { id: 'gallery', title: 'Palette Gallery', icon: '🎨', mode: wins.gallery.mode, focused: focusedWindow === 'gallery' },
  ]);

  // ─── Processing Logic ───
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function handleImageSelected(file: File) {
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      processorService.clearImageCache();
    }
    currentObjectUrl = URL.createObjectURL(file);
    originalImageSrc = currentObjectUrl;
    processImmediate();
    if (wins.preview.mode === 'closed') wins.preview.mode = 'windowed';
    focusWindow('preview');
  }

  function handleSettingsChange(newSettings: typeof processingSettings) {
    processingSettings = { ...newSettings };
    applyProcessingDebounced();
  }

  async function processImmediate() {
    if (!originalImageSrc) return;
    if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
    isProcessing = true;
    try {
      const result = await processorService.processImage(originalImageSrc, processingSettings);
      if (result !== null) processedImageSrc = result;
    } catch (err) { console.error(err); }
    finally { isProcessing = false; }
  }

  function applyProcessingDebounced() {
    if (!originalImageSrc) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    isProcessing = true;
    debounceTimer = setTimeout(async () => {
      debounceTimer = null;
      try {
        const result = await processorService.processImage(originalImageSrc!, processingSettings);
        if (result !== null) processedImageSrc = result;
      } catch (err) { console.error(err); }
      finally { isProcessing = false; }
    }, 150);
  }

  function handleOpenGallery() {
    if (wins.gallery.mode === 'closed' || wins.gallery.mode === 'minimized') wins.gallery.mode = 'windowed';
    focusWindow('gallery');
  }

  function handleGallerySelect(paletteId: string) {
    processingSettings.palette = paletteId;
    processImmediate();
  }

  function showDialog(message: string, title = 'Retro Pixel Converter') {
    dialogMessage = message;
    dialogTitle = title;
  }

  async function handleSave() {
    if (!processedImageSrc) return;
    try {
      if (isTauri) {
        // Desktop (Tauri) Native File Save
        const { save } = await import('@tauri-apps/plugin-dialog');
        const { writeFile } = await import('@tauri-apps/plugin-fs');
        
        const filePath = await save({
          filters: [{ name: 'Image', extensions: ['png'] }],
          defaultPath: `retro_pixel_${Date.now()}.png`
        });
        if (filePath) {
          const response = await fetch(processedImageSrc);
          const arrayBuffer = await response.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          await writeFile(filePath, bytes);
          showDialog('File saved successfully!');
        }
      } else {
        // Web Browser Fallback Download
        const a = document.createElement('a');
        a.href = processedImageSrc;
        a.download = `retro_pixel_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showDialog('Image downloaded successfully!');
      }
    } catch (err) {
      console.error('Failed to save file:', err);
      showDialog('Error saving file. Please try again.', 'Error');
    }
  }

  function handleLoadNewImage() {
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = null;
      processorService.clearImageCache();
    }
    originalImageSrc = null;
    processedImageSrc = null;
  }

  function handleIconClick(id: string) {
    selectedIcon = id;
  }

  function handleIconDblClick(id: string) {
    selectedIcon = null;
    openWindow(id);
  }

  function handleDesktopClick() {
    selectedIcon = null;
  }

  onDestroy(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
    processorService.destroy();
  });
</script>

<!-- ═══ Desktop ═══ -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="desktop" onclick={handleDesktopClick}>

  <!-- Desktop Icons -->
  <div class="desktop-icons">
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="desktop-icon"
      class:icon-selected={selectedIcon === 'settings'}
      onclick={(e) => { e.stopPropagation(); handleIconClick('settings'); }}
      ondblclick={() => handleIconDblClick('settings')}
    >
      <div class="icon-img">⚙️</div>
      <div class="icon-label">Settings</div>
    </div>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="desktop-icon"
      class:icon-selected={selectedIcon === 'preview'}
      onclick={(e) => { e.stopPropagation(); handleIconClick('preview'); }}
      ondblclick={() => handleIconDblClick('preview')}
    >
      <div class="icon-img">🖼️</div>
      <div class="icon-label">Preview</div>
    </div>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="desktop-icon"
      class:icon-selected={selectedIcon === 'gallery'}
      onclick={(e) => { e.stopPropagation(); handleIconClick('gallery'); }}
      ondblclick={() => handleIconDblClick('gallery')}
    >
      <div class="icon-img">🎨</div>
      <div class="icon-label">Palette Gallery</div>
    </div>
  </div>

  <!-- ═══ Settings Window ═══ -->
  {#if wins.settings.mode !== 'closed'}
    <Win98Window
      title="Settings"
      icon="⚙️"
      bind:mode={wins.settings.mode}
      bind:x={wins.settings.x}
      bind:y={wins.settings.y}
      bind:width={wins.settings.w}
      bind:height={wins.settings.h}
      zIndex={wins.settings.z}
      onClose={() => closeWindow('settings')}
      onFocus={() => focusWindow('settings')}
    >
      {#if !originalImageSrc}
        <ImageDropZone onImageSelected={handleImageSelected} />
      {:else}
        <div style="padding: 4px; overflow-y: auto; flex: 1;">
          <button
            style="margin-bottom:6px; padding:4px; font-weight:bold; width:100%; text-align:left;"
            onclick={handleLoadNewImage}
          >
            📂 Load New Image...
          </button>
          <ControlPanel
            bind:settings={processingSettings}
            onChange={handleSettingsChange}
            onSave={handleSave}
            onOpenGallery={handleOpenGallery}
          />
        </div>
      {/if}
    </Win98Window>
  {/if}

  <!-- ═══ Preview Window ═══ -->
  {#if wins.preview.mode !== 'closed'}
    <Win98Window
      title="Preview - {isProcessing ? 'Rendering...' : 'Ready'}"
      icon="🖼️"
      bind:mode={wins.preview.mode}
      bind:x={wins.preview.x}
      bind:y={wins.preview.y}
      bind:width={wins.preview.w}
      bind:height={wins.preview.h}
      zIndex={wins.preview.z}
      onClose={() => closeWindow('preview')}
      onFocus={() => focusWindow('preview')}
    >
      <div class="preview-body">
        {#if processedImageSrc}
          <CrtDisplay active={processingSettings.crtEffect}>
            {#snippet children()}
              <img
                src={processedImageSrc}
                alt="Processed Pixel Art"
                style="max-width:100%; max-height:100%; width:100%; height:100%; image-rendering:pixelated; object-fit:contain;"
              />
            {/snippet}
          </CrtDisplay>
        {:else if originalImageSrc}
          <div class="status-bar" style="position:absolute; bottom:0; width:100%;">
            <p class="status-bar-field">Processing image...</p>
          </div>
        {:else}
          <p style="color:#fff; font-weight:bold; text-shadow:1px 1px 0 #000;">No Image Loaded</p>
        {/if}
      </div>
    </Win98Window>
  {/if}

  <!-- ═══ Gallery Window ═══ -->
  {#if wins.gallery.mode !== 'closed'}
    <Win98Window
      title="Palette Gallery"
      icon="🎨"
      bind:mode={wins.gallery.mode}
      bind:x={wins.gallery.x}
      bind:y={wins.gallery.y}
      bind:width={wins.gallery.w}
      bind:height={wins.gallery.h}
      zIndex={wins.gallery.z}
      onClose={() => closeWindow('gallery')}
      onFocus={() => focusWindow('gallery')}
    >
      <PaletteGallery
        selectedPaletteId={processingSettings.palette}
        onSelect={handleGallerySelect}
      />
    </Win98Window>
  {/if}
</div>

<!-- ═══ Taskbar ═══ -->
<Taskbar
  windows={taskbarWindows}
  onWindowClick={handleTaskbarClick}
  onWindowClose={closeAndResetWindow}
/>

<!-- ═══ Dialog ═══ -->
{#if dialogMessage}
  <MessageDialog
    message={dialogMessage}
    title={dialogTitle}
    onClose={() => { dialogMessage = null; }}
  />
{/if}

<style>
  .desktop {
    background-color: #008080;
    width: 100vw;
    height: calc(100vh - 32px);
    position: relative;
    overflow: hidden;
    box-sizing: border-box;
  }

  /* ===== Desktop Icons ===== */
  .desktop-icons {
    position: absolute;
    top: 16px;
    left: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 1;
  }

  .desktop-icon {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 72px;
    padding: 4px;
    cursor: default;
    border: 1px solid transparent;
    border-radius: 2px;
    user-select: none;
  }
  .desktop-icon:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }

  /* Icon selected state (#3) */
  .desktop-icon.icon-selected {
    background: rgba(0, 0, 128, 0.5);
    border-color: rgba(255, 255, 255, 0.5);
  }
  .desktop-icon.icon-selected .icon-label {
    background: #000080;
    color: #fff;
  }

  .icon-img {
    font-size: 32px;
    filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.5));
  }

  .icon-label {
    font-size: 11px;
    color: #fff;
    text-align: center;
    text-shadow: 1px 1px 2px #000;
    word-break: break-word;
    margin-top: 2px;
    line-height: 1.2;
    padding: 0 2px;
  }

  /* ===== Preview Body ===== */
  .preview-body {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #000;
    overflow: hidden;
    min-height: 0;
  }

  /* ===== Mobile ===== */
  @media (max-width: 550px) {
    .desktop-icons {
      top: 8px;
      left: 8px;
      flex-direction: row;
      gap: 6px;
    }
    .desktop-icon { width: 56px; }
    .icon-img { font-size: 24px; }
  }
</style>
