<script lang="ts">
  import { onMount } from 'svelte';
  import '98.css';
  import '$lib/styles/theme.css';
  import '../app.css';
  import { registerAppServiceWorker } from '$lib/utils/serviceWorker';

  let { children } = $props();

  onMount(() => {
    void registerAppServiceWorker();
  });
</script>

{@render children()}
