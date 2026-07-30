<script lang="ts">
  import Icon from "@iconify/svelte";
  import { page } from '$app/state';
  import { tick, onDestroy } from 'svelte';
  import { fly, fade } from 'svelte/transition';

  export let activeTab: 'home' | 'how-it-works' | 'for-ngos' | 'for-volunteers' | 'tasks' | 'impact' | undefined = undefined;

  let mobileMenuOpen = false;
  let menuToggleEl: HTMLButtonElement | null = null;
  let firstMenuLinkEl: HTMLAnchorElement | null = null;

  async function toggleMenu() {
    mobileMenuOpen = !mobileMenuOpen;
    if (mobileMenuOpen) {
      await tick();
      firstMenuLinkEl?.focus();
    }
  }

  function closeMenu() {
    if (!mobileMenuOpen) return;
    mobileMenuOpen = false;
    menuToggleEl?.focus();
  }

  function handleWindowKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && mobileMenuOpen) closeMenu();
  }

  $: if (typeof document !== 'undefined') {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
  }

  onDestroy(() => {
    if (typeof document !== 'undefined') document.body.style.overflow = '';
  });

  $: userRole = (page.data?.userRole as string | undefined) ?? 'anonymous';
  $: isSignedIn = userRole !== 'anonymous';
</script>

<svelte:window on:keydown={handleWindowKeydown} />

<div class="landing">
  <!-- ───── Header ───── -->
  <header class="site-header">
    <div class="header-inner">
      <a href="/" class="header-brand">
        <img src="/logo.png" alt="MicroMatch" width="36" height="36" />
        <span>MicroMatch</span>
      </a>
      <nav class="header-nav" aria-label="Main navigation">
        <a href="/how-it-works" class:active={activeTab === 'how-it-works'}>How it Works</a>
        <a href="/tasks" class:active={activeTab === 'tasks'}>Browse Tasks</a>
        <a href="/for-ngos" class:active={activeTab === 'for-ngos'}>For NGOs</a>
        <a href="/for-volunteers" class:active={activeTab === 'for-volunteers'}>For Volunteers</a>
      </nav>
      <div class="header-actions">
        <button
          type="button"
          class="menu-toggle"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
          bind:this={menuToggleEl}
          on:click={toggleMenu}
        >
          <Icon icon={mobileMenuOpen ? 'lucide:x' : 'lucide:menu'} width="22" height="22" />
        </button>
        <a
          href="https://github.com/Builder106/micro-match"
          class="header-github"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View MicroMatch on GitHub"
        >
          <Icon icon="mdi:github" width="18" height="18" />
          <span>GitHub</span>
        </a>
        {#if isSignedIn}
          <a href="/tasks" class="header-signin">Browse tasks</a>
          <a href="/dashboard" class="btn-coral btn-sm" data-sveltekit-preload-data="hover">Go to dashboard</a>
        {:else}
          <a href="/login" class="header-signin">Sign In</a>
          <a href="/signup" class="btn-coral btn-sm">Join Now</a>
        {/if}
      </div>
    </div>
  </header>

  {#if mobileMenuOpen}
    <div
      class="mobile-menu-backdrop"
      role="presentation"
      on:click={closeMenu}
      transition:fade={{ duration: 150 }}
    ></div>
    <nav
      id="mobile-menu"
      class="mobile-menu"
      aria-label="Mobile"
      transition:fly={{ y: -12, duration: 200 }}
    >
      <a href="/how-it-works" bind:this={firstMenuLinkEl} on:click={closeMenu}>How it Works</a>
      <a href="/tasks" on:click={closeMenu}>Browse Tasks</a>
      <a href="/for-ngos" on:click={closeMenu}>For NGOs</a>
      <a href="/for-volunteers" on:click={closeMenu}>For Volunteers</a>
      <div class="mobile-menu-divider"></div>
      {#if isSignedIn}
        <a href="/tasks" on:click={closeMenu}>Browse tasks</a>
        <a href="/dashboard" class="mobile-menu-cta" on:click={closeMenu}>Go to dashboard</a>
      {:else}
        <a href="/login" on:click={closeMenu}>Sign In</a>
        <a href="/signup" class="mobile-menu-cta" on:click={closeMenu}>Join Now</a>
      {/if}
      <a
        href="https://github.com/Builder106/micro-match"
        class="mobile-menu-github"
        target="_blank"
        rel="noopener noreferrer"
        on:click={closeMenu}
      >
        <Icon icon="mdi:github" width="18" height="18" /> View on GitHub
      </a>
    </nav>
  {/if}

  <main>
    <slot />
  </main>

  <!-- ───── Footer ───── -->
  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="footer-logo">
            <img src="/logo.png" alt="MicroMatch" width="36" height="36" />
            <span>MicroMatch</span>
          </div>
          <p>Connecting volunteers with bite-sized tasks for maximum impact. Small efforts, big changes.</p>
        </div>
        <div class="footer-links">
          <div class="link-col">
            <h4>Platform</h4>
            <a href="/tasks">Browse Tasks</a>
            <a href="/dashboard">Dashboard</a>
            {#if !isSignedIn}
              <a href="/login">Sign In</a>
            {/if}
          </div>
          <div class="link-col">
            <h4>Resources</h4>
            <a href="/how-it-works">How It Works</a>
            <a href="/for-ngos">For NGOs</a>
            <a href="/for-volunteers">For Volunteers</a>
            <a href="/impact">Impact</a>
            <a href="/docs/api">API Docs</a>
            <a href="/about">About Us</a>
            <a href="/help">Help Center</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 MicroMatch. All rights reserved.</p>
        <div class="footer-legal">
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
        </div>
      </div>
    </div>
  </footer>
</div>

<style>
  .landing {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    color: #1E293B;
    background: #FDFCF8;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
  }
  .landing *, .landing *::before, .landing *::after { box-sizing: border-box; }
  main { flex: 1; width: 100%; }

  .container, :global(.container) { max-width: 1200px !important; margin: 0 auto !important; padding: 0 24px !important; box-sizing: border-box !important; }

  /* Buttons */
  .btn-coral { display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: #FF6B6B; color: #fff; font-weight: 700; border: none; border-radius: 9999px; cursor: pointer; text-decoration: none; transition: all .3s; }
  .btn-coral:hover { background: #ff5252; transform: translateY(-2px); box-shadow: 0 16px 40px rgba(255,107,107,0.35); }
  .btn-coral:active { transform: scale(0.97); }
  .btn-sm { padding: 10px 24px; font-size: 14px; }

  /* Header */
  .site-header { position: sticky; top: 0; z-index: 50; background: rgba(253,252,248,0.8); backdrop-filter: blur(16px); border-bottom: 1px solid rgba(0,0,0,0.05); }
  .header-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; height: 72px; display: flex; align-items: center; justify-content: space-between; }
  .header-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; color: #1E293B; }
  .header-brand span { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
  .header-nav { display: none; gap: 32px; }
  .header-nav a { font-size: 14px; font-weight: 500; color: #1E293Bb3; text-decoration: none; transition: color .2s; }
  .header-nav a:hover { color: #FF6B6B; }
  .header-nav a.active { color: #FF6B6B; font-weight: 600; }
  .header-actions { display: flex; align-items: center; gap: 12px; }
  .header-signin { font-size: 14px; font-weight: 600; color: #1E293B; text-decoration: none; display: none; }
  .header-signin:hover { color: #FF6B6B; }
  .header-github { display: inline-flex; align-items: center; justify-content: center; gap: 8px; width: 40px; height: 40px; padding: 0; background: rgba(255,255,255,0.6); border: 1px solid rgba(30,41,59,0.1); border-radius: 9999px; color: #1E293B; font-size: 14px; font-weight: 600; text-decoration: none; transition: all .2s; }
  .header-github:hover { background: #1E293B; color: #fff; border-color: #1E293B; transform: translateY(-1px); box-shadow: 0 8px 20px rgba(30,41,59,0.15); }
  .header-github span { display: none; }
  .menu-toggle { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; padding: 0; background: rgba(255,255,255,0.6); border: 1px solid rgba(30,41,59,0.1); border-radius: 9999px; color: #1E293B; cursor: pointer; transition: all .2s; }
  .menu-toggle:hover { background: rgba(255,255,255,0.9); border-color: rgba(30,41,59,0.2); }
  @media (min-width: 768px) {
    .header-nav { display: flex; }
    .header-signin { display: block; }
    .header-actions { gap: 16px; }
    .header-github { width: auto; height: auto; padding: 8px 16px; }
    .header-github span { display: inline; }
    .menu-toggle { display: none; }
    .mobile-menu, .mobile-menu-backdrop { display: none; }
  }

  /* Mobile menu */
  .mobile-menu-backdrop { position: fixed; inset: 72px 0 0 0; background: rgba(15,23,42,0.35); z-index: 49; }
  .mobile-menu { position: fixed; top: 72px; left: 0; right: 0; z-index: 50; display: flex; flex-direction: column; gap: 4px; padding: 16px 24px 24px; background: #FDFCF8; border-bottom: 1px solid rgba(0,0,0,0.05); box-shadow: 0 16px 32px rgba(0,0,0,0.08); max-height: calc(100vh - 72px); overflow-y: auto; }
  .mobile-menu a { display: block; padding: 12px 4px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15px; font-weight: 600; color: #1E293B; text-decoration: none; border-radius: 8px; }
  .mobile-menu a:hover { color: #FF6B6B; }
  .mobile-menu-divider { height: 1px; background: rgba(30,41,59,0.08); margin: 8px 0; }
  .mobile-menu-cta { background: #FF6B6B; color: #fff !important; text-align: center; border-radius: 9999px; font-weight: 700; }
  .mobile-menu-cta:hover { background: #ff5252; color: #fff !important; }
  .mobile-menu-github { display: flex !important; align-items: center; gap: 8px; color: #1E293Bb3 !important; }

  /* Footer */
  .site-footer { background: #1E293B; color: #fff; padding: 80px 0 32px; margin-top: auto; }
  .footer-grid { display: grid; grid-template-columns: 1fr; gap: 48px; margin-bottom: 48px; }
  @media (min-width: 768px) { .footer-grid { grid-template-columns: 2fr 1fr; } }
  .footer-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
  .footer-logo span { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 22px; font-weight: 700; }
  .footer-brand p { color: rgba(255,255,255,0.6); font-weight: 500; line-height: 1.7; margin: 0; max-width: 360px; }
  .footer-links { display: grid; grid-template-columns: repeat(2, 1fr); gap: 32px; }
  .link-col h4 { font-size: 18px; font-weight: 700; margin: 0 0 16px; color: #fff; }
  .link-col a { display: block; color: rgba(255,255,255,0.6); text-decoration: none; margin-bottom: 12px; font-weight: 500; transition: color .2s; }
  .link-col a:hover { color: #fff; }
  .footer-bottom { padding-top: 32px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; gap: 16px; align-items: center; text-align: center; color: rgba(255,255,255,0.4); font-size: 14px; font-weight: 500; }
  .footer-bottom p { margin: 0; color: #fff; }
  .footer-legal { display: flex; gap: 24px; }
  .footer-legal a { color: rgba(255,255,255,0.4); text-decoration: none; transition: color .2s; }
  .footer-legal a:hover { color: #fff; }
  @media (min-width: 768px) { .footer-bottom { flex-direction: row; justify-content: space-between; } }
</style>
