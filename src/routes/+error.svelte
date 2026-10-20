<script lang="ts">
  import { page } from '$app/state';
  import Seo from '$lib/components/Seo.svelte';
  import Link from '$lib/components/Link.svelte';
  import Needle from '$lib/components/art/Needle.svelte';
  import * as m from '$lib/paraglide/messages.js';

  const missing = $derived(page.status === 404);
</script>

<Seo title={missing ? m.error_missing_meta() : m.error_broken_meta()} description={m.error_meta_description()} noindex />

<div class="missing">
  <div class="hole" aria-hidden="true">
    <Needle class="hole__needle" />
    <svg class="hole__thread" viewBox="0 0 380 60"><path d="M10 40C60 26 86 54 130 40S204 18 242 36 320 52 370 34" /></svg>
  </div>
  <h1 class="display h-xl" tabindex="-1">{missing ? m.error_missing_title() : m.error_broken_title()}</h1>
  <p class="lede">{missing ? m.error_missing_body() : m.error_broken_body({ status: page.status })}</p>
  <div class="ctas">
    <Link href="/" class="patch-btn">{m.error_back()}</Link>
    <Link href="/contents" class="patch-btn patch-btn--plain">{m.error_contents()}</Link>
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
    background: repeating-linear-gradient(45deg, color-mix(in srgb, var(--c-fg) 6%, transparent) 0 2px, transparent 2px 9px), var(--c-hole);
    outline: 3px dashed var(--c-weld);
    outline-offset: -8px;
    box-shadow: inset 0 6px 14px color-mix(in srgb, var(--c-shade) 18%, transparent);
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
