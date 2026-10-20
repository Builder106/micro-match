<script lang="ts">
  import { page } from '$app/state';
  import { invalidateAll } from '$app/navigation';
  import Seo from '$lib/components/Seo.svelte';
  import Link from '$lib/components/Link.svelte';
  import Quilt from '$lib/components/Quilt.svelte';
  import PatchPreview from '$lib/components/PatchPreview.svelte';
  import TaskSwatch from '$lib/components/TaskSwatch.svelte';
  import AccountTabs from '$lib/components/AccountTabs.svelte';
  import { callApi } from '$lib/api';
  import { relativeTime, minutesLabel } from '$lib/time';
  import * as m from '$lib/paraglide/messages.js';
  import type { QuiltPatch } from '$lib/quilt/patches';
  import type { Claim, Task } from '$lib/types';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type Enriched = Claim & { task?: { id: string; title: string; estimatedMinutes?: number } };
  const ud = $derived((data.userData ?? {}) as Record<string, unknown>);
  const isNgo = $derived(data.userRole === 'ngo');
  const patches = $derived((ud.patches as QuiltPatch[] | undefined) ?? []);
  const sewn = $derived(patches.filter((p) => p.status === 'approved'));
  const pinned = $derived(patches.filter((p) => p.status === 'pending'));
  const unpicked = $derived(patches.filter((p) => p.status === 'rejected'));
  const hours = $derived(Number(ud.totalHours ?? 0));
  const recs = $derived((ud.recommendations as Task[] | undefined) ?? []);
  const reviews = $derived((ud.pendingReviews as Enriched[] | undefined) ?? []);
  const myTasks = $derived((ud.myTasks as Task[] | undefined) ?? []);
  const justPinned = $derived(page.url.searchParams.get('pinned') === '1');

  const statusName = { active: m.task_status_active, completed: m.task_status_completed, expired: m.task_status_expired, moderated: m.task_status_moderated };

  let busy = $state<string | null>(null);
  let result = $state<Record<string, { kind: 'approved' | 'rejected' | 'error'; text: string }>>({});

  async function review(claim: Enriched, action: 'approve' | 'reject') {
    if (action === 'reject' && !confirm(m.dash_reject_confirm({ task: claim.task?.title ?? m.dash_your_task() }))) return;
    busy = claim.id;
    const res = await callApi<{ awardedBadgeIds?: string[] }>(`/api/claims/${claim.id}/${action}`, {
      method: 'POST',
      fallback: action === 'approve' ? m.dash_approve_error() : m.dash_reject_error()
    });
    busy = null;
    if (!res.ok) {
      result = { ...result, [claim.id]: { kind: 'error', text: res.error } };
      return;
    }
    const awarded = action === 'approve' ? (res.data.awardedBadgeIds?.length ?? 0) : 0;
    result = {
      ...result,
      [claim.id]:
        action === 'approve'
          ? { kind: 'approved', text: awarded === 0 ? m.dash_sewn() : awarded === 1 ? m.dash_sewn_awarded_one() : m.dash_sewn_awarded({ count: awarded }) }
          : { kind: 'rejected', text: m.dash_rejected() }
    };
    setTimeout(() => void invalidateAll(), 1400);
  }
</script>

<Seo title="{isNgo ? m.block_account_ngo_title() : m.block_account_title()} | MicroMatch" description={m.dash_meta_description()} noindex />

<AccountTabs />

{#if !isNgo}
  <div class="vol">
    <header class="page-head">
      <h1 class="display h-l" tabindex="-1">{m.block_account_title()}</h1>
      <p class="lede">
        {#if sewn.length === 0}
          {m.dash_vol_empty()}
        {:else}
          {m.dash_vol_sewn({
            patches: sewn.length === 1 ? m.count_patches_one() : m.count_patches({ count: sewn.length }),
            hours: hours === 1 ? m.count_hours_one() : m.count_hours({ count: hours })
          })}
          {#if pinned.length}{pinned.length === 1 ? m.dash_vol_pinned_one() : m.dash_vol_pinned({ count: pinned.length })}{/if}
        {/if}
      </p>
    </header>
    {#if justPinned}<p class="notice notice--ok" role="status">{m.dash_just_pinned()}</p>{/if}

    <div class="vol__grid">
      <div class="vol__block">
        <Quilt patches={sewn} label={sewn.length === 1 ? m.dash_block_label_one() : m.dash_block_label({ count: sewn.length })} emptyLine={m.dash_block_empty()} fit={sewn.length > 0} />
      </div>

      <div class="vol__side">
        <section aria-labelledby="pinned">
          <h2 id="pinned" class="h-m">{m.dash_pinned_title()}</h2>
          {#if pinned.length}
            <ul class="claims">
              {#each pinned as p (p.id)}
                <li>
                  <PatchPreview color={p.color} icon={p.icon} pinned size="3rem" />
                  <span><Link href="/task/{p.taskId}" class="link">{p.taskTitle ?? m.dash_a_task()}</Link><span class="small muted">{m.dash_sent({ time: relativeTime(p.sewnAt) })}</span></span>
                </li>
              {/each}
            </ul>
          {:else}
            <p class="muted">{m.dash_pinned_none()}</p>
          {/if}
        </section>

        {#if unpicked.length}
          <section aria-labelledby="unpicked">
            <h2 id="unpicked" class="h-m">{m.dash_unpicked_title()}</h2>
            <ul class="claims">
              {#each unpicked as p (p.id)}
                <li>
                  <PatchPreview color={null} size="3rem" />
                  <span><Link href="/task/{p.taskId}" class="link">{p.taskTitle ?? m.dash_a_task()}</Link><span class="small muted">{m.dash_reviewed({ time: relativeTime(p.sewnAt) })}</span></span>
                </li>
              {/each}
            </ul>
          </section>
        {/if}
      </div>
    </div>

    <section class="part" aria-labelledby="next">
      <h2 id="next">{m.dash_next_title()}</h2>
      {#if recs.length}
        <ul class="recs">{#each recs as t (t.id)}<li><TaskSwatch task={t} headingLevel="h3" /></li>{/each}</ul>
      {:else}
        <p class="muted">{m.dash_next_none()}</p>
      {/if}
      <Link href="/tasks" class="patch-btn patch-btn--plain">{m.dash_every_task()}</Link>
    </section>
  </div>
{:else}
  <div class="ngo">
    <header class="page-head">
      <h1 class="display h-l" tabindex="-1">{m.block_account_ngo_title()}</h1>
      <p class="lede">
        {#if reviews.length === 0}
          {m.dash_ngo_none()}
        {:else}
          {reviews.length === 1 ? m.dash_ngo_waiting_one() : m.dash_ngo_waiting({ count: reviews.length })}
        {/if}
        {sewn.length === 1 ? m.dash_ngo_sewn_one() : m.dash_ngo_sewn({ count: sewn.length })}
      </p>
    </header>

    <div class="ngo__grid">
      <section aria-labelledby="waiting">
        <h2 id="waiting" class="h-m">{m.dash_waiting_title()}</h2>
        {#if reviews.length}
          <ul class="reviews">
            {#each reviews as c (c.id)}
              {@const r = result[c.id]}
              <li class="review" class:is-done={r && r.kind !== 'error'} class:is-sewn={r?.kind === 'approved'}>
                <div class="review__head">
                  <h3>{c.task?.title ?? m.dash_a_task()}</h3>
                  <span class="small muted">{m.dash_review_meta({ length: minutesLabel(c.task?.estimatedMinutes), time: relativeTime(c.createdAt) })}</span>
                </div>
                {#if c.proofUrl}
                  <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the volunteer's external proof link -->
                  <p><a class="link" href={c.proofUrl} target="_blank" rel="noopener noreferrer">{m.dash_open_work()}</a> <span class="small muted proof">{c.proofUrl}</span></p>
                {/if}
                {#if c.notes}<blockquote>{c.notes}</blockquote>{/if}
                {#if r}
                  <p class="notice" class:notice--ok={r.kind === 'approved'} class:notice--error={r.kind === 'error'} role="status">{r.text}</p>
                {/if}
                {#if !r || r.kind === 'error'}
                  <div class="ctas">
                    <button type="button" class="patch-btn patch-btn--small" disabled={busy === c.id} onclick={() => review(c, 'approve')}>{m.dash_approve()}</button>
                    <button type="button" class="patch-btn patch-btn--plain patch-btn--small" disabled={busy === c.id} onclick={() => review(c, 'reject')}>{m.action_reject()}</button>
                  </div>
                {/if}
              </li>
            {/each}
          </ul>
        {:else}
          <p class="muted">{m.dash_waiting_none()}</p>
        {/if}
      </section>

      <aside class="ngo__block" aria-labelledby="sewn">
        <h2 id="sewn" class="h-m">{m.dash_sewn_title()}</h2>
        <Quilt patches={sewn} label={sewn.length === 1 ? m.dash_ngo_label_one() : m.dash_ngo_label({ count: sewn.length })} emptyLine={m.dash_ngo_empty()} fit={sewn.length > 0} />
        <Link href="/badges/manage" class="link small">{m.dash_design_link()}</Link>
      </aside>
    </div>

    <section class="part" aria-labelledby="mine">
      <h2 id="mine">{m.dash_mine_title()}</h2>
      {#if myTasks.length}
        <ul class="mine">
          {#each myTasks as t (t.id)}
            <li>
              <Link href="/task/{t.id}" class="link">{t.title}</Link>
              <span class="small muted">{minutesLabel(t.estimatedMinutes)}, {statusName[t.status ?? 'active']()}{t.isVerified ? '' : m.dash_hidden_suffix()}</span>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="muted">{m.dash_mine_none()}</p>
      {/if}
      <Link href="/org" class="patch-btn">{m.nav_post_task()}</Link>
    </section>
  </div>
{/if}

<style>
  /* A standalone link, so it gets a full-height tap target. */
  .ngo__block :global(.link) {
    display: inline-block;
    padding-block: 0.15rem;
  }
  .vol__grid,
  .ngo__grid {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
    gap: clamp(1.5rem, 4vw, 3.5rem);
    align-items: start;
    margin-bottom: 1rem;
  }
  .ngo__grid {
    grid-template-columns: minmax(0, 1.3fr) minmax(16rem, 0.8fr);
  }
  .vol__block {
    max-width: 24rem;
  }
  .vol__side {
    display: grid;
    gap: 2rem;
  }
  .vol__side section,
  .ngo__grid section,
  .ngo__block {
    display: grid;
    gap: 0.9rem;
    align-content: start;
  }
  .claims {
    list-style: none;
    padding: 0;
    display: grid;
    gap: 0.75rem;
  }
  .claims li {
    display: flex;
    gap: 0.85rem;
    align-items: center;
  }
  .claims li > span {
    display: grid;
  }
  .recs {
    list-style: none;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(15rem, 100%), 1fr));
    gap: 1rem;
  }
  .reviews {
    list-style: none;
    padding: 0;
    display: grid;
    gap: 1rem;
  }
  .review {
    display: grid;
    gap: 0.7rem;
    padding: 1.15rem 1.25rem;
    border-radius: var(--radius);
    background: var(--c-card);
    box-shadow: inset 0 0 0 1.5px var(--c-line);
    transition: box-shadow 0.4s, opacity 0.4s;
  }
  .review.is-sewn {
    box-shadow: inset 0 0 0 2px var(--c-ok);
    background:
      linear-gradient(90deg, var(--c-ok) 55%, transparent 0) 0.8rem 0.5rem / 9px 2px no-repeat,
      var(--c-card);
    animation: stitch-across 0.9s cubic-bezier(0.65, 0, 0.35, 1) both;
  }
  @keyframes stitch-across {
    from {
      background-size: 0 2px, auto;
    }
    to {
      background-size: calc(100% - 1.6rem) 2px, auto;
    }
  }
  .review.is-done:not(.is-sewn) {
    opacity: 0.6;
  }
  .review__head {
    display: grid;
    gap: 0.15rem;
  }
  .review h3 {
    font-family: var(--f-display);
    font-weight: 700;
    font-size: 1.1rem;
  }
  .proof {
    overflow-wrap: anywhere;
  }
  blockquote {
    margin: 0;
    padding: 0.7rem 0.9rem;
    border-left: 3px dashed var(--c-weld);
    background: rgb(242 184 75 / 0.12);
    white-space: pre-line;
  }
  .mine {
    list-style: none;
    padding: 0;
    display: grid;
    gap: 0.6rem;
  }
  .mine li {
    display: grid;
  }
  .part :global(.patch-btn) {
    justify-self: start;
  }
  @media (max-width: 899px) {
    .vol__grid,
    .ngo__grid {
      grid-template-columns: 1fr;
    }
  }
</style>
