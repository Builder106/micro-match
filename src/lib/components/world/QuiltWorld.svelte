<script lang="ts">
  // The site itself: one sampler quilt. On desktop it is a fixed canvas the camera pans; on
  // phones the same blocks flow as a two-column path that scrolls natively. The first camera
  // position is set in CSS from the route (--bx, --by), so server-rendered pages paint in place.
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';
  import { page } from '$app/state';
  import SamplerBlock from './SamplerBlock.svelte';
  import TitleBlock from './TitleBlock.svelte';
  import CommunityBlock from './CommunityBlock.svelte';
  import LabelBlock from './LabelBlock.svelte';
  import Link from '../Link.svelte';
  import { createCamera, type Camera } from '$engine/camera';
  import { BLOCKS, GRID, block, focusForPath, toPixels, worldSize, type BlockId, type Point } from '$lib/quilt/world';
  import type { PatchIcon } from '$lib/quilt/icons';
  import type { QuiltPatch } from '$lib/quilt/patches';
  import * as m from '$lib/paraglide/messages.js';

  type TaskPreview = { id: string; title: string; estimatedMinutes?: number };
  type Props = {
    patches: QuiltPatch[];
    total: number;
    tasks: TaskPreview[];
    taskCount: number;
    signedIn: boolean;
    role: string;
    /** The block lifted out into the panel, if any. */
    openId: BlockId | null;
    hasPanel: boolean;
  };
  let { patches, total, tasks, taskCount, signedIn, role, openId, hasPanel }: Props = $props();

  const isHome = $derived(!hasPanel);
  const focus = $derived(focusForPath(page.url.pathname));

  const copy: Partial<Record<BlockId, { title: () => string; line: () => string; icon: PatchIcon }>> = {
    how: { title: m.block_how_title, line: m.block_how_line, icon: 'pencil' },
    volunteers: { title: m.block_volunteers_title, line: m.block_volunteers_line, icon: 'heart' },
    nonprofits: { title: m.block_nonprofits_title, line: m.block_nonprofits_line, icon: 'house' },
    about: { title: m.block_about_title, line: m.block_about_line, icon: 'leaf' },
    contact: { title: m.block_contact_title, line: m.block_contact_line, icon: 'speech' },
    help: { title: m.block_help_title, line: m.block_help_line, icon: 'sun' },
    docs: { title: m.block_docs_title, line: m.block_docs_line, icon: 'book' },
    api: { title: m.block_api_title, line: m.block_api_line, icon: 'globe' }
  };
  const samplers = BLOCKS.filter((b) => b.id in copy);
  const crossings = Array.from({ length: (GRID.cols + 1) * (GRID.rows + 1) }, (_, i) => ({
    x: i % (GRID.cols + 1),
    y: Math.floor(i / (GRID.cols + 1))
  }));

  let view = $state<HTMLElement>();
  let world = $state<HTMLElement>();
  let mapView = $state<HTMLElement>();
  let camera: Camera | null = null;

  /** Point the camera at a route's block, leaving room for a panel of `panelWidth`. */
  export function lookAt(pathname: string, panelWidth: number, immediate = false) {
    if (!camera) return;
    camera.lookAt(toPixels(focusForPath(pathname), camera.metrics()), panelWidth, immediate);
  }

  /** The block's rectangle on screen, for the panel to unfold from. */
  export function rectOf(id: BlockId | null): DOMRect | null {
    if (!id || !world) return null;
    const el = world.querySelector<HTMLElement>(`[data-block="${id}"]`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const onScreen = r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
    return onScreen ? r : null;
  }

  function jump(e: MouseEvent) {
    if (!camera || !mapView) return;
    const box = mapView.parentElement!.getBoundingClientRect();
    const p: Point = { x: ((e.clientX - box.left) / box.width) * GRID.cols, y: ((e.clientY - box.top) / box.height) * GRID.rows };
    camera.lookAt(toPixels(p, camera.metrics()), hasPanel ? (document.querySelector<HTMLElement>('[data-panel]')?.offsetWidth ?? 0) : 0);
  }

  onMount(() => {
    const desktop = matchMedia('(min-width: 900px)');
    const syncMap = () => {
      if (!camera || !mapView || !view) return;
      const size = worldSize(camera.metrics());
      const p = camera.position();
      gsap.set(mapView, {
        left: `${(-p.x / size.w) * 100}%`,
        top: `${(-p.y / size.h) * 100}%`,
        width: `${(view.clientWidth / size.w) * 100}%`,
        height: `${(view.clientHeight / size.h) * 100}%`
      });
    };
    const setup = () => {
      camera?.destroy();
      camera = null;
      gsap.ticker.remove(syncMap);
      if (desktop.matches && view && world) {
        camera = createCamera(view, world);
        gsap.ticker.add(syncMap);
      }
    };
    setup();
    desktop.addEventListener('change', setup);
    return () => {
      desktop.removeEventListener('change', setup);
      gsap.ticker.remove(syncMap);
      camera?.destroy();
    };
  });
</script>

<div class="quilt-view" class:has-panel={hasPanel} bind:this={view}>
  <div
    class="quilt-world"
    bind:this={world}
    style:--bx={focus.x}
    style:--by={focus.y}
    role="group"
    aria-label={m.world_label()}
  >
    {#each crossings as c (`${c.x}-${c.y}`)}
      <span class="cornerstone" style:--x={c.x} style:--y={c.y} aria-hidden="true"></span>
    {/each}

    <TitleBlock {isHome} />
    <CommunityBlock {patches} {total} open={openId === 'community'} />

    <SamplerBlock
      def={block('tasks')}
      title={m.block_tasks_title()}
      line={taskCount === 1 ? m.block_tasks_one() : m.block_tasks_line({ count: taskCount })}
      icon="star"
      open={openId === 'tasks'}
    >
      {#snippet extra()}
        {#if tasks.length}
          <ul class="tasks__swatches">
            {#each tasks as t (t.id)}
              <li>
                <Link href="/task/{t.id}" class="tasks__swatch">
                  <span class="tasks__min num">{t.estimatedMinutes ?? '?'} min</span>
                  <span class="tasks__name">{t.title}</span>
                </Link>
              </li>
            {/each}
          </ul>
        {/if}
      {/snippet}
    </SamplerBlock>

    <SamplerBlock
      def={{ ...block('account'), href: signedIn ? '/dashboard' : '/login' }}
      title={signedIn ? (role === 'ngo' ? m.block_account_ngo_title() : m.block_account_title()) : m.block_account_title()}
      line={signedIn ? (role === 'ngo' ? m.block_account_ngo_line() : m.block_account_signed_line()) : m.block_account_line()}
      icon="star"
      open={openId === 'account'}
    />

    {#each samplers as def (def.id)}
      {@const c = copy[def.id]!}
      <SamplerBlock {def} title={c.title()} line={c.line()} icon={c.icon} open={openId === def.id} />
    {/each}

    <LabelBlock open={openId === 'label'} />
  </div>

  <div class="minimap" aria-hidden="true" data-no-drag>
    <button type="button" class="minimap__hit" tabindex="-1" aria-label={m.minimap_jump()} onclick={jump}>
      {#each BLOCKS as b (b.id)}
        <span
          class="minimap__block"
          class:is-open={openId === b.id}
          style:--c={b.col}
          style:--r={b.row}
          style:--w={b.w}
          style:--h={b.h}
          style:background={b.id === 'title' ? 'var(--c-accent)' : b.id === 'community' ? 'var(--c-weld)' : b.fabrics[0]}
        ></span>
      {/each}
      <span class="minimap__view" bind:this={mapView}></span>
    </button>
  </div>
</div>
