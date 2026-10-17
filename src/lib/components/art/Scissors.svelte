<script lang="ts">
  // Dressmaker's scissors, drawn in Glaxnimate (design/glaxnimate/sewing-kit.svg, #scissors).
  let { class: className = '' }: { class?: string } = $props();
</script>

<svg class={className} viewBox="2 10 116 106" aria-hidden="true" focusable="false">
  <g fill="none" stroke="var(--c-fg)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="22" cy="88" r="13" />
    <circle cx="50" cy="100" r="13" />
    <path d="M32 79 108 18" />
    <path d="M41 90 112 40" />
  </g>
  <circle cx="62" cy="58" r="3" fill="var(--c-fg)" />
</svg>
