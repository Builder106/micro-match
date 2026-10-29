<script lang="ts">
  // One sampler block on the quilt: its pieced pattern with a plain center square where the
  // block is "signed", as on a friendship quilt. The title is the block's link; it stretches
  // over the whole block. When the block is open in a panel, a chalked hole takes its place.
  import type { Snippet } from 'svelte';
  import Link from '../Link.svelte';
  import BlockCloth from './BlockCloth.svelte';
  import { PATCH_ICONS, type PatchIcon } from '#lib/quilt/icons.js';
  import type { BlockDef } from '#lib/quilt/world.js';

  type Props = {
    def: BlockDef;
    title: string;
    line: string;
    icon?: PatchIcon;
    open?: boolean;
    current?: boolean;
    extra?: Snippet;
  };
  let { def, title, line, icon, open = false, current = false, extra }: Props = $props();
</script>

<div
  class="block block--sampler"
  class:is-open={open}
  class:is-wide={def.w > 1}
  data-block={def.id}
  style:--c={def.col + 1}
  style:--r={def.row + 1}
  style:--w={def.w}
  style:--h={def.h}
  style:--o={def.phone}
>
  <div class="block__face">
    <BlockCloth {def} />
    <div class="sig">
      {#if icon}
        <svg class="sig__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d={PATCH_ICONS[icon]} />
        </svg>
      {/if}
      <h2 class="sig__title">
        {#if def.href}
          <Link href={def.href} class="sig__link" aria-current={current ? 'page' : undefined}>{title}</Link>
        {:else}
          {title}
        {/if}
      </h2>
      <p class="sig__line">{line}</p>
      {@render extra?.()}
    </div>
  </div>
  <div class="block__hole" aria-hidden="true"></div>
</div>
