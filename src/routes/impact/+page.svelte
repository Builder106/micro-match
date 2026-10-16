<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
  import Link from '$lib/components/Link.svelte';
  import Quilt from '$lib/components/Quilt.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  const s = $derived(data.stats);
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  const lengths = $derived([
    { label: 'Up to 15 minutes', n: s.durationCounts['15m'] },
    { label: '16 to 20 minutes', n: s.durationCounts['20m'] },
    { label: '21 to 30 minutes', n: s.durationCounts['30m'] }
  ]);
  const longest = $derived(Math.max(1, ...lengths.map((l) => l.n)));
</script>

<Seo
  title="The community block | MicroMatch"
  description="The whole MicroMatch quilt, built from real approved tasks, with live counts of tasks finished, volunteers, nonprofits and hours given."
/>

<header class="page-head">
  <h1 class="display h-xl" tabindex="-1">The community block</h1>
  {#if s.tasksCompleted === 0}
    <p class="lede">Nothing has been sewn in yet. When a person at a nonprofit approves the first finished task, it becomes the square in the middle.</p>
  {:else}
    <p class="lede">
      {plural(s.tasksCompleted, 'task', 'tasks')} finished and approved, by {plural(s.activeVolunteers, 'volunteer', 'volunteers')},
      for nonprofits on MicroMatch. Each one is a patch below.
    </p>
  {/if}
</header>

<div class="whole">
  <Quilt patches={data.patches} label="The whole community quilt, {s.tasksCompleted} patches" emptyLine="The first one could be yours" />
</div>

{#if s.tasksCompleted > 0}
  <section class="part" aria-labelledby="adds">
    <h2 id="adds">What it adds up to</h2>
    <ul class="ticks">
      <li>{s.hoursContributed} hours of help in total, about {s.avgTaskMinutes} minutes a task.</li>
      <li>{plural(s.badgesAwarded, 'badge', 'badges')} awarded from designs the nonprofits made.</li>
      <li>{plural(s.ngosOnboarded, 'nonprofit has', 'nonprofits have')} posted tasks.</li>
    </ul>
  </section>

  <section class="part" aria-labelledby="len">
    <h2 id="len">How long the finished tasks took</h2>
    <ul class="bars">
      {#each lengths as l (l.label)}
        <li>
          <span>{l.label}</span>
          <span class="bar" style:--f={l.n / longest} aria-hidden="true"></span>
          <span class="num">{l.n}</span>
        </li>
      {/each}
    </ul>
  </section>

  {#if s.causeBreakdown.length}
    <section class="part" aria-labelledby="causes">
      <h2 id="causes">What they were about</h2>
      <ul class="causes">
        {#each s.causeBreakdown as c (c.name)}
          <li><span class="fabric-tag">{c.name} <strong class="num">{c.count}</strong></span></li>
        {/each}
      </ul>
    </section>
  {/if}
{:else}
  <section class="part">
    <p>The counts here are live. There is nothing to count yet, so there is nothing shown.</p>
    <div class="ctas"><Link href="/tasks" class="patch-btn">Find a task</Link></div>
  </section>
{/if}

<style>
  .whole {
    max-width: 40rem;
    margin-bottom: 1rem;
  }
  .bars {
    list-style: none;
    padding: 0;
    display: grid;
    gap: 0.6rem;
    max-width: 34rem;
  }
  .bars li {
    display: grid;
    grid-template-columns: 9rem 1fr 2rem;
    gap: 0.9rem;
    align-items: center;
    font-size: 0.95rem;
  }
  .bar {
    height: 0.9rem;
    border-radius: 2px;
    background: linear-gradient(90deg, var(--c-accent) 55%, transparent 0) 0 50% / 9px 100% repeat-x;
    transform: scaleX(var(--f));
    transform-origin: left;
  }
  .causes {
    list-style: none;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
</style>
