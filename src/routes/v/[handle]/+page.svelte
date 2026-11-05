<script lang="ts">
  import Seo from '#lib/components/Seo.svelte';
  import PatchPreview from '#lib/components/PatchPreview.svelte';
  import { getLocale } from '#lib/paraglide/runtime.js';
  import * as m from '#lib/paraglide/messages.js';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const day = (iso: string) => new Date(iso).toLocaleDateString(getLocale(), { dateStyle: 'medium' });
</script>

<Seo title={m.vault_public_title({ name: data.displayName })} description={m.vault_public_meta()} noindex />

<div class="public">
  <header class="page-head">
    <h1 class="display h-l" tabindex="-1" dir="auto">{m.vault_public_title({ name: data.displayName })}</h1>
    <p class="muted">{m.vault_public_note()}</p>
  </header>

  {#if data.badges.length}
    <ul class="badges">
      {#each data.badges as badge (badge.id)}
        <li class="badge">
          <PatchPreview color={badge.color} icon={badge.source === 'offplatform' ? 'heart' : 'star'} size="4.2rem" />
          <div>
            <strong dir="auto">{badge.label}</strong>
            <span class="muted">
              {badge.source === 'offplatform' ? m.vault_source_offplatform({ org: badge.orgName ?? badge.label }) : m.vault_source_task()}
            </span>
            <span class="muted num">{m.vault_public_confirmed({ date: day(badge.awardedAt) })}</span>
          </div>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="muted">{m.vault_public_empty()}</p>
  {/if}
</div>

<style>
  .public {
    display: grid;
    gap: 1.8rem;
    max-width: 44rem;
  }
  .badges {
    list-style: none;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
    gap: 1rem;
  }
  .badge {
    display: flex;
    gap: 0.9rem;
    align-items: center;
  }
  .badge div {
    display: grid;
    gap: 0.1rem;
    min-width: 0;
    overflow-wrap: anywhere;
  }
</style>
