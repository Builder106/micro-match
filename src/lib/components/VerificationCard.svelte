<script lang="ts">
  // A nonprofit's verification: its status, and the form to send or update it.
  import { onMount } from 'svelte';
  import { callApi } from '$lib/api';
  import { relativeTime } from '$lib/time';
  import { COUNTRIES, taxIdLabel } from '$lib/verification';
  import type { NgoVerification } from '$lib/types';

  let verification = $state<NgoVerification | null>(null);
  let loading = $state(true);
  let editing = $state(false);
  let orgName = $state('');
  let country = $state('US');
  let taxId = $state('');
  let docFileId = $state<string | undefined>();
  let docName = $state('');
  let uploading = $state(false);
  let submitting = $state(false);
  let error = $state('');

  onMount(async () => {
    const res = await callApi<{ verification?: NgoVerification | null }>('/api/verifications/me');
    if (res.ok) verification = res.data.verification ?? null;
    loading = false;
  });

  function open() {
    orgName = verification?.orgName ?? '';
    country = verification?.country ?? 'US';
    taxId = verification?.taxId ?? '';
    docFileId = verification?.docFileId;
    docName = verification?.docFileId ? 'Document on file' : '';
    error = '';
    editing = true;
  }

  async function upload(e: Event) {
    const file = (e.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return;
    uploading = true;
    error = '';
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/verifications/upload', { method: 'POST', body: form, credentials: 'include' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || 'Upload failed');
      docFileId = body.fileId;
      docName = file.name;
    } catch (err) {
      error = (err as Error).message;
    } finally {
      uploading = false;
    }
  }

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    if (!orgName.trim()) return void (error = 'Add your organization name.');
    if (!taxId.trim()) return void (error = `Add your ${taxIdLabel(country).toLowerCase()}.`);
    submitting = true;
    const res = await callApi<{ verification: NgoVerification }>('/api/verifications', {
      body: { orgName: orgName.trim(), country: country === 'OTHER' ? 'ZZ' : country, taxId: taxId.trim(), docFileId },
      fallback: 'Could not send your verification.'
    });
    submitting = false;
    if (res.ok) {
      verification = res.data.verification;
      editing = false;
    } else error = res.error;
  }

  async function withdraw() {
    if (!confirm('Withdraw your verification? You can send it again at any time.')) return;
    const res = await callApi('/api/verifications/me', { method: 'DELETE' });
    if (res.ok) verification = null;
  }
</script>

<section class="vcard" aria-labelledby="vcard-title">
  <h2 id="vcard-title" class="h-m">Verification</h2>
  {#if loading}
    <p class="muted">Checking your verification...</p>
  {:else if editing}
    <form class="vcard__form" onsubmit={submit}>
      <div class="field">
        <label for="v-org">Organization name</label>
        <input id="v-org" class="input" bind:value={orgName} required />
      </div>
      <div class="field">
        <label for="v-country">Country</label>
        <select id="v-country" class="input" bind:value={country}>
          {#each COUNTRIES as c (c.code)}<option value={c.code}>{c.name}</option>{/each}
        </select>
      </div>
      <div class="field">
        <label for="v-tax">{taxIdLabel(country)}</label>
        <input id="v-tax" class="input" bind:value={taxId} placeholder={country === 'US' ? '12-3456789' : ''} required />
        {#if country === 'US'}<span class="hint">An admin checks US EINs against the ProPublica Nonprofit Explorer.</span>{/if}
      </div>
      <div class="field">
        <label for="v-doc">Registration document {country === 'US' ? '(optional)' : ''}</label>
        <input id="v-doc" type="file" accept="application/pdf,image/png,image/jpeg" onchange={upload} />
        <span class="hint">{uploading ? 'Uploading...' : docName || 'PDF, PNG or JPEG.'}</span>
      </div>
      {#if error}<p class="notice notice--error" role="alert">{error}</p>{/if}
      <div class="ctas">
        <button class="patch-btn patch-btn--small" type="submit" disabled={submitting || uploading}>{submitting ? 'Sending...' : 'Send for review'}</button>
        <button class="patch-btn patch-btn--plain patch-btn--small" type="button" onclick={() => (editing = false)}>Cancel</button>
      </div>
    </form>
  {:else if !verification}
    <p>Not verified yet. Until an admin approves your organization, your tasks stay out of the public feed.</p>
    <button class="patch-btn patch-btn--small" type="button" onclick={open}>Verify your organization</button>
  {:else}
    <p class="vcard__status vcard__status--{verification.status}">
      {#if verification.status === 'approved'}
        Verified. {verification.orgName}'s tasks show the verified mark.
      {:else if verification.status === 'pending'}
        Waiting for an admin. Sent {relativeTime(verification.submittedAt)}.
      {:else}
        Not approved{verification.reason ? `: ${verification.reason}` : '.'} You can update it and send it again.
      {/if}
    </p>
    <div class="ctas">
      <button class="patch-btn patch-btn--plain patch-btn--small" type="button" onclick={open}>{verification.status === 'rejected' ? 'Update and resend' : 'Edit details'}</button>
      {#if verification.status !== 'approved'}<button class="link small" type="button" onclick={withdraw}>Withdraw</button>{/if}
    </div>
  {/if}
</section>

<style>
  .vcard {
    display: grid;
    gap: 0.9rem;
    padding: 1.3rem 1.4rem;
    border-radius: var(--radius);
    background: #fff;
    box-shadow: inset 0 0 0 1.5px var(--c-line);
  }
  .vcard__form {
    display: grid;
    gap: 0.9rem;
  }
  .vcard__status {
    padding-left: 0.9rem;
    border-left: 3px dashed var(--c-weld);
  }
  .vcard__status--approved {
    border-left-color: var(--c-ok);
  }
  .vcard__status--rejected {
    border-left-color: var(--c-danger);
  }
</style>
