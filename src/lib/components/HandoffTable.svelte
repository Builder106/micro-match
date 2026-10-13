<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { resolve } from '$app/paths';
  import * as m from '$lib/paraglide/messages.js';
  import type { Locale } from '$lib/locale';
  import type { Task } from '$lib/types';
  import {
    CAPTION_GAP,
    MOBILE_BREAKPOINT,
    assetTimelines,
    clockText,
    dialStill,
    seekSeconds,
    stageState,
    taskMinutes,
    ticketPosition,
    vignetteFor,
    type AssetTimelines,
    type Scene
  } from '$lib/handoff/motion';
  import stampPosted from '$lib/assets/handoff/ink-stamp-posted.svg?raw';
  import stampApproved from '$lib/assets/handoff/ink-stamp-approved.svg?raw';
  import seal from '$lib/assets/handoff/verified-seal.svg?raw';
  import lanes from '$lib/assets/handoff/time-lanes.svg?raw';
  import dial from '$lib/assets/handoff/minute-dial.svg?raw';
  import vignetteTranslate from '$lib/assets/handoff/vignette-translate.svg?raw';
  import vignetteData from '$lib/assets/handoff/vignette-data.svg?raw';
  import vignetteProofread from '$lib/assets/handoff/vignette-proofread.svg?raw';
  import vignettePhotos from '$lib/assets/handoff/vignette-photos.svg?raw';
  import clip from '$lib/assets/handoff/proof-clip.svg?raw';
  import badge from '$lib/assets/handoff/badge-press.svg?raw';

  type StaticMessage = (inputs?: Record<string, never>, options?: { locale?: Locale }) => string;
  type Props = { tasks: Task[]; locale: Locale; role?: string | null };

  let { tasks, locale, role = null }: Props = $props();
  const t = (message: StaticMessage) => message({}, { locale });

  const VIGNETTES = { translate: vignetteTranslate, data: vignetteData, proofread: vignetteProofread, photos: vignettePhotos };

  const featured = $derived(tasks[0]);
  const minutes = $derived(taskMinutes(featured?.estimatedMinutes));
  const verified = $derived(featured ? featured.isVerified === true : true);
  const vignette = $derived(VIGNETTES[vignetteFor(featured?.tags ?? ['translation'])]);
  const steps = $derived([
    { scene: 'post', side: 'ngo', still: 'ink-stamp-posted', title: m.home_table_post_title, body: m.home_table_post_body },
    { scene: 'claim', side: 'volunteer', still: 'time-lanes', title: m.home_table_claim_title, body: m.home_table_claim_body },
    { scene: 'work', side: 'volunteer', still: dialStill(minutes), title: m.home_table_work_title, body: m.home_table_work_body },
    { scene: 'proof', side: 'volunteer', still: 'proof-clip', title: m.home_table_proof_title, body: m.home_table_proof_body },
    { scene: 'review', side: 'ngo', still: 'ink-stamp-approved', title: m.home_table_review_title, body: m.home_table_review_body },
    { scene: 'badge', side: 'volunteer', still: 'badge-press', title: m.home_table_badge_title, body: m.home_table_badge_body }
  ] satisfies Array<{ scene: Scene; side: 'ngo' | 'volunteer'; still: string; title: StaticMessage; body: StaticMessage }>);
  let exchange: HTMLElement;
  let stage: HTMLElement;
  let ticket: HTMLElement;
  let pile: HTMLElement;
  let motion = $state(false);
  let scene = $state<Scene>('badge');
  let reviewing = $state(true);
  let lanesVisible = $state(false);
  let ended = $state(true);
  let clock = $state('');

  onMount(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let cancel: (() => void) | undefined;
    let disposed = false;
    let size = { width: 0, height: 0, bottomInset: 0 };
    const measure = () => {
      const captions = stage.querySelector<HTMLElement>('.steps');
      const desktop = stage.clientWidth >= MOBILE_BREAKPOINT;
      size = { width: stage.clientWidth, height: stage.clientHeight, bottomInset: desktop && captions ? captions.offsetHeight + CAPTION_GAP : 0 };
    };

    function render(progress: number, players: Array<[SVGSVGElement, keyof AssetTimelines]>) {
      const state = stageState(progress);
      scene = state.scene;
      reviewing = state.reviewing;
      lanesVisible = state.lanesVisible;
      ended = state.ended;
      clock = clockText(progress, minutes);
      const { x, y } = ticketPosition(progress, { ...size, rtl: document.documentElement.dir === 'rtl' });
      ticket.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      const timelines = assetTimelines(progress, minutes);
      for (const [svg, key] of players) svg.setCurrentTime(seekSeconds(timelines[key]));
    }

    async function start() {
      const { scroll } = await import('motion');
      if (disposed || reduced.matches) return;
      motion = true;
      await tick();
      measure();
      const players = [...exchange.querySelectorAll<HTMLElement>('[data-timeline]')].flatMap((wrapper) => {
        const svg = wrapper.querySelector('svg');
        if (!svg || typeof svg.setCurrentTime !== 'function') return [];
        svg.pauseAnimations();
        return [[svg, wrapper.dataset.timeline as keyof AssetTimelines] as [SVGSVGElement, keyof AssetTimelines]];
      });
      cancel = scroll((progress: number) => render(progress, players), { target: exchange });
    }

    function stop() {
      cancel?.();
      cancel = undefined;
      motion = false;
      ended = true;
      reviewing = true;
      ticket.style.transform = '';
    }

    const onReducedChange = () => (reduced.matches ? stop() : void start());
    if (!reduced.matches) void start();
    reduced.addEventListener('change', onReducedChange);
    addEventListener('resize', measure);
    return () => {
      disposed = true;
      cancel?.();
      reduced.removeEventListener('change', onReducedChange);
      removeEventListener('resize', measure);
    };
  });

  // The live players are build-time Glaxnimate exports from this repository, mounted only on the client.
  function inlineSvg(node: HTMLElement, markup: string) {
    node.innerHTML = markup;
    return { update: (next: string) => (node.innerHTML = next) };
  }

  function skipToTasks(event: MouseEvent) {
    if (!motion) return;
    event.preventDefault();
    window.scrollTo(0, exchange.offsetTop + exchange.offsetHeight - window.innerHeight);
    pile.focus({ preventScroll: true });
  }
</script>

<a class="skip" href="#home-tasks" onclick={skipToTasks}>{t(m.home_table_skip)}</a>

<section class="exchange" class:motion aria-labelledby="home-title" bind:this={exchange}>
  <div class="stage" class:ended class:reviewing bind:this={stage}>
    <div class="side ngo">
      <span class="side-label">{t(m.home_table_ngo)}</span>
      <div class="live stamp" aria-hidden="true">
        <div class="player posted" data-timeline="ink-stamp-posted" use:inlineSvg={stampPosted}></div>
        <div class="player approved" data-timeline="ink-stamp-approved" use:inlineSvg={stampApproved}></div>
      </div>
    </div>
    <div class="side volunteer">
      <span class="side-label">{t(m.home_table_volunteer)}</span>
      <div class="live lanes" class:gone={!lanesVisible} aria-hidden="true">
        <div class="player" data-timeline="time-lanes" use:inlineSvg={lanes}></div>
      </div>
      <div class="live vignette" aria-hidden="true">
        <div class="player" data-timeline="vignette" use:inlineSvg={vignette}></div>
      </div>
      <div class="live badge" aria-hidden="true">
        <div class="player" data-timeline="badge-press" use:inlineSvg={badge}></div>
      </div>
    </div>
    <div class="seam" aria-hidden="true"></div>

    <article class="ticket" bind:this={ticket}>
      {#if verified}
        <div class="live seal" aria-hidden="true"><div class="player" data-timeline="verified-seal" use:inlineSvg={seal}></div></div>
      {/if}
      <div class="live clip" aria-hidden="true"><div class="player" data-timeline="proof-clip" use:inlineSvg={clip}></div></div>
      <h1 id="home-title">{t(m.home_title_lead)} <em>{t(m.home_title_accent)}</em></h1>
      <div class="task">
        {#if featured}
          <span class="task-title">{featured.title}</span>
        {:else}
          <span class="task-title">{t(m.home_card_translate_flyer)}</span>
        {/if}
        <span class="task-meta">
          {#if featured?.tags?.[0]}<span class="chip">#{featured.tags[0].replace(/^#/, '')}</span>{/if}
          {#if !featured}<span class="chip">{t(m.home_table_sample)}</span>{/if}
          <span>{minutes} {t(m.minutes_short)}</span>
          {#if verified && featured}<span>{t(m.home_table_verified)}</span>{/if}
        </span>
        <span class="clock" aria-hidden="true">{motion ? clock : `${minutes}:00`} / {minutes}:00</span>
      </div>
      <div class="live dial" aria-hidden="true"><div class="player" data-timeline="minute-dial" use:inlineSvg={dial}></div></div>
    </article>

    <ol class="steps" aria-label={t(m.home_table_steps_label)}>
      {#each steps as step (step.scene)}
        <li data-side={step.side} class:active={scene === step.scene}>
          <img class="still" src={`/images/handoff/${step.still}.svg`} alt="" width="96" height="96" loading="lazy" />
          <h2>{t(step.title)}</h2>
          <p>{t(step.body)}</p>
        </li>
      {/each}
    </ol>

    <div class="pile" id="home-tasks" tabindex="-1" bind:this={pile}>
      {#if tasks.length > 0}
        <h2>{t(m.home_table_tasks_title)}</h2>
        <ul>
          {#each tasks as task (task.id)}
            <li>
              <a href={resolve(`/task/${task.id}`, {})} data-sveltekit-preload-data="hover">
                <span>{task.title}</span>
                {#if typeof task.estimatedMinutes === 'number'}<span class="minutes">{task.estimatedMinutes} {t(m.minutes_short)}</span>{/if}
              </a>
            </li>
          {/each}
        </ul>
        <a class="all" href={resolve('/tasks', {})} data-sveltekit-preload-data="hover">{t(m.home_view_all_tasks)}</a>
      {:else}
        <h2>{t(m.home_empty_title)}</h2>
        <p>{t(m.home_empty_body)}</p>
        <a class="all" href={resolve('/tasks', {})} data-sveltekit-preload-data="hover">{t(m.home_browse_all_tasks)}</a>
      {/if}
    </div>

    {#if role === 'ngo'}
      <a class="door secondary" href={resolve('/org', {})} data-sveltekit-preload-data="hover">{t(m.home_post_task)}</a>
    {:else if role === 'volunteer' || role === 'user'}
      <a class="door secondary" href={resolve('/dashboard', {})} data-sveltekit-preload-data="hover">{t(m.home_view_impact)}</a>
    {:else}
      <a class="door secondary" href={resolve('/signup', {})} data-sveltekit-preload-data="hover">{t(m.home_post_task)}</a>
    {/if}
    <a class="door find" href={resolve('/tasks', {})} data-sveltekit-preload-data="hover">{t(m.home_find_task)}</a>
  </div>
</section>

<style>
  .exchange {
    --table: var(--color-surface-container);
    --ngo-tint: #fff5f0;
    --vol-tint: var(--color-surface-variant);
    --seam: var(--color-outline-variant);
    --line: var(--color-text);
    --paper-shadow: 4px 4px 0 rgba(15, 23, 42, 0.14);
    --header: 72px;
    position: relative;
  }
  :global(.dark) .exchange { --ngo-tint: #2a2433; --vol-tint: #24293a; --table: #1e293b; --paper-shadow: 4px 4px 0 rgba(0, 0, 0, 0.4); }

  .skip { position: absolute; left: 16px; top: -64px; z-index: 60; padding: 8px 16px; border-radius: 8px; background: var(--color-text); color: var(--color-background); font-weight: 600; text-decoration: none; }
  .skip:focus { top: 84px; }

  /* Storyboard: the default layout, used without JavaScript and under reduced motion. */
  /* minmax(0, 1fr): a plain 1fr column grows to its widest child and overflows on phones. */
  .stage { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); background: var(--table); }
  .side { position: relative; padding: 40px 40px 8px; }
  .side.ngo { background: var(--ngo-tint); }
  .side.volunteer { background: var(--vol-tint); }
  .side-label { font: 700 13px Inter, sans-serif; letter-spacing: 0.04em; color: var(--color-text-secondary); }
  /* Text carries the background of the paper it sits on, so contrast checks can read it directly. */
  .ngo .side-label { background: var(--ngo-tint); }
  .volunteer .side-label { background: var(--vol-tint); }
  .steps h2, .steps p { background: var(--caption-bg, var(--table)); }
  .pile h2, .pile p { background: var(--vol-tint); }
  .seam { position: absolute; inset: 0 auto 0 50%; width: 2px; background: repeating-linear-gradient(to bottom, var(--seam) 0 10px, transparent 10px 20px); }
  .live { display: none; }

  .ticket { position: relative; grid-column: 1 / -1; justify-self: center; margin: 32px 0; width: calc(100% - 32px); max-width: 380px;
    background: var(--color-surface); color: var(--color-text); border: 2px solid var(--line); border-radius: 16px; padding: 24px; box-shadow: var(--paper-shadow); z-index: 3; }
  .ticket h1 { font: 800 clamp(26px, 2.6vw, 36px)/1.15 'Plus Jakarta Sans', sans-serif; margin: 0 0 16px; }
  .ticket h1 em { font-style: normal; color: var(--color-primary-readable); }
  .task { border-top: 2px dashed var(--color-outline); padding-top: 14px; display: grid; gap: 6px; padding-inline-end: 96px; }
  .task-title { font-weight: 700; }
  .task-meta { display: flex; flex-wrap: wrap; gap: 8px; font-size: 13px; color: var(--color-text-secondary); }
  .chip { padding: 2px 10px; border-radius: 9999px; background: #fed7aa; color: #431407; font-weight: 600; }
  /* Text boxes shrink to their content so the minute dial never sits under them. */
  .task > * { justify-self: start; }
  .clock { font: 700 clamp(20px, 2.4vw, 28px)/1 'Plus Jakarta Sans', sans-serif; font-variant-numeric: tabular-nums; }

  .steps { grid-column: 1 / -1; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); column-gap: 80px; row-gap: 28px; list-style: none; margin: 0; padding: 8px 40px 32px; }
  .steps li[data-side='ngo'] { grid-column: 1; }
  .steps li[data-side='volunteer'] { grid-column: 2; }
  .steps h2 { font: 700 20px/1.3 'Plus Jakarta Sans', sans-serif; margin: 0 0 4px; color: var(--color-text); }
  .steps p { margin: 0; color: var(--color-text-secondary); max-width: 520px; }
  .still { display: block; width: 96px; height: 96px; margin-bottom: 10px; }

  .pile { grid-column: 2; display: grid; gap: 12px; margin: 0 40px 24px; padding: 12px; border-radius: 16px; background: var(--vol-tint); }
  .pile h2 { font: 800 22px 'Plus Jakarta Sans', sans-serif; margin: 0; color: var(--color-text); }
  .pile p { margin: 0; color: var(--color-text-secondary); }
  .pile ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
  .pile li a { display: flex; justify-content: space-between; gap: 12px; padding: 14px 16px; background: var(--color-surface); color: var(--color-text);
    border: 2px solid var(--line); border-radius: 12px; box-shadow: var(--paper-shadow); text-decoration: none; font-weight: 600; }
  .pile .minutes { white-space: nowrap; }
  .pile .all { justify-self: start; color: var(--color-primary-readable); font-weight: 700; }
  .door { justify-self: start; margin: 0 40px 48px; padding: 12px 22px; border-radius: 9999px; font-weight: 700; text-decoration: none; border: 2px solid var(--line); color: var(--color-text); }
  .door.secondary { grid-column: 1; background: var(--color-surface); }
  .door.find { grid-column: 2; background: var(--color-primary); color: #000; }
  .door, .pile li a { transition: transform 0.15s ease-out, box-shadow 0.15s ease-out, background-color 0.15s ease-out; }
  .door:hover, .door:focus-visible, .pile li a:hover, .pile li a:focus-visible { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 rgba(15, 23, 42, 0.22); }
  .door.find:hover { background: var(--color-primary-variant); }
  .door.secondary:hover, .pile li a:hover { background: #fed7aa; color: #0f172a; }

  /* Motion: one pinned stage scrubbed by scroll. */
  .exchange.motion { height: 600vh; }
  .motion .stage { position: sticky; top: var(--header); height: calc(100svh - var(--header)); overflow: hidden; }
  .motion .side { padding: 24px 40px; }
  .motion .live { display: block; position: absolute; }
  .motion .player, .motion .player :global(svg) { display: block; width: 100%; height: 100%; overflow: visible; }
  .motion .player { position: absolute; inset: 0; }
  .motion .stamp { width: 200px; height: 200px; left: 32px; top: 40px; }
  .motion .stamp .approved { visibility: hidden; }
  .motion .reviewing .stamp .approved { visibility: visible; }
  .motion .reviewing .stamp .posted { visibility: hidden; }
  .motion .lanes { width: 70%; height: 110px; left: 15%; bottom: 112px; transition: opacity 0.2s ease-out; }
  .motion .lanes.gone { opacity: 0; }
  .motion .vignette { width: min(300px, 32vh); height: min(225px, 24vh); right: 48px; bottom: 24px; z-index: 4; }
  .motion .badge { width: 220px; height: 220px; right: 72px; bottom: 140px; }
  @media (min-width: 768px) and (max-width: 1023px) { .motion .stamp { width: 150px; height: 150px; } }
  .motion .ticket { position: absolute; left: 0; top: 0; margin: 0; width: clamp(300px, 34vw, 380px); max-width: none; will-change: transform; }
  .motion .seal { width: 88px; height: 88px; inset-inline-end: -44px; top: -52px; }
  .motion .clip { width: 64px; height: 106px; inset-inline-start: -38px; top: -72px; }
  .motion .dial { width: 96px; height: 100px; inset-inline-end: 14px; bottom: 12px; }
  .motion .still { display: none; }
  /* Captions stay inside the NGO half, over a single background. */
  /* Captions share one grid cell, so the box fits the longest one and nothing overflows the stage.
     Inactive captions are hidden, not just transparent, so they are not read or measured. */
  .motion .steps { --caption-bg: var(--ngo-tint); position: absolute; inset-block: auto 32px; inset-inline: 40px calc(50% + 24px); display: grid; align-items: end; padding: 0; z-index: 4; }
  .motion .steps li { grid-area: 1 / 1; max-width: 520px; opacity: 0; visibility: hidden; translate: 0 12px; }
  .motion .steps li.active { opacity: 1; visibility: visible; translate: 0 0; transition: opacity 0.25s ease-out, translate 0.25s ease-out; }
  .motion .pile { position: absolute; inset: 40px 40px auto auto; width: min(420px, 40vw); margin: 0; z-index: 5; opacity: 0; pointer-events: none; }
  .motion .door { position: absolute; bottom: 32px; margin: 0; z-index: 5; opacity: 0; }
  .motion .door.secondary { inset-inline-start: 40px; }
  .motion .door.find { inset-inline-end: 40px; }
  .motion .ended .pile, .motion .pile:focus, .motion .pile:focus-within, .motion .ended .door, .motion .door:focus-visible { opacity: 1; pointer-events: auto; transition: opacity 0.3s ease-out; }
  .motion .ended .steps, .motion .ended .lanes, .motion .ended .vignette { opacity: 0; transition: opacity 0.2s ease-out; }

  @media (max-width: 767px) {
    .stage, .steps { grid-template-columns: minmax(0, 1fr); }
    .seam { display: none; }
    .side { padding: 24px 16px 0; }
    .side.volunteer { display: none; }
    .steps { padding: 8px 16px 24px; }
    .steps li[data-side] { grid-column: 1; }
    .steps li[data-side='volunteer'] { margin-inline-start: 32px; }
    .pile, .door.secondary, .door.find { grid-column: 1; margin: 0 16px 16px; }

    .exchange.motion { height: 500vh; }
    .motion .stage { grid-template-rows: 1fr 1fr auto; }
    .motion .side { padding: 16px 16px 8px; }
    .motion .side.volunteer { display: block; }
    .motion .side-label { display: block; text-align: end; }
    .motion .seam { display: block; inset: 50% 0 auto 0; width: auto; height: 2px; background: repeating-linear-gradient(to right, var(--seam) 0 10px, transparent 10px 20px); }
    .motion .ticket { width: min(340px, calc(100vw - 32px)); padding: 18px; }
    .motion .ticket h1 { font-size: 24px; }
    .motion .vignette { display: none; }
    .motion .stamp { width: 84px; height: 84px; left: 120px; top: 8px; z-index: 4; }
    .motion .clip { inset-inline-start: 10px; top: -86px; width: 56px; height: 94px; }
    .motion .seal { inset-inline-end: -8px; top: -40px; }
    .motion .lanes { bottom: 12px; height: 64px; }
    .motion .badge { width: 120px; height: 120px; right: 16px; bottom: 76px; }
    .motion .steps { --caption-bg: var(--color-surface); position: relative; inset: auto; grid-row: 3; align-items: start; padding: 14px 16px 18px; background: var(--color-surface); border-top: 2px solid var(--line); }
    .motion .steps li { margin: 0; }
    .motion .steps h2 { font-size: 18px; }
    .motion .pile { inset: auto 16px 76px 16px; width: auto; }
    .motion .door { bottom: 16px; }
    .motion .door.secondary { inset-inline-start: 16px; }
    .motion .door.find { inset-inline-end: 16px; }
    .motion .ended .badge, .motion .ended .lanes { opacity: 0; }
  }
</style>
