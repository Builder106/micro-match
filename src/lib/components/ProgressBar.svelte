<script lang="ts">
  export let value: number = 0; // 0..1
  const clamped = Math.max(0, Math.min(1, value));
</script>

<div style="width: 100%; height: 12px; background: var(--color-outline-variant); border-radius: var(--radius-full); overflow: hidden; position: relative;">
  <div style="height: 100%; width: {clamped * 100}%; background: var(--color-primary); border-radius: var(--radius-full); transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative;">
    <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent); animation: shimmer 2s infinite;"></div>
  </div>
  <slot />
</div>

<style>
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
</style>
