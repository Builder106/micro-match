<script lang="ts">
  import Icon from "@iconify/svelte";
  import CustomSelect from '$lib/components/CustomSelect.svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

  export let data: { verificationStatus: 'pending' | 'approved' | 'rejected' | null };

  let title = "";
  let shortDescription = "";
  let description = "";
  let language = "English";
  let estimatedMinutes: number | string = 30;
  let tags = "";
  let maxVolunteers: number | string = "";
  let deadline = "";

  let isSubmitting = false;
  let submitError = "";
  let submitSuccess = false;

  const titleMax = 140;
  const shortMax = 280;
  const longMax = 4000;

  $: titleCount = title.length;
  $: shortCount = shortDescription.length;
  $: descCount = description.length;

  $: isVerified = data.verificationStatus === 'approved';
  $: isPending = data.verificationStatus === 'pending';
  $: isRejected = data.verificationStatus === 'rejected';

  async function handleSubmit() {
    submitError = "";
    if (!title.trim() || !shortDescription.trim()) {
      submitError = "Title and short description are required.";
      return;
    }

    isSubmitting = true;
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          shortDescription: shortDescription.trim(),
          description: description.trim() || undefined,
          language,
          estimatedMinutes: Number(estimatedMinutes) || undefined,
          tags: tags.split(",").map(t => t.trim()).filter(Boolean),
          maxVolunteers: maxVolunteers ? Number(maxVolunteers) : undefined,
          deadline: deadline || undefined
        })
      });

      if (response.ok) {
        const created = await response.json();
        submitSuccess = true;
        // Tiny delay so the success state registers, then navigate.
        setTimeout(() => goto(resolve(`/task/${created.id}`, {})), 600);
      } else {
        const payload = await response.json().catch(() => ({}));
        submitError = payload?.error || "Failed to create task";
        if (Array.isArray(payload?.reasons)) {
          submitError += `: ${payload.reasons.join(', ')}`;
        }
      }
    } catch {
      submitError = "Network error. Please try again.";
    } finally {
      isSubmitting = false;
    }
  }

  const languages = [
    'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese',
    'Korean', 'Arabic', 'Portuguese', 'Russian'
  ];
  const timePresets = [10, 15, 20, 30, 45, 60];
</script>

<svelte:head><title>Post a task · MicroMatch</title></svelte:head>

<div class="org-page">
  <!-- ───── Hero ───── -->
  <section class="org-hero brand-card">
    <div class="org-hero-blob"></div>
    <div class="org-hero-text">
      <h1>Post a <span class="coral-gradient">task</span>.</h1>
      <p>Describe a bite-sized contribution and volunteers will pick it up. Aim for 15–30 minutes per task — it's the sweet spot for response rate.</p>
    </div>
  </section>

  <!-- ───── Verification status banner ───── -->
  {#if !isVerified}
    <aside class="org-banner" class:org-banner-warn={!isPending} class:org-banner-info={isPending}>
      <Icon icon={isPending ? 'lucide:hourglass' : 'lucide:shield-alert'} width="18" height="18" />
      <div>
        {#if isPending}
          <strong>Verification under review.</strong>
          <span>Your tasks will show an "Unverified" chip to volunteers until verification is approved.</span>
        {:else if isRejected}
          <strong>Verification needs changes.</strong>
          <span>Your tasks will show "Unverified" until you resubmit.</span>
        {:else}
          <strong>Org not yet verified.</strong>
          <span>Posted tasks will show "Unverified" to volunteers. <a href={resolve('/profile', {})}>Verify your org →</a></span>
        {/if}
      </div>
    </aside>
  {/if}

  <!-- ───── Form ───── -->
  <form class="org-form brand-card" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
    <header class="org-form-head">
      <h2>Mission details</h2>
      <p>Required fields are marked. Volunteers see the title, short description, time estimate, and tags first.</p>
    </header>

    <fieldset class="org-section">
      <legend>The basics</legend>

      <label class="org-field">
        <span class="org-label">Title <em>required</em></span>
        <input
          bind:value={title}
          placeholder="e.g. Translate website copy to Spanish"
          required
          maxlength={titleMax}
        />
        <small class="org-counter">{titleCount}/{titleMax}</small>
      </label>

      <label class="org-field">
        <span class="org-label">Short description <em>required</em></span>
        <input
          type="text"
          bind:value={shortDescription}
          placeholder="One-sentence summary volunteers see in the feed"
          required
          maxlength={shortMax}
        />
        <small class="org-counter">{shortCount}/{shortMax}</small>
      </label>

      <label class="org-field">
        <span class="org-label">Detailed instructions</span>
        <textarea
          bind:value={description}
          placeholder="What needs to happen, what's the context, what should the volunteer hand back?"
          rows="6"
          maxlength={longMax}
        ></textarea>
        <small class="org-counter">{descCount}/{longMax}</small>
      </label>
    </fieldset>

    <fieldset class="org-section">
      <legend>Time + scope</legend>

      <div class="org-row">
        <label class="org-field">
          <span class="org-label">Language</span>
          <CustomSelect bind:value={language} ariaLabel="Language" options={languages.map((lang) => ({ value: lang, label: lang }))} />
        </label>

        <label class="org-field">
          <span class="org-label">Estimated minutes</span>
          <input
            type="number"
            bind:value={estimatedMinutes}
            min="5"
            max="480"
          />
          <div class="org-presets">
            {#each timePresets as m (m)}
              <button type="button" class="org-preset" class:active={Number(estimatedMinutes) === m} onclick={() => (estimatedMinutes = m)}>{m}m</button>
            {/each}
          </div>
        </label>
      </div>

      <label class="org-field">
        <span class="org-label">Tags <em>comma-separated</em></span>
        <input
          bind:value={tags}
          placeholder="e.g. translation, design, data, research"
        />
        <small class="org-hint">Tags help volunteers filter the feed. Use lowercase, no #.</small>
      </label>
    </fieldset>

    <fieldset class="org-section">
      <legend>Limits <em class="org-section-em">optional</em></legend>

      <div class="org-row">
        <label class="org-field">
          <span class="org-label">Max volunteers</span>
          <input
            type="number"
            bind:value={maxVolunteers}
            placeholder="Unlimited"
            min="1"
          />
          <small class="org-hint">Cap how many people can claim this task.</small>
        </label>

        <label class="org-field">
          <span class="org-label">Deadline</span>
          <input
            type="datetime-local"
            bind:value={deadline}
          />
          <small class="org-hint">Leave empty for no deadline.</small>
        </label>
      </div>
    </fieldset>

    {#if submitError}
      <div class="org-error">
        <Icon icon="lucide:alert-circle" width="16" height="16" />
        {submitError}
      </div>
    {/if}

    <footer class="org-actions">
      <a href={resolve('/dashboard', {})} class="org-cancel">Cancel</a>
      <button type="submit" class="btn-coral btn-lg" disabled={isSubmitting || submitSuccess}>
        {#if submitSuccess}
          <Icon icon="lucide:check-circle-2" width="18" height="18" />
          Posted!
        {:else if isSubmitting}
          <Icon icon="lucide:loader-2" width="18" height="18" class="spin" />
          Posting…
        {:else}
          Post task
          <Icon icon="lucide:arrow-right" width="16" height="16" />
        {/if}
      </button>
    </footer>
  </form>
</div>

<style>
  .org-page { display: flex; flex-direction: column; gap: 24px; max-width: 880px; margin: 0 auto; }

  /* Hero */
  .org-hero { position: relative; overflow: hidden; padding: 32px 36px; }
  .org-hero-blob { position: absolute; top: -50%; right: -10%; width: 320px; height: 320px; border-radius: 50%; background: rgba(255, 107, 107, 0.18); filter: blur(80px); pointer-events: none; }
  .org-hero-text { position: relative; z-index: 1; max-width: 600px; }
  .org-hero-text h1 { font-size: clamp(1.75rem, 3vw + 0.5rem, 2.5rem); font-weight: 800; line-height: 1.1; letter-spacing: -0.02em; margin: 0 0 10px; }
  .org-hero-text p { color: color-mix(in srgb, var(--color-text) 70%, transparent); font-size: 15px; line-height: 1.6; margin: 0; }

  /* Verification banner */
  .org-banner {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 18px;
    border-radius: 16px;
    font-size: 14px;
    line-height: 1.5;
  }
  .org-banner > div { display: flex; flex-direction: column; gap: 2px; }
  .org-banner strong { font-weight: 700; }
  .org-banner-warn { background: color-mix(in srgb, var(--color-warning) 12%, transparent); color: color-mix(in srgb, var(--color-warning) 75%, var(--color-text)); }
  .org-banner-warn :global(svg) { color: var(--color-warning); flex-shrink: 0; margin-top: 2px; }
  .org-banner-warn a { color: var(--color-warning); font-weight: 700; text-decoration: underline; }
  .org-banner-info { background: #DBEAFE; color: #1E40AF; }
  .org-banner-info :global(svg) { color: #2563EB; flex-shrink: 0; margin-top: 2px; }

  /* Form */
  .org-form { padding: 32px; display: flex; flex-direction: column; gap: 28px; }
  .org-form-head h2 { font-size: 22px; font-weight: 700; margin: 0 0 6px; }
  .org-form-head p { color: color-mix(in srgb, var(--color-text) 60%, transparent); font-size: 14px; margin: 0; }

  .org-section { padding: 0; margin: 0; border: none; display: flex; flex-direction: column; gap: 16px; }
  .org-section legend { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: color-mix(in srgb, var(--color-text) 55%, transparent); padding: 0; margin: 0 0 4px; }
  .org-section-em { font-style: normal; font-weight: 600; text-transform: none; letter-spacing: 0; color: color-mix(in srgb, var(--color-text) 45%, transparent); margin-left: 6px; }

  .org-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  @media (max-width: 540px) { .org-row { grid-template-columns: 1fr; } }

  .org-field { display: flex; flex-direction: column; gap: 6px; position: relative; }
  .org-label { font-size: 13px; font-weight: 700; color: var(--color-text); display: inline-flex; align-items: center; gap: 6px; }
  .org-label em { font-style: normal; font-size: 11px; font-weight: 600; padding: 2px 6px; background: color-mix(in srgb, var(--color-primary) 12%, transparent); color: var(--color-primary-readable); border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.04em; }

  .org-field input, .org-field textarea {
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
  .org-field input:focus, .org-field textarea:focus { outline: none; border-color: var(--color-primary-readable); box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.12); }
  .org-field textarea { resize: vertical; min-height: 120px; line-height: 1.55; }
  .org-counter { position: absolute; right: 4px; bottom: -18px; font-size: 11px; font-weight: 600; color: color-mix(in srgb, var(--color-text) 50%, transparent); }
  .org-hint { font-size: 12px; color: color-mix(in srgb, var(--color-text) 55%, transparent); }

  .org-presets { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
  .org-preset {
    padding: 5px 12px;
    border-radius: 9999px;
    border: 1px solid var(--card-border-strong);
    background: var(--color-surface);
    font-family: inherit;
    font-size: 12px;
    font-weight: 700;
    color: color-mix(in srgb, var(--color-text) 65%, transparent);
    cursor: pointer;
    transition: all .15s;
  }
  .org-preset:hover { color: var(--color-text); border-color: color-mix(in srgb, var(--color-primary-readable) 30%, transparent); }
  .org-preset.active { background: var(--color-primary); border-color: var(--color-primary-readable); color: var(--color-action-on-coral); }

  .org-error { display: inline-flex; align-items: center; gap: 8px; padding: 12px 14px; background: color-mix(in srgb, var(--color-error) 10%, transparent); color: var(--color-error); border-radius: 12px; font-size: 14px; font-weight: 600; }

  .org-actions { display: flex; align-items: center; justify-content: flex-end; gap: 12px; padding-top: 12px; border-top: 1px solid var(--card-border); flex-wrap: wrap; }
  .org-cancel { padding: 12px 24px; border-radius: 9999px; border: 1px solid var(--card-border-strong); background: transparent; color: var(--color-text); font-family: inherit; font-size: 14px; font-weight: 700; cursor: pointer; text-decoration: none; transition: background .15s; }
  .org-cancel:hover { background: color-mix(in srgb, var(--color-text) 5%, transparent); }
</style>
