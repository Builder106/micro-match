<script lang="ts">
  import Seo from '#lib/components/Seo.svelte';
  import Link from '#lib/components/Link.svelte';
  import Rich from '#lib/components/Rich.svelte';
  import Scissors from '#lib/components/art/Scissors.svelte';
  import Swatch from '#lib/components/art/Swatch.svelte';
  import Pin from '#lib/components/art/Pin.svelte';
  import Needle from '#lib/components/art/Needle.svelte';
  import * as m from '#lib/paraglide/messages.js';
</script>

<Seo title={m.how_meta_title()} description={m.how_meta_description()} />

<header class="page-head">
  <h1 class="display h-xl" tabindex="-1">{m.block_how_title()}</h1>
  <p class="lede">{m.how_lede()}</p>
</header>

<ol class="steps">
  <li class="step">
    <Scissors class="step__art" />
    <div>
      <h2 class="h-m">{m.how_step_1_title()}</h2>
      <p>{m.how_step_1_body()}</p>
      <p class="muted small">{m.how_step_1_note()}</p>
    </div>
  </li>
  <li class="step">
    <Swatch class="step__art" />
    <div>
      <h2 class="h-m">{m.how_step_2_title()}</h2>
      <p><Rich text={m.how_step_2_body()} links={{ feed: '/tasks' }} /></p>
    </div>
  </li>
  <li class="step">
    <Pin class="step__art step__art--pin" />
    <div>
      <h2 class="h-m">{m.how_step_3_title()}</h2>
      <p>{m.how_step_3_body()}</p>
    </div>
  </li>
  <li class="step">
    <Needle class="step__art" />
    <div>
      <h2 class="h-m">{m.how_step_4_title()}</h2>
      <p>{m.how_step_4_body()}</p>
      <p class="muted small">{m.how_step_4_note()}</p>
    </div>
  </li>
</ol>

<div class="next">
  <Link href="/tasks" class="patch-btn">{m.hero_find()}</Link>
  <Link href="/for-nonprofits" class="patch-btn patch-btn--plain">{m.nav_post_task()}</Link>
</div>

<style>
  .page-head {
    display: grid;
    gap: 1rem;
    max-width: 38rem;
    margin-bottom: clamp(2rem, 4vw, 3.5rem);
  }
  .steps {
    list-style: none;
    padding: 0;
    display: grid;
    gap: clamp(2rem, 4vw, 3rem);
    position: relative;
  }
  .steps::before {
    content: '';
    position: absolute;
    left: 2.6rem;
    top: 3rem;
    bottom: 3rem;
    width: 2px;
    background: linear-gradient(180deg, var(--c-accent) 55%, transparent 0) 0 0 / 2px 12px repeat-y;
  }
  .step {
    position: relative;
    display: grid;
    grid-template-columns: 5.2rem 1fr;
    gap: clamp(1rem, 2.4vw, 2rem);
    align-items: start;
  }
  .step > div {
    display: grid;
    gap: 0.6rem;
    max-width: 36rem;
  }
  .step :global(.step__art) {
    width: 5.2rem;
    height: 5.2rem;
    padding: 0.75rem;
    background: var(--c-paper);
    border-radius: var(--radius);
    box-shadow: inset 0 0 0 1.5px var(--c-fg);
    position: relative;
  }
  .step :global(.step__art--pin) {
    padding: 1.2rem;
  }
  .next {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: clamp(2.5rem, 5vw, 4rem);
  }
  @media (max-width: 599px) {
    .step {
      grid-template-columns: 3.6rem 1fr;
    }
    .step :global(.step__art) {
      width: 3.6rem;
      height: 3.6rem;
      padding: 0.5rem;
    }
    .steps::before {
      left: 1.8rem;
    }
  }
</style>
