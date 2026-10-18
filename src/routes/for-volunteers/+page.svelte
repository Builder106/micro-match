<script lang="ts">
  import { page } from '$app/state';
  import Seo from '$lib/components/Seo.svelte';
  import Link from '$lib/components/Link.svelte';
  import Swatch from '$lib/components/art/Swatch.svelte';

  const upTo = $derived((page.data.openTasks?.upTo ?? { 15: 0, 20: 0, 30: 0 }) as Record<15 | 20 | 30, number>);
  const caps = [
    { minutes: 15, color: '#F2B84B', line: 'A coffee, a bus ride, the gap between classes.' },
    { minutes: 20, color: '#8DAA8B', line: 'Long enough to proofread a page or tag a batch of photos.' },
    { minutes: 30, color: '#FF6B6B', line: 'Room for a careful translation or a small design.' }
  ] as const;
  const countLine = (n: number) => (n === 0 ? 'None open right now' : n === 1 ? '1 open now' : `${n} open now`);
</script>

<Seo
  title="For volunteers | MicroMatch"
  description="Pick a nonprofit task that takes 5 to 30 minutes, send a link to your work, and a person at the nonprofit approves it into the quilt."
/>

<header class="page-head">
  <h1 class="display h-xl" tabindex="-1">For volunteers</h1>
  <p class="lede">You need twenty minutes, a phone or a laptop, and something you already know how to do. No interviews, no onboarding course.</p>
</header>

<section class="part" aria-labelledby="fit">
  <h2 id="fit">Pick by the time you have</h2>
  <ul class="caps">
    {#each caps as cap (cap.minutes)}
      <li>
        <Link href="/tasks?max={cap.minutes}" class="cap">
          <Swatch color={cap.color} class="cap__swatch" />
          <span class="cap__text">
            <strong>Up to {cap.minutes} minutes</strong>
            <span>{cap.line}</span>
            <span class="cap__count num">{countLine(upTo[cap.minutes])}</span>
          </span>
        </Link>
      </li>
    {/each}
  </ul>
</section>

<section class="part" aria-labelledby="after">
  <h2 id="after">What happens after you send your work</h2>
  <ol class="ticks">
    <li>You send a link to what you made, plus a note on how you did it.</li>
    <li>Your claim is pinned to your block while it waits. Nobody sees a score.</li>
    <li>A person at the nonprofit reads it and approves it, or rejects it if it is not what they needed.</li>
    <li>Approved work becomes a patch in your block and in the community quilt, in the colors that nonprofit designed, with any badge it set up.</li>
  </ol>
</section>

<section class="part" aria-labelledby="not">
  <h2 id="not">What you will not find here</h2>
  <ul class="ticks">
    <li>Points, levels or streaks. A patch means one finished task.</li>
    <li>Countdown timers on claimed tasks.</li>
    <li>Tasks from nonprofits nobody has checked. The feed only shows verified ones.</li>
  </ul>
  <div class="ctas">
    <Link href="/tasks" class="patch-btn">Find a task</Link>
    <Link href="/signup?role=volunteer" class="patch-btn patch-btn--plain">Join as a volunteer</Link>
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
