<script lang="ts">
  import { onMount } from 'svelte';

  export let src: string;
  export let scene: string;
  export let aspectRatio = '4 / 3';

  interface DotLottiePlayer extends HTMLElement {
    pause?: () => void;
    play?: () => void;
    setLooping?: (looping: boolean) => void;
  }

  let container: HTMLDivElement;
  let playerReady = false;
  let playerUnavailable = false;
  let hasPlayed = false;
  let observer: IntersectionObserver | null = null;

  function markUnavailable() {
    playerUnavailable = true;
    observer?.disconnect();
  }

  function loadPlayer() {
    import('@dotlottie/player-component')
      .then(() => {
        playerReady = true;
      })
      .catch(markUnavailable);
  }

  function startOnce(event: Event) {
    if (hasPlayed) return;

    hasPlayed = true;
    const player = event.currentTarget as DotLottiePlayer;
    player.setLooping?.(false);
    player.play?.();
  }

  onMount(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reducedMotion || !('IntersectionObserver' in window)) {
      playerUnavailable = true;
      return;
    }

    observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;

        observer?.disconnect();
        loadPlayer();
      },
      { threshold: 0.4 }
    );
    observer.observe(container);

    return () => observer?.disconnect();
  });
</script>

<div
  bind:this={container}
  class="decorative-lottie"
  style:--motion-aspect-ratio={aspectRatio}
  data-motion-scene={scene}
  aria-hidden="true"
>
  {#if playerReady && !playerUnavailable}
    <dotlottie-player
      class="player"
      src={src}
      onready={startOnce}
      onerror={markUnavailable}
      onloadError={markUnavailable}
    ></dotlottie-player>
  {:else}
    <svg class="static-fallback" viewBox="0 0 120 90" fill="none" focusable="false">
      <rect x="18" y="18" width="84" height="54" rx="12" fill="currentColor" opacity="0.12" />
      <circle cx="44" cy="45" r="11" fill="currentColor" opacity="0.32" />
      <path d="M61 56C65.5 43 75 36 91 36" stroke="currentColor" stroke-width="7" stroke-linecap="round" opacity="0.32" />
    </svg>
  {/if}
</div>

<style>
  .decorative-lottie {
    position: relative;
    width: 100%;
    aspect-ratio: var(--motion-aspect-ratio);
    color: var(--color-primary, #ff6b6b);
  }

  .player,
  .static-fallback {
    display: block;
    width: 100%;
    height: 100%;
  }

  .static-fallback {
    position: absolute;
    inset: 0;
  }
</style>
