<script lang="ts">
  // Dressmaker's scissors, drawn in Glaxnimate (design/glaxnimate/sewing-kit.svg, #scissors).
  let { class: className = '' }: { class?: string } = $props();
</script>

<svg class={className} viewBox="2 10 116 106" aria-hidden="true" focusable="false">
  <g fill="none" stroke="var(--c-fg)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="18" cy="78" r="12" />
    <circle cx="44" cy="100" r="12" />
    <!-- Each blade runs from its loop through the pivot, so the two cross there. -->
    <path d="M29.1 73.5 62 60 109.2 33.8" />
    <path d="M48.9 89.1 62 60 96 18" />
  </g>
  <circle cx="62" cy="60" r="3" fill="var(--c-fg)" />
</svg>
