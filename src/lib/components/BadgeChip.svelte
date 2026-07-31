<script lang="ts">
  import Icon from "@iconify/svelte";
  export let label: string;
  export let color: string = "#16a34a";
</script>

<span class="chip chip-success" style="background: color-mix(in srgb, {color} 15%, transparent); color: {color}; font-weight: 500; padding: var(--space-2) var(--space-4); border: 1px solid color-mix(in srgb, {color} 25%, transparent);">
  <Icon icon="hugeicons:award-01" width="14" height="14"/> {label}
  <slot />
</span>

