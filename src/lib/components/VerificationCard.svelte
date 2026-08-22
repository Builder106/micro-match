<script lang="ts">
  import Icon from "@iconify/svelte";
  import CustomSelect from '$lib/components/CustomSelect.svelte';
  import { onMount } from 'svelte';
  import { account } from '$lib/appwrite.client';
  import type { NgoVerification } from '$lib/types';

  let verification: NgoVerification | null = null;
  let loading = true;
  let editing = false;

  // Form state
  let orgName = '';
  let country = 'US';
  let taxId = '';
  let docFileId: string | undefined = undefined;
  let docName = '';
  let uploading = false;
  let submitting = false;
  let formError: string | null = null;

  const COUNTRIES: Array<{ code: string; name: string; flag: string }> = [
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
    { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
    { code: 'IN', name: 'India', flag: '🇮🇳' },
    { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
    { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'OTHER', name: 'Other / not listed', flag: '🌍' }
  ];

  $: selectedCountry = COUNTRIES.find((c) => c.code === country) ?? COUNTRIES[COUNTRIES.length - 1];
  $: taxIdLabel = country === 'US' ? 'EIN (Federal Tax ID)'
    : country === 'GB' ? 'Charity Commission number'
    : country === 'CA' ? 'CRA Charity Registration #'
    : 'Registration / charity number';
  $: taxIdPlaceholder = country === 'US' ? '12-3456789' : '';

  async function load() {
    loading = true;
    try {
      const res = await fetch('/api/verifications/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        verification = data.verification ?? null;
      }
    } finally {
      loading = false;
    }
  }
  onMount(load);

  function openForm() {
    if (verification) {
      orgName = verification.orgName;
      country = verification.country;
      taxId = verification.taxId;
      docFileId = verification.docFileId;
      docName = verification.docFileId ? 'document on file' : '';
    } else {
      orgName = '';
      country = 'US';
      taxId = '';
      docFileId = undefined;
      docName = '';
    }
    formError = null;
    editing = true;
  }

  async function handleFileChange(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    uploading = true;
    formError = null;
    try {
      const jwt = await account.createJWT().then((j) => j?.jwt).catch(() => null);
      const headers: Record<string, string> = {};
      if (jwt) headers.Authorization = `Bearer ${jwt}`;
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/verifications/upload', { method: 'POST', body: form, credentials: 'include', headers });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Upload failed');
      docFileId = data.fileId;
      docName = file.name;
    } catch (err) {
      formError = (err as Error).message;
    } finally {
      uploading = false;
    }
  }

  async function submitForm() {
    formError = null;
    if (!orgName.trim()) { formError = 'Org name is required.'; return; }
    if (!taxId.trim()) { formError = `${taxIdLabel} is required.`; return; }
    submitting = true;
    try {
      const res = await fetch('/api/verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orgName: orgName.trim(), country, taxId: taxId.trim(), docFileId })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Submission failed');
      verification = data.verification;
      editing = false;
    } catch (err) {
      formError = (err as Error).message;
    } finally {
      submitting = false;
    }
  }

  async function withdraw() {
    if (!confirm('Withdraw this verification submission? You can resubmit anytime.')) return;
    submitting = true;
    try {
      const res = await fetch('/api/verifications/me', { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        verification = null;
      }
    } finally {
      submitting = false;
    }
  }

  function relativeDate(iso?: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const diff = Date.now() - d.getTime();
    const day = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (day < 1) return 'today';
    if (day === 1) return 'yesterday';
    if (day < 7) return `${day} days ago`;
    return d.toLocaleDateString();
  }
</script>

<section class="vc brand-card">
  <div class="vc-blob"></div>
  <header class="vc-head">
    <div>
      <h2>Verification</h2>
    </div>
    {#if !loading && verification}
      {#if verification.status === 'approved'}
        <span class="vc-status status-approved"><Icon icon="lucide:check-circle-2" width="14" height="14" /> Verified NGO</span>
      {:else if verification.status === 'pending'}
        <span class="vc-status status-pending"><Icon icon="lucide:hourglass" width="14" height="14" /> Under review</span>
      {:else if verification.status === 'rejected'}
        <span class="vc-status status-rejected"><Icon icon="lucide:alert-circle" width="14" height="14" /> Needs changes</span>
      {/if}
    {/if}
  </header>

  {#if loading}
    <p class="vc-body">Loading…</p>
  {:else if editing}
    <!-- ───── Submission form ───── -->
    <form class="vc-form" onsubmit={(e) => { e.preventDefault(); submitForm(); }}>
      <label class="vc-field">
        <span>Organization name</span>
        <input type="text" bind:value={orgName} placeholder="Doctors Without Borders" autocomplete="organization" required />
      </label>

      <div class="vc-row">
        <label class="vc-field">
          <span>Country</span>
          <CustomSelect bind:value={country} ariaLabel="Country" options={COUNTRIES.map((c) => ({ value: c.code, label: `${c.flag} ${c.name}` }))} />
        </label>
        <label class="vc-field">
          <span>{taxIdLabel}</span>
          <input type="text" bind:value={taxId} placeholder={taxIdPlaceholder} required />
        </label>
      </div>

      <div class="vc-field">
        <span>Supporting document <small>(optional, helps speed up review)</small></span>
        <label class="vc-upload">
          {#if uploading}
            <Icon icon="lucide:loader-2" width="16" height="16" class="spin" />
            Uploading…
          {:else if docName}
            <Icon icon="lucide:check-circle-2" width="16" height="16" />
            {docName}
          {:else}
            <Icon icon="lucide:upload" width="16" height="16" />
            Upload PDF / image (max 10 MB)
          {/if}
          <input type="file" accept=".pdf,image/png,image/jpeg,image/webp" onchange={handleFileChange} />
        </label>
        <small class="vc-hint">e.g. IRS determination letter, charity commission certificate, incorporation document.</small>
      </div>

      {#if formError}
        <div class="vc-error"><Icon icon="lucide:alert-circle" width="14" height="14" />{formError}</div>
      {/if}

      <div class="vc-actions">
        <button type="submit" class="btn-coral" disabled={submitting || uploading}>
          {#if submitting}
            <Icon icon="lucide:loader-2" width="16" height="16" class="spin" />
          {/if}
          {verification ? 'Resubmit for review' : 'Submit for review'}
        </button>
        <button type="button" class="vc-cancel" onclick={() => (editing = false)} disabled={submitting}>Cancel</button>
      </div>
    </form>
  {:else if !verification}
    <!-- ───── Not submitted ───── -->
    <p class="vc-body">Volunteers see your tasks with an <strong>Unverified</strong> chip until your org is verified. Submit your registration number to remove it.</p>
    <div class="vc-actions">
      <button class="btn-coral" onclick={openForm}>
        Verify your org
        <Icon icon="lucide:arrow-right" width="14" height="14" />
      </button>
    </div>
  {:else if verification.status === 'pending'}
    <!-- ───── Pending ───── -->
    <p class="vc-body">Submitted {relativeDate(verification.submittedAt)} <span class="pipe-sep">|</span> usually 1–2 business days. We'll email you when it's done.</p>
    <ul class="vc-meta">
      <li><span>Org</span> <strong>{verification.orgName}</strong></li>
      <li><span>{taxIdLabel}</span> <strong>{verification.taxId}</strong></li>
      <li><span>Country</span> <strong>{selectedCountry.flag} {selectedCountry.name}</strong></li>
      {#if verification.docFileId}<li><span>Document</span> <strong><Icon icon="lucide:paperclip" width="12" height="12" /> on file</strong></li>{/if}
    </ul>
    <div class="vc-actions">
      <button class="btn-outline-dark btn-sm" onclick={openForm}>Update</button>
      <button class="vc-withdraw" onclick={withdraw} disabled={submitting}>Withdraw</button>
    </div>
  {:else if verification.status === 'approved'}
    <!-- ───── Approved ───── -->
    <p class="vc-body">Approved {relativeDate(verification.reviewedAt)}. Tasks you post show a <strong>Verified</strong> chip.</p>
  {:else}
    <!-- ───── Rejected ───── -->
    {#if verification.reason}
      <blockquote class="vc-reason">{verification.reason}</blockquote>
    {:else}
      <p class="vc-body">Your submission needs changes before it can be approved.</p>
    {/if}
    <p class="vc-meta-line">Reviewed {relativeDate(verification.reviewedAt)}.</p>
    <div class="vc-actions">
      <button class="btn-coral" onclick={openForm}>
        Resubmit
        <Icon icon="lucide:arrow-right" width="14" height="14" />
      </button>
    </div>
  {/if}
</section>

<style>
  .vc { position: relative; overflow: hidden; padding: 28px; }
  .vc-blob { position: absolute; top: -50%; right: -10%; width: 280px; height: 280px; border-radius: 50%; background: rgba(255, 107, 107, 0.12); filter: blur(80px); pointer-events: none; }

  .vc-head { position: relative; display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
  .vc-head h2 { font-size: 20px; font-weight: 700; margin: 0; }

  .vc-status { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; }
  .status-approved { background: #D1FAE5; color: #047857; }
  .status-pending { background: #FEF3C7; color: #92400E; }
  .status-rejected { background: #FEE2E2; color: #B91C1C; }

  .vc-body { position: relative; color: color-mix(in srgb, var(--color-text) 70%, transparent); font-size: 14px; line-height: 1.6; margin: 0 0 16px; }

  .vc-meta { position: relative; list-style: none; padding: 0; margin: 0 0 16px; display: grid; gap: 8px; font-size: 13px; }
  .vc-meta li { display: flex; gap: 12px; align-items: baseline; padding: 8px 12px; background: color-mix(in srgb, var(--color-text) 3%, transparent); border-radius: 10px; }
  .vc-meta li span { color: color-mix(in srgb, var(--color-text) 55%, transparent); font-weight: 600; min-width: 100px; flex-shrink: 0; }
  .vc-meta li strong { color: var(--color-text); font-weight: 700; display: inline-flex; align-items: center; gap: 4px; }

  .vc-meta-line { position: relative; color: color-mix(in srgb, var(--color-text) 55%, transparent); font-size: 12px; margin: 0 0 16px; }

  .vc-reason { position: relative; margin: 0 0 12px; padding: 12px 16px; background: color-mix(in srgb, var(--color-warning) 12%, transparent); border-left: 4px solid var(--color-warning); border-radius: 8px; font-size: 14px; color: color-mix(in srgb, var(--color-text) 85%, transparent); line-height: 1.5; font-style: italic; }

  .vc-actions { position: relative; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

  /* Form */
  .vc-form { position: relative; display: flex; flex-direction: column; gap: 16px; }
  .vc-row { display: grid; grid-template-columns: 1fr 1.5fr; gap: 12px; }
  @media (max-width: 540px) { .vc-row { grid-template-columns: 1fr; } }
  .vc-field { display: flex; flex-direction: column; gap: 6px; }
  .vc-field > span { font-size: 13px; font-weight: 700; color: var(--color-text); }
  .vc-field > span small { font-weight: 500; color: color-mix(in srgb, var(--color-text) 50%, transparent); margin-left: 4px; }
  .vc-field input, .vc-field select {
    padding: 12px 14px;
    border: 1px solid var(--card-border-strong);
    border-radius: 12px;
    background: var(--color-surface-variant);
    color: var(--color-text);
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    transition: all .2s;
  }
  .vc-field input:focus, .vc-field select:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.12); }

  .vc-upload {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 14px;
    border: 1px dashed var(--card-border-strong);
    border-radius: 12px;
    background: var(--color-surface-variant);
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    color: color-mix(in srgb, var(--color-text) 70%, transparent);
    transition: all .15s;
  }
  .vc-upload:hover { border-color: var(--color-primary); color: var(--color-text); }
  .vc-upload input[type="file"] { display: none; }

  .vc-hint { font-size: 12px; color: color-mix(in srgb, var(--color-text) 55%, transparent); }

  .vc-error { display: inline-flex; align-items: center; gap: 6px; padding: 10px 12px; background: color-mix(in srgb, var(--color-error) 10%, transparent); color: var(--color-error); border-radius: 10px; font-size: 13px; font-weight: 600; }

  .vc-cancel, .vc-withdraw {
    background: none;
    border: none;
    padding: 0 8px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    color: color-mix(in srgb, var(--color-text) 60%, transparent);
    cursor: pointer;
  }
  .vc-cancel:hover { color: var(--color-text); }
  .vc-withdraw { color: var(--color-error); }
  .vc-withdraw:hover { text-decoration: underline; }
</style>
