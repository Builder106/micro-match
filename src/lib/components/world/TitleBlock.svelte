<script lang="ts">
  // The title block at the heart of the quilt: a sawtooth border around a large signed center.
  // It is the home page's heading; on other routes the same words are not a heading.
  import Link from '../Link.svelte';
  import { sawtoothBorder, piecePath } from '$lib/quilt/blocks';
  import { block, clothFill } from '$lib/quilt/world';
  import * as m from '$lib/paraglide/messages.js';

  let { isHome }: { isHome: boolean } = $props();

  const def = block('title');
  const W = 200;
  const H = 200;
  const border = sawtoothBorder(W, H, 12.5);
  const layers = def.fabrics.map((color, f) => ({
    color,
    d: border
      .filter((p) => p.fabric === f)
      .map(piecePath)
      .join('')
  }));
</script>

<div
  class="block block--title"
  data-block="title"
  style:--c={def.col + 1}
  style:--r={def.row + 1}
  style:--w={def.w}
  style:--h={def.h}
  style:--o={def.phone}
>
  <div class="block__face">
    <svg class="title__border" viewBox="0 0 {W} {H}" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <rect width={W} height={H} fill="var(--cloth-muslin)" />
      {#each layers as layer, i (i)}
        {#if layer.d}<path d={layer.d} fill={clothFill(layer.color)} />{/if}
      {/each}
    </svg>
    <div class="title__sig">
      {#if isHome}
        <h1 class="title__headline display">
          <span class="intro-line" style:--i="0"><span>{m.hero_line_1()}</span></span>
          <span class="intro-line" style:--i="1"><span>{m.hero_line_2()}</span></span>
          <span class="intro-line" style:--i="2"><span>{m.hero_line_3()}</span></span>
        </h1>
      {:else}
        <p class="title__headline display" aria-hidden="true">
          <span>{m.hero_line_1()}</span> <span>{m.hero_line_2()}</span> <span>{m.hero_line_3()}</span>
        </p>
      {/if}
      <p class="title__lede intro-settle" style:--i="3">{m.title_lede()}</p>
      <div class="title__ctas intro-settle" style:--i="4">
        <Link href="/tasks" class="patch-btn">{m.hero_find()}</Link>
        <Link href="/for-nonprofits" class="patch-btn patch-btn--plain">{m.hero_nonprofit()}</Link>
      </div>
      <p class="title__hint intro-settle" style:--i="5">
        <span class="hint--pointer">{m.title_hint_pointer()}</span>
        <span class="hint--touch">{m.title_hint_touch()}</span>
      </p>
    </div>
  </div>
</div>
