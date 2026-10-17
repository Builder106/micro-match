<script lang="ts">
  import { page } from '$app/state';
  import Seo from '$lib/components/Seo.svelte';
  import Link from '$lib/components/Link.svelte';
  import Needle from '$lib/components/art/Needle.svelte';

  const missing = $derived(page.status === 404);
</script>

<Seo title="{missing ? 'A missing block' : 'Something came unstitched'} | MicroMatch" description="This page is not part of the MicroMatch quilt." noindex />

<div class="missing">
  <div class="hole" aria-hidden="true">
    <Needle class="hole__needle" />
    <svg class="hole__thread" viewBox="0 0 380 60"><path d="M10 40C60 26 86 54 130 40S204 18 242 36 320 52 370 34" /></svg>
  </div>
  <h1 class="display h-xl" tabindex="-1">{missing ? 'This block was never sewn' : 'Something came unstitched'}</h1>
  <p class="lede">
    {#if missing}
      There is no page here. It may have moved, or the link has a typo.
    {:else}
      The server dropped a stitch ({page.status}). Try again in a moment.
    {/if}
  </p>
  <div class="ctas">
    <Link href="/" class="patch-btn">Back to the quilt</Link>
    <Link href="/contents" class="patch-btn patch-btn--plain">See every block</Link>
  </div>
</div>

<style>
  .missing {
    display: grid;
    gap: 1.25rem;
    max-width: 38rem;
  }
  .hole {
    position: relative;
    width: 11rem;
    aspect-ratio: 1;
    border-radius: 3px;
    background: repeating-linear-gradient(45deg, rgb(28 31 59 / 0.06) 0 2px, transparent 2px 9px), #ded3bd;
    outline: 3px dashed var(--c-weld);
    outline-offset: -8px;
    box-shadow: inset 0 6px 14px rgb(28 31 59 / 0.18);
    margin-bottom: 1rem;
  }
  .hole :global(.hole__needle) {
    position: absolute;
    width: 55%;
    right: -18%;
    top: -14%;
  }
  .hole__thread {
    position: absolute;
    left: 40%;
    bottom: -18%;
    width: 13rem;
    fill: none;
    stroke: var(--c-accent);
    stroke-width: 2.4;
    stroke-linecap: round;
  }
</style>
