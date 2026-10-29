<script lang="ts">
  import { onMount } from 'svelte';
  import Seo from '#lib/components/Seo.svelte';
  import AccountTabs from '#lib/components/AccountTabs.svelte';
  import { callApi } from '#lib/api.js';
  import { relativeTime } from '#lib/time.js';
  import { countryName } from '#lib/verification.js';
  import type { NgoVerification } from '#lib/types.js';
  import * as m from '#lib/paraglide/messages.js';

  type Row = NgoVerification & {
    propublica?: { found: true; orgName: string; status: 'active' | 'revoked' | 'unknown'; ntee?: string; rulingDate?: string } | { found: false; error?: string } | null;
  };
  type Tab = 'pending' | 'approved' | 'rejected' | 'all';

  let rows = $state<Row[]>([]);
  let loading = $state(true);
  let loadError = $state('');
  let tab = $state<Tab>('pending');
  let working = $state<string | null>(null);
  let note = $state('');
  let rejecting = $state<Row | null>(null);
  let reason = $state('');
  let dialog = $state<HTMLDialogElement>();

  const counts = $derived({
    pending: rows.filter((r) => r.status === 'pending').length,
    approved: rows.filter((r) => r.status === 'approved').length,
    rejected: rows.filter((r) => r.status === 'rejected').length,
    all: rows.length
  });
  const shown = $derived(tab === 'all' ? rows : rows.filter((r) => r.status === tab));
  const tabs: { id: Tab; label: () => string }[] = [
    { id: 'pending', label: m.admin_tab_pending },
    { id: 'approved', label: m.admin_tab_approved },
    { id: 'rejected', label: m.admin_tab_rejected },
    { id: 'all', label: m.admin_tab_all }
  ];
  const statusName = { pending: m.admin_status_pending, approved: m.admin_status_approved, rejected: m.admin_status_rejected };

  async function load() {
    loading = true;
    const res = await callApi<{ verifications: Row[] }>('/api/verifications', { fallback: m.admin_load_error() });
    loading = false;
    if (res.ok) rows = res.data.verifications ?? [];
    else loadError = res.error;
  }
  onMount(load);

  const emailNote = (d: { email?: { ok?: boolean } }) => (d.email?.ok ? m.admin_email_sent() : m.admin_email_not_sent());

  async function approve(r: Row) {
    working = r.userId;
    const res = await callApi<{ tasksUpdated?: number; email?: { ok?: boolean } }>(`/api/verifications/${r.userId}/approve`, { method: 'POST', fallback: m.admin_approve_error() });
    working = null;
    note = res.ok ? `${m.admin_approved({ org: r.orgName, count: res.data.tasksUpdated ?? 0 })} ${emailNote(res.data)}` : res.error;
    if (res.ok) await load();
  }

  function askReject(r: Row) {
    rejecting = r;
    reason = '';
    dialog?.showModal();
  }

  async function reject(e: SubmitEvent) {
    e.preventDefault();
    if (!rejecting || !reason.trim()) return;
    const r = rejecting;
    working = r.userId;
    const res = await callApi<{ email?: { ok?: boolean } }>(`/api/verifications/${r.userId}/reject`, { body: { reason: reason.trim() }, fallback: m.admin_reject_error() });
    working = null;
    dialog?.close();
    note = res.ok ? `${m.admin_rejected({ org: r.orgName })} ${emailNote(res.data)}` : res.error;
    if (res.ok) await load();
  }
</script>

<Seo title={m.admin_meta_title()} description={m.admin_meta_description()} noindex />

<AccountTabs />

<header class="page-head">
  <h1 class="display h-l" tabindex="-1">{m.nav_verifications()}</h1>
  <p class="lede">{m.admin_lede()}</p>
</header>

<div class="tabs" role="tablist" aria-label={m.admin_tabs_label()}>
  {#each tabs as t (t.id)}
    <button type="button" role="tab" aria-selected={tab === t.id} onclick={() => (tab = t.id)}>{t.label()} <span class="num">{counts[t.id]}</span></button>
  {/each}
</div>

{#if note}<p class="notice notice--ok" role="status">{note}</p>{/if}

{#if loading}
  <p class="muted">{m.admin_loading()}</p>
{:else if loadError}
  <p class="notice notice--error" role="alert">{loadError}</p>
{:else if shown.length === 0}
  <p class="muted">{tab === 'pending' ? m.admin_none_pending() : m.admin_none()}</p>
{:else}
  <ul class="queue">
    {#each shown as r (r.id)}
      <li class="app">
        <div class="app__head">
          <h2>{r.orgName}</h2>
          <span class="small muted">{m.admin_row_meta({ country: countryName(r.country), time: relativeTime(r.submittedAt), status: statusName[r.status]() })}</span>
        </div>
        <dl>
          <div><dt>{m.admin_reg_number()}</dt><dd><code>{r.taxId}</code></dd></div>
          {#if r.propublica}
            <div>
              <dt>ProPublica</dt>
              <dd>
                {#if r.propublica.found}
                  {m.admin_propublica({ org: r.propublica.orgName, status: r.propublica.status })}{r.propublica.rulingDate ? m.admin_ruling({ date: r.propublica.rulingDate }) : ''}
                {:else}
                  {m.admin_no_match()}{r.propublica.error ? ` (${r.propublica.error})` : ''}
                {/if}
              </dd>
            </div>
          {/if}
          {#if r.docFileId}
            <div>
              <dt>{m.admin_document()}</dt>
              <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- an API file download, not a page route -->
              <dd><a class="link" href="/api/verifications/{r.userId}/document" target="_blank" rel="noopener">{m.admin_open_document()}</a></dd>
            </div>
          {/if}
          {#if r.reason}<div><dt>{m.admin_reason_given()}</dt><dd>{r.reason}</dd></div>{/if}
        </dl>
        {#if r.status === 'pending'}
          <div class="ctas">
            <button type="button" class="patch-btn patch-btn--small" disabled={working === r.userId} onclick={() => approve(r)}>{m.action_approve()}</button>
            <button type="button" class="patch-btn patch-btn--plain patch-btn--small" disabled={working === r.userId} onclick={() => askReject(r)}>{m.action_reject()}</button>
          </div>
        {/if}
      </li>
    {/each}
  </ul>
{/if}

<dialog class="confirm" bind:this={dialog} aria-labelledby="reject-title">
  <form onsubmit={reject}>
    <h2 id="reject-title" class="h-m">{m.admin_reject_title({ org: rejecting?.orgName ?? '' })}</h2>
    <div class="field">
      <label for="reason">{m.admin_reason_label()}</label>
      <textarea id="reason" class="input" required bind:value={reason}></textarea>
    </div>
    <div class="ctas">
      <button type="submit" class="patch-btn" disabled={!reason.trim()}>{m.admin_reject_send()}</button>
      <button type="button" class="patch-btn patch-btn--plain" onclick={() => dialog?.close()}>{m.action_cancel()}</button>
    </div>
  </form>
</dialog>

<style>
  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-bottom: 1.25rem;
  }
  .tabs button {
    min-height: 2.4rem;
    padding: 0.35rem 0.85rem;
    border-radius: var(--radius);
    box-shadow: inset 0 0 0 1.5px var(--c-line);
  }
  .tabs button[aria-selected='true'] {
    background: var(--c-fg);
    color: var(--c-bg);
    box-shadow: none;
  }
  .queue {
    list-style: none;
    padding: 0;
    display: grid;
    gap: 1rem;
  }
  .app {
    display: grid;
    gap: 0.9rem;
    padding: 1.2rem 1.3rem;
    border-radius: var(--radius);
    background: var(--c-card);
    box-shadow: inset 0 0 0 1.5px var(--c-line);
  }
  .app h2 {
    font-family: var(--f-display);
    font-weight: 700;
    font-size: 1.15rem;
  }
  dl {
    display: grid;
    gap: 0.5rem;
  }
  dt {
    font-size: var(--t-xs);
    color: var(--c-muted);
  }
  dd {
    margin: 0;
  }
  .confirm {
    max-width: 30rem;
    width: calc(100vw - 2rem);
    padding: 1.6rem;
    border: 0;
    border-radius: var(--radius);
    background: var(--c-paper);
    color: var(--c-fg);
    box-shadow: 0 0 0 1.5px var(--c-fg), 0 20px 50px color-mix(in srgb, var(--c-shade) 35%, transparent);
  }
  .confirm form {
    display: grid;
    gap: 1rem;
  }
  .confirm::backdrop {
    background: color-mix(in srgb, var(--c-shade) 45%, transparent);
  }
</style>
