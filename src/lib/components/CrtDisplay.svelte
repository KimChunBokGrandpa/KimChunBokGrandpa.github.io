<script lang="ts">
  import type { Snippet } from 'svelte';

  let { active = false, intensity = 1.0, children }: {
    active?: boolean;
    intensity?: number; // 0.0 ~ 1.0
    children: Snippet;
  } = $props();

  let crtStyle = $derived(active ? `--crt-intensity: ${intensity};` : '');
</script>

<div class="crt-wrapper" class:active style={crtStyle}>
  {@render children()}
  {#if active}
    <div class="scanlines"></div>
    <div class="glare"></div>
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
    border-radius: 12px;
    box-shadow: inset 0 0 calc(20px * var(--crt-intensity)) rgba(0,0,0,0.8);
    filter: drop-shadow(calc(1px * var(--crt-intensity)) 0 calc(2px * var(--crt-intensity)) rgba(255,0,0,0.3)) drop-shadow(calc(-1px * var(--crt-intensity)) 0 calc(2px * var(--crt-intensity)) rgba(0,0,255,0.3)) contrast(calc(1 + 0.1 * var(--crt-intensity))) brightness(calc(1 + 0.1 * var(--crt-intensity)));
  }

  @keyframes flicker {
    0% { opacity: 0.95; }
    5% { opacity: 0.85; }
    10% { opacity: 0.95; }
    100% { opacity: 1; }
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
    will-change: opacity;
    animation: flicker 4s ease-in-out infinite;
    opacity: var(--crt-intensity);
  }

  @media (prefers-reduced-motion: reduce) {
    .scanlines {
      animation: none;
      will-change: auto;
      opacity: calc(0.5 * var(--crt-intensity));
    }
  }

  .glare {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 60%);
    pointer-events: none;
    z-index: 11;
    opacity: var(--crt-intensity);
  }
</style>
