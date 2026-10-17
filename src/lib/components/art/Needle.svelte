<script lang="ts">
  // A threaded needle, drawn in Glaxnimate (design/glaxnimate/sewing-kit.svg, #needle).
  let { class: className = '' }: { class?: string } = $props();
</script>

<svg class={className} viewBox="12 14 108 94" aria-hidden="true" focusable="false">
  <path data-thread d="M96 24C112 14 118 40 101 50 84 60 70 50 63 63 56 76 70 88 58 102" fill="none" stroke="var(--c-accent)" stroke-width="2.4" stroke-linecap="round" pathLength="1" />
  <path d="M18 102 92.4 22.6C94.8 20.2 98.6 20.6 99.6 21.6 100.6 22.6 101 26.4 98.6 28.8z" fill="#575B76" />
  <path d="M93.6 26.4 97 23" stroke="#FDFCF8" stroke-width="1.4" stroke-linecap="round" />
</svg>
