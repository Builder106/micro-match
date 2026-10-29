<script lang="ts">
  // The community block: the live log cabin. Every patch in it is a claim a person approved.
  import Link from '../Link.svelte';
  import Quilt from '../Quilt.svelte';
  import { block } from '#lib/quilt/world.js';
  import type { QuiltPatch } from '#lib/quilt/patches.js';
  import * as m from '#lib/paraglide/messages.js';

  let { patches, total, open = false }: { patches: QuiltPatch[]; total: number; open?: boolean } = $props();
  const def = block('community');
</script>

<div
  class="block block--community"
  class:is-open={open}
  data-block="community"
  style:--c={def.col + 1}
  style:--r={def.row + 1}
  style:--w={def.w}
  style:--h={def.h}
  style:--o={def.phone}
>
  <div class="block__face">
    <Quilt {patches} label={total === 1 ? m.quilt_label_one() : m.quilt_label({ count: total })} emptyLine={m.quilt_empty_line()} bare />
    <div class="community__caption">
      <h2 class="community__title">
        <Link href="/impact" class="community__link">{m.block_community_title()}</Link>
      </h2>
      <p>
        {#if total === 0}
          {m.block_community_empty()}
        {:else if total === 1}
          {m.block_community_one()}
        {:else}
          {m.block_community_count({ count: total })}
        {/if}
      </p>
    </div>
  </div>
  <div class="block__hole" aria-hidden="true"></div>
</div>
