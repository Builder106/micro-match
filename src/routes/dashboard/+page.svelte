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

  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

  let busy = $state<string | null>(null);
  let result = $state<Record<string, { kind: 'approved' | 'rejected' | 'error'; text: string }>>({});

  async function review(claim: Enriched, action: 'approve' | 'reject') {
    if (action === 'reject' && !confirm(`Reject this claim on "${claim.task?.title ?? 'your task'}"? The volunteer sees it as not picked.`)) return;
    busy = claim.id;
    const res = await callApi<{ awardedBadgeIds?: string[] }>(`/api/claims/${claim.id}/${action}`, { method: 'POST', fallback: `Could not ${action} the claim.` });
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
          ? { kind: 'approved', text: awarded ? `Sewn in. ${plural(awarded, 'badge', 'badges')} awarded.` : 'Sewn in.' }
          : { kind: 'rejected', text: 'Rejected.' }
    };
    setTimeout(() => void invalidateAll(), 1400);
  }
</script>

<Seo title="{isNgo ? 'Your reviews' : 'Your block'} | MicroMatch" description="Your MicroMatch block: the patches you have earned, the claims waiting for review and tasks to try next." noindex />

<AccountTabs />

{#if !isNgo}
  <div class="vol">
    <header class="page-head">
      <h1 class="display h-l" tabindex="-1">Your block</h1>
      <p class="lede">
        {#if sewn.length === 0}
          No patches yet. Finish a task and, once a person approves it, it becomes the center square of your block.
        {:else}
          {plural(sewn.length, 'patch', 'patches')} sewn in, about {hours} {hours === 1 ? 'hour' : 'hours'} of help.
          {#if pinned.length}{plural(pinned.length, 'more is', 'more are')} pinned, waiting for review.{/if}
        {/if}
      </p>
    </header>
    {#if justPinned}<p class="notice notice--ok" role="status">Your work is pinned. A person at the nonprofit will review it.</p>{/if}

    <div class="vol__grid">
      <div class="vol__block">
        <Quilt patches={sewn} label={sewn.length === 1 ? 'Your block, one patch' : `Your block, ${sewn.length} patches`} emptyLine="Your first patch goes here" fit={sewn.length > 0} />
      </div>

      <div class="vol__side">
        <section aria-labelledby="pinned">
          <h2 id="pinned" class="h-m">Pinned, waiting for a person</h2>
          {#if pinned.length}
            <ul class="claims">
              {#each pinned as p (p.id)}
                <li>
                  <PatchPreview color={p.color} icon={p.icon} pinned size="3rem" />
                  <span><Link href="/task/{p.taskId}" class="link">{p.taskTitle ?? 'A task'}</Link><span class="small muted">Sent {relativeTime(p.sewnAt)}</span></span>
                </li>
              {/each}
            </ul>
          {:else}
            <p class="muted">Nothing waiting. Work you send shows up here until it is reviewed.</p>
          {/if}
        </section>

        {#if unpicked.length}
          <section aria-labelledby="unpicked">
            <h2 id="unpicked" class="h-m">Not picked this time</h2>
            <ul class="claims">
              {#each unpicked as p (p.id)}
                <li>
                  <PatchPreview color={null} size="3rem" />
                  <span><Link href="/task/{p.taskId}" class="link">{p.taskTitle ?? 'A task'}</Link><span class="small muted">Reviewed {relativeTime(p.sewnAt)}</span></span>
                </li>
              {/each}
            </ul>
          </section>
        {/if}
      </div>
    </div>

    <section class="part" aria-labelledby="next">
      <h2 id="next">Tasks to try next</h2>
      {#if recs.length}
        <ul class="recs">{#each recs as t (t.id)}<li><TaskSwatch task={t} headingLevel="h3" /></li>{/each}</ul>
      {:else}
        <p class="muted">You have tried everything that is open. New tasks appear as nonprofits post them.</p>
      {/if}
      <Link href="/tasks" class="patch-btn patch-btn--plain">See every task</Link>
    </section>
  </div>
{:else}
  <div class="ngo">
    <header class="page-head">
      <h1 class="display h-l" tabindex="-1">Your reviews</h1>
      <p class="lede">
        {#if reviews.length === 0}
          No claims are waiting for you.
        {:else}
          {plural(reviews.length, 'claim is', 'claims are')} waiting for a person to read {reviews.length === 1 ? 'it' : 'them'}.
        {/if}
        {plural(sewn.length, 'patch has', 'patches have')} been sewn in from your tasks.
      </p>
    </header>

    <div class="ngo__grid">
      <section aria-labelledby="waiting">
        <h2 id="waiting" class="h-m">Waiting to be sewn in</h2>
        {#if reviews.length}
          <ul class="reviews">
            {#each reviews as c (c.id)}
              {@const r = result[c.id]}
              <li class="review" class:is-done={r && r.kind !== 'error'} class:is-sewn={r?.kind === 'approved'}>
                <div class="review__head">
                  <h3>{c.task?.title ?? 'A task'}</h3>
                  <span class="small muted">{minutesLabel(c.task?.estimatedMinutes)} task, sent {relativeTime(c.createdAt)}</span>
                </div>
                {#if c.proofUrl}
                  <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the volunteer's external proof link -->
                  <p><a class="link" href={c.proofUrl} target="_blank" rel="noopener noreferrer">Open their work</a> <span class="small muted proof">{c.proofUrl}</span></p>
                {/if}
                {#if c.notes}<blockquote>{c.notes}</blockquote>{/if}
                {#if r}
                  <p class="notice" class:notice--ok={r.kind === 'approved'} class:notice--error={r.kind === 'error'} role="status">{r.text}</p>
                {/if}
                {#if !r || r.kind === 'error'}
                  <div class="ctas">
                    <button type="button" class="patch-btn patch-btn--small" disabled={busy === c.id} onclick={() => review(c, 'approve')}>Approve and sew in</button>
                    <button type="button" class="patch-btn patch-btn--plain patch-btn--small" disabled={busy === c.id} onclick={() => review(c, 'reject')}>Reject</button>
                  </div>
                {/if}
              </li>
            {/each}
          </ul>
        {:else}
          <p class="muted">When a volunteer sends work on one of your tasks, it waits here for you.</p>
        {/if}
      </section>

      <aside class="ngo__block" aria-labelledby="sewn">
        <h2 id="sewn" class="h-m">Sewn in from your tasks</h2>
        <Quilt patches={sewn} label={sewn.length === 1 ? 'Patches from your tasks, one' : `Patches from your tasks, ${sewn.length}`} emptyLine="Your first approval goes here" fit={sewn.length > 0} />
        <Link href="/badges/manage" class="link small">Design the patches they earn</Link>
      </aside>
    </div>

    <section class="part" aria-labelledby="mine">
      <h2 id="mine">Your tasks</h2>
      {#if myTasks.length}
        <ul class="mine">
          {#each myTasks as t (t.id)}
            <li>
              <Link href="/task/{t.id}" class="link">{t.title}</Link>
              <span class="small muted">{minutesLabel(t.estimatedMinutes)}, {t.status ?? 'active'}{t.isVerified ? '' : ', hidden from the feed until you are verified'}</span>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="muted">You have not posted a task yet.</p>
      {/if}
      <Link href="/org" class="patch-btn">Post a task</Link>
    </section>
  </div>
{/if}

<style>
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
    background: #fff;
    box-shadow: inset 0 0 0 1.5px var(--c-line);
    transition: box-shadow 0.4s, opacity 0.4s;
  }
  .review.is-sewn {
    box-shadow: inset 0 0 0 2px var(--c-ok);
    background:
      linear-gradient(90deg, var(--c-ok) 55%, transparent 0) 0.8rem 0.5rem / 9px 2px no-repeat,
      #fff;
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
