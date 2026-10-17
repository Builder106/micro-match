<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import Seo from '$lib/components/Seo.svelte';
  import Link from '$lib/components/Link.svelte';
  import PatchPreview from '$lib/components/PatchPreview.svelte';
  import { getTaskDetailCopy } from '$lib/translation';
  import { deadlineLabel, minutesLabel } from '$lib/time';
  import { callApi } from '$lib/api';
  import { go } from '$lib/go';
  import type { Locale } from '$lib/locale';
  import type { Task } from '$lib/types';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  const taskDescription = (t: Task) => `${t.shortDescription} ${minutesLabel(t.estimatedMinutes)} volunteer task on MicroMatch.`.trim();

  const locale = $derived((page.data.locale as Locale | undefined) ?? 'en');
  const copy = $derived(getTaskDetailCopy(locale === 'en' ? null : locale));
  const signedIn = $derived((page.data.userRole ?? 'anonymous') !== 'anonymous');

  // Task text comes in its original language; other site locales fetch a translation after load.
  let translated = $state<Task | null>(null);
  let translationStatus = $state<'translated' | 'fallback' | null>(null);
  let translating = $state(false);
  let showOriginal = $state(false);

  async function loadTranslation(to: string) {
    translating = true;
    const res = await callApi<{ task?: Task & { translation?: { status?: 'translated' | 'fallback' } } }>(
      `/api/tasks/${data.task.id}/translation?lang=${encodeURIComponent(to)}`
    );
    translating = false;
    if (res.ok && res.data.task) {
      translated = res.data.task;
      translationStatus = res.data.task.translation?.status ?? 'fallback';
    } else {
      translationStatus = 'fallback';
    }
  }

  onMount(() => {
    const target = data.translatedTo ?? locale;
    if (target !== 'en') void loadTranslation(target);
  });

  const task = $derived(!showOriginal && translationStatus === 'translated' && translated ? translated : data.task);
  const deadline = $derived(deadlineLabel(task.deadline));
  const claimable = $derived(task.status === 'active' && deadline?.tone !== 'late');
  const closedNote = $derived(
    task.status === 'completed' ? 'This task is complete.' : task.status === 'expired' || deadline?.tone === 'late' ? 'This task has closed.' : task.status === 'moderated' ? 'This task is under review.' : ''
  );

  let deleting = $state(false);
  let deleteError = $state('');
  async function remove() {
    if (!confirm('Delete this task? Volunteers can no longer claim it. Existing claims are kept.')) return;
    deleting = true;
    const res = await callApi(`/api/tasks/${data.task.id}`, { method: 'DELETE', fallback: 'Could not delete the task.' });
    deleting = false;
    if (res.ok) await go('/tasks', locale, { invalidateAll: true });
    else deleteError = res.error;
  }
</script>

<Seo title="{data.task.title} | MicroMatch" description={taskDescription(data.task)} />

<div class="task">
  <article class="task__main">
    <p class="crumbs"><Link href="/tasks" class="link">All tasks</Link></p>
    <h1 class="display h-l" tabindex="-1">{task.title}</h1>
    <p class="lede">{task.shortDescription}</p>

    {#if locale !== 'en'}
      <div class="translation">
        {#if translating}
          <span>{copy.translating}</span>
        {:else if translationStatus === 'translated'}
          <span>{copy.translationNotice}</span>
          <button type="button" class="link" onclick={() => (showOriginal = !showOriginal)}>
            {showOriginal ? copy.viewTranslation : copy.viewOriginal}
          </button>
        {:else if translationStatus === 'fallback'}
          <span>{copy.translationUnavailable}</span>
        {/if}
      </div>
    {/if}

    <section class="brief" aria-labelledby="brief">
      <h2 id="brief" class="h-m">The brief</h2>
      {#if task.description}
        <p class="brief__text">{task.description}</p>
      {:else}
        <p class="muted">{copy.noDescription}</p>
      {/if}
    </section>

    <section class="send" aria-labelledby="send">
      <h2 id="send" class="h-m">What you send back</h2>
      <ol class="ticks">
        <li>A link to what you made: a document, a shared folder, a pull request or a design file.</li>
        <li>A short note on how you did it and anything they should check.</li>
        <li>A person at {data.orgName ?? 'the nonprofit'} reads both and approves the claim, or rejects it if it is not what they needed.</li>
      </ol>
    </section>

    {#if data.isOwner}
      <section class="owner" aria-labelledby="owner">
        <h2 id="owner" class="h-m">You posted this</h2>
        <p class="muted">Claims on it wait in your reviews.</p>
        <div class="ctas">
          <Link href="/dashboard" class="patch-btn patch-btn--small">Open your reviews</Link>
          <button type="button" class="patch-btn patch-btn--plain patch-btn--small" onclick={remove} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete task'}
          </button>
        </div>
        {#if deleteError}<p class="notice notice--error" role="alert">{deleteError}</p>{/if}
      </section>
    {/if}
  </article>

  <aside class="tag-card" aria-label="About this task">
    <dl>
      <div><dt>Takes</dt><dd class="num big">{minutesLabel(task.estimatedMinutes)}</dd></div>
      <div><dt>Posted by</dt><dd>{data.orgName ?? 'A nonprofit on MicroMatch'}{#if task.isVerified}<span class="verified">, verified</span>{/if}</dd></div>
      {#if deadline}<div><dt>Deadline</dt><dd class:late={deadline.tone === 'late'}>{deadline.text}</dd></div>{/if}
      {#if task.maxVolunteers}<div><dt>Volunteers</dt><dd>Up to {task.maxVolunteers}</dd></div>{/if}
      {#if task.language}<div><dt>Written in</dt><dd>{task.language}</dd></div>{/if}
      {#if task.tags.length}
        <div>
          <dt>Tags</dt>
          <dd class="tag-list">{#each task.tags as t (t)}<span class="fabric-tag">{t.replace(/^#/, '')}</span>{/each}</dd>
        </div>
      {/if}
    </dl>

    <div class="earn">
      <PatchPreview color={data.patch?.color} icon={data.patch?.icon} size="5.5rem" />
      <p>
        {#if data.patch?.label}
          Finish it and it is sewn in as a <strong>{data.patch.label}</strong> patch.
        {:else}
          Finish it and it is sewn in as a plain patch: this nonprofit has not designed one yet.
        {/if}
      </p>
    </div>

    {#if claimable}
      {#if signedIn}
        <Link href="/task/{task.id}/claim" class="patch-btn">{copy.claimTask}</Link>
      {:else}
        <Link href="/login?next=/task/{task.id}/claim" class="patch-btn">{copy.signInToClaim}</Link>
      {/if}
    {:else}
      <p class="notice">{closedNote}</p>
    {/if}
  </aside>
</div>

<style>
  .task {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(16rem, 20rem);
    gap: clamp(1.5rem, 4vw, 3.5rem);
    align-items: start;
  }
  .task__main {
    display: grid;
    gap: 1rem;
    max-width: 44rem;
  }
  .crumbs {
    font-size: var(--t-s);
  }
  .translation {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    font-size: var(--t-s);
    color: var(--c-muted);
  }
  .brief {
    display: grid;
    gap: 0.6rem;
    padding-top: 1.5rem;
    border-top: 1.5px dashed var(--c-line);
  }
  .send {
    display: grid;
    gap: 0.75rem;
    padding-top: 1.5rem;
    border-top: 1.5px dashed var(--c-line);
  }
  .brief__text {
    white-space: pre-line;
  }
  .owner {
    display: grid;
    gap: 0.6rem;
    padding: 1.25rem;
    border-radius: var(--radius);
    background: rgb(242 184 75 / 0.18);
  }
  .tag-card {
    position: sticky;
    top: 0;
    display: grid;
    gap: 1.1rem;
    padding: 1.4rem;
    background: #fff;
    border-radius: var(--radius);
    box-shadow: inset 0 0 0 1.5px var(--c-fg), 0 6px 0 -2px rgb(28 31 59 / 0.15);
    rotate: 0.4deg;
  }
  dl {
    display: grid;
    gap: 0.75rem;
  }
  dt {
    font-size: var(--t-xs);
    color: var(--c-muted);
  }
  dd {
    margin: 0;
  }
  .big {
    font-family: var(--f-display);
    font-weight: 760;
    font-size: 2rem;
    letter-spacing: -0.03em;
    line-height: 1.05;
  }
  .verified {
    color: var(--c-ok);
    font-weight: 600;
  }
  .late {
    color: var(--c-danger);
  }
  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }
  .earn {
    display: flex;
    gap: 0.9rem;
    align-items: center;
    padding-top: 1rem;
    border-top: 1.5px dashed var(--c-line);
    font-size: 0.92rem;
  }
  @media (max-width: 999px) {
    .task {
      grid-template-columns: 1fr;
    }
    .tag-card {
      position: static;
    }
  }
</style>
