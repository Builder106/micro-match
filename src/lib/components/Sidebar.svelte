<script lang="ts">
  import Icon from '@iconify/svelte';
  import { page } from '$app/state';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import { signOut } from '$lib/appwrite.client';

  // Resilient role hint from cookie so NGO items render even if SSR local session is missing
  let roleHint = '';
  if (typeof document !== 'undefined') {
    try {
      const m = (document.cookie || '').match(/(?:^|;\s*)mm_role=([^;]+)/);
      roleHint = m ? decodeURIComponent(m[1]) : '';
    } catch {}
  }
  $: isNGO = page.data.userRole === 'ngo' || roleHint === 'ngo';
  $: isAdmin = page.data.isAdmin === true;

  function handleSignOut(e: Event) {
    e.preventDefault();
    Promise.resolve()
      .then(() => signOut())
      .finally(() => { try { window.location.href = '/'; } catch {} });
  }
</script>

<aside class="sidebar">
  <div style="margin-bottom: var(--space-8);">
    <div class="micromatch-header-container">
      <div class="micromatch-logo-container">
        <img src="/logo.png" alt="MicroMatch Logo" width="24" height="24" />
      </div>
      <a href="/" class="micromatch-header-link">MicroMatch</a>
    </div>
  </div>
  
  <nav class="nav-container">
    <a href="/tasks" class="nav-link" class:active={page.url.pathname === '/tasks'} >
      <Icon icon="mdi:view-dashboard-outline" width="22" height="22"/>
      <span class="font-semibold">Feed</span>
    </a>
          <a href="/dashboard" class="nav-link" class:active={page.url.pathname === '/dashboard'}>
        <Icon icon="mdi:seal-variant" width="22" height="22"/>
        <span class="font-medium">Dashboard</span>
      </a>
      {#if isNGO}
        <a href="/org" class="nav-link" class:active={page.url.pathname === '/org'}>
          <Icon icon="mdi:plus-circle-outline" width="22" height="22"/>
          <span class="font-medium">Create Task</span>
        </a>
        <a href="/badges/manage" class="nav-link" class:active={page.url.pathname === '/badges/manage'}>
          <Icon icon="mdi:shield-edit" width="22" height="22"/>
          <span class="font-medium">Manage Badges</span>
        </a>
        <a href="/badges/analytics" class="nav-link" class:active={page.url.pathname === '/badges/analytics'}>
          <Icon icon="mdi:chart-line" width="22" height="22"/>
          <span class="font-medium">Analytics</span>
        </a>
      {/if}
    {#if isAdmin}
        <a href="/admin/verifications" class="nav-link" class:active={page.url.pathname.startsWith('/admin/')}>
          <Icon icon="mdi:shield-check-outline" width="22" height="22"/>
          <span class="font-medium">Verifications</span>
        </a>
      {/if}
    {#if page.data.userRole && page.data.userRole !== 'anonymous'}
      <a href="/profile" class="nav-link" class:active={page.url.pathname === '/profile'}>
        <Icon icon="mdi:account-circle-outline" width="22" height="22"/>
        <span class="font-medium">Profile</span>
      </a>
      <a href="/logout" class="nav-link" on:click|preventDefault={handleSignOut}>
        <Icon icon="mdi:logout" width="22" height="22"/>
        <span class="font-medium">Sign out</span>
      </a>
    {:else}
      <a href="/login" class="nav-link" class:active={page.url.pathname === '/login' || page.url.pathname === '/signup'}>
        <Icon icon="mdi:login-variant" width="22" height="22"/>
        <span class="font-medium">Sign in</span>
      </a>
    {/if}
  </nav>
  
  <div class="quick-tip-container">
    <div class="quick-tip-header">
      <Icon icon="mdi:lightbulb-outline" width="16" height="16" class="quick-tip-icon"/>
      <span class="quick-tip-title">Quick Tip</span>
    </div>
    <p class="quick-tip-text">Complete tasks in 15-30 minutes to maximize your impact and earn badges faster!</p>
  </div>

  <div style="margin-top: var(--space-4);">
    <ThemeToggle compact={true} />
  </div>
</aside>

<style>
  .nav-container {
    display:flex; 
    flex-direction:column; 
    gap: var(--space-3); 
    width: 100%;
  }

  .font-semibold {
    font-weight: var(--font-semibold);
  }

  .font-medium {
    font-weight: var(--font-medium);
  }
  
  .quick-tip-container {
    position: relative;
    overflow: hidden;
    margin-top: var(--space-12);
    padding: var(--space-5);
    background:
      linear-gradient(135deg,
        color-mix(in srgb, var(--color-primary) 12%, var(--color-surface)) 0%,
        color-mix(in srgb, var(--color-primary-light) 18%, var(--color-surface)) 100%);
    border-radius: 20px;
    border: 1px solid color-mix(in srgb, var(--color-primary) 25%, transparent);
  }
  .quick-tip-container::before {
    content: '';
    position: absolute;
    top: -40%;
    right: -20%;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: rgba(255, 158, 94, 0.25);
    filter: blur(30px);
    pointer-events: none;
  }

  .quick-tip-header {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-2);
  }
  .quick-tip-header :global(svg) { color: var(--color-primary); }

  .quick-tip-title {
    font-weight: 800;
    color: var(--color-primary);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .quick-tip-text {
    position: relative;
    margin: 0;
    color: color-mix(in srgb, var(--color-text) 75%, transparent);
    font-size: 13px;
    font-weight: 500;
    line-height: 1.5;
  }

  .micromatch-header-container {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    /* Match .nav-link's horizontal inset so the logo lines up with the nav icons below it. */
    padding: var(--space-4) var(--space-4);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: var(--radius-lg);
  }

  .micromatch-header-container:hover {
    transform: translateY(-2px);
    box-shadow: var(--elev-2);
    cursor: pointer;
  }

  .micromatch-logo-container {
    /* Sized to the 24px logo so its left edge aligns with the 22px nav icons. */
    width: 24px;
    height: 40px;
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .micromatch-header-link {
    text-decoration: none; 
    font-weight: var(--font-bold); 
    font-size: var(--text-lg); 
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-variant)); 
    -webkit-background-clip: text; 
    -webkit-text-fill-color: transparent; 
    background-clip: text;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    text-decoration: none;
    color: var(--color-text-tertiary);
    padding: var(--space-4) var(--space-4);
    border-radius: var(--radius-lg);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .nav-link:hover {
    transform: translateY(-2px);
    box-shadow: var(--elev-2);
  }
  .nav-link.active {
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-variant));
    color: white;
    box-shadow: var(--elev-1);
  }
</style>

