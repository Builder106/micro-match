<script lang="ts">
  import { page } from '$app/state';
  import Seo from '$lib/components/Seo.svelte';
  import Link from '$lib/components/Link.svelte';
  import Swatch from '$lib/components/art/Swatch.svelte';
  import * as m from '$lib/paraglide/messages.js';

  const upTo = $derived((page.data.openTasks?.upTo ?? { 15: 0, 20: 0, 30: 0 }) as Record<15 | 20 | 30, number>);
  const caps = [
    { minutes: 15, color: '#F2B84B', line: m.volunteers_cap_15 },
    { minutes: 20, color: '#8DAA8B', line: m.volunteers_cap_20 },
    { minutes: 30, color: '#FF6B6B', line: m.volunteers_cap_30 }
  ] as const;
  const countLine = (n: number) => (n === 0 ? m.volunteers_open_none() : n === 1 ? m.volunteers_open_one() : m.volunteers_open_count({ count: n }));
</script>

<Seo title={m.volunteers_meta_title()} description={m.volunteers_meta_description()} />

<header class="page-head">
  <h1 class="display h-xl" tabindex="-1">{m.volunteers_title()}</h1>
  <p class="lede">{m.volunteers_lede()}</p>
</header>

<section class="part" aria-labelledby="fit">
  <h2 id="fit">{m.volunteers_fit_title()}</h2>
  <ul class="caps">
    {#each caps as cap (cap.minutes)}
      <li>
        <Link href="/tasks?max={cap.minutes}" class="cap">
          <Swatch color={cap.color} class="cap__swatch" />
          <span class="cap__text">
            <strong>{m.volunteers_up_to({ count: cap.minutes })}</strong>
            <span>{cap.line()}</span>
            <span class="cap__count num">{countLine(upTo[cap.minutes])}</span>
          </span>
        </Link>
      </li>
    {/each}
  </ul>
</section>

<section class="part" aria-labelledby="after">
  <h2 id="after">{m.volunteers_after_title()}</h2>
  <ol class="ticks">
    <li>{m.volunteers_after_1()}</li>
    <li>{m.volunteers_after_2()}</li>
    <li>{m.volunteers_after_3()}</li>
    <li>{m.volunteers_after_4()}</li>
  </ol>
</section>

<section class="part" aria-labelledby="not">
  <h2 id="not">{m.volunteers_not_title()}</h2>
  <ul class="ticks">
    <li>{m.volunteers_not_1()}</li>
    <li>{m.volunteers_not_2()}</li>
    <li>{m.volunteers_not_3()}</li>
  </ul>
  <div class="ctas">
    <Link href="/tasks" class="patch-btn">{m.hero_find()}</Link>
    <Link href="/signup?role=volunteer" class="patch-btn patch-btn--plain">{m.cta_join_volunteer()}</Link>
  </div>
</section>

<style>
  .caps {
    list-style: none;
    padding: 0;
    display: grid;
    gap: 0.75rem;
  }
  .caps :global(.cap) {
    display: grid;
    grid-template-columns: 4.5rem 1fr;
    gap: 1rem;
    align-items: center;
    padding: 0.85rem 1rem;
    border-radius: var(--radius);
    box-shadow: inset 0 0 0 1.5px var(--c-line);
    transition: box-shadow 0.3s, translate 0.35s cubic-bezier(0.16, 1, 0.3, 1), rotate 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @media (hover: hover) {
    .caps :global(.cap:hover) {
      box-shadow: inset 0 0 0 1.5px var(--c-fg), 0 7px 0 -2px color-mix(in srgb, var(--c-shade) 18%, transparent);
      translate: 0 -4px;
      rotate: -0.5deg;
    }
  }
  .caps :global(.cap__swatch) {
    width: 4.5rem;
    height: 4.5rem;
    rotate: -3deg;
  }
  .cap__text {
    display: grid;
    gap: 0.15rem;
  }
  .cap__text strong {
    font-family: var(--f-display);
    font-size: 1.15rem;
  }
  .cap__count {
    font-size: var(--t-s);
    color: var(--c-muted);
  }
</style>
