<script lang="ts">
  /* eslint-disable svelte/no-navigation-without-resolve */
  import Icon from "@iconify/svelte";
  import { onMount } from 'svelte';
  import { localizedHref, type Locale } from '$lib/locale';
  import { page } from '$app/stores';
  import { getTaskDetailCopy, TRANSLATION_OPTIONS } from '$lib/translation';
  import { getTagStyle } from '$lib/utils/tagColors';
  import type { Task } from '$lib/types';
  import CustomSelect from '$lib/components/CustomSelect.svelte';

  export let data: {
    task: Task;
    isOwner: boolean;
    orgName: string | null;
    translatedTo: string | null;
  };

  $: id = $page.params.id;
  let translatedTask: Task | null = null;
  $: task = translatedTask ?? data.task;
  $: orgName = data.orgName ?? 'Community organization';
  $: signedIn = $page.data.userRole && $page.data.userRole !== 'anonymous';
  $: currentLocale = ($page.data.locale as Locale | undefined) ?? 'en';
  function resolve(pathname: string) { return localizedHref(pathname, currentLocale); }
  $: copy = getTaskDetailCopy(currentLocale === 'en' ? null : currentLocale);

  let langSelection = currentLocale;
  let isTranslating = false;
  let translationRequest = 0;

  async function loadTranslation(to: string | null) {
    const request = ++translationRequest;
    translatedTask = null;

    if (!to || to === 'en') {
      isTranslating = false;
      return;
    }

    isTranslating = true;
    try {
      const response = await fetch(`/api/tasks/${id}/translation?lang=${encodeURIComponent(to)}`);
      if (!response.ok) return;

      const result = (await response.json()) as { task?: Task };
      if (request === translationRequest && result.task) translatedTask = result.task;
    } catch {
      // Preserve the original task when a translation request cannot finish.
    } finally {
      if (request === translationRequest) isTranslating = false;
    }
  }

  async function applyTranslation() {
    const to = langSelection || null;
    void loadTranslation(to);
    window.location.href = resolve(`/task/${id}`);
  }

  onMount(() => {
    if (currentLocale !== 'en') void loadTranslation(currentLocale);
  });

  let deleting = false;
  async function deleteTask() {
    if (!confirm('Delete this task? Volunteers can no longer claim it. Existing claims are preserved.')) return;
    deleting = true;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        window.location.href = resolve('/tasks');
      } else {
        alert('Failed to delete task.');
      }
    } finally {
      deleting = false;
    }
  }

  function formatDeadline(d: string | undefined): { text: string; tone: 'soon' | 'late' | 'normal' } | null {
    if (!d) return null;
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return null;
    const diffMs = date.getTime() - Date.now();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (days < 0) return { text: `Expired ${date.toLocaleDateString()}`, tone: 'late' };
    if (days === 0) return { text: 'Due today', tone: 'soon' };
    if (days === 1) return { text: 'Due tomorrow', tone: 'soon' };
    if (days <= 7) return { text: `Due in ${days} days`, tone: 'soon' };
    return { text: `Due ${date.toLocaleDateString()}`, tone: 'normal' };
  }
  $: deadline = formatDeadline(task.deadline);

  function statusInfo(s?: string) {
    switch (s) {
      case 'completed': return { label: 'Completed', color: '#2563EB', bg: '#DBEAFE', icon: 'lucide:flag' };
      case 'expired':   return { label: 'Expired',   color: '#DC2626', bg: '#FEE2E2', icon: 'lucide:alarm-clock-off' };
      case 'moderated': return { label: 'Under review', color: '#D97706', bg: '#FEF3C7', icon: 'lucide:shield-alert' };
      default: return null;
    }
  }
  $: status = statusInfo(task.status);

  $: claimable = task.status === 'active' && (deadline?.tone !== 'late');
</script>

<svelte:head><title>{task.title} · MicroMatch</title></svelte:head>

<div class="td-page">
  <a href={resolve('/tasks')} class="td-back">
    <Icon icon="lucide:arrow-left" width="14" height="14" />
    {copy.backToFeed}
  </a>

  <!-- ───── Hero ───── -->
  <section class="td-hero brand-card">
    <div class="td-hero-blob"></div>

    <div class="td-hero-top">
      <div class="td-avatar"><Icon icon="lucide:heart-handshake" width="28" height="28" /></div>
      <div class="td-org">
        <small>{copy.postedBy}</small>
        <strong>{orgName}</strong>
        {#if task.isVerified}
          <span class="td-verified" title="Verification confirmed">
            <Icon icon="lucide:badge-check" width="14" height="14" /> {copy.verified}
          </span>
        {:else}
          <span class="td-unverified" title="Org has not been verified">
            <Icon icon="lucide:shield-alert" width="14" height="14" /> {copy.unverified}
          </span>
        {/if}
      </div>
      {#if status}
        <span class="td-status" style="background: {status.bg}; color: {status.color};">
          <Icon icon={status.icon} width="12" height="12" /> {status.label}
        </span>
      {/if}
    </div>

    {#if isTranslating}
      <div class="td-hero-skeleton" aria-hidden="true">
        <span class="td-skeleton-title"></span>
        <span class="td-skeleton-short"></span>
        <span class="td-skeleton-short td-skeleton-short-last"></span>
        <div class="td-skeleton-chips"><span></span><span></span><span></span><span></span></div>
      </div>
    {:else}
      <h1>{task.title}</h1>
      <p class="td-short">{task.shortDescription}</p>

      <div class="td-meta">
        {#if typeof task.estimatedMinutes === 'number'}
          <span class="td-chip td-chip-time">
            <Icon icon="lucide:clock" width="14" height="14" /> {task.estimatedMinutes} {copy.minutes}
          </span>
        {/if}
        {#if task.language}
          <span class="td-chip td-chip-lang">
            <Icon icon="lucide:globe" width="14" height="14" /> {translatedTask && data.translatedTo ? copy.autoTranslated : task.language}
          </span>
        {/if}
        {#if task.maxVolunteers}
          <span class="td-chip td-chip-cap">
            <Icon icon="lucide:users" width="14" height="14" /> {copy.max} {task.maxVolunteers}
          </span>
        {/if}
        {#if deadline}
          <span class="td-chip" class:tone-soon={deadline.tone === 'soon'} class:tone-late={deadline.tone === 'late'} class:tone-normal={deadline.tone === 'normal'}>
            <Icon icon="lucide:calendar-clock" width="14" height="14" /> {deadline.text}
          </span>
        {/if}
        {#each task.tags as tag (tag)}
          {@const s = getTagStyle(tag)}
          <span class="td-chip" style="background: {s.bg}; color: {s.color};">#{tag}</span>
        {/each}
      </div>
    {/if}
  </section>

  <!-- ───── Description ───── -->
  <section class="td-card brand-card">
    <header class="td-card-head">
      <h2>{copy.theMission}</h2>
      <label class="td-translate">
        <Icon icon="lucide:languages" width="14" height="14" />
        <CustomSelect
          bind:value={langSelection}
          onChange={applyTranslation}
          disabled={isTranslating}
          ariaLabel="Translate description"
          options={TRANSLATION_OPTIONS.map((opt) => ({ value: opt.code, label: opt.label }))}
        />
      </label>
    </header>
    {#if isTranslating}
      <div class="td-translating" role="status">
        <span class="spin"><Icon icon="lucide:loader-2" width="13" height="13" /></span>
        {copy.translating}
      </div>
    {:else if data.translatedTo && translatedTask}
      <div class="td-translated-note">
        <Icon icon="lucide:info" width="13" height="13" />
        {copy.translationNotice}
      </div>
    {/if}
    {#if isTranslating}
      <div class="td-skeleton" aria-hidden="true">
        <span></span><span></span><span></span><span></span>
      </div>
    {:else if task.description}
      <div class="td-prose">
        {#each task.description.split(/\n\n+/) as para (para)}
          <p>{para}</p>
        {/each}
      </div>
    {:else}
      <p class="td-prose td-prose-empty">{copy.noDescription}</p>
    {/if}
  </section>

  <!-- ───── Action footer ───── -->
  <footer class="td-actions">
    {#if data.isOwner}
      <div class="td-owner-row">
        <Icon icon="lucide:user" width="14" height="14" />
        You posted this task.
      </div>
      <div class="td-action-buttons">
        <button on:click={deleteTask} disabled={deleting} class="td-delete">
          {#if deleting}
            <Icon icon="lucide:loader-2" width="14" height="14" class="spin" />
            Deleting…
          {:else}
            <Icon icon="lucide:trash-2" width="14" height="14" />
            Delete task
          {/if}
        </button>
      </div>
    {:else if !claimable}
      <div class="td-not-claimable">
        <Icon icon="lucide:lock" width="14" height="14" />
        {#if task.status === 'expired' || deadline?.tone === 'late'}
          This task is no longer accepting volunteers — the deadline has passed.
        {:else if task.status === 'completed'}
          This task is marked completed.
        {:else if task.status === 'moderated'}
          This task is under review and temporarily paused.
        {:else}
          This task isn't currently accepting claims.
        {/if}
      </div>
      <a href={resolve('/tasks')} class="btn-outline-dark">Browse other tasks</a>
    {:else if !signedIn}
      <div class="td-signin-cta">
        <Icon icon="lucide:user-plus" width="14" height="14" />
        {copy.signInToClaimTask}
      </div>
      <a href={resolve(`/login?next=/task/${id}`)} class="btn-coral btn-lg">
        {copy.signInToClaim}
        <Icon icon="lucide:arrow-right" width="16" height="16" />
      </a>
    {:else}
      <div class="td-cta-meta">
        <Icon icon="lucide:hand-heart" width="14" height="14" />
        {copy.readyToHelp}
      </div>
      <a href={resolve(`/task/${id}/claim`)} class="btn-coral btn-lg">
        {copy.claimTask}
        <Icon icon="lucide:arrow-right" width="16" height="16" />
      </a>
    {/if}
  </footer>
</div>

<style>
  .td-page { display: flex; flex-direction: column; gap: 20px; max-width: 820px; margin: 0 auto; }

  .td-back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    align-self: flex-start;
    color: color-mix(in srgb, var(--color-text) 60%, transparent);
    text-decoration: none;
    font-size: 13px;
    font-weight: 700;
    padding: 6px 12px;
    border-radius: 9999px;
    transition: all .15s;
  }
  .td-back:hover { color: var(--color-text); background: color-mix(in srgb, var(--color-text) 5%, transparent); }

  /* Hero */
  .td-hero { position: relative; overflow: hidden; padding: 32px 36px; display: flex; flex-direction: column; gap: 16px; }
  .td-hero-blob { position: absolute; top: -50%; right: -10%; width: 320px; height: 320px; border-radius: 50%; background: rgba(255, 107, 107, 0.16); filter: blur(80px); pointer-events: none; }

  .td-hero-top { position: relative; display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
  .td-avatar { width: 56px; height: 56px; border-radius: 18px; background: #FFE5DC; color: var(--color-primary-readable); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .td-org { display: flex; flex-direction: column; flex: 1; min-width: 0; }
  .td-org small { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: color-mix(in srgb, var(--color-text) 50%, transparent); }
  .td-org strong { font-size: 16px; font-weight: 700; color: var(--color-text); }
  .td-verified, .td-unverified { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; align-self: flex-start; margin-top: 4px; }
  .td-verified { background: #D1FAE5; color: #047857; }
  .td-unverified { background: #FEE2E2; color: #B91C1C; }
  .td-status { display: inline-flex; align-items: center; gap: 4px; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; flex-shrink: 0; }

  .td-hero h1 { position: relative; font-size: clamp(1.5rem, 2.5vw + 0.5rem, 2.25rem); font-weight: 800; line-height: 1.15; letter-spacing: -0.02em; margin: 0; }
  .td-short { position: relative; font-size: 17px; font-weight: 500; line-height: 1.6; color: color-mix(in srgb, var(--color-text) 75%, transparent); margin: 0; max-width: 640px; }
  .td-hero-skeleton { position: relative; display: grid; gap: 14px; max-width: 640px; }
  .td-hero-skeleton > span, .td-skeleton-chips span { border-radius: 999px; background: linear-gradient(90deg, color-mix(in srgb, var(--color-text) 8%, transparent), color-mix(in srgb, var(--color-text) 15%, transparent), color-mix(in srgb, var(--color-text) 8%, transparent)); background-size: 200% 100%; animation: td-shimmer 1.2s ease-in-out infinite; }
  .td-skeleton-title { width: 84%; height: 42px; }
  .td-skeleton-short { width: 96%; height: 20px; }
  .td-skeleton-short-last { width: 62%; }
  .td-skeleton-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 2px; }
  .td-skeleton-chips span { width: 94px; height: 30px; }
  .td-skeleton-chips span:nth-child(2) { width: 132px; }
  .td-skeleton-chips span:nth-child(3) { width: 76px; }
  .td-skeleton-chips span:nth-child(4) { width: 102px; }

  .td-meta { position: relative; display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
  .td-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 9999px;
    font-size: 13px;
    font-weight: 700;
    background: color-mix(in srgb, var(--color-text) 5%, transparent);
    color: color-mix(in srgb, var(--color-text) 70%, transparent);
  }
  .td-chip-time { background: rgba(255, 107, 107, 0.12); color: var(--color-primary-readable); }
  .td-chip-lang { background: #DBEAFE; color: #2563EB; }
  .td-chip-cap { background: #F1F5F9; color: #475569; }
  .td-chip.tone-soon { background: #FEF3C7; color: #D97706; }
  .td-chip.tone-late { background: #FEE2E2; color: #DC2626; }
  .td-chip.tone-normal { background: #F1F5F9; color: #475569; }

  /* Description card */
  .td-card { padding: 28px 32px; }
  .td-card-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
  .td-card-head h2 { font-size: 20px; font-weight: 700; margin: 0; }

  .td-translate {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 9999px;
    background: color-mix(in srgb, var(--color-text) 5%, transparent);
    color: color-mix(in srgb, var(--color-text) 65%, transparent);
    font-size: 13px;
    font-weight: 600;
    transition: background .15s;
  }
  .td-translate:hover { background: color-mix(in srgb, var(--color-text) 8%, transparent); }
  .td-translate :global(.custom-select) { width: auto; min-width: 118px; }
  .td-translate :global(.custom-select-trigger) { min-height: 30px; padding: 0 2px; border: 0; background: transparent; font-size: 13px; font-weight: 700; }
  .td-translate :global(.custom-select-trigger:hover), .td-translate :global(.custom-select.open .custom-select-trigger) { border: 0; background: transparent; }
  .td-translate :global(.custom-select-menu) { width: 190px; right: 0; left: auto; }

  .td-translated-note { display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; background: #FEF3C7; color: #92400E; border-radius: 10px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
  .td-translating { display: inline-flex; align-items: center; gap: 6px; color: color-mix(in srgb, var(--color-text) 65%, transparent); font-size: 12px; font-weight: 700; margin-bottom: 16px; }
  .td-skeleton { display: grid; gap: 12px; padding: 6px 0; }
  .td-skeleton span { height: 18px; border-radius: 999px; background: linear-gradient(90deg, color-mix(in srgb, var(--color-text) 8%, transparent), color-mix(in srgb, var(--color-text) 15%, transparent), color-mix(in srgb, var(--color-text) 8%, transparent)); background-size: 200% 100%; animation: td-shimmer 1.2s ease-in-out infinite; }
  .td-skeleton span:nth-child(2) { width: 92%; }
  .td-skeleton span:nth-child(3) { width: 78%; }
  .td-skeleton span:nth-child(4) { width: 58%; }

  .td-prose { display: flex; flex-direction: column; gap: 14px; }
  .td-prose p { font-size: 15px; line-height: 1.7; color: var(--color-text); margin: 0; white-space: pre-wrap; }
  .td-prose-empty { color: color-mix(in srgb, var(--color-text) 50%, transparent); font-style: italic; }

  /* Action footer */
  .td-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    padding: 20px 24px;
    background: var(--color-surface);
    border: 1px solid var(--card-border);
    border-radius: 24px;
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.04);
  }
  .td-cta-meta, .td-owner-row, .td-not-claimable, .td-signin-cta {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 600;
    color: color-mix(in srgb, var(--color-text) 65%, transparent);
  }
  .td-not-claimable { color: var(--color-warning); }
  .td-action-buttons { display: flex; gap: 10px; }
  .td-delete {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 9px 16px;
    border-radius: 9999px;
    border: 1px solid color-mix(in srgb, var(--color-error) 30%, transparent);
    background: transparent;
    color: var(--color-error);
    font-family: inherit;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all .15s;
  }
  .td-delete:hover { background: color-mix(in srgb, var(--color-error) 10%, transparent); }
  .td-delete:disabled { opacity: 0.5; cursor: not-allowed; }
  .spin { animation: spin .75s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes td-shimmer { to { background-position: -200% 0; } }
</style>
