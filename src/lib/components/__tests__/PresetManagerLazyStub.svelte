<script lang="ts">
  import type { ProcessingSettings } from '$lib/types';

  let {
    settings = $bindable(),
  }: {
    settings: ProcessingSettings;
  } = $props();
</script>

<div data-testid="mock-preset-manager" data-pixel-size={settings.pixelSize}>Mock preset manager</div>
