<script lang="ts">
  import { page } from '$app/state';
  import Seo from '#lib/components/Seo.svelte';
  import AccountTabs from '#lib/components/AccountTabs.svelte';
  import VerificationCard from '#lib/components/VerificationCard.svelte';
  import { callApi } from '#lib/api.js';
  import { go } from '#lib/go.js';
  import { TASK_MINUTES, LIMITS, parseTags } from '#lib/taskForm.js';
  import type { Locale } from '#lib/locale.js';
  import * as m from '#lib/paraglide/messages.js';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  const locale = $derived((page.data.locale as Locale | undefined) ?? 'en');

  let title = $state('');
  let shortDescription = $state('');
  let description = $state('');
  let minutes = $state(15);
  let tags = $state('');
  let language = $state('English');
  let maxVolunteers = $state('');
  let deadline = $state('');
  let error = $state('');
  let submitting = $state(false);

  // The stored value stays the English name the task translation service expects.
  const languages = [
    ['English', m.lang_en],
    ['Spanish', m.lang_es],
    ['French', m.lang_fr],
    ['German', m.lang_de],
    ['Portuguese', m.lang_pt],
    ['Chinese', m.lang_zh],
    ['Arabic', m.lang_ar]
  ] as const;

  async function post(e: SubmitEvent) {
    e.preventDefault();
    if (!title.trim() || !shortDescription.trim()) return void (error = m.org_required());
    submitting = true;
    error = '';
    const res = await callApi<{ id: string }>('/api/tasks', {
      body: {
        title: title.trim(),
        shortDescription: shortDescription.trim(),
        description: description.trim() || undefined,
        estimatedMinutes: minutes,
        tags: parseTags(tags),
        language,
        maxVolunteers: maxVolunteers ? Number(maxVolunteers) : undefined,
        deadline: deadline ? new Date(deadline).toISOString() : undefined
      },
      fallback: m.org_error()
    });
    submitting = false;
    if (res.ok) await go(`/task/${res.data.id}`, locale, { refreshAll: true });
    else error = res.error;
  }
</script>

<Seo title={m.org_meta_title()} description={m.org_meta_description()} noindex />

<AccountTabs />

<div class="org">
  <form class="org__form" onsubmit={post}>
    <header class="page-head">
      <h1 class="display h-l" tabindex="-1">{m.nav_post_task()}</h1>
      <p class="lede">{m.org_lede()}</p>
    </header>
    {#if data.verificationStatus !== 'approved'}
      <p class="notice">{m.org_unverified()}</p>
    {/if}

    <div class="field">
      <label for="t-title">{m.field_title()}</label>
      <input id="t-title" class="input" maxlength={LIMITS.title} bind:value={title} placeholder={m.org_title_placeholder()} required />
    </div>
    <div class="field">
      <label for="t-short">{m.org_summary()}</label>
      <input id="t-short" class="input" maxlength={LIMITS.short} bind:value={shortDescription} placeholder={m.org_summary_placeholder()} required />
    </div>
    <div class="field">
      <label for="t-brief">{m.task_brief()}</label>
      <textarea id="t-brief" class="input" maxlength={LIMITS.brief} bind:value={description} placeholder={m.org_brief_placeholder()}></textarea>
    </div>

    <fieldset class="field minutes">
      <legend class="label">{m.org_minutes()}</legend>
      <div class="seg">
        {#each TASK_MINUTES as n (n)}
          <label class:is-on={minutes === n}><input type="radio" name="minutes" value={n} bind:group={minutes} />{m.minutes_short({ count: n })}</label>
        {/each}
      </div>
    </fieldset>

    <div class="row">
      <div class="field">
        <label for="t-tags">{m.field_tags()}</label>
        <input id="t-tags" class="input" bind:value={tags} placeholder={m.org_tags_placeholder()} />
        <span class="hint">{m.org_tags_hint()}</span>
      </div>
      <div class="field">
        <label for="t-lang">{m.field_written_in()}</label>
        <select id="t-lang" class="input" bind:value={language}>{#each languages as [value, name] (value)}<option {value}>{name()}</option>{/each}</select>
      </div>
    </div>
    <div class="row">
      <div class="field">
        <label for="t-cap">{m.org_cap()}</label>
        <input id="t-cap" class="input" type="number" min="1" inputmode="numeric" bind:value={maxVolunteers} />
      </div>
      <div class="field">
        <label for="t-due">{m.org_deadline()}</label>
        <input id="t-due" class="input" type="date" bind:value={deadline} />
      </div>
    </div>

    {#if error}<p class="notice notice--error" role="alert">{error}</p>{/if}
    <button class="patch-btn" type="submit" disabled={submitting}>{submitting ? m.org_posting() : m.org_submit()}</button>
    <p class="small muted">{m.org_safety()}</p>
  </form>

  <aside class="org__side">
    <VerificationCard />
  </aside>
</div>

<style>
  .org {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(16rem, 22rem);
    gap: clamp(1.5rem, 4vw, 3.5rem);
    align-items: start;
  }
  .org__form {
    display: grid;
    gap: 1.1rem;
    max-width: 40rem;
  }
  .org__form .patch-btn {
    justify-self: start;
  }
  .row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.9rem;
  }
  .minutes {
    border: 0;
    padding: 0;
  }
  .seg {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }
  .seg label {
    position: relative;
    display: inline-flex;
    align-items: center;
    min-height: 2.5rem;
    padding: 0.4rem 0.85rem;
    border-radius: var(--radius);
    box-shadow: inset 0 0 0 1.5px var(--c-line);
    cursor: pointer;
  }
  .seg input {
    position: absolute;
    opacity: 0;
  }
  .seg label.is-on {
    background: var(--c-fg);
    color: var(--c-bg);
    box-shadow: none;
  }
  .seg label:has(input:focus-visible) {
    outline: 2px solid var(--c-fg);
    outline-offset: 2px;
  }
  .org__side {
    position: sticky;
    top: 0;
  }
  @media (max-width: 899px) {
    .org {
      grid-template-columns: 1fr;
    }
    .org__side {
      position: static;
    }
    .row {
      grid-template-columns: 1fr;
    }
  }
</style>
