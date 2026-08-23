<script lang="ts">
  import { resolve } from '$app/paths';
  export let avatarUrl = "";
  export let title = "";
  export let subtitle = "";
  export let time = "";
  export let unread = 0;
  export let href = "#";
</script>

<a href={href.startsWith('/') ? resolve(href, {}) : href} style="display:flex;align-items:center;gap:12px;padding:12px 8px;text-decoration:none;color:inherit;">
  <img src={avatarUrl} alt="" width="44" height="44" style="border-radius:999px;object-fit:cover;" />
  <div style="flex:1;min-width:0;">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
      <strong style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{title}</strong>
      <small style="color:var(--color-muted);">{time}</small>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:4px;">
      <span style="color:var(--color-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{subtitle}</span>
      {#if unread > 0}
        <span style="display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;padding:0 6px;border-radius:999px;background:color-mix(in srgb, var(--color-primary) 18%, transparent);color:var(--color-primary-variant);font-size:12px;">{unread}</span>
      {/if}
    </div>
  </div>
</a>
