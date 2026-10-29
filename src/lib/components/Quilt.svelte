<script lang="ts">
  // The community quilt, composed at runtime from the log cabin layout, the Glaxnimate icon
  // paths and each patch's real badge color. The first screen paints the finished quilt;
  // with motion on, CSS keyframes sew it in (no hidden state before hydration) and the GSAP
  // ticker keeps the chalked next strip's stitch moving while the quilt is on screen.
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';
  import { idle, startIdle } from '#engine/idle.js';
  import { layoutQuilt, polygonPath, linePath, inset } from '#lib/quilt/layout.js';
  import { PATCH_ICONS } from '#lib/quilt/icons.js';
  import Needle from './art/Needle.svelte';
  import type { QuiltPatch } from '#lib/quilt/patches.js';
  import * as m from '#lib/paraglide/messages.js';
  import { getLocale } from '#lib/paraglide/runtime.js';

  type Props = {
    patches: QuiltPatch[];
    label: string;
    /** Line set on the empty frame when there are no patches yet. */
    emptyLine?: string;
    intro?: boolean;
    interactive?: boolean;
    showNext?: boolean;
    /** Inside the sampler: no binding of its own, the big quilt binds it. */
    bare?: boolean;
    /** Crop to the patches there are (a personal block), instead of the full block frame. */
    fit?: boolean;
    class?: string;
  };

  let {
    patches,
    label,
    emptyLine = m.quilt_empty_line(),
    intro = true,
    interactive = true,
    showNext = true,
    bare = false,
    fit = false,
    class: className = ''
  }: Props = $props();

  const uid = $props.id();
  const layout = $derived(layoutQuilt(patches.length));
  const pieces = $derived(
    layout.pieces.map((piece, i) => {
      const patch = patches[i];
      const seam = piece.side === 'center' ? inset(piece.seam, 7) : inset(piece.seam, 6, piece.center);
      const iconSize = Math.min(piece.room, 46);
      return { piece, patch, seam: linePath(seam), outline: polygonPath(piece.corners), iconSize };
    })
  );
  const nextOutline = $derived(polygonPath(inset(layout.next.corners, 3)));
  // The visible window onto the layout: the whole frame, or just the pieces plus the next strip.
  const box = $derived.by(() => {
    if (!fit) return { x: 0, y: 0, w: layout.width, h: layout.height };
    const pts = [...layout.pieces.flatMap((p) => p.corners), ...layout.next.corners];
    const pad = 26;
    const x0 = Math.min(...pts.map((p) => p.x)) - pad;
    const y0 = Math.min(...pts.map((p) => p.y)) - pad;
    const w = Math.max(...pts.map((p) => p.x)) + pad - x0;
    const h = Math.max(...pts.map((p) => p.y)) + pad - y0;
    const side = Math.max(w, h, 220);
    return { x: x0 - (side - w) / 2, y: y0 - (side - h) / 2, w: side, h: side };
  });
  const delay = $derived(Math.min(55, 1300 / Math.max(1, patches.length)));

  let active = $state<number | null>(null);
  // Leaving a patch waits a moment, so the pointer can cross to its label and stay there.
  let leaving: ReturnType<typeof setTimeout> | undefined;
  // After Escape, a label stays dismissed until the pointer really moves, so the patch that is
  // uncovered under a still pointer does not bring it straight back.
  let dismissedAt: { x: number; y: number } | null = null;
  let pointer = { x: 0, y: 0 };
  const hover = (i: number) => {
    if (dismissedAt) return;
    clearTimeout(leaving);
    active = i;
  };
  const unhover = (i: number) => {
    clearTimeout(leaving);
    leaving = setTimeout(() => active === i && (active = null), 300);
  };

  // Escape dismisses a patch's label without moving the pointer or focus (WCAG 1.4.13). It is
  // caught on the way down and marked handled, so an open panel does not also fold back.
  $effect(() => {
    const dismiss = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || active === null) return;
      clearTimeout(leaving);
      active = null;
      dismissedAt = { ...pointer };
      e.preventDefault();
    };
    const track = (e: PointerEvent) => {
      pointer = { x: e.clientX, y: e.clientY };
      if (dismissedAt && Math.hypot(pointer.x - dismissedAt.x, pointer.y - dismissedAt.y) > 6) dismissedAt = null;
    };
    addEventListener('keydown', dismiss, { capture: true });
    addEventListener('pointermove', track, { passive: true });
    return () => {
      removeEventListener('keydown', dismiss, { capture: true });
      removeEventListener('pointermove', track);
    };
  });
  const activePatch = $derived(active === null ? null : pieces[active]);

  let root: HTMLElement;
  let chalk = $state<SVGPathElement>();
  let cloth = $state<SVGGElement>();
  let needle = $state<HTMLElement>();

  function sewnLabel(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '' : m.quilt_sewn_on({ day: d.toLocaleDateString(getLocale(), { month: 'short', day: 'numeric' }) });
  }

  onMount(() => {
    startIdle();
    let visible = false;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(root);
    const sway = cloth ? gsap.quickTo(cloth, 'rotation', { duration: 1.2, ease: 'power3.out' }) : null;
    let lastStep = -1;
    const tick = () => {
      if (!visible) return;
      // Whole-pixel steps: the stitch still marches, but the SVG repaints a few times a second.
      const step = Math.floor((idle.t * 9) % 13);
      if (chalk && step !== lastStep) {
        lastStep = step;
        chalk.style.strokeDashoffset = String(-step);
      }
      if (!bare) sway?.(idle.x * 0.8 + Math.sin(idle.t * 0.5) * 0.15);
      if (needle) gsap.set(needle, { y: Math.sin(idle.t * 1.3) * 4, rotation: Math.sin(idle.t * 0.9) * 2.5 });
    };
    if (cloth) gsap.set(cloth, { svgOrigin: `${layout.width / 2} ${layout.height / 2}` });
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      io.disconnect();
      if (cloth) gsap.killTweensOf(cloth);
    };
  });
</script>


{#snippet patchCloth(p: (typeof pieces)[number])}
  <path d={p.outline} fill={p.patch.color} />
  {#if p.patch.icon && p.iconSize >= 16}
    <g transform="translate({p.piece.center.x - p.iconSize / 2} {p.piece.center.y - p.iconSize / 2}) scale({p.iconSize / 24})">
      <path d={PATCH_ICONS[p.patch.icon]} fill="none" stroke={p.patch.thread} stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
    </g>
  {/if}
  <path
    class="quilt__seam"
    d={p.seam}
    fill="none"
    stroke={p.patch.thread}
    stroke-opacity="0.6"
    stroke-width="1.7"
    stroke-dasharray="6 5"
    stroke-linecap="round"
    mask="url(#{uid}-m{p.piece.index})"
  />
{/snippet}

<figure class="quilt {className}" class:quilt--intro={intro} class:quilt--fit={fit} bind:this={root} style:--delay="{delay}ms" style:aspect-ratio="{box.w} / {box.h}">
  <svg
    viewBox="{box.x} {box.y} {box.w} {box.h}"
    role={interactive ? 'group' : 'img'}
    aria-label={label}
    class="quilt__svg"
  >
    <defs>
      <pattern id="{uid}-weave" width="6" height="6" patternUnits="userSpaceOnUse">
        <path d="M1.5 0v6M4.5 0v6" stroke="#1C1F3B" stroke-opacity="0.06" stroke-width="1" />
        <path d="M0 1.5h6M0 4.5h6" stroke="#FFFFFF" stroke-opacity="0.1" stroke-width="1" />
      </pattern>
      <pattern id="{uid}-quilting" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <path d="M0 14h28" stroke="var(--c-fg)" stroke-opacity="0.09" stroke-width="1.2" stroke-dasharray="4 4" />
      </pattern>
      {#each pieces as p (p.piece.index)}
        <mask id="{uid}-m{p.piece.index}" maskUnits="userSpaceOnUse">
          <path class="quilt__draw" d={p.seam} fill="none" stroke="#fff" stroke-width="10" pathLength="1" style:--i={p.piece.index} />
        </mask>
      {/each}
    </defs>

    <g bind:this={cloth}>
      {#if !bare}
        <rect class="quilt__binding" x="2" y="2" width={layout.width - 4} height={layout.height - 4} rx="4" />
      {/if}
      <rect class="quilt__backing" x={bare ? 0 : 9} y={bare ? 0 : 9} width={layout.width - (bare ? 0 : 18)} height={layout.height - (bare ? 0 : 18)} rx="2" />
      <rect x={bare ? 0 : 9} y={bare ? 0 : 9} width={layout.width - (bare ? 0 : 18)} height={layout.height - (bare ? 0 : 18)} fill="url(#{uid}-quilting)" />
      {#if !bare}
        <rect class="quilt__quilting" x="15" y="15" width={layout.width - 30} height={layout.height - 30} />
      {/if}

      {#each pieces as p, i (p.piece.index)}
        {#if interactive}
          <g
            class="quilt__patch"
            class:is-active={active === i}
            style:--i={i}
            role="button"
            tabindex="0"
            aria-label={p.patch.minutes ? m.quilt_patch_label_minutes({ name: p.patch.label ?? m.quilt_muslin_patch(), count: p.patch.minutes }) : (p.patch.label ?? m.quilt_muslin_patch())}
            onpointerenter={() => hover(i)}
            onpointerleave={() => unhover(i)}
            onfocus={() => (active = i)}
            onblur={() => active === i && (active = null)}
          >
            {@render patchCloth(p)}
          </g>
        {:else}
          <g class="quilt__patch" style:--i={i}>{@render patchCloth(p)}</g>
        {/if}
      {/each}

      <!-- One weave over the whole quilt instead of one per patch: far fewer pattern paints. -->
      <rect x="0" y="0" width={layout.width} height={layout.height} fill="url(#{uid}-weave)" pointer-events="none" />

      {#if showNext}
        <path bind:this={chalk} class="quilt__chalk" d={nextOutline} />
      {/if}
    </g>
  </svg>

  {#if patches.length === 0}
    <div
      class="quilt__needle"
      bind:this={needle}
      style:left="{((layout.next.center.x + 70 - box.x) / box.w) * 100}%"
      style:top="{((layout.next.center.y - 150 - box.y) / box.h) * 100}%"
    >
      <Needle />
    </div>
    <figcaption class="quilt__empty" style:--y="{((layout.next.center.y + 64 - box.y) / box.h) * 100}%">
      {emptyLine}
    </figcaption>
  {/if}

  {#if activePatch}
    <div
      class="quilt__tag"
      role="presentation"
      onpointerenter={() => active !== null && hover(active)}
      onpointerleave={() => active !== null && unhover(active)}
      aria-hidden="true"
      style:left="{((activePatch.piece.center.x - box.x) / box.w) * 100}%"
      style:top="{((activePatch.piece.center.y - box.y) / box.h) * 100}%"
    >
      <span class="quilt__tag-swatch" style:background={activePatch.patch.color}></span>
      <span class="quilt__tag-text">
        <strong>{activePatch.patch.label ?? m.quilt_muslin()}</strong>
        {#if activePatch.patch.minutes}<span>{m.quilt_minute_task({ count: activePatch.patch.minutes })}</span>{/if}
        {#if !activePatch.patch.label}<span>{m.quilt_no_badge()}</span>{/if}
        <span>{sewnLabel(activePatch.patch.sewnAt)}</span>
      </span>
    </div>
  {/if}
</figure>

<style>
  .quilt {
    position: relative;
    margin: 0;
    container-type: inline-size;
    /* Its own layer: the marching chalk repaints this quilt only, never the canvas around it. */
    will-change: transform;
  }
  .quilt__svg {
    width: 100%;
    height: auto;
    overflow: visible;
  }
  .quilt--fit .quilt__svg {
    overflow: hidden;
    border-radius: 4px;
    box-shadow: 0 0 0 7px var(--c-binding);
  }
  .quilt__binding {
    fill: var(--c-binding);
  }
  .quilt__backing {
    fill: var(--c-backing);
  }
  .quilt__quilting {
    fill: none;
    stroke: var(--c-fg);
    stroke-opacity: 0.22;
    stroke-width: 1.4;
    stroke-dasharray: 6 6;
  }
  .quilt__patch {
    transform-box: fill-box;
    transform-origin: center;
    outline: none;
    transition: translate 0.35s cubic-bezier(0.16, 1, 0.3, 1), filter 0.35s;
  }
  .quilt__patch[role='button'] {
    cursor: pointer;
  }
  .quilt__patch.is-active {
    translate: 0 -3px;
    filter: drop-shadow(0 4px 0 color-mix(in srgb, var(--c-shade) 28%, transparent));
  }
  .quilt__patch:focus-visible {
    filter: drop-shadow(0 0 0 var(--c-weld)) drop-shadow(0 0 3px var(--c-weld));
  }
  .quilt__chalk {
    fill: none;
    stroke: var(--c-weld);
    stroke-width: 3;
    stroke-dasharray: 7 6;
    stroke-linecap: round;
  }
  .quilt__needle {
    position: absolute;
    width: 24%;
    pointer-events: none;
  }
  .quilt__empty {
    position: absolute;
    left: 50%;
    top: var(--y);
    translate: -50% 0;
    width: max-content;
    max-width: 80%;
    text-align: center;
    font-family: var(--f-display);
    font-weight: 650;
    font-size: clamp(1rem, 4.2cqi, 1.5rem);
    letter-spacing: -0.01em;
  }
  .quilt__tag {
    position: absolute;
    z-index: 2;
    translate: -50% calc(-100% - 18px);
    display: flex;
    gap: 0.6rem;
    align-items: flex-start;
    padding: 0.6rem 0.75rem;
    min-width: 11rem;
    background: var(--c-paper);
    color: var(--c-fg);
    border-radius: var(--radius);
    box-shadow: 0 0 0 1.5px var(--c-fg), 0 8px 0 -3px color-mix(in srgb, var(--c-shade) 25%, transparent);
    font-size: var(--t-xs);
    line-height: 1.35;
    pointer-events: auto; /* hoverable, so the pointer can rest on it (WCAG 1.4.13) */
  }
  .quilt__tag-swatch {
    flex: none;
    width: 1rem;
    height: 1rem;
    margin-top: 0.1rem;
    border-radius: 2px;
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c-fg) 30%, transparent);
  }
  .quilt__tag-text {
    display: grid;
  }
  .quilt__tag-text strong {
    font-family: var(--f-display);
    font-size: 0.92rem;
    font-weight: 700;
  }

  /* Intro: transform-only and one-shot, so the finished quilt is what paints without JS. */
  @keyframes sew-in {
    from {
      transform: scale(0.001) rotate(-10deg);
    }
    65% {
      transform: scale(1.05) rotate(1.2deg);
    }
    to {
      transform: none;
    }
  }
  @keyframes draw {
    from {
      stroke-dashoffset: 1;
    }
    to {
      stroke-dashoffset: 0;
    }
  }
  :global(html.motion) .quilt--intro .quilt__patch {
    animation: sew-in 0.75s cubic-bezier(0.16, 1, 0.3, 1) both;
    animation-delay: calc(var(--i) * var(--delay) + 250ms);
  }
  :global(html.motion) .quilt--intro .quilt__draw {
    stroke-dasharray: 1 1;
    animation: draw 0.7s cubic-bezier(0.65, 0, 0.35, 1) both;
    animation-delay: calc(var(--i) * var(--delay) + 650ms);
  }
</style>
