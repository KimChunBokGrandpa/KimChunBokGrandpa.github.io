<script lang="ts">
  let { onImageSelected }: {
    onImageSelected: (file: File) => void;
  } = $props();

  let isDragging = $state(false);

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
      if (file.type.startsWith('image/')) {
        onImageSelected(file);
      } else {
        alert("Please drop an image file.");
      }
    }
  }

  function handleFileInput(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      onImageSelected(input.files[0]);
    }
  }
</script>

<div
  class="window"
  style="margin: 0; flex: 1; display: flex; flex-direction: column; box-sizing: border-box; overflow: hidden;"
>
  <div class="title-bar">
    <div class="title-bar-text">Open Image</div>
  </div>
  <div
    class="window-body {isDragging ? 'dragging' : ''}"
    style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; border: 2px dashed #808080; margin: 8px; background-color: #fff; overflow: hidden;"
    ondragenter={handleDragEnter}
    ondragover={handleDragEnter}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
    role="button"
    tabindex="0"
  >
    <p style="font-size: 16px; margin-bottom: 20px;">Drag & Drop Image Here</p>
    <p>or</p>
    <div class="field-row">
      <input type="file" accept="image/*" id="file-upload" onchange={handleFileInput} style="display: none;" />
      <button onclick={() => document.getElementById('file-upload')?.click()}>Browse...</button>
    </div>
  </div>
</div>

<style>
  .dragging {
    background-color: #e0e0e0 !important;
    border-color: #000080 !important;
  }
</style>
