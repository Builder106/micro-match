<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
  import Link from '$lib/components/Link.svelte';
  import AccountTabs from '$lib/components/AccountTabs.svelte';
  import * as m from '$lib/paraglide/messages.js';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  const a = $derived(data.analytics);
  const title = (id: string) => data.tasks.find((t) => t.id === id)?.title ?? m.dash_a_task();
  const top = $derived(Math.max(1, ...a.topBadgeTypes.map((t) => t.count)));
</script>

<Seo title={m.stats_meta_title()} description={m.stats_meta_description()} noindex />

<AccountTabs />

<header class="page-head">
  <h1 class="display h-l" tabindex="-1">{m.stats_title()}</h1>
  <p class="lede">
    {#if a.totalBadgesAwarded === 0}
      {m.stats_none()}
    {:else}
      {m.stats_lede({ patches: a.totalBadgesAwarded, volunteers: a.totalVolunteersEngaged, each: a.averageTasksPerVolunteer })}
    {/if}
  </p>
</header>

{#if a.totalBadgesAwarded > 0}
  <section class="part" aria-labelledby="kinds">
    <h2 id="kinds">{m.stats_most()}</h2>
    <ul class="bars">
      {#each a.topBadgeTypes as t (t.type)}
        <li><span>{t.type}</span><span class="bar" style:--f={t.count / top} aria-hidden="true"></span><span class="num">{t.count}</span></li>
      {/each}
    </ul>
  </section>

  {#if a.engagementTrend.length}
    <section class="part" aria-labelledby="months">
      <h2 id="months">{m.stats_by_month()}</h2>
      <ul class="months">
        {#each a.engagementTrend as t (t.month)}
          <li><strong>{t.month}</strong> {m.stats_month({ patches: t.badges, volunteers: t.volunteers })}</li>
        {/each}
      </ul>
    </section>
  {/if}

  <section class="part" aria-labelledby="recent">
    <h2 id="recent">{m.stats_recent()}</h2>
    <ul class="months">
      {#each a.recentAwards as r, i (i)}
        <li><strong>{r.badge}</strong> {m.stats_for()} <Link href="/task/{r.task}" class="link">{title(r.task)}</Link>, {r.date}</li>
      {/each}
    </ul>
  </section>
{:else}
  <div class="ctas"><Link href="/dashboard" class="patch-btn patch-btn--plain">{m.task_open_reviews()}</Link></div>
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
