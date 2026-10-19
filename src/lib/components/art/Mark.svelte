<script lang="ts">
  // The MicroMatch mark: an M pieced from two halves, madder and indigo, matched at one seam
  // (design/glaxnimate/brand.svg, #mark-bare). The indigo half is thread colored, so it turns
  // cream by lamplight the way indigo does in the quilt's piecing.
  let { class: className = '' }: { class?: string } = $props();
</script>

<svg class={className} viewBox="0 0 40 36" aria-hidden="true" focusable="false">
  <path d="M0 36V0h11l9 15v18l-9-15v18z" fill="var(--c-accent)" />
  <path d="M40 36V0H29l-9 15v18l9-15v18z" fill="currentColor" />
</svg>
