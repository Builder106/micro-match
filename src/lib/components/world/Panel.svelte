<script lang="ts">
  // The cloth a block unfolds into. Its face carries the block's pattern during the flight;
  // its body holds the page. "Fold back" is a real link to the quilt.
  import type { Snippet } from 'svelte';
  import Link from '../Link.svelte';
  import BlockCloth from './BlockCloth.svelte';
  import type { BlockDef, PanelKind } from '#lib/quilt/world.js';
  import * as m from '#lib/paraglide/messages.js';

  type Props = {
    kind: PanelKind;
    def: BlockDef | null;
    where: string;
    children: Snippet;
    panel?: HTMLElement;
    scroller?: HTMLElement;
    content?: HTMLElement;
  };
  let {
    kind,
    def,
    where,
    children,
    panel = $bindable(),
    scroller = $bindable(),
    content = $bindable()
  }: Props = $props();
</script>

<article class="panel panel--{kind}" data-panel bind:this={panel}>
  {#if def}
    <div class="panel__face" data-panel-face aria-hidden="true"><BlockCloth {def} /></div>
  {/if}
  {#if def}
    <div class="panel__band" aria-hidden="true">
      {#each { length: 20 } as _, i (i)}<BlockCloth {def} />{/each}
    </div>
  {/if}
  <div class="panel__body" data-panel-body>
    <div class="panel__selvedge">
      <span class="panel__swatch" style:background={def?.fabrics[0] ?? 'var(--c-weld)'} aria-hidden="true"></span>
      <span class="panel__where">{where}</span>
      <Link href="/" class="panel__close" data-fold>
        <span>{m.panel_fold()}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18" /></svg>
      </Link>
    </div>
    <!-- The panel scrolls on its own, so the keyboard has to be able to reach it. -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div class="panel__scroll" bind:this={scroller} tabindex="0" role="region" aria-label={where}>
      <div class="panel__content" bind:this={content}>
        {@render children()}
      </div>
    </div>
  </div>
</article>
