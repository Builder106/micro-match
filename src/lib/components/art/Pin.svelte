<script lang="ts">
  // A dressmaker's pin, drawn in Glaxnimate (design/glaxnimate/sewing-kit.svg, #pin).
  let { class: className = '' }: { class?: string } = $props();
</script>

<svg class={className} viewBox="14 15 50 50" aria-hidden="true" focusable="false">
  <path d="M28 30 58 62" stroke="#575B76" stroke-width="2.6" stroke-linecap="round" />
  <circle cx="26" cy="27" r="10" fill="var(--c-accent)" />
  <circle cx="23.2" cy="24.2" r="2.6" fill="#FDFCF8" fill-opacity="0.75" />
</svg>
