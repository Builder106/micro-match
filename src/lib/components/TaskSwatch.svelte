<script lang="ts">
  // A task in the feed: a swatch of cloth with pinked edges (cut but not yet sewn), the
  // minutes it takes, and the brief. The whole swatch is one link to the task.
  import Link from './Link.svelte';
  import { fabricForTag, threadFor } from '$lib/quilt/fabrics';
  import { minutesLabel } from '$lib/time';

  type Props = {
    task: { id: string; title: string; shortDescription: string; tags: string[]; sourceTags?: string[]; estimatedMinutes?: number; isVerified?: boolean };
    headingLevel?: 'h2' | 'h3';
  };
  let { task, headingLevel = 'h2' }: Props = $props();

  const cloth = $derived(fabricForTag((task.sourceTags ?? task.tags)[0]));
  const ink = $derived(threadFor(cloth));
</script>

<article class="swatch-card">
  <div class="swatch-card__cloth" style:--cloth={cloth} style:color={ink}>
    <span class="swatch-card__min num">{minutesLabel(task.estimatedMinutes)}</span>
    {#if task.isVerified}<span class="swatch-card__verified">Verified nonprofit</span>{/if}
  </div>
  <div class="swatch-card__body">
    <svelte:element this={headingLevel} class="swatch-card__title">
      <Link href="/task/{task.id}" class="swatch-card__link">{task.title}</Link>
    </svelte:element>
    <p class="swatch-card__desc">{task.shortDescription}</p>
    {#if task.tags.length}
      <ul class="swatch-card__tags" aria-label="Tags">
        {#each task.tags as tag (tag)}<li>{tag.replace(/^#/, '')}</li>{/each}
      </ul>
    {/if}
  </div>
</article>

<style>
  .swatch-card {
    position: relative;
    display: grid;
    background: var(--c-paper);
    border-radius: 0 0 var(--radius) var(--radius);
    box-shadow: inset 0 0 0 1.5px var(--c-line), 0 2px 0 rgb(28 31 59 / 0.06);
    transition: translate 0.4s cubic-bezier(0.16, 1, 0.3, 1), rotate 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s;
  }
  @media (hover: hover) {
    .swatch-card:hover,
    .swatch-card:has(:global(.swatch-card__link:hover)) {
      translate: 0 -4px;
      rotate: -0.6deg;
      box-shadow: inset 0 0 0 1.5px var(--c-fg), 0 8px 0 -2px rgb(28 31 59 / 0.18);
    }
  }
  .swatch-card:has(:global(.swatch-card__link:focus-visible)) {
    outline: 3px solid var(--c-weld);
    outline-offset: 3px;
  }
  .swatch-card__cloth {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 0.5rem;
    min-height: 4.4rem;
    padding: 1.1rem 1rem 0.7rem;
    background: var(--cloth);
    --pink: conic-gradient(from 135deg at top, #0000, #000 1deg 89deg, #0000 90deg) 0 0 / 14px 7px repeat-x,
      linear-gradient(#000 0 0) 0 7px / 100% calc(100% - 7px) no-repeat;
    -webkit-mask: var(--pink);
    mask: var(--pink);
  }
  .swatch-card__cloth::after {
    content: '';
    position: absolute;
    left: 0.6rem;
    right: 0.6rem;
    bottom: 0.35rem;
    height: 1.5px;
    background: linear-gradient(90deg, currentColor 55%, transparent 0) 0 0 / 9px 1.5px repeat-x;
    opacity: 0.55;
  }
  .swatch-card__min {
    font-family: var(--f-display);
    font-weight: 760;
    font-size: 1.7rem;
    letter-spacing: -0.03em;
    line-height: 1;
  }
  .swatch-card__verified {
    font-size: var(--t-xs);
    font-weight: 600;
  }
  .swatch-card__body {
    display: grid;
    gap: 0.5rem;
    padding: 0.9rem 1rem 1.1rem;
    align-content: start;
  }
  .swatch-card__title {
    font-family: var(--f-display);
    font-weight: 700;
    font-size: 1.12rem;
    line-height: 1.15;
    letter-spacing: -0.01em;
  }
  .swatch-card :global(.swatch-card__link::after) {
    content: '';
    position: absolute;
    inset: 0;
  }
  .swatch-card :global(.swatch-card__link:focus-visible) {
    outline: none;
  }
  .swatch-card__desc {
    font-size: 0.92rem;
    color: var(--c-muted);
    line-height: 1.45;
  }
  .swatch-card__tags {
    list-style: none;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }
  .swatch-card__tags li {
    font-size: var(--t-xs);
    padding: 0.1rem 0.5rem;
    border-radius: var(--radius);
    background: rgb(28 31 59 / 0.06);
  }
</style>
