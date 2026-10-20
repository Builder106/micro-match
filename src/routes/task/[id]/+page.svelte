<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import Seo from '$lib/components/Seo.svelte';
  import Link from '$lib/components/Link.svelte';
  import Rich from '$lib/components/Rich.svelte';
  import PatchPreview from '$lib/components/PatchPreview.svelte';
  import { deadlineLabel, minutesLabel } from '$lib/time';
  import { callApi } from '$lib/api';
  import { taskLang } from '$lib/translation';
  import { go } from '$lib/go';
  import type { Locale } from '$lib/locale';
  import type { Task } from '$lib/types';
  import * as m from '$lib/paraglide/messages.js';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  const taskDescription = (t: Task) => m.task_meta_description({ summary: t.shortDescription, length: minutesLabel(t.estimatedMinutes) }).trim();

  const locale = $derived((page.data.locale as Locale | undefined) ?? 'en');
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
  // The nonprofit's own words carry their language until a translation replaces them.
  const textLang = $derived(taskLang(data.task.language, task !== data.task));
  const deadline = $derived(deadlineLabel(task.deadline));
  const claimable = $derived(task.status === 'active' && deadline?.tone !== 'late');
  const closedNote = $derived(
    task.status === 'completed' ? m.task_closed_complete() : task.status === 'expired' || deadline?.tone === 'late' ? m.task_closed() : task.status === 'moderated' ? m.task_closed_review() : ''
  );

  let deleting = $state(false);
  let deleteError = $state('');
  async function remove() {
    if (!confirm(m.task_delete_confirm())) return;
    deleting = true;
    const res = await callApi(`/api/tasks/${data.task.id}`, { method: 'DELETE', fallback: m.task_delete_error() });
    deleting = false;
    if (res.ok) await go('/tasks', locale, { invalidateAll: true });
    else deleteError = res.error;
  }
</script>

<Seo title="{data.task.title} | MicroMatch" description={taskDescription(data.task)} />

<div class="task">
  <article class="task__main">
    <p class="crumbs"><Link href="/tasks" class="link">{m.task_all()}</Link></p>
    <h1 class="display h-l" tabindex="-1" lang={textLang}>{task.title}</h1>
    <p class="lede" lang={textLang}>{task.shortDescription}</p>

    {#if locale !== 'en'}
      <div class="translation">
        {#if translating}
          <span>{m.task_translating()}</span>
        {:else if translationStatus === 'translated'}
          <span>{m.task_translation_notice()}</span>
          <button type="button" class="link" onclick={() => (showOriginal = !showOriginal)}>
            {showOriginal ? m.task_view_translation() : m.task_view_original()}
          </button>
        {:else if translationStatus === 'fallback'}
          <span>{m.task_translation_unavailable()}</span>
        {/if}
      </div>
    {/if}

    <section class="brief" aria-labelledby="brief">
      <h2 id="brief" class="h-m">{m.task_brief()}</h2>
      {#if task.description}
        <p class="brief__text" lang={textLang}>{task.description}</p>
      {:else}
        <p class="muted">{m.task_no_description()}</p>
      {/if}
    </section>

    <section class="send" aria-labelledby="send">
      <h2 id="send" class="h-m">{m.task_send_title()}</h2>
      <ol class="ticks">
        <li>{m.task_send_1()}</li>
        <li>{m.task_send_2()}</li>
        <li>{data.orgName ? m.task_send_3_org({ org: data.orgName }) : m.task_send_3()}</li>
      </ol>
    </section>

    {#if data.isOwner}
      <section class="owner" aria-labelledby="owner">
        <h2 id="owner" class="h-m">{m.task_owner_title()}</h2>
        <p class="muted">{m.task_owner_body()}</p>
        <div class="ctas">
          <Link href="/dashboard" class="patch-btn patch-btn--small">{m.task_open_reviews()}</Link>
          <button type="button" class="patch-btn patch-btn--plain patch-btn--small" onclick={remove} disabled={deleting}>
            {deleting ? m.task_deleting() : m.task_delete()}
          </button>
        </div>
        {#if deleteError}<p class="notice notice--error" role="alert">{deleteError}</p>{/if}
      </section>
    {/if}
  </article>

  <aside class="tag-card" aria-label={m.task_about_label()}>
    <dl>
      <div><dt>{m.task_takes()}</dt><dd class="num big">{minutesLabel(task.estimatedMinutes)}</dd></div>
      <div><dt>{m.task_posted_by()}</dt><dd>{data.orgName ?? m.task_a_nonprofit()}{#if task.isVerified}<span class="verified">{m.task_verified_suffix()}</span>{/if}</dd></div>
      {#if deadline}<div><dt>{m.task_deadline()}</dt><dd class:late={deadline.tone === 'late'}>{deadline.text}</dd></div>{/if}
      {#if task.maxVolunteers}<div><dt>{m.task_volunteers()}</dt><dd>{m.task_up_to({ count: task.maxVolunteers })}</dd></div>{/if}
      {#if task.language}<div><dt>{m.field_written_in()}</dt><dd>{task.language}</dd></div>{/if}
      {#if task.tags.length}
        <div>
          <dt>{m.field_tags()}</dt>
          <dd class="tag-list" lang={textLang}>{#each task.tags as t (t)}<span class="fabric-tag">{t.replace(/^#/, '')}</span>{/each}</dd>
        </div>
      {/if}
    </dl>

    <div class="earn">
      <PatchPreview color={data.patch?.color} icon={data.patch?.icon} size="5.5rem" />
      <p>
        {#if data.patch?.label}
          <Rich text={m.task_earn_named({ patch: data.patch.label })} />
        {:else}
          {m.task_earn_plain()}
        {/if}
      </p>
    </div>

    {#if claimable}
      {#if signedIn}
        <Link href="/task/{task.id}/claim" class="patch-btn">{m.task_claim()}</Link>
      {:else}
        <Link href="/login?next=/task/{task.id}/claim" class="patch-btn">{m.task_sign_in_to_claim()}</Link>
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
    box-shadow: inset 0 0 0 1.5px var(--c-fg), 0 6px 0 -2px color-mix(in srgb, var(--c-shade) 15%, transparent);
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
