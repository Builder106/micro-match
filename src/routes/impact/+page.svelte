<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
  import Link from '$lib/components/Link.svelte';
  import Quilt from '$lib/components/Quilt.svelte';
  import * as m from '$lib/paraglide/messages.js';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  const s = $derived(data.stats);
  const lengths = $derived([
    { label: m.impact_len_15(), n: s.durationCounts['15m'] },
    { label: m.impact_len_20(), n: s.durationCounts['20m'] },
    { label: m.impact_len_30(), n: s.durationCounts['30m'] }
  ]);
  const longest = $derived(Math.max(1, ...lengths.map((l) => l.n)));
</script>

<Seo title={m.impact_meta_title()} description={m.impact_meta_description()} />

<header class="page-head">
  <h1 class="display h-xl" tabindex="-1">{m.block_community_title()}</h1>
  {#if s.tasksCompleted === 0}
    <p class="lede">{m.impact_lede_empty()}</p>
  {:else}
    <p class="lede">
      {m.impact_lede({
        tasks: s.tasksCompleted === 1 ? m.count_tasks_one() : m.count_tasks({ count: s.tasksCompleted }),
        volunteers: s.activeVolunteers === 1 ? m.count_volunteers_one() : m.count_volunteers({ count: s.activeVolunteers })
      })}
    </p>
  {/if}
</header>

<div class="whole">
  <Quilt patches={data.patches} label={m.impact_quilt_label({ count: s.tasksCompleted })} emptyLine={m.quilt_empty_line()} />
</div>

{#if s.tasksCompleted > 0}
  <section class="part" aria-labelledby="adds">
    <h2 id="adds">{m.impact_adds_title()}</h2>
    <ul class="ticks">
      <li>{m.impact_adds_hours({ hours: s.hoursContributed, minutes: s.avgTaskMinutes })}</li>
      <li>{s.badgesAwarded === 1 ? m.impact_adds_badges_one() : m.impact_adds_badges({ count: s.badgesAwarded })}</li>
      <li>{s.ngosOnboarded === 1 ? m.impact_adds_ngos_one() : m.impact_adds_ngos({ count: s.ngosOnboarded })}</li>
    </ul>
  </section>

  <section class="part" aria-labelledby="len">
    <h2 id="len">{m.impact_len_title()}</h2>
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
      <h2 id="causes">{m.impact_causes_title()}</h2>
      <ul class="causes">
        {#each s.causeBreakdown as c (c.name)}
          <li><span class="fabric-tag">{c.name} <strong class="num">{c.count}</strong></span></li>
        {/each}
      </ul>
    </section>
  {/if}
{:else}
  <section class="part">
    <p>{m.impact_none()}</p>
    <div class="ctas"><Link href="/tasks" class="patch-btn">{m.hero_find()}</Link></div>
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
