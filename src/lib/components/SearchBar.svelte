<script lang="ts">
  import Icon from "@iconify/svelte";
  export let placeholder = "Search";
  export let value = "";
  export let onInput: ((v: string) => void) | undefined;
</script>

<div class="card glass hover-lift" style="display: flex; align-items: center; gap: var(--space-4); padding: var(--space-4) var(--space-6); border-radius: var(--radius-2xl); box-shadow: var(--elev-2); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: 2px solid var(--color-outline-variant);">
  <div style="width: 40px; height: 40px; border-radius: var(--radius-full); background: #FF6B6B; color: #0F172A; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
    <Icon icon="mdi:magnify" width="20" height="20" style="color: white;"/>
  </div>
  <input
    value={value}
    on:input={(e) => onInput?.((e.target as HTMLInputElement).value)}
    placeholder={`${placeholder} tasks, tags, or skills...`}
    style="border: none; outline: none; background: transparent; flex: 1; font-size: var(--text-lg); color: var(--color-text); font-family: inherit; font-weight: var(--font-medium);"
  />
</div>
