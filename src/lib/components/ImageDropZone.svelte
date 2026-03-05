<script lang="ts">
  let { onImageSelected, onError }: {
    onImageSelected: (file: File) => void;
    onError?: (message: string) => void;
  } = $props();

  let isDragging = $state(false);

  const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/bmp', 'image/webp'];

  function handleDragEnter(e: DragEvent) {
    e.preventDefault();
    isDragging = true;
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;

    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (ACCEPTED_TYPES.includes(file.type)) {
        onImageSelected(file);
      } else {
        onError?.("Please drop an image file (PNG, JPEG, GIF, BMP, WebP).");
      }
    }
  }

  function handleFileInput(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      onImageSelected(input.files[0]);
    }
  }

  function handlePaste(e: ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          onImageSelected(file);
          return;
        }
      }
    }
  }
</script>

<svelte:window onpaste={handlePaste} />

<div
  class="window"
  style="margin: 0; flex: 1; display: flex; flex-direction: column; box-sizing: border-box; overflow: hidden;"
>
  <div class="title-bar">
    <div class="title-bar-text">Open Image</div>
  </div>
  <div
    class="window-body dropzone"
    class:dragging={isDragging}
    ondragenter={handleDragEnter}
    ondragover={(e) => e.preventDefault()}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
    role="button"
    tabindex="0"
  >
    <div class="drop-content">
      <span class="drop-icon">{isDragging ? '📥' : '🖼️'}</span>
      <p class="drop-title">{isDragging ? 'Drop here!' : 'Drag & Drop Image Here'}</p>
      <p class="drop-or">or</p>
      <div class="field-row">
        <input type="file" accept={ACCEPTED_TYPES.join(',')} id="file-upload" onchange={handleFileInput} style="display: none;" />
        <button class="browse-btn" onclick={() => document.getElementById('file-upload')?.click()}>📂 Browse...</button>
      </div>
      <p class="drop-hint">Ctrl+V to paste from clipboard</p>
      <p class="drop-formats">PNG · JPEG · GIF · BMP · WebP</p>
    </div>
  </div>
</div>

<style>
  .dropzone {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border: 2px dashed #808080;
    margin: 8px;
    background-color: #fff;
    overflow: hidden;
    transition: all 0.2s ease;
    cursor: pointer;
  }

  .dropzone.dragging {
    background-color: #d0d8e0;
    border-color: #000080;
    border-width: 3px;
    box-shadow: inset 0 0 20px rgba(0, 0, 128, 0.08);
  }

  .drop-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .drop-icon {
    font-size: 40px;
    font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
    color: initial;
    transition: transform 0.2s ease;
  }

  .dragging .drop-icon {
    transform: scale(1.2);
    animation: bounce 0.5s ease infinite alternate;
  }

  .drop-title {
    font-size: 14px;
    font-weight: bold;
    margin: 4px 0;
    color: #000;
  }

  .drop-or {
    font-size: 11px;
    color: #808080;
    margin: 2px 0;
  }

  .browse-btn {
    font-weight: bold;
    padding: 4px 16px;
    font-size: 12px;
  }

  .drop-hint {
    font-size: 10px;
    color: #808080;
    margin: 6px 0 0 0;
    font-style: italic;
  }

  .drop-formats {
    font-size: 10px;
    color: #a0a0a0;
    margin: 2px 0 0 0;
  }

  @keyframes bounce {
    from { transform: scale(1.2) translateY(0); }
    to { transform: scale(1.2) translateY(-6px); }
  }
</style>
