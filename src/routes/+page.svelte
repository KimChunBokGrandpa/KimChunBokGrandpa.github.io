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
  import { createWindowStore, WINDOW_CONFIGS } from '$lib/stores/windowStore.svelte';
  import type { TaskbarWindowInfo } from '$lib/components/Taskbar.svelte';
  import type { ProcessingSettings } from '$lib/types';

  // Tauri 환경 검증
  const isTauri = typeof window !== 'undefined' && !!(window as any).__TAURI__;

  // ─── Window Manager ───
  const wm = createWindowStore();

  // ─── Image & Processing State ───
  let originalImageSrc: string | null = $state(null);
  let currentObjectUrl: string | null = null;
  let processedImageSrc: string | null = $state(null);
  let isProcessing = $state(false);
  let processingSettings = $state<ProcessingSettings>({
    pixelSize: 1,
    palette: 'original',
    crtEffect: false,
  });

  // ─── Dialog State ───
  let dialogMessage: string | null = $state(null);
  let dialogTitle = $state('Message');

  // ─── Desktop icon selection ───
  let selectedIcon = $state<string | null>(null);

  // ─── Taskbar window info ───
  let taskbarWindows = $derived<TaskbarWindowInfo[]>(
    WINDOW_CONFIGS.map(c => ({
      id: c.id,
      title: c.title,
      icon: c.icon,
      mode: wm.wins[c.id].mode,
      focused: wm.focusedWindow === c.id,
    }))
  );

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
    wm.openWindow('preview');
  }

  function handleSettingsChange(newSettings: ProcessingSettings) {
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

  function handleIconClick(id: string) { selectedIcon = id; }
  function handleIconDblClick(id: string) { selectedIcon = null; wm.openWindow(id); }
  function handleDesktopClick() { selectedIcon = null; }

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
  <div class="desktop-icons" role="toolbar" aria-label="Desktop shortcuts">
    {#each WINDOW_CONFIGS as cfg}
      <button
        class="desktop-icon"
        class:icon-selected={selectedIcon === cfg.id}
        onclick={(e) => { e.stopPropagation(); handleIconClick(cfg.id); }}
        ondblclick={() => handleIconDblClick(cfg.id)}
        aria-label="Open {cfg.title}"
      >
        <span class="icon-img" aria-hidden="true">{cfg.icon}</span>
        <span class="icon-label">{cfg.title}</span>
      </button>
    {/each}
  </div>

  <!-- ═══ Settings Window ═══ -->
  {#if wm.wins.settings.mode !== 'closed'}
    <Win98Window
      title="Settings"
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
      {#if !originalImageSrc}
        <ImageDropZone onImageSelected={handleImageSelected} onError={(msg) => showDialog(msg, 'Error')} />
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
            onOpenGallery={() => wm.openWindow('gallery')}
          />
        </div>
      {/if}
    </Win98Window>
  {/if}

  <!-- ═══ Preview Window ═══ -->
  {#if wm.wins.preview.mode !== 'closed'}
    <Win98Window
      title="Preview - {isProcessing ? 'Rendering...' : 'Ready'}"
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
  {#if wm.wins.gallery.mode !== 'closed'}
    <Win98Window
      title="Palette Gallery"
      icon="🎨"
      bind:mode={wm.wins.gallery.mode}
      bind:x={wm.wins.gallery.x}
      bind:y={wm.wins.gallery.y}
      bind:width={wm.wins.gallery.w}
      bind:height={wm.wins.gallery.h}
      zIndex={wm.wins.gallery.z}
      onClose={() => wm.close('gallery')}
      onFocus={() => wm.focusWindow('gallery')}
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
  onWindowClick={wm.handleTaskbarClick}
  onWindowClose={wm.closeAndReset}
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
    height: calc(100vh - 30px);
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
    background: transparent;
    font-family: inherit;
    /* 버튼 스타일 초기화 */
    min-width: 0;
    min-height: 0;
    box-shadow: none;
    box-sizing: border-box;
    /* 클릭 시 내려가는 98.css 기본 효과 방지 */
  }
  .desktop-icon:active {
    padding: 4px;
  }
  .desktop-icon:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }
  .desktop-icon:focus-visible {
    outline: 1px dotted #fff;
    outline-offset: -1px;
  }

  /* Icon selected state */
  .desktop-icon.icon-selected {
    border-color: rgba(255, 255, 255, 0.5);
  }
  .desktop-icon.icon-selected .icon-img {
    filter: contrast(0.5) sepia(1) hue-rotate(180deg) saturate(4);
  }
  .desktop-icon.icon-selected .icon-label {
    background: #000080;
    color: #fff;
  }

  .icon-img {
    font-size: 32px;
    font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
    color: initial;
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
