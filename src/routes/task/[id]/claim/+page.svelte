<script lang="ts">
  import Icon from "@iconify/svelte";
  import { page } from "$app/state";
  import { authHeader } from "$lib/appwrite.client";
  import { getTagStyle } from '$lib/utils/tagColors';
  import { resolve } from '$app/paths';

  export let data: {
    task: {
      id: string;
      title: string;
      shortDescription: string;
      estimatedMinutes?: number;
      tags: string[];
      isVerified?: boolean;
    };
  };

  let proofUrl = "";
  let notes = "";
  let submitting = false;
  let errorMsg: string | null = null;

  const notesMax = 1000;
  $: notesCount = notes.length;
  $: validUrl = isValidUrl(proofUrl);

  function isValidUrl(s: string): boolean {
    if (!s.trim()) return false;
    try {
      const u = new URL(s.trim());
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch { return false; }
  }

  async function submitClaim() {
    if (!validUrl) { errorMsg = 'Enter a valid http(s) URL.'; return; }
    submitting = true;
    errorMsg = null;
    try {
      const id = page.params.id;
      const headers = { 'Content-Type': 'application/json', ...(await authHeader()) } as Record<string, string>;
      const res = await fetch(`/api/tasks/${id}/claim`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ proofUrl: proofUrl.trim(), notes: notes.trim() || undefined })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        errorMsg = body?.error || 'Failed to submit';
        if (Array.isArray(body?.reasons)) errorMsg += `: ${body.reasons.join(', ')}`;
        return;
      }
      try {
        localStorage.setItem('toast', 'Submission sent for review');
        localStorage.setItem('celebrate', '1');
      } catch {}
      window.location.href = '/dashboard?celebrate=1';
    } catch (e) {
      console.error(e);
      errorMsg = e instanceof Error ? e.message : 'Something went wrong. Please try again.';
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head><title>Submit work · {data.task.title}</title></svelte:head>

<div class="cl-page">
  <a href={resolve(`/task/${data.task.id}`, {})} class="cl-back">
    <Icon icon="lucide:arrow-left" width="14" height="14" />
    Back to task
  </a>

  <!-- ───── Hero ───── -->
  <section class="cl-hero brand-card">
    <div class="cl-hero-blob"></div>
    <div class="cl-hero-text">
      <h1>Send your work for <span class="coral-gradient">review</span>.</h1>
      <p>Drop in a link to what you produced and add any context that'll help the org review it quickly.</p>
    </div>
  </section>

  <!-- ───── Task summary card ───── -->
  <aside class="cl-task brand-card">
    <div class="cl-task-icon"><Icon icon="lucide:heart-handshake" width="24" height="24" /></div>
    <div class="cl-task-meta">
      <small>You're submitting for</small>
      <h2>{data.task.title}</h2>
      <p>{data.task.shortDescription}</p>
      <div class="cl-task-chips">
        {#if typeof data.task.estimatedMinutes === 'number'}
          <span class="cl-chip cl-chip-time"><Icon icon="lucide:clock" width="12" height="12" /> {data.task.estimatedMinutes} min</span>
        {/if}
        {#each data.task.tags.slice(0, 3) as tag (tag)}
          {@const s = getTagStyle(tag)}
          <span class="cl-chip" style="background: {s.bg}; color: {s.color};">#{tag}</span>
        {/each}
      </div>
    </div>
  </aside>

  <!-- ───── Form ───── -->
  <form class="cl-form brand-card" on:submit|preventDefault={submitClaim}>
    <header class="cl-form-head">
      <h2>Your submission</h2>
      <p>Reviews typically take 24–48 hours. You'll see status changes on your dashboard and (if email's enabled) in your inbox.</p>
    </header>

    <label class="cl-field">
      <span class="cl-label">Proof URL <em>required</em></span>
      <input
        type="url"
        bind:value={proofUrl}
        placeholder="https://docs.google.com/document/d/…"
        required
      />
      <small class="cl-hint">A public link to your work — Google Doc, GitHub PR, image upload, etc.</small>
    </label>

    <label class="cl-field">
      <span class="cl-label">Notes <em class="cl-em-optional">optional</em></span>
      <textarea
        bind:value={notes}
        rows="5"
        maxlength={notesMax}
        placeholder="Describe your approach, anything you got stuck on, what reviewers should look at first."
      ></textarea>
      <div class="cl-foot-row">
        <small class="cl-hint">Helps reviewers understand the work in context.</small>
        <small class="cl-counter">{notesCount}/{notesMax}</small>
      </div>
    </label>

    {#if errorMsg}
      <div class="cl-error">
        <Icon icon="lucide:alert-circle" width="16" height="16" />
        {errorMsg}
      </div>
    {/if}

    <footer class="cl-actions">
      <a href={resolve(`/task/${data.task.id}`, {})} class="cl-cancel">Cancel</a>
      <button type="submit" class="btn-coral btn-lg" disabled={!validUrl || submitting}>
        {#if submitting}
          <Icon icon="lucide:loader-2" width="16" height="16" class="spin" />
          Submitting…
        {:else}
          Submit for review
          <Icon icon="lucide:arrow-right" width="16" height="16" />
        {/if}
      </button>
    </footer>
  </form>
</div>

<style>
  .cl-page { display: flex; flex-direction: column; gap: 16px; max-width: 760px; margin: 0 auto; }

  .cl-back {
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
  .cl-back:hover { color: var(--color-text); background: color-mix(in srgb, var(--color-text) 5%, transparent); }

  /* Hero */
  .cl-hero { position: relative; overflow: hidden; padding: 28px 32px; }
  .cl-hero-blob { position: absolute; top: -50%; right: -10%; width: 280px; height: 280px; border-radius: 50%; background: rgba(5, 150, 105, 0.18); filter: blur(80px); pointer-events: none; }
  .cl-hero-text { position: relative; z-index: 1; max-width: 540px; }
  .cl-hero-text h1 { font-size: clamp(1.5rem, 2.5vw + 0.5rem, 2.25rem); font-weight: 800; line-height: 1.15; letter-spacing: -0.02em; margin: 0 0 8px; }
  .cl-hero-text p { color: color-mix(in srgb, var(--color-text) 70%, transparent); font-size: 15px; line-height: 1.6; margin: 0; }

  /* Task summary */
  .cl-task { padding: 18px 22px; display: flex; align-items: flex-start; gap: 16px; }
  .cl-task-icon { width: 48px; height: 48px; border-radius: 16px; background: #FFE5DC; color: var(--color-primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .cl-task-meta { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
  .cl-task-meta small { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: color-mix(in srgb, var(--color-text) 50%, transparent); }
  .cl-task-meta h2 { font-size: 17px; font-weight: 700; margin: 0; line-height: 1.3; }
  .cl-task-meta p { font-size: 13px; color: color-mix(in srgb, var(--color-text) 60%, transparent); margin: 0 0 4px; line-height: 1.5; }
  .cl-task-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
  .cl-chip { padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; background: color-mix(in srgb, var(--color-text) 5%, transparent); color: color-mix(in srgb, var(--color-text) 65%, transparent); }
  .cl-chip-time { background: rgba(255, 107, 107, 0.12); color: var(--color-primary); }

  /* Form */
  .cl-form { padding: 28px 32px; display: flex; flex-direction: column; gap: 18px; }
  .cl-form-head h2 { font-size: 20px; font-weight: 700; margin: 0 0 6px; }
  .cl-form-head p { color: color-mix(in srgb, var(--color-text) 60%, transparent); font-size: 13px; margin: 0; line-height: 1.5; }

  .cl-field { display: flex; flex-direction: column; gap: 6px; }
  .cl-label { font-size: 13px; font-weight: 700; color: var(--color-text); display: inline-flex; align-items: center; gap: 6px; }
  .cl-label em { font-style: normal; font-size: 11px; font-weight: 600; padding: 2px 6px; background: color-mix(in srgb, var(--color-primary) 12%, transparent); color: var(--color-primary); border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.04em; }
  .cl-em-optional { background: color-mix(in srgb, var(--color-text) 8%, transparent) !important; color: color-mix(in srgb, var(--color-text) 60%, transparent) !important; }

  .cl-field input, .cl-field textarea {
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
  .cl-field input:focus, .cl-field textarea:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.12); }
  .cl-field textarea { resize: vertical; min-height: 100px; line-height: 1.55; }
  .cl-hint { font-size: 12px; color: color-mix(in srgb, var(--color-text) 55%, transparent); }
  .cl-counter { font-size: 12px; font-weight: 600; color: color-mix(in srgb, var(--color-text) 50%, transparent); }
  .cl-foot-row { display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap; }

  .cl-error { display: inline-flex; align-items: center; gap: 8px; padding: 12px 14px; background: color-mix(in srgb, var(--color-error) 10%, transparent); color: var(--color-error); border-radius: 12px; font-size: 13px; font-weight: 600; }

  .cl-actions { display: flex; align-items: center; justify-content: flex-end; gap: 10px; padding-top: 12px; border-top: 1px solid var(--card-border); flex-wrap: wrap; }
  .cl-cancel {
    padding: 10px 20px;
    border-radius: 9999px;
    border: 1px solid var(--card-border-strong);
    background: transparent;
    color: var(--color-text);
    font-family: inherit;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    text-decoration: none;
    transition: background .15s;
  }
  .cl-cancel:hover { background: color-mix(in srgb, var(--color-text) 5%, transparent); }
</style>
