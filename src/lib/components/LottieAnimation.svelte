<script lang="ts">
  import { onMount } from 'svelte';

  export let src: string;
  export let loop: boolean | number = true;
  export let autoplay = true;
  export let className = '';
  export let decorative = true;

  let container: HTMLDivElement;
  let ready = false;
  let unavailable = false;

  onMount(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      unavailable = true;
      return;
    }

    let animation: import('lottie-web/build/player/lottie_light').AnimationItem | undefined;
    let disposed = false;

    import('lottie-web/build/player/lottie_light')
      .then(({ default: lottie }) => {
        if (disposed) return;

        const instance = lottie.loadAnimation({
          container,
          renderer: 'svg',
          loop,
          autoplay,
          path: src
        });
        instance.addEventListener('data_failed', () => {
          unavailable = true;
        });
        animation = instance;
        ready = true;
      })
      .catch(() => {
        unavailable = true;
      });

    return () => {
      disposed = true;
      animation?.destroy();
    };
  });
</script>

<div
  bind:this={container}
  class="lottie-animation {className}"
  aria-hidden={decorative ? 'true' : undefined}
  data-lottie-ready={ready}
>
  {#if !ready || unavailable}
    <slot />
  {/if}
</div>
