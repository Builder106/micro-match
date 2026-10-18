<script lang="ts">
  import { page } from '$app/state';
  import { replaceState } from '$app/navigation';
  import Seo from '$lib/components/Seo.svelte';
  import Link from '$lib/components/Link.svelte';
  import TaskSwatch from '$lib/components/TaskSwatch.svelte';
  import { TIME_CAPS, applyFilters, feedTags, filtersFromParams, hasFilters, paramsFromFilters, EMPTY_FILTERS, type Filters, type TimeCap } from '$lib/feed';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let filters = $state<Filters>(filtersFromParams(page.url.searchParams));
  const tags = $derived(feedTags(data.tasks).slice(0, 12));
  const shown = $derived(applyFilters(data.tasks, filters));
  const role = $derived(page.data.userRole ?? 'anonymous');

  // Keep the URL in step with the filters, so a filtered feed can be shared or bookmarked.
  $effect(() => {
    const search = paramsFromFilters(filters);
    if (search !== page.url.search) replaceState(`${page.url.pathname}${search}`, {});
  });

  const setMax = (cap: TimeCap | null) => (filters = { ...filters, max: cap });
  const toggleTag = (tag: string) =>
    (filters = { ...filters, tags: filters.tags.includes(tag) ? filters.tags.filter((t) => t !== tag) : [...filters.tags, tag] });
  const clear = () => (filters = { ...EMPTY_FILTERS });
</script>

<Seo
  title="Tasks | MicroMatch"
  description="Open volunteer tasks from verified nonprofits, each 5 to 30 minutes. Search, filter by 15, 20 or 30 minutes, or pick a tag."
/>

<div class="feed">
  <header class="feed__head">
    <h1 class="display h-l" tabindex="-1">Tasks</h1>
    <p class="muted">
      {#if data.tasks.length === 0}
        No tasks are open right now.
      {:else}
        {data.tasks.length} open, all from verified nonprofits. Pick one that fits the time you have.
      {/if}
    </p>
  </header>

  {#if data.tasks.length > 0}
    <form class="rail" role="search" onsubmit={(e) => e.preventDefault()}>
      <label class="field rail__search">
        <span class="sr-only">Search tasks</span>
        <input class="input" type="search" placeholder="Search tasks" bind:value={filters.q} />
      </label>

      <fieldset class="rail__group">
        <legend>Time you have</legend>
        <div class="seg">
          <label class:is-on={filters.max === null}><input type="radio" name="max" checked={filters.max === null} onchange={() => setMax(null)} />Any</label>
          {#each TIME_CAPS as cap (cap)}
            <label class:is-on={filters.max === cap}>
              <input type="radio" name="max" checked={filters.max === cap} onchange={() => setMax(cap)} />Up to {cap} min
            </label>
          {/each}
        </div>
      </fieldset>

      {#if tags.length}
        <fieldset class="rail__group">
          <legend>Tags</legend>
          <div class="chips">
            {#each tags as t (t.tag)}
              <button type="button" class="chip" aria-pressed={filters.tags.includes(t.tag)} onclick={() => toggleTag(t.tag)}>
                {t.tag} <span class="num">{t.count}</span>
              </button>
            {/each}
          </div>
        </fieldset>
      {/if}

      <label class="field rail__sort">
        <span class="label">Order</span>
        <select class="input" bind:value={filters.sort}>
          <option value="newest">As posted</option>
          <option value="shortest">Shortest first</option>
          <option value="az">A to Z</option>
        </select>
      </label>

      {#if hasFilters(filters)}
        <button type="button" class="patch-btn patch-btn--plain patch-btn--small" onclick={clear}>Clear filters</button>
      {/if}
    </form>

    <section class="wall" aria-label="Open tasks">
      <p class="sr-only" aria-live="polite">{shown.length} tasks shown</p>
      {#if shown.length}
        <ul>
          {#each shown as task (task.id)}
            <li><TaskSwatch {task} /></li>
          {/each}
        </ul>
      {:else}
        <div class="none">
          <h2 class="h-m">Nothing fits those filters</h2>
          <p class="muted">Try a longer time, fewer tags or a shorter search.</p>
          <button type="button" class="patch-btn patch-btn--small" onclick={clear}>Clear filters</button>
        </div>
      {/if}
    </section>
  {:else}
    <div class="none none--empty">
      <p>Nonprofits post new tasks as small jobs come up. Check back soon{role === 'ngo' ? ', or post one yourself' : ''}.</p>
      <div class="ctas">
        {#if role === 'ngo'}
          <Link href="/org" class="patch-btn">Post a task</Link>
        {:else}
          <Link href="/for-nonprofits" class="patch-btn patch-btn--plain">Run a nonprofit? Post one</Link>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .feed {
    display: grid;
    grid-template-columns: minmax(14rem, 17rem) 1fr;
    gap: 1.5rem clamp(1.5rem, 3vw, 3rem);
    align-items: start;
  }
  .feed__head {
    grid-column: 1 / -1;
    display: grid;
    gap: 0.4rem;
  }
  .rail {
    position: sticky;
    top: 0;
    display: grid;
    gap: 1.25rem;
  }
  .rail__group {
    border: 0;
    padding: 0;
    display: grid;
    gap: 0.5rem;
  }
  .rail__group legend,
  .rail__sort .label {
    font-family: var(--f-display);
    font-weight: 650;
    font-size: 0.95rem;
    margin-bottom: 0.4rem;
  }
  .seg {
    display: grid;
    gap: 0.35rem;
  }
  .seg label {
    position: relative;
    display: flex;
    align-items: center;
    min-height: 2.5rem;
    padding: 0.4rem 0.8rem;
    border-radius: var(--radius);
    box-shadow: inset 0 0 0 1.5px var(--c-line);
    cursor: pointer;
    font-size: 0.95rem;
    transition: box-shadow 0.2s, background-color 0.2s, translate 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .seg input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
  .seg label.is-on {
    background: var(--c-fg);
    color: var(--c-bg);
    box-shadow: none;
  }
  .seg label:has(input:focus-visible) {
    outline: 2px solid var(--c-fg);
    outline-offset: 2px;
  }
  @media (hover: hover) {
    .seg label:not(.is-on):hover {
      box-shadow: inset 0 0 0 1.5px var(--c-fg);
      translate: 3px 0;
    }
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }
  .chip {
    display: inline-flex;
    gap: 0.4rem;
    align-items: baseline;
    min-height: 2.2rem;
    padding: 0.35rem 0.7rem;
    border-radius: var(--radius);
    box-shadow: inset 0 0 0 1.5px var(--c-line);
    font-size: 0.88rem;
    transition: box-shadow 0.2s, background-color 0.2s;
  }
  .chip .num {
    color: var(--c-muted);
    font-size: 0.78rem;
  }
  .chip[aria-pressed='true'] {
    background: var(--c-weld);
    box-shadow: inset 0 0 0 1.5px var(--c-fg);
  }
  @media (hover: hover) {
    .chip:hover {
      box-shadow: inset 0 0 0 1.5px var(--c-fg);
    }
  }
  .wall ul {
    list-style: none;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(15.5rem, 100%), 1fr));
    gap: 1.25rem 1rem;
  }
  .none {
    display: grid;
    gap: 0.75rem;
    justify-items: start;
    padding: 2rem;
    border-radius: var(--radius);
    background: color-mix(in srgb, var(--c-fg) 4%, transparent);
  }
  .none--empty {
    grid-column: 1 / -1;
    max-width: 40rem;
  }
  @media (max-width: 899px) {
    .feed {
      grid-template-columns: minmax(0, 1fr);
    }
    .none {
      padding: 1.25rem;
    }
    .rail {
      position: static;
    }
    .rail {
      gap: 0.9rem;
    }
    .seg,
    .chips {
      display: flex;
      flex-wrap: nowrap;
      overflow-x: auto;
      scrollbar-width: none;
      -webkit-mask: linear-gradient(90deg, #000 calc(100% - 2.5rem), #0000);
      mask: linear-gradient(90deg, #000 calc(100% - 2.5rem), #0000);
      padding-right: 2rem;
      padding: 0.25rem 0;
    }
    .seg label,
    .chip {
      flex: none;
      white-space: nowrap;
    }
  }
</style>
