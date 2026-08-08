<script lang="ts">
  import Button from "@smui/button";
  import Icon from "@iconify/svelte";
  export let title: string = "Nothing here yet";
  export let description: string = "Check back later or adjust your filters.";
  export let ctaText: string | undefined = undefined;
  export let ctaHref: string | undefined = undefined;
</script>

<section class="card" style="padding: var(--space-12); text-align: center; margin: 0 var(--space-4);">
  <div style="width: 80px; height: 80px; margin: 0 auto var(--space-6); border-radius: var(--radius-full); background: var(--color-primary); display: flex; align-items: center; justify-content: center; opacity: 0.8;">
    <Icon icon="mdi:magnify" width="32" height="32" style="color: white;"/>
  </div>
  <h3 style="margin: 0 0 var(--space-3) 0; font-size: var(--text-xl); font-weight: 500; color: var(--color-text);">{title}</h3>
  <p style="margin: 0; color: var(--color-text-secondary); font-size: var(--text-base); line-height: var(--leading-normal); max-width: 320px; margin-left: auto; margin-right: auto;">{description}</p>
  {#if ctaText && ctaHref}
    <div style="margin-top: var(--space-6);">
      <Button href={ctaHref} style="background: var(--color-primary); color: var(--color-on-primary); padding: var(--space-3) var(--space-6); border-radius: var(--radius-sm);">{ctaText}</Button>
    </div>
  {/if}
</section>

