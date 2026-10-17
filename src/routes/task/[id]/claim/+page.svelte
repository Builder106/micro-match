<script lang="ts">
  import { page } from '$app/state';
  import Seo from '$lib/components/Seo.svelte';
  import Link from '$lib/components/Link.svelte';
  import PatchPreview from '$lib/components/PatchPreview.svelte';
  import { callApi } from '$lib/api';
  import { go } from '$lib/go';
  import { isHttpUrl, NOTES_MAX } from '$lib/claim';
  import { minutesLabel } from '$lib/time';
  import type { Locale } from '$lib/locale';
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
      fallback: 'Could not send your work.'
    });
    submitting = false;
    if (res.ok) await go('/dashboard?pinned=1', locale, { invalidateAll: true });
    else error = res.error;
  }
</script>

<Seo title="Send your work: {data.task.title} | MicroMatch" description="Send a link to your finished work and a note to the nonprofit that posted this task." noindex />

<div class="claim">
  <form class="claim__form" onsubmit={submit} novalidate>
    <p class="crumbs"><Link href="/task/{data.task.id}" class="link">Back to the task</Link></p>
    <h1 class="display h-l" tabindex="-1">Send your work</h1>
    <p class="lede">{data.task.title}</p>

    <div class="field">
      <label for="proof">Link to your work</label>
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
        {#if touched && !urlOk}A full link starting with https:// or http://.{:else}A document, shared folder, pull request or design file the nonprofit can open.{/if}
      </span>
    </div>

    <div class="field">
      <label for="notes">A note for the reviewer <span class="muted">(optional)</span></label>
      <textarea id="notes" class="input" maxlength={NOTES_MAX} bind:value={notes} placeholder="What you did, anything they should check, anything you were unsure about."></textarea>
      <span class="hint num">{notes.length} of {NOTES_MAX}</span>
    </div>

    {#if error}<p class="notice notice--error" role="alert">{error}</p>{/if}

    <div class="ctas">
      <button class="patch-btn" type="submit" disabled={submitting}>{submitting ? 'Sending...' : 'Pin it for review'}</button>
      <Link href="/task/{data.task.id}" class="patch-btn patch-btn--plain">Not yet</Link>
    </div>
  </form>

  <aside class="claim__patch" aria-label="The patch this becomes">
    <PatchPreview color={data.patch?.color} icon={data.patch?.icon} size="9rem" pinned />
    <p>
      Your work is <strong>pinned</strong> until a person at the nonprofit reviews it.
      {#if data.patch?.label}Once approved it is sewn in as a {data.patch.label} patch.{:else}Once approved it is sewn in as a plain patch.{/if}
    </p>
    <p class="small muted">{minutesLabel(data.task.estimatedMinutes)} task. Notes go through content safety before they are saved.</p>
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
