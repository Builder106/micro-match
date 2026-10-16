<script lang="ts">
  // A pinked swatch of cloth with a running stitch, drawn in Glaxnimate
  // (design/glaxnimate/sewing-kit.svg, #swatch). The cloth color is a prop.
  let { color = 'var(--c-accent)', class: className = '' }: { color?: string; class?: string } = $props();
</script>

<svg class={className} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
  <path d="M0 8 6 0 12 8 18 0 24 8 30 0 36 8 42 0 48 8 54 0 60 8 66 0 72 8 78 0 84 8 90 0 96 8 102 0 108 8 114 0 120 8V120H0z" fill={color} />
  <path d="M10 22H110V110H10z" fill="none" stroke="#000" stroke-opacity="0.5" stroke-width="2" stroke-dasharray="6 5" stroke-linecap="round" />
</svg>
