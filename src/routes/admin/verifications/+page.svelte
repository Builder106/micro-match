<script lang="ts">
  import Icon from "@iconify/svelte";
  import { onMount } from 'svelte';
  import type { NgoVerification } from '$lib/types';
  import { resolve } from '$app/paths';

  type EnrichedVerification = NgoVerification & {
    propublica?:
      | { found: true; orgName: string; status: 'active' | 'revoked' | 'unknown'; ntee?: string; rulingDate?: string }
      | { found: false; error?: string }
      | null;
  };

  const COUNTRY_FLAGS: Record<string, string> = {
    US: '🇺🇸', GB: '🇬🇧', CA: '🇨🇦', AU: '🇦🇺',
    NG: '🇳🇬', IN: '🇮🇳', KE: '🇰🇪', ZA: '🇿🇦',
    DE: '🇩🇪', FR: '🇫🇷'
  };

  let rows: EnrichedVerification[] = [];
  let allRows: EnrichedVerification[] = [];
  let loading = true;
  let activeTab: 'pending' | 'approved' | 'rejected' | 'all' = 'pending';
  let counts = { pending: 0, approved: 0, rejected: 0 };

  // Reject dialog
  let rejectingUserId: string | null = null;
  let rejectReason = '';
  let working = false;
  let toast = '';

  async function load() {
    loading = true;
    try {
      const res = await fetch('/api/verifications', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        allRows = data.verifications ?? [];
        recompute();
      }
    } finally {
      loading = false;
    }
  }

  function recompute() {
    counts = {
      pending: allRows.filter((r) => r.status === 'pending').length,
      approved: allRows.filter((r) => r.status === 'approved').length,
      rejected: allRows.filter((r) => r.status === 'rejected').length
    };
    rows = activeTab === 'all' ? allRows : allRows.filter((r) => r.status === activeTab);
  }

  $: if (activeTab && (allRows.length || !loading)) recompute();

  async function approve(userId: string) {
    if (working) return;
    working = true;
    try {
      const res = await fetch(`/api/verifications/${userId}/approve`, { method: 'POST', credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast = `Approved · ${data.tasksUpdated ?? 0} tasks updated · email ${data.email?.ok ? 'sent' : 'skipped'}`;
        await load();
      } else {
        toast = data?.error || 'Failed to approve';
      }
    } finally {
      working = false;
      setTimeout(() => (toast = ''), 4000);
    }
  }

  function openReject(userId: string) {
    rejectingUserId = userId;
    rejectReason = '';
  }

  async function confirmReject() {
    if (!rejectingUserId || !rejectReason.trim()) return;
    working = true;
    try {
      const res = await fetch(`/api/verifications/${rejectingUserId}/reject`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason.trim() })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast = `Rejected · email ${data.email?.ok ? 'sent' : 'skipped'}`;
        rejectingUserId = null;
        await load();
      } else {
        toast = data?.error || 'Failed to reject';
      }
    } finally {
      working = false;
      setTimeout(() => (toast = ''), 4000);
    }
  }

  function relativeTime(iso?: string): string {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    const diff = Date.now() - then;
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'just now';
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const d = Math.floor(hr / 24);
    return `${d}d ago`;
  }

  onMount(load);
</script>

<svelte:head><title>Verification queue · MicroMatch admin</title></svelte:head>

<div class="admin-page">
  <header class="admin-head">
    <div>
      <h1>Verification queue</h1>
      <p>Review NGO submissions. Approving stamps existing tasks with the Verified chip and emails the org.</p>
    </div>
    {#if counts.pending > 0}
      <span class="admin-pending"><Icon icon="lucide:hourglass" width="14" height="14" /> {counts.pending} pending</span>
    {/if}
  </header>

  <nav class="admin-tabs">
    {#each [['pending', 'Pending', counts.pending], ['approved', 'Approved', counts.approved], ['rejected', 'Rejected', counts.rejected], ['all', 'All', allRows.length]] as [tab, label, count] (tab)}
      <button class="tab" class:active={activeTab === tab} onclick={() => (activeTab = tab as 'pending' | 'approved' | 'rejected' | 'all')}>
        {label}
        <span class="tab-count">{count}</span>
      </button>
    {/each}
  </nav>

  {#if loading}
    <p class="admin-empty">Loading…</p>
  {:else if rows.length === 0}
    <p class="admin-empty">Nothing here. ✨</p>
  {:else}
    <div class="admin-grid">
      {#each rows as v (v.userId)}
        <article class="admin-card">
          <div class="admin-card-head">
            <div>
              <h3>{v.orgName}</h3>
              <p class="admin-meta">
                <span>{COUNTRY_FLAGS[v.country] ?? '🌍'} {v.country}</span>
                <span class="pipe-sep">|</span>
                <span>{v.country === 'US' ? 'EIN' : 'ID'} {v.taxId}</span>
                <span class="pipe-sep">|</span>
                <span>{relativeTime(v.submittedAt)}</span>
              </p>
            </div>
            {#if v.status === 'pending'}
              <span class="admin-status status-pending">Pending</span>
            {:else if v.status === 'approved'}
              <span class="admin-status status-approved">Approved</span>
            {:else}
              <span class="admin-status status-rejected">Rejected</span>
            {/if}
          </div>

          {#if v.country === 'US' && v.propublica}
            <div class="propublica" class:bad={v.propublica.found === false || (v.propublica.found && v.propublica.status === 'revoked')}>
              <Icon icon={v.propublica.found && v.propublica.status === 'active' ? 'lucide:shield-check' : 'lucide:shield-alert'} width="14" height="14" />
              {#if v.propublica.found}
                <span>ProPublica: <strong>{v.propublica.orgName}</strong> <span class="pipe-sep">|</span> {v.propublica.status === 'active' ? 'active 501(c)(3)' : v.propublica.status}</span>
              {:else}
                <span>ProPublica: not found ({v.propublica.error ?? 'no record'})</span>
              {/if}
            </div>
          {/if}

          {#if v.docFileId}
            <a href={resolve(`/api/verifications/${v.userId}/document`, {})} target="_blank" rel="noopener" class="admin-doc">
              <Icon icon="lucide:paperclip" width="14" height="14" />
              View supporting document
              <Icon icon="lucide:external-link" width="12" height="12" />
            </a>
          {/if}

          {#if v.status === 'rejected' && v.reason}
            <blockquote class="admin-reason">{v.reason}</blockquote>
          {/if}

          {#if v.status === 'pending'}
            <div class="admin-actions">
              <button class="btn-reject" onclick={() => openReject(v.userId)} disabled={working}>Reject…</button>
              <button class="btn-approve" onclick={() => approve(v.userId)} disabled={working}>Approve</button>
            </div>
          {/if}
        </article>
      {/each}
    </div>
  {/if}
</div>

<!-- Reject dialog -->
{#if rejectingUserId}
  <div class="modal" role="dialog" aria-modal="true" aria-labelledby="reject-dialog-title" tabindex="-1">
    <div class="modal-card">
      <h2 id="reject-dialog-title">Reject submission</h2>
      <p>This becomes the user-facing message in their REJECTED state. Be specific so they know how to fix it.</p>
      <textarea bind:value={rejectReason} rows="4" placeholder="Document doesn't show tax-exempt status. Please upload your IRS Form 990 or determination letter." maxlength="1000"></textarea>
      <div class="modal-actions">
        <button onclick={() => (rejectingUserId = null)} disabled={working}>Cancel</button>
        <button class="btn-reject" onclick={confirmReject} disabled={working || !rejectReason.trim()}>Send rejection</button>
      </div>
    </div>
  </div>
{/if}

{#if toast}
  <div class="toast" role="status">{toast}</div>
{/if}

<style>
  .admin-page { display: flex; flex-direction: column; gap: 24px; max-width: 960px; margin: 0 auto; }
  .admin-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
  .admin-head h1 { font-size: clamp(1.5rem, 2.5vw + 0.25rem, 2.25rem); font-weight: 800; letter-spacing: -0.02em; margin: 0 0 6px; }
  .admin-head p { color: color-mix(in srgb, var(--color-text) 65%, transparent); font-size: 14px; line-height: 1.5; margin: 0; max-width: 560px; }
  .admin-pending { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: #FEF3C7; color: #92400E; border-radius: 9999px; font-size: 12px; font-weight: 700; flex-shrink: 0; }

  .admin-tabs { display: flex; gap: 8px; flex-wrap: wrap; padding-bottom: 4px; }
  .tab {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border: 1px solid var(--card-border-strong);
    background: var(--color-surface);
    border-radius: 9999px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 700;
    color: color-mix(in srgb, var(--color-text) 70%, transparent);
    cursor: pointer;
    transition: all .15s;
  }
  .tab:hover { color: var(--color-text); }
  .tab.active { background: var(--color-text); color: var(--color-surface); border-color: var(--color-text); }
  .tab-count { font-size: 11px; padding: 2px 7px; background: color-mix(in srgb, currentColor 15%, transparent); border-radius: 9999px; }

  .admin-empty { color: color-mix(in srgb, var(--color-text) 55%, transparent); font-size: 14px; padding: 32px 16px; text-align: center; }

  .admin-grid { display: flex; flex-direction: column; gap: 16px; }
  .admin-card { background: var(--color-surface); border-radius: 24px; padding: 24px; border: 1px solid var(--card-border); box-shadow: 0 12px 28px rgba(15, 23, 42, 0.04); display: flex; flex-direction: column; gap: 14px; }
  .admin-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
  .admin-card h3 { font-size: 18px; font-weight: 700; margin: 0; }
  .admin-meta { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; font-size: 13px; color: color-mix(in srgb, var(--color-text) 60%, transparent); margin: 4px 0 0; }
  .admin-status { font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 9999px; flex-shrink: 0; text-transform: uppercase; letter-spacing: 0.06em; }

  .propublica { display: inline-flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 12px; background: #DBEAFE; color: #1E40AF; font-size: 13px; font-weight: 600; }
  .propublica.bad { background: #FEE2E2; color: #B91C1C; }

  .admin-doc {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    align-self: flex-start;
    padding: 8px 12px;
    background: color-mix(in srgb, var(--color-text) 4%, transparent);
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text);
    text-decoration: none;
    transition: background .15s;
  }
  .admin-doc:hover { background: color-mix(in srgb, var(--color-text) 8%, transparent); }

  .admin-reason {
    margin: 0;
    padding: 10px 14px;
    background: color-mix(in srgb, var(--color-warning) 12%, transparent);
    border-left: 4px solid var(--color-warning);
    border-radius: 8px;
    font-size: 13px;
    font-style: italic;
    color: color-mix(in srgb, var(--color-text) 85%, transparent);
  }

  .admin-actions { display: flex; justify-content: flex-end; gap: 8px; }
  .btn-reject, .btn-approve {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 9px 16px;
    border-radius: 9999px;
    font-family: inherit;
    font-weight: 700;
    font-size: 13px;
    border: none;
    cursor: pointer;
    transition: all .15s;
  }
  .btn-reject { background: #FEE2E2; color: #B91C1C; }
  .btn-reject:hover { background: #FECACA; }
  .btn-approve { background: #D1FAE5; color: #047857; }
  .btn-approve:hover { background: #A7F3D0; }
  .btn-reject:disabled, .btn-approve:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Status chip colors */
  .status-pending { background: #FEF3C7; color: #92400E; }
  .status-approved { background: #D1FAE5; color: #047857; }
  .status-rejected { background: #FEE2E2; color: #B91C1C; }

  /* Modal */
  .modal { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); display: flex; align-items: center; justify-content: center; padding: 16px; z-index: 80; backdrop-filter: blur(4px); }
  .modal-card { background: var(--color-surface); border-radius: 24px; padding: 28px; max-width: 480px; width: 100%; box-shadow: 0 32px 80px rgba(0, 0, 0, 0.25); display: flex; flex-direction: column; gap: 16px; }
  .modal-card h2 { font-size: 20px; font-weight: 700; margin: 0; }
  .modal-card p { font-size: 14px; line-height: 1.5; color: color-mix(in srgb, var(--color-text) 65%, transparent); margin: 0; }
  .modal-card textarea {
    width: 100%;
    box-sizing: border-box;
    padding: 12px 14px;
    border: 1px solid var(--card-border-strong);
    border-radius: 12px;
    background: var(--color-surface-variant);
    color: var(--color-text);
    font-family: inherit;
    font-size: 14px;
    resize: vertical;
    min-height: 100px;
  }
  .modal-card textarea:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.12); }
  .modal-actions { display: flex; justify-content: flex-end; gap: 8px; }
  .modal-actions button:not(.btn-reject) {
    padding: 9px 16px;
    border-radius: 9999px;
    border: none;
    background: none;
    cursor: pointer;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    color: color-mix(in srgb, var(--color-text) 65%, transparent);
  }
  .modal-actions button:not(.btn-reject):hover { color: var(--color-text); }

  /* Toast */
  .toast { position: fixed; bottom: 110px; left: 50%; transform: translateX(-50%); padding: 12px 20px; background: var(--color-text); color: var(--color-surface); border-radius: 14px; font-size: 13px; font-weight: 700; z-index: 70; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2); }
</style>
