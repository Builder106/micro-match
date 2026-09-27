<script lang="ts">
  import AuthBrandPanel from '$lib/components/AuthBrandPanel.svelte';

  export let animation: string;
  export let wideContent = false;
</script>

<div class="auth-shell">
  <div class="brand-panel">
    <AuthBrandPanel {animation} />
  </div>

  <main class="right-panel">
    <div class="auth-content" class:wide={wideContent}>
      <slot />
    </div>
  </main>
</div>

<style>
  .auth-shell {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100vh;
    overflow: hidden;
    background: var(--color-background);
    color: var(--color-text);
  }

  .brand-panel {
    width: 100%;
    height: 300px;
    flex: 0 0 300px;
  }

  .right-panel {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    min-height: 0;
    overflow-y: auto;
  }

  .auth-content {
    width: min(440px, calc(100% - 2rem));
    padding: 28px 18px 30px;
  }

  .auth-content.wide {
    width: min(540px, calc(100% - 2rem));
    padding-bottom: 32px;
  }

  @media (min-width: 1024px) {
    .auth-shell {
      flex-direction: row;
    }

    .brand-panel {
      width: 55%;
      height: 100vh;
      flex: 0 0 55%;
    }

    .right-panel {
      justify-content: center;
      width: 45%;
      height: 100vh;
      padding: 36px 16px;
    }

    .auth-content,
    .auth-content.wide {
      width: min(100%, 540px);
      padding: 8px 4px;
    }
  }
</style>
