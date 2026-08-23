<script lang="ts">
  import Icon from "@iconify/svelte";
  import { resolve } from '$app/paths';
  export let href = "/org";
</script>

<a href={resolve(href, {})} aria-label="Post task" class="fab animate-scale-in" style="z-index: 60;">
  <div class="card-elevated" role="button" tabindex="0" style="width: 64px; height: 64px; border-radius: var(--radius-2xl); background: var(--color-primary); display: flex; align-items: center; justify-content: center; box-shadow: var(--elev-4); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; border: 3px solid rgba(255, 255, 255, 0.2);" on:mouseenter={(e) => (e.currentTarget as HTMLDivElement | null)?.style.setProperty('transform', 'scale(1.1) rotate(90deg)')} on:mouseleave={(e) => (e.currentTarget as HTMLDivElement | null)?.style.setProperty('transform', 'scale(1) rotate(0deg)')}>
    <Icon icon="mdi:plus" width="28" height="28" style="color: var(--color-on-primary);"/>
  </div>
</a>
