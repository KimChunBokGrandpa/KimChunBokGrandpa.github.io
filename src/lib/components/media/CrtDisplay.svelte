<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { CrtMode } from '$lib/types';

  let { active = false, intensity = 1.0, mode = 'horizontal' as CrtMode, children }: {
    active?: boolean;
    intensity?: number; // 0.0 ~ 1.0
    mode?: CrtMode;
    children: Snippet;
  } = $props();

  let crtStyle = $derived(active ? `--crt-intensity: ${intensity};` : '');
</script>

<div class="crt-wrapper" class:active style={crtStyle}>
  {@render children()}
  {#if active}
    <div class="scanlines" class:vertical={mode === 'vertical'}></div>
  {/if}
</div>

<style>
  .crt-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    overflow: hidden;
    --crt-intensity: 1;
  }

  .crt-wrapper.active {
    border-radius: var(--w98-radius-crt, 12px);
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, calc(0.18 * var(--crt-intensity))),
      inset 0 0 calc(10px * var(--crt-intensity)) rgba(0, 0, 0, 0.45);
  }

  .scanlines {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: linear-gradient(
      to bottom,
      rgba(255,255,255,0), rgba(255,255,255,0) 50%,
      rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.2)
    );
    background-size: 100% 4px;
    pointer-events: none;
    z-index: 10;
    opacity: calc(0.45 * var(--crt-intensity));
  }

  .scanlines.vertical {
    background: linear-gradient(
      to right,
      rgba(255,255,255,0), rgba(255,255,255,0) 50%,
      rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.2)
    );
    background-size: 4px 100%;
  }

  @media (prefers-reduced-motion: reduce) {
    .scanlines {
      opacity: calc(0.35 * var(--crt-intensity));
    }
  }
</style>
