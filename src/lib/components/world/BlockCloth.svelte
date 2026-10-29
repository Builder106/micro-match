<script lang="ts">
  // The pieced cloth of one sampler block: its traditional pattern in the block's fabrics,
  // a faint weave, and a running quilting stitch just inside the edge.
  import { patternPieces, piecePath } from '#lib/quilt/blocks.js';
  import { clothFill, type BlockDef } from '#lib/quilt/world.js';

  let { def, class: className = '' }: { def: BlockDef; class?: string } = $props();

  const uid = $props.id();
  const width = $derived(def.w * 100);
  const height = $derived(def.h * 100);
  const byFabric = $derived.by(() => {
    if (!def.pattern) return [];
    const pieces = patternPieces(def.pattern, def.w, def.h);
    return def.fabrics.map((color, f) => ({
      color,
      d: pieces
        .filter((p) => p.fabric === f)
        .map(piecePath)
        .join('')
    }));
  });
</script>

<svg class="cloth {className}" viewBox="0 0 {width} {height}" preserveAspectRatio="none" aria-hidden="true" focusable="false">
  <defs>
    <pattern id="{uid}-weave" width="3" height="3" patternUnits="userSpaceOnUse">
      <path d="M.75 0v3M2.25 0v3" stroke="#1C1F3B" stroke-opacity="0.05" stroke-width=".5" />
      <path d="M0 .75h3M0 2.25h3" stroke="#FFFFFF" stroke-opacity="0.09" stroke-width=".5" />
    </pattern>
  </defs>
  <rect width={width} height={height} fill={clothFill(def.fabrics[def.fabrics.length - 1])} />
  {#each byFabric as layer, i (i)}
    {#if layer.d}<path d={layer.d} fill={clothFill(layer.color)} />{/if}
  {/each}
  <rect width={width} height={height} fill="url(#{uid}-weave)" />
  <rect
    x="3"
    y="3"
    width={width - 6}
    height={height - 6}
    fill="none"
    stroke="var(--c-fg)"
    stroke-opacity="0.28"
    stroke-width="0.7"
    stroke-dasharray="2.6 2.2"
    vector-effect="non-scaling-stroke"
  />
</svg>

<style>
  .cloth {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
</style>
