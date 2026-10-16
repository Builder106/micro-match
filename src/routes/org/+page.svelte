<script lang="ts">
  import { page } from '$app/state';
  import Seo from '$lib/components/Seo.svelte';
  import AccountTabs from '$lib/components/AccountTabs.svelte';
  import VerificationCard from '$lib/components/VerificationCard.svelte';
  import { callApi } from '$lib/api';
  import { go } from '$lib/go';
  import { TASK_MINUTES, LIMITS, parseTags } from '$lib/taskForm';
  import type { Locale } from '$lib/locale';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  const locale = $derived((page.data.locale as Locale | undefined) ?? 'en');

  let title = $state('');
  let shortDescription = $state('');
  let description = $state('');
  let minutes = $state(15);
  let tags = $state('');
  let language = $state('English');
  let maxVolunteers = $state('');
  let deadline = $state('');
  let error = $state('');
  let submitting = $state(false);

  const languages = ['English', 'Spanish', 'French', 'German', 'Portuguese', 'Chinese', 'Arabic'];

  async function post(e: SubmitEvent) {
    e.preventDefault();
    if (!title.trim() || !shortDescription.trim()) return void (error = 'A title and a one-line summary are required.');
    submitting = true;
    error = '';
    const res = await callApi<{ id: string }>('/api/tasks', {
      body: {
        title: title.trim(),
        shortDescription: shortDescription.trim(),
        description: description.trim() || undefined,
        estimatedMinutes: minutes,
        tags: parseTags(tags),
        language,
        maxVolunteers: maxVolunteers ? Number(maxVolunteers) : undefined,
        deadline: deadline ? new Date(deadline).toISOString() : undefined
      },
      fallback: 'Could not post the task.'
    });
    submitting = false;
    if (res.ok) await go(`/task/${res.data.id}`, locale, { invalidateAll: true });
    else error = res.error;
  }
</script>

<Seo title="Post a task | MicroMatch" description="Post a 5 to 30 minute task for volunteers and verify your nonprofit." noindex />

<AccountTabs />

<div class="org">
  <form class="org__form" onsubmit={post}>
    <header class="page-head">
      <h1 class="display h-l" tabindex="-1">Post a task</h1>
      <p class="lede">Cut one clear piece of work: what to make, what done looks like and how long it takes.</p>
    </header>
    {#if data.verificationStatus !== 'approved'}
      <p class="notice">Tasks you post now stay out of the public feed until your organization is verified.</p>
    {/if}

    <div class="field">
      <label for="t-title">Title</label>
      <input id="t-title" class="input" maxlength={LIMITS.title} bind:value={title} placeholder="Translate a medical flyer into Spanish" required />
    </div>
    <div class="field">
      <label for="t-short">One-line summary</label>
      <input id="t-short" class="input" maxlength={LIMITS.short} bind:value={shortDescription} placeholder="What the volunteer does, in one sentence." required />
    </div>
    <div class="field">
      <label for="t-brief">The brief</label>
      <textarea id="t-brief" class="input" maxlength={LIMITS.brief} bind:value={description} placeholder="Where the material is, what to deliver, how you will judge it."></textarea>
    </div>

    <fieldset class="field minutes">
      <legend class="label">How long it takes</legend>
      <div class="seg">
        {#each TASK_MINUTES as m (m)}
          <label class:is-on={minutes === m}><input type="radio" name="minutes" value={m} bind:group={minutes} />{m} min</label>
        {/each}
      </div>
    </fieldset>

    <div class="row">
      <div class="field">
        <label for="t-tags">Tags</label>
        <input id="t-tags" class="input" bind:value={tags} placeholder="translation, health" />
        <span class="hint">Separate with commas.</span>
      </div>
      <div class="field">
        <label for="t-lang">Written in</label>
        <select id="t-lang" class="input" bind:value={language}>{#each languages as l (l)}<option>{l}</option>{/each}</select>
      </div>
    </div>
    <div class="row">
      <div class="field">
        <label for="t-cap">Most volunteers (optional)</label>
        <input id="t-cap" class="input" type="number" min="1" inputmode="numeric" bind:value={maxVolunteers} />
      </div>
      <div class="field">
        <label for="t-due">Deadline (optional)</label>
        <input id="t-due" class="input" type="date" bind:value={deadline} />
      </div>
    </div>

    {#if error}<p class="notice notice--error" role="alert">{error}</p>{/if}
    <button class="patch-btn" type="submit" disabled={submitting}>{submitting ? 'Posting...' : 'Post the task'}</button>
    <p class="small muted">Task text goes through Azure AI Content Safety before it is saved.</p>
  </form>

  <aside class="org__side">
    <VerificationCard />
  </aside>
</div>

<style>
  .org {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(16rem, 22rem);
    gap: clamp(1.5rem, 4vw, 3.5rem);
    align-items: start;
  }
  .org__form {
    display: grid;
    gap: 1.1rem;
    max-width: 40rem;
  }
  .org__form .patch-btn {
    justify-self: start;
  }
  .row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.9rem;
  }
  .minutes {
    border: 0;
    padding: 0;
  }
  .seg {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }
  .seg label {
    position: relative;
    display: inline-flex;
    align-items: center;
    min-height: 2.5rem;
    padding: 0.4rem 0.85rem;
    border-radius: var(--radius);
    box-shadow: inset 0 0 0 1.5px var(--c-line);
    cursor: pointer;
  }
  .seg input {
    position: absolute;
    opacity: 0;
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
  .org__side {
    position: sticky;
    top: 0;
  }
  @media (max-width: 899px) {
    .org {
      grid-template-columns: 1fr;
    }
    .org__side {
      position: static;
    }
    .row {
      grid-template-columns: 1fr;
    }
  }
</style>
