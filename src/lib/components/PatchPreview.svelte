<script lang="ts">
  // One patch on its own: hand-cut cloth in the badge's color, its embroidered icon and a
  // running stitch. Pinned patches (claims still waiting for a person) are only basted on.
  import { PATCH_ICONS, type PatchIcon } from '#lib/quilt/icons.js';
  import { fabricFor, threadFor } from '#lib/quilt/fabrics.js';

  type Props = { color?: string | null; icon?: PatchIcon | null; pinned?: boolean; size?: string; label?: string };
  let { color = null, icon = null, pinned = false, size = '6rem', label }: Props = $props();

  const cloth = $derived(fabricFor(color));
  const thread = $derived(threadFor(color));
</script>

<svg
  class="patch"
  class:patch--pinned={pinned}
  viewBox="0 0 100 100"
  style:width={size}
  style:height={size}
  role={label ? 'img' : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : 'true'}
>
  <path d="M6 8.5 93 5 95.5 92 5 95z" fill={cloth} />
  <path d="M14 15.5 86 13 88 85 13 87z" fill="none" stroke={thread} stroke-opacity="0.7" stroke-width="2" stroke-dasharray="6 5" stroke-linecap="round" />
  {#if icon}
    <g transform="translate(28 28) scale(1.8)">
      <path d={PATCH_ICONS[icon]} fill="none" stroke={thread} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    </g>
  {/if}
  {#if pinned}
    <circle cx="20" cy="18" r="6" fill="var(--c-accent)" />
    <circle cx="18.2" cy="16.2" r="1.8" fill="#fff" fill-opacity="0.75" />
  {/if}
</svg>

<style>
  .patch {
    flex: none;
    overflow: visible;
    filter: drop-shadow(0 3px 0 color-mix(in srgb, var(--c-shade) 18%, transparent));
  }
  .patch--pinned {
    rotate: -3deg;
    opacity: 0.85;
  }
  .patch--pinned path:first-child {
    stroke: var(--c-fg);
    stroke-width: 1.5;
    stroke-dasharray: 4 4;
  }
</style>
