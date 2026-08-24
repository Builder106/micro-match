<script lang="ts">
  import TaskCard from "$lib/components/TaskCard.svelte";
  import FabCompose from "$lib/components/FabCompose.svelte";
  import PublicShell from "$lib/components/PublicShell.svelte";
  import CustomSelect from "$lib/components/CustomSelect.svelte";
  import Icon from "@iconify/svelte";
  import LottieAnimation from '$lib/components/LottieAnimation.svelte';
  import { page } from '$app/state';

  interface Task {
    id: string;
    title: string;
    shortDescription: string;
    tags: string[];
    estimatedMinutes?: number;
    language?: string;
    status?: string;
    deadline?: string;
    maxVolunteers?: number;
    isVerified?: boolean;
    orgId?: string;
  }

  let { data }: { data: { tasks: Task[] } } = $props();

  const sortOptions = [
    { value: 'recommended', label: 'Recommended' },
    { value: 'shortest', label: 'Shortest first' },
    { value: 'az', label: 'A–Z' }
  ];

  let q = $state("");
  const tasks = $derived(data.tasks);

  let selectedTags = $state<string[]>([]);
  let maxMinutes = $state<number | null>(null);
  let sortBy = $state<'recommended' | 'shortest' | 'az'>('recommended');

  const toggleTag = (tag: string) => {
    selectedTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
  };

  const clearFilters = () => {
    selectedTags = [];
    maxMinutes = null;
    q = "";
    sortBy = 'recommended';
  };

  const quickTags = ['translation', 'design', 'data', 'excel', 'spanish'];
  const timeOptions = [15, 20, 30];

  const filtered = $derived(tasks.filter((t) => {
    const qLower = q.toLowerCase();
    const matchesQuery =
      qLower === '' ||
      t.title.toLowerCase().includes(qLower) ||
      t.shortDescription.toLowerCase().includes(qLower) ||
      t.tags.some((tg) => tg.toLowerCase().includes(qLower));

    const matchesTags =
      selectedTags.length === 0 || selectedTags.every((tg) => t.tags.includes(tg));

    const matchesTime =
      maxMinutes === null ||
      (typeof t.estimatedMinutes === 'number' && t.estimatedMinutes <= maxMinutes);

    return matchesQuery && matchesTags && matchesTime;
  }));

  const sorted = $derived([...filtered].sort((a, b) => {
    if (sortBy === 'shortest') {
      const am = typeof a.estimatedMinutes === 'number' ? a.estimatedMinutes : Number.MAX_SAFE_INTEGER;
      const bm = typeof b.estimatedMinutes === 'number' ? b.estimatedMinutes : Number.MAX_SAFE_INTEGER;
      return am - bm;
    }
    if (sortBy === 'az') return a.title.localeCompare(b.title);
    return 0;
  }));

  const hasActiveFilters = $derived(q !== '' || selectedTags.length > 0 || maxMinutes !== null || sortBy !== 'recommended');
  const ngoCount = $derived(new Set(tasks.map(t => t.orgId).filter(Boolean)).size);

  let userRole = $derived(page.data?.userRole ?? 'anonymous');
  let isSignedIn = $derived(userRole !== 'anonymous');
</script>

{#if isSignedIn}
  <div class="feed-page feed-page-app">
    <!-- ───── Header ───── -->
    <header class="feed-head">
      <h1>Find your next <span class="coral-gradient">mission</span>.</h1>
      <p>
        {tasks.length} task{tasks.length === 1 ? '' : 's'} open{ngoCount > 0 ? ` across ${ngoCount} NGO${ngoCount === 1 ? '' : 's'}` : ''} <span class="pipe-sep">|</span> pick something that matches your skills and dive in.
      </p>
    </header>

    <!-- ───── Search ───── -->
    <div class="search">
      <Icon icon="lucide:search" width="20" height="20" class="search-icon" />
      <input
        type="search"
        id="task-search"
        name="task-search"
        bind:value={q}
        placeholder="Search tasks, tags, or skills…"
        aria-label="Search tasks"
      />
      {#if q}
        <button type="button" class="search-clear" onclick={() => q = ''} aria-label="Clear search">
          <Icon icon="lucide:x" width="16" height="16" />
        </button>
      {/if}
    </div>

    <!-- ───── Filters ───── -->
    <div class="filters">
      <div class="filter-row">
        <span class="filter-label">Time</span>
        {#each timeOptions as m (m)}
          <button
            type="button"
            class="filter-chip"
            class:active={maxMinutes === m}
            onclick={() => (maxMinutes = maxMinutes === m ? null : m)}
          >
            <Icon icon="lucide:clock" width="13" height="13" /> ≤ {m} min
          </button>
        {/each}
      </div>

      <div class="filter-row">
        <span class="filter-label">Tags</span>
        {#each quickTags as tag (tag)}
          <button
            type="button"
            class="filter-chip filter-chip-tag"
            class:active={selectedTags.includes(tag)}
            onclick={() => toggleTag(tag)}
          >
            #{tag}
          </button>
        {/each}
      </div>

      <div class="filter-row filter-controls">
        <div class="sort">
          <span class="sort-label">Sort</span>
          <CustomSelect bind:value={sortBy} ariaLabel="Sort tasks" options={sortOptions} />
        </div>
        {#if hasActiveFilters}
          <button type="button" class="filter-clear" onclick={clearFilters}>
            <Icon icon="lucide:x" width="14" height="14" /> Clear filters
          </button>
        {/if}
      </div>
    </div>

    <!-- ───── Results ───── -->
    {#if sorted.length === 0}
      <div class="feed-empty">
        <div class="empty-mascot">
          <LottieAnimation src="/animations/empty_state_mascot.json">
            <Icon icon="lucide:search-x" width="80" height="80" />
          </LottieAnimation>
        </div>
        {#if hasActiveFilters}
          <h2>Nothing matches those filters.</h2>
          <p>Try widening your search or clearing the filters to see everything.</p>
          <button type="button" class="btn-dark-pill" onclick={clearFilters}>
            <Icon icon="lucide:rotate-ccw" width="14" height="14" />
            Clear filters
          </button>
        {:else}
          <h2>You're too fast!</h2>
          <p>Our NGOs are busy preparing more bite-sized tasks. Check back soon — fresh missions land daily.</p>
        {/if}
      </div>
    {:else}
      <div class="feed-grid">
        {#each sorted as t (t.id)}
          <TaskCard
            id={t.id}
            title={t.title}
            shortDescription={t.shortDescription}
            tags={t.tags}
            estimatedMinutes={t.estimatedMinutes}
            language={t.language}
            href={`/task/${t.id}`}
            status={t.status}
            deadline={t.deadline}
            maxVolunteers={t.maxVolunteers}
            isVerified={t.isVerified}
          />
        {/each}
      </div>
    {/if}
  </div>

  {#if page.data.userRole === 'ngo'}
    <FabCompose />
  {/if}
{:else}
  <PublicShell activeTab="tasks">
    <div class="feed-page">
      <!-- ───── Header ───── -->
      <header class="feed-head">
        <h1>Find your next <span class="coral-gradient">mission</span>.</h1>
        <p>
          {tasks.length} task{tasks.length === 1 ? '' : 's'} open{ngoCount > 0 ? ` across ${ngoCount} NGO${ngoCount === 1 ? '' : 's'}` : ''} <span class="pipe-sep">|</span> pick something that matches your skills and dive in.
        </p>
      </header>

      <!-- ───── Search ───── -->
      <div class="search">
        <Icon icon="lucide:search" width="20" height="20" class="search-icon" />
        <input
          type="search"
          id="task-search-public"
          name="task-search"
          bind:value={q}
          placeholder="Search tasks, tags, or skills…"
          aria-label="Search tasks"
        />
        {#if q}
          <button type="button" class="search-clear" onclick={() => q = ''} aria-label="Clear search">
            <Icon icon="lucide:x" width="16" height="16" />
          </button>
        {/if}
      </div>

      <!-- ───── Filters ───── -->
      <div class="filters">
        <div class="filter-row">
          <span class="filter-label">Time</span>
          {#each timeOptions as m (m)}
            <button
              type="button"
              class="filter-chip"
              class:active={maxMinutes === m}
              onclick={() => (maxMinutes = maxMinutes === m ? null : m)}
            >
              <Icon icon="lucide:clock" width="13" height="13" /> ≤ {m} min
            </button>
          {/each}
        </div>

        <div class="filter-row">
          <span class="filter-label">Tags</span>
          {#each quickTags as tag (tag)}
            <button
              type="button"
              class="filter-chip filter-chip-tag"
              class:active={selectedTags.includes(tag)}
              onclick={() => toggleTag(tag)}
            >
              #{tag}
            </button>
          {/each}
        </div>

        <div class="filter-row filter-controls">
          <div class="sort">
            <span class="sort-label">Sort</span>
            <CustomSelect bind:value={sortBy} ariaLabel="Sort tasks" options={sortOptions} />
          </div>
          {#if hasActiveFilters}
            <button type="button" class="filter-clear" onclick={clearFilters}>
              <Icon icon="lucide:x" width="14" height="14" /> Clear filters
            </button>
          {/if}
        </div>
      </div>

      <!-- ───── Results ───── -->
      {#if sorted.length === 0}
        <div class="feed-empty">
          <div class="empty-mascot">
            <LottieAnimation src="/animations/empty_state_mascot.json">
              <Icon icon="lucide:search-x" width="80" height="80" />
            </LottieAnimation>
          </div>
          {#if hasActiveFilters}
            <h2>Nothing matches those filters.</h2>
            <p>Try widening your search or clearing the filters to see everything.</p>
            <button type="button" class="btn-dark-pill" onclick={clearFilters}>
              <Icon icon="lucide:rotate-ccw" width="14" height="14" />
              Clear filters
            </button>
          {:else}
            <h2>You're too fast!</h2>
            <p>Our NGOs are busy preparing more bite-sized tasks. Check back soon — fresh missions land daily.</p>
          {/if}
        </div>
      {:else}
        <div class="feed-grid">
          {#each sorted as t (t.id)}
            <TaskCard
              id={t.id}
              title={t.title}
              shortDescription={t.shortDescription}
              tags={t.tags}
              estimatedMinutes={t.estimatedMinutes}
              language={t.language}
              href={`/task/${t.id}`}
              status={t.status}
              deadline={t.deadline}
              maxVolunteers={t.maxVolunteers}
              isVerified={t.isVerified}
            />
          {/each}
        </div>
      {/if}
    </div>

    {#if page.data.userRole === 'ngo'}
      <FabCompose />
    {/if}
  </PublicShell>
{/if}

<style>
  .feed-page { display: flex; flex-direction: column; gap: 24px; max-width: 1040px; margin: 0 auto; padding: 32px 20px 80px; }
  .feed-page-app { padding: 8px 0 60px; }

  /* Header */
  .feed-head h1 { font-size: clamp(1.75rem, 3vw + 0.5rem, 2.75rem); font-weight: 800; line-height: 1.1; letter-spacing: -0.02em; margin: 0 0 12px; }
  .feed-head p { color: var(--color-text-secondary); font-size: 16px; font-weight: 500; line-height: 1.6; margin: 0; max-width: 640px; }

  /* Search */
  .search {
    position: relative;
    display: flex;
    align-items: center;
    background: var(--color-surface);
    border: 1px solid var(--card-border-strong);
    border-radius: 9999px;
    padding: 4px 4px 4px 20px;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
    transition: all .2s;
  }
  .search:focus-within {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.12), 0 4px 12px rgba(15, 23, 42, 0.04);
  }
  .search :global(.search-icon) { color: color-mix(in srgb, var(--color-text) 50%, transparent); flex-shrink: 0; }
  .search input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    padding: 14px 12px;
    font-size: 15px;
    font-weight: 500;
    color: var(--color-text);
    font-family: inherit;
  }
  .search input::placeholder { color: color-mix(in srgb, var(--color-text) 45%, transparent); }
  .search-clear {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: var(--card-border-strong);
    color: color-mix(in srgb, var(--color-text) 65%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all .15s;
  }
  .search-clear:hover { background: color-mix(in srgb, var(--color-text) 14%, transparent); color: var(--color-text); }

  /* Filters */
  .filters { display: flex; flex-direction: column; gap: 10px; }
  .filter-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .filter-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-secondary); margin-right: 4px; min-width: 36px; }
  .filter-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 7px 14px;
    border-radius: 9999px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    border: 1px solid var(--card-border-strong);
    background: var(--color-surface);
    color: var(--color-text);
    transition: all .15s;
  }
  .filter-chip:hover { border-color: color-mix(in srgb, var(--color-primary) 35%, transparent); color: var(--color-text); }
  .filter-chip.active {
    background: var(--color-primary);
    color: #fff;
    border-color: var(--color-primary);
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.25);
  }
  .filter-chip-tag.active { background: var(--color-text); border-color: var(--color-text); }

  .filter-controls { margin-top: 4px; justify-content: flex-end; }
  .sort {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--color-surface);
    border: 1px solid var(--card-border-strong);
    border-radius: 9999px;
    padding: 4px 36px 4px 14px;
    transition: border-color .15s;
  }
  .sort:focus-within { border-color: var(--color-primary); }
  .sort-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-secondary); }
  .sort :global(.custom-select) { width: auto; min-width: 156px; }
  .sort :global(.custom-select-trigger) { min-height: 38px; padding: 0 4px; border: 0; background: transparent; font-size: 13px; font-weight: 700; }
  .sort :global(.custom-select-trigger:hover), .sort :global(.custom-select.open .custom-select-trigger) { border: 0; background: transparent; }
  .sort :global(.custom-select-menu) { width: 190px; right: 0; left: auto; }
  .filter-clear {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 7px 14px;
    border-radius: 9999px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    border: 1px solid var(--card-border-strong);
    background: transparent;
    color: color-mix(in srgb, var(--color-text) 65%, transparent);
    transition: all .15s;
  }
  .filter-clear:hover { color: var(--color-error); border-color: color-mix(in srgb, var(--color-error) 30%, transparent); }

  /* Results grid */
  .feed-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
  }
  @media (min-width: 640px) { .feed-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 1024px) { .feed-grid { grid-template-columns: repeat(3, 1fr); } }

  /* Empty state */
  .feed-empty {
    background: var(--color-surface);
    border-radius: 32px;
    border: 1px solid color-mix(in srgb, var(--color-primary) 12%, transparent);
    padding: 64px 32px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    box-shadow: 0 16px 40px rgba(255, 107, 107, 0.05);
  }
  .empty-mascot { width: 160px; height: 160px; display: flex; align-items: center; justify-content: center; color: var(--color-primary-light); margin-bottom: 8px; }
  .empty-mascot :global(.lottie-animation) { width: 100%; height: 100%; }
  .feed-empty h2 { font-size: 24px; font-weight: 800; margin: 0; }
  .feed-empty p { color: color-mix(in srgb, var(--color-text) 60%, transparent); font-size: 15px; font-weight: 500; max-width: 420px; margin: 0 0 8px; line-height: 1.6; }
</style>
