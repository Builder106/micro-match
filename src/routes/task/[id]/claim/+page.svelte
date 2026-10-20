<script lang="ts">
  import { page } from '$app/state';
  import Seo from '$lib/components/Seo.svelte';
  import Link from '$lib/components/Link.svelte';
  import Rich from '$lib/components/Rich.svelte';
  import PatchPreview from '$lib/components/PatchPreview.svelte';
  import { callApi } from '$lib/api';
  import { go } from '$lib/go';
  import { isHttpUrl, NOTES_MAX } from '$lib/claim';
  import { minutesLabel } from '$lib/time';
  import { taskLang } from '$lib/translation';
  import type { Locale } from '$lib/locale';
  import * as m from '$lib/paraglide/messages.js';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  const locale = $derived((page.data.locale as Locale | undefined) ?? 'en');

  let proofUrl = $state('');
  let notes = $state('');
  let touched = $state(false);
  let submitting = $state(false);
  let error = $state('');
  const urlOk = $derived(isHttpUrl(proofUrl));

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    touched = true;
    if (!urlOk) return;
    submitting = true;
    error = '';
    const res = await callApi(`/api/tasks/${data.task.id}/claim`, {
      body: { proofUrl: proofUrl.trim(), notes: notes.trim() || undefined },
      fallback: m.claim_error()
    });
    submitting = false;
    if (res.ok) await go('/dashboard?pinned=1', locale, { invalidateAll: true });
    else error = res.error;
  }
</script>

<Seo title={m.claim_meta_title({ task: data.task.title })} description={m.claim_meta_description()} noindex />

<div class="claim">
  <form class="claim__form" onsubmit={submit} novalidate>
    <p class="crumbs"><Link href="/task/{data.task.id}" class="link">{m.claim_back()}</Link></p>
    <h1 class="display h-l" tabindex="-1">{m.claim_title()}</h1>
    <p class="lede" lang={taskLang(data.task.language)}>{data.task.title}</p>

    <div class="field">
      <label for="proof">{m.claim_proof_label()}</label>
      <input
        id="proof"
        class="input"
        type="url"
        inputmode="url"
        autocomplete="url"
        placeholder="https://docs.google.com/..."
        bind:value={proofUrl}
        onblur={() => (touched = true)}
        aria-invalid={touched && !urlOk}
        aria-describedby="proof-hint"
        required
      />
      <span class="hint" id="proof-hint">
        {touched && !urlOk ? m.claim_proof_invalid() : m.claim_proof_hint()}
      </span>
    </div>

    <div class="field">
      <label for="notes">{m.claim_notes_label()} <span class="muted">{m.field_optional()}</span></label>
      <textarea id="notes" class="input" maxlength={NOTES_MAX} bind:value={notes} placeholder={m.claim_notes_placeholder()}></textarea>
      <span class="hint num">{m.count_of({ count: notes.length, max: NOTES_MAX })}</span>
    </div>

    {#if error}<p class="notice notice--error" role="alert">{error}</p>{/if}

    <div class="ctas">
      <button class="patch-btn" type="submit" disabled={submitting}>{submitting ? m.status_sending() : m.claim_submit()}</button>
      <Link href="/task/{data.task.id}" class="patch-btn patch-btn--plain">{m.claim_not_yet()}</Link>
    </div>
  </form>

  <aside class="claim__patch" aria-label={m.claim_patch_label()}>
    <PatchPreview color={data.patch?.color} icon={data.patch?.icon} size="9rem" pinned />
    <p>
      <Rich text={m.claim_pinned()} />
      {data.patch?.label ? m.claim_sewn_named({ patch: data.patch.label }) : m.claim_sewn_plain()}
    </p>
    <p class="small muted">{m.claim_safety({ length: minutesLabel(data.task.estimatedMinutes) })}</p>
  </aside>
</div>

<style>
  .claim {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 16rem;
    gap: clamp(1.5rem, 4vw, 3.5rem);
    align-items: start;
  }
  .claim__form {
    display: grid;
    gap: 1.25rem;
    max-width: 38rem;
  }
  .crumbs {
    font-size: var(--t-s);
  }
  .claim__patch {
    display: grid;
    gap: 1rem;
    justify-items: start;
    padding: 1.5rem;
    border-radius: var(--radius);
    background: var(--c-sash);
  }
  @media (max-width: 799px) {
    .claim {
      grid-template-columns: 1fr;
    }
  }
</style>
