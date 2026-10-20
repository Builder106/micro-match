<script lang="ts">
  // A nonprofit's verification: its status, and the form to send or update it.
  import { onMount } from 'svelte';
  import { callApi } from '$lib/api';
  import { relativeTime } from '$lib/time';
  import { COUNTRIES, countryName, taxIdLabel } from '$lib/verification';
  import type { NgoVerification } from '$lib/types';
  import * as m from '$lib/paraglide/messages.js';

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
    docName = verification?.docFileId ? m.vcard_doc_on_file() : '';
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
      if (!res.ok) throw new Error(body?.error || m.upload_failed());
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
    if (!orgName.trim()) return void (error = m.vcard_need_org());
    if (!taxId.trim()) return void (error = m.vcard_need_tax({ label: taxIdLabel(country) }));
    submitting = true;
    const res = await callApi<{ verification: NgoVerification }>('/api/verifications', {
      body: { orgName: orgName.trim(), country: country === 'OTHER' ? 'ZZ' : country, taxId: taxId.trim(), docFileId },
      fallback: m.vcard_error()
    });
    submitting = false;
    if (res.ok) {
      verification = res.data.verification;
      editing = false;
    } else error = res.error;
  }

  async function withdraw() {
    if (!confirm(m.vcard_withdraw_confirm())) return;
    const res = await callApi('/api/verifications/me', { method: 'DELETE' });
    if (res.ok) verification = null;
  }
</script>

<section class="vcard" aria-labelledby="vcard-title">
  <h2 id="vcard-title" class="h-m">{m.docs_ngo_verify_title()}</h2>
  {#if loading}
    <p class="muted">{m.vcard_loading()}</p>
  {:else if editing}
    <form class="vcard__form" onsubmit={submit}>
      <div class="field">
        <label for="v-org">{m.field_org_name()}</label>
        <input id="v-org" class="input" bind:value={orgName} required />
      </div>
      <div class="field">
        <label for="v-country">{m.vcard_country()}</label>
        <select id="v-country" class="input" bind:value={country}>
          {#each COUNTRIES as c (c)}<option value={c}>{countryName(c)}</option>{/each}
        </select>
      </div>
      <div class="field">
        <label for="v-tax">{taxIdLabel(country)}</label>
        <input id="v-tax" class="input" bind:value={taxId} placeholder={country === 'US' ? '12-3456789' : ''} required />
        {#if country === 'US'}<span class="hint">{m.vcard_us_hint()}</span>{/if}
      </div>
      <div class="field">
        <label for="v-doc">{m.vcard_doc()} {country === 'US' ? m.field_optional() : ''}</label>
        <input id="v-doc" type="file" accept="application/pdf,image/png,image/jpeg" onchange={upload} />
        <span class="hint">{uploading ? m.status_uploading() : docName || m.vcard_doc_types()}</span>
      </div>
      {#if error}<p class="notice notice--error" role="alert">{error}</p>{/if}
      <div class="ctas">
        <button class="patch-btn patch-btn--small" type="submit" disabled={submitting || uploading}>{submitting ? m.status_sending() : m.vcard_send()}</button>
        <button class="patch-btn patch-btn--plain patch-btn--small" type="button" onclick={() => (editing = false)}>{m.action_cancel()}</button>
      </div>
    </form>
  {:else if !verification}
    <p>{m.vcard_none()}</p>
    <button class="patch-btn patch-btn--small" type="button" onclick={open}>{m.vcard_start()}</button>
  {:else}
    <p class="vcard__status vcard__status--{verification.status}">
      {#if verification.status === 'approved'}
        {m.vcard_approved({ org: verification.orgName })}
      {:else if verification.status === 'pending'}
        {m.vcard_pending({ time: relativeTime(verification.submittedAt) })}
      {:else}
        {verification.reason ? m.vcard_rejected_reason({ reason: verification.reason }) : m.vcard_rejected()}
      {/if}
    </p>
    <div class="ctas">
      <button class="patch-btn patch-btn--plain patch-btn--small" type="button" onclick={open}>{verification.status === 'rejected' ? m.vcard_resend() : m.vcard_edit()}</button>
      {#if verification.status !== 'approved'}<button class="link small" type="button" onclick={withdraw}>{m.vcard_withdraw()}</button>{/if}
    </div>
  {/if}
</section>

<style>
  .vcard {
    display: grid;
    gap: 0.9rem;
    padding: 1.3rem 1.4rem;
    border-radius: var(--radius);
    background: var(--c-card);
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
