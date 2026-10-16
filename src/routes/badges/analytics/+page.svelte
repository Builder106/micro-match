<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
  import Link from '$lib/components/Link.svelte';
  import AccountTabs from '$lib/components/AccountTabs.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  const a = $derived(data.analytics);
  const title = (id: string) => data.tasks.find((t) => t.id === id)?.title ?? 'A task';
  const top = $derived(Math.max(1, ...a.topBadgeTypes.map((t) => t.count)));
</script>

<Seo title="Patch stats | MicroMatch" description="How many patches have been awarded across MicroMatch, which ones, and when." noindex />

<AccountTabs />

<header class="page-head">
  <h1 class="display h-l" tabindex="-1">Patch stats</h1>
  <p class="lede">
    {#if a.totalBadgesAwarded === 0}
      No patches have been awarded across MicroMatch yet. The numbers here appear once people approve work.
    {:else}
      Across MicroMatch, {a.totalBadgesAwarded} patches have been awarded to {a.totalVolunteersEngaged} volunteers, about {a.averageTasksPerVolunteer} each.
    {/if}
  </p>
</header>

{#if a.totalBadgesAwarded > 0}
  <section class="part" aria-labelledby="kinds">
    <h2 id="kinds">Most awarded</h2>
    <ul class="bars">
      {#each a.topBadgeTypes as t (t.type)}
        <li><span>{t.type}</span><span class="bar" style:--f={t.count / top} aria-hidden="true"></span><span class="num">{t.count}</span></li>
      {/each}
    </ul>
  </section>

  {#if a.engagementTrend.length}
    <section class="part" aria-labelledby="months">
      <h2 id="months">By month</h2>
      <ul class="months">
        {#each a.engagementTrend as m (m.month)}
          <li><strong>{m.month}</strong> {m.badges} patches to {m.volunteers} volunteers</li>
        {/each}
      </ul>
    </section>
  {/if}

  <section class="part" aria-labelledby="recent">
    <h2 id="recent">Most recent</h2>
    <ul class="months">
      {#each a.recentAwards as r, i (i)}
        <li><strong>{r.badge}</strong> for <Link href="/task/{r.task}" class="link">{title(r.task)}</Link>, {r.date}</li>
      {/each}
    </ul>
  </section>
{:else}
  <div class="ctas"><Link href="/dashboard" class="patch-btn patch-btn--plain">Open your reviews</Link></div>
{/if}

<style>
  .bars,
  .months {
    list-style: none;
    padding: 0;
    display: grid;
    gap: 0.6rem;
    max-width: 38rem;
  }
  .bars li {
    display: grid;
    grid-template-columns: minmax(8rem, 12rem) 1fr 2.5rem;
    gap: 0.9rem;
    align-items: center;
  }
  .bar {
    height: 0.9rem;
    background: linear-gradient(90deg, var(--c-accent) 55%, transparent 0) 0 50% / 9px 100% repeat-x;
    transform: scaleX(var(--f));
    transform-origin: left;
  }
</style>
