<script lang="ts">
  import { enhance } from '$app/forms';
  import Seo from '#lib/components/Seo.svelte';
  import * as m from '#lib/paraglide/messages.js';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const answered = $derived(form && 'decision' in form ? form : undefined);
  const facts = $derived(data.open ? [data.date, data.minutes ? `${data.minutes} min` : ''].filter(Boolean).join(', ') : '');
</script>

<Seo title={m.vault_confirm_meta_title()} description={m.vault_meta_description()} noindex />

<div class="confirm">
  {#if answered}
    <h1 class="display h-l" tabindex="-1">
      {answered.decision === 'verified' ? m.vault_confirm_done_yes({ name: answered.volunteerName }) : m.vault_confirm_done_no()}
    </h1>
  {:else if data.open && !form?.closed}
    <header class="page-head">
      <h1 class="display h-l" tabindex="-1">{m.vault_confirm_title({ name: data.volunteerName, org: data.orgName })}</h1>
      <p class="muted">{m.vault_confirm_intro({ name: data.volunteerName })}</p>
    </header>
    <figure class="said">
      <figcaption>{m.vault_confirm_wrote()}</figcaption>
      <blockquote dir="auto">{data.description}</blockquote>
      {#if facts}<p class="muted num">{facts}</p>{/if}
    </figure>
    <div class="ctas">
      <form method="post" action="?/confirm" use:enhance>
        <button class="patch-btn" type="submit">{m.vault_confirm_yes()}</button>
      </form>
      <form method="post" action="?/decline" use:enhance>
        <button class="patch-btn patch-btn--plain" type="submit">{m.vault_confirm_no()}</button>
      </form>
    </div>
  {:else}
    <h1 class="display h-l" tabindex="-1">{m.vault_closed_title()}</h1>
    <p class="muted">{m.vault_closed_body()}</p>
  {/if}
</div>

<style>
  .confirm {
    display: grid;
    gap: 1.5rem;
    max-width: 34rem;
    overflow-wrap: anywhere;
  }
  .said {
    display: grid;
    gap: 0.5rem;
    margin: 0;
    padding: 1rem 1.2rem;
    border-radius: var(--radius);
    box-shadow: inset 0 0 0 1.5px var(--c-line);
  }
  .said figcaption {
    font-family: var(--f-display);
    font-weight: 650;
  }
  .said blockquote {
    margin: 0;
    white-space: pre-wrap;
  }
  .ctas {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }
</style>
