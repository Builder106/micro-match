<script lang="ts">
  /* eslint-disable svelte/no-navigation-without-resolve, svelte/no-immutable-reactive-statements */
  import Icon from '@iconify/svelte';
  import { page } from '$app/state';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import { signOut } from '$lib/appwrite.client';
  import { localizedHref, stripLocale, type Locale } from '$lib/locale';

  // Resilient role hint from cookie so NGO items render even if SSR local session is missing
  let roleHint = '';
  if (typeof document !== 'undefined') {
    try {
      const m = (document.cookie || '').match(/(?:^|;\s*)mm_role=([^;]+)/);
      roleHint = m ? decodeURIComponent(m[1]) : '';
    } catch {}
  }
  const isNGO = page.data.userRole === 'ngo' || roleHint === 'ngo';
  const isAdmin = page.data.isAdmin === true;
  $: currentLocale = (page.data?.locale as Locale | undefined) ?? 'en';
  function resolve(pathname: string, _options?: unknown) { return localizedHref(pathname, currentLocale); }
  function isPath(pathname: string) {
    const current = stripLocale(page.url.pathname);
    return pathname === '/admin/' ? current.startsWith('/admin/') : current === pathname;
  }

  function handleSignOut(e: Event) {
    e.preventDefault();
    Promise.resolve()
      .then(() => signOut())
      .finally(() => { try { window.location.href = resolve('/'); } catch {} });
  }
</script>

<aside class="sidebar" aria-label="Sidebar">
  <div style="margin-bottom: var(--space-8);">
    <div class="micromatch-header-container">
      <div class="micromatch-logo-container">
        <img src="/logo.png" alt="MicroMatch Logo" width="24" height="24" />
      </div>
      <a href={resolve('/', {})} class="micromatch-header-link">MicroMatch</a>
    </div>
  </div>
  
  <nav class="nav-container">
    <a href={resolve('/tasks')} class="nav-link" class:active={isPath('/tasks')} >
      <Icon icon="mdi:view-dashboard-outline" width="22" height="22"/>
      <span class="font-semibold">Feed</span>
    </a>
          <a href={resolve('/dashboard', {})} class="nav-link" class:active={isPath('/dashboard')}>
        <Icon icon="mdi:seal-variant" width="22" height="22"/>
        <span class="font-medium">Dashboard</span>
      </a>
      {#if isNGO}
        <a href={resolve('/org', {})} class="nav-link" class:active={isPath('/org')}>
          <Icon icon="mdi:plus-circle-outline" width="22" height="22"/>
          <span class="font-medium">Create Task</span>
        </a>
        <a href={resolve('/badges/manage', {})} class="nav-link" class:active={isPath('/badges/manage')}>
          <Icon icon="mdi:shield-edit" width="22" height="22"/>
          <span class="font-medium">Manage Badges</span>
        </a>
        <a href={resolve('/badges/analytics', {})} class="nav-link" class:active={isPath('/badges/analytics')}>
          <Icon icon="mdi:chart-line" width="22" height="22"/>
          <span class="font-medium">Analytics</span>
        </a>
      {/if}
    {#if isAdmin}
        <a href={resolve('/admin/verifications', {})} class="nav-link" class:active={isPath('/admin/')}>
          <Icon icon="mdi:shield-check-outline" width="22" height="22"/>
          <span class="font-medium">Verifications</span>
        </a>
      {/if}
    {#if page.data.userRole && page.data.userRole !== 'anonymous'}
      <a href={resolve('/profile', {})} class="nav-link" class:active={isPath('/profile')}>
        <Icon icon="mdi:account-circle-outline" width="22" height="22"/>
        <span class="font-medium">Profile</span>
      </a>
      <a href={resolve('/logout', {})} class="nav-link" onclick={handleSignOut}>
        <Icon icon="mdi:logout" width="22" height="22"/>
        <span class="font-medium">Sign out</span>
      </a>
    {:else}
      <a href={resolve('/login', {})} class="nav-link" class:active={isPath('/login') || isPath('/signup')}>
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
    display: flex; 
    flex-direction: column; 
    gap: 4px; 
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
    margin-top: var(--space-6);
    padding: 14px 14px;
    background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface));
    border-radius: 16px;
    border: 1px solid color-mix(in srgb, var(--color-primary-readable) 20%, transparent);
  }
  .quick-tip-header {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: 6px;
  }
  .quick-tip-header :global(svg) { color: var(--color-primary-readable); }

  .quick-tip-title {
    font-weight: 800;
    color: var(--color-text);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .quick-tip-text {
    position: relative;
    margin: 0;
    color: color-mix(in srgb, var(--color-text) 75%, transparent);
    font-size: 12px;
    font-weight: 500;
    line-height: 1.4;
  }

  .micromatch-header-container {
    display: flex;
    align-items: center;
    gap: 10px;
    /* Match .nav-link's horizontal inset so the logo lines up with the nav icons below it. */
    padding: 8px 12px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 12px;
  }

  .micromatch-header-container:hover {
    transform: translateY(-2px);
    box-shadow: var(--elev-2);
    cursor: pointer;
  }

  .micromatch-logo-container {
    width: 24px;
    height: 36px;
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .micromatch-header-link {
    text-decoration: none; 
    font-weight: var(--font-bold); 
    font-size: 17px; 
    color: var(--color-primary-readable);
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    color: var(--color-text-tertiary);
    padding: 8px 12px;
    font-size: 14px;
    border-radius: 12px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .nav-link:hover {
    transform: translateY(-2px);
    box-shadow: var(--elev-2);
  }
  .nav-link.active {
    background: var(--color-primary);
    color: white;
    box-shadow: var(--elev-1);
  }
</style>
