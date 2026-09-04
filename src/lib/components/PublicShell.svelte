<script lang="ts">
  /* eslint-disable svelte/no-navigation-without-resolve */
  import Icon from "@iconify/svelte";
  import { page } from '$app/state';
  import { tick, onDestroy } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import { localizedHref, locales, type Locale } from '$lib/locale';
  import { reducedMotion } from '$lib/utils/reducedMotion';

  export let activeTab: 'home' | 'how-it-works' | 'for-ngos' | 'for-volunteers' | 'tasks' | 'impact' | undefined = undefined;

  let mobileMenuOpen = false;
  let menuToggleEl: HTMLButtonElement | null = null;
  let firstMenuLinkEl: HTMLAnchorElement | null = null;
  let languageOpen = false;
  let languageTriggerEl: HTMLButtonElement | null = null;

  const languageNames: Record<Locale, string> = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    pt: 'Português',
    zh: '中文',
    ar: 'العربية'
  };

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
    if (e.key === 'Escape' && languageOpen) closeLanguageMenu();
  }

  $: if (typeof document !== 'undefined') {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
  }

  onDestroy(() => {
    if (typeof document !== 'undefined') document.body.style.overflow = '';
  });

  /* eslint-disable-next-line svelte/no-immutable-reactive-statements */
  $: userRole = (page.data?.userRole as string | undefined) ?? 'anonymous';
  $: isSignedIn = userRole !== 'anonymous';
  /* eslint-disable-next-line svelte/no-immutable-reactive-statements */
  $: currentLocale = (page.data?.locale as Locale | undefined) ?? 'en';
  function resolve(pathname: string, _options?: unknown) { return localizedHref(pathname, currentLocale); }
  async function toggleLanguageMenu() {
    languageOpen = !languageOpen;
    if (languageOpen) {
      await tick();
      document.querySelector<HTMLButtonElement>('.locale-option.selected')?.focus();
    }
  }
  function closeLanguageMenu(returnFocus = false) {
    if (!languageOpen) return;
    languageOpen = false;
    if (returnFocus) languageTriggerEl?.focus();
  }
  function handleWindowClick(event: MouseEvent) {
    const target = event.target as HTMLElement | null;
    if (languageOpen && !target?.closest('.locale-picker')) closeLanguageMenu();
  }
  function handleLanguageKeydown(event: KeyboardEvent) {
    const options = Array.from(document.querySelectorAll<HTMLButtonElement>('.locale-option'));
    const current = options.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const next = event.key === 'ArrowDown'
        ? (current + 1 + options.length) % options.length
        : (current - 1 + options.length) % options.length;
      options[next]?.focus();
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      options[event.key === 'Home' ? 0 : options.length - 1]?.focus();
    }
  }
  function handleLanguageTriggerKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!languageOpen) toggleLanguageMenu();
    }
  }
  function selectLocale(locale: Locale) {
    closeLanguageMenu();
    window.location.href = localizedHref(page.url.pathname, locale) + page.url.search;
  }
</script>

<svelte:window onkeydown={handleWindowKeydown} onclick={handleWindowClick} />

<div class="landing">
  <!-- ───── Header ───── -->
  <header class="site-header">
    <div class="header-inner">
      <a href={resolve('/', {})} class="header-brand">
        <img src="/logo.png" alt="" width="36" height="36" />
        <span>MicroMatch</span>
      </a>
      <nav class="header-nav" dir="ltr" aria-label="Main navigation">
        <a href={resolve('/how-it-works', {})} class:active={activeTab === 'how-it-works'}>How it Works</a>
        <a href={resolve('/tasks', {})} class:active={activeTab === 'tasks'}>Browse Tasks</a>
        <a href={resolve('/for-ngos', {})} class:active={activeTab === 'for-ngos'}>For NGOs</a>
        <a href={resolve('/for-volunteers', {})} class:active={activeTab === 'for-volunteers'}>For Volunteers</a>
      </nav>
      <div class="header-actions">
        <ThemeToggle compact={true} />
        <div class="locale-picker">
          <button
            type="button"
            class="locale-trigger"
            aria-label="Language"
            aria-haspopup="listbox"
            aria-expanded={languageOpen}
            bind:this={languageTriggerEl}
            onclick={toggleLanguageMenu}
            onkeydown={handleLanguageTriggerKeydown}
          >
            <Icon icon="lucide:globe-2" width="16" height="16" aria-hidden="true" />
            <span>{currentLocale.toUpperCase()}</span>
            <Icon icon={languageOpen ? 'lucide:chevron-up' : 'lucide:chevron-down'} width="15" height="15" aria-hidden="true" />
          </button>
          {#if languageOpen}
            <div id="language-menu" class="locale-menu" role="listbox" tabindex="0" aria-label="Choose language" onkeydown={handleLanguageKeydown}>
            {#each locales as locale (locale)}
              <button
                type="button"
                class:selected={locale === currentLocale}
                class="locale-option"
                role="option"
                aria-selected={locale === currentLocale}
                onclick={() => selectLocale(locale)}
              >
                <span class="locale-code">{locale.toUpperCase()}</span>
                <span class="locale-name">{languageNames[locale]}</span>
                {#if locale === currentLocale}<Icon icon="lucide:check" width="16" height="16" aria-hidden="true" />{/if}
              </button>
            {/each}
            </div>
          {/if}
        </div>
        <button
          type="button"
          class="menu-toggle"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
          bind:this={menuToggleEl}
          onclick={toggleMenu}
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
          <a href={resolve('/tasks', {})} class="header-signin">Browse tasks</a>
          <a href={resolve('/dashboard', {})} class="btn-coral btn-sm" data-sveltekit-preload-data="hover">Go to dashboard</a>
        {:else}
          <a href={resolve('/login', {})} class="header-signin">Sign In</a>
          <a href={resolve('/signup', {})} class="btn-coral btn-sm">Join Now</a>
        {/if}
      </div>
    </div>
  </header>

  {#if mobileMenuOpen}
    <div
      class="mobile-menu-backdrop"
      role="presentation"
      onclick={closeMenu}
      transition:fade={{ duration: $reducedMotion ? 0 : 150 }}
    ></div>
    <nav
      id="mobile-menu"
      class="mobile-menu"
      aria-label="Mobile"
      transition:fly={{ y: -12, duration: $reducedMotion ? 0 : 200 }}
    >
      <a href={resolve('/how-it-works', {})} bind:this={firstMenuLinkEl} onclick={closeMenu}>How it Works</a>
      <a href={resolve('/tasks', {})} onclick={closeMenu}>Browse Tasks</a>
      <a href={resolve('/for-ngos', {})} onclick={closeMenu}>For NGOs</a>
      <a href={resolve('/for-volunteers', {})} onclick={closeMenu}>For Volunteers</a>
      <div class="mobile-menu-divider"></div>
      {#if isSignedIn}
        <a href={resolve('/tasks', {})} onclick={closeMenu}>Browse tasks</a>
        <a href={resolve('/dashboard', {})} class="mobile-menu-cta" onclick={closeMenu}>Go to dashboard</a>
      {:else}
        <a href={resolve('/login', {})} onclick={closeMenu}>Sign In</a>
        <a href={resolve('/signup', {})} class="mobile-menu-cta" onclick={closeMenu}>Join Now</a>
      {/if}
      <a
        href="https://github.com/Builder106/micro-match"
        class="mobile-menu-github"
        target="_blank"
        rel="noopener noreferrer"
        onclick={closeMenu}
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
        <div class="footer-brand" dir="ltr">
          <div class="footer-logo">
            <img src="/logo.png" alt="" width="36" height="36" />
            <span>MicroMatch</span>
          </div>
          <p>Connecting volunteers with bite-sized tasks for maximum impact. Small efforts, big changes.</p>
        </div>
        <div class="footer-links">
          <div class="link-col">
          <h2>Platform</h2>
            <a href={resolve('/tasks', {})}>Browse Tasks</a>
            <a href={resolve('/dashboard', {})}>Dashboard</a>
            {#if !isSignedIn}
              <a href={resolve('/login', {})}>Sign In</a>
            {/if}
          </div>
          <div class="link-col">
          <h2>Resources</h2>
          <a href={resolve('/how-it-works', {})} aria-label="Footer: How It Works">How It Works</a>
          <a href={resolve('/for-ngos', {})} aria-label="Footer: For NGOs">For NGOs</a>
          <a href={resolve('/for-volunteers', {})} aria-label="Footer: For Volunteers">For Volunteers</a>
          <a href={resolve('/impact', {})} aria-label="Footer: Impact">Impact</a>
            <a href={resolve('/docs/api', {})}>API Docs</a>
            <a href={resolve('/about', {})}>About Us</a>
            <a href={resolve('/help', {})}>Help Center</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 MicroMatch. All rights reserved.</p>
        <div class="footer-legal">
          <a href={resolve('/privacy', {})}>Privacy Policy</a>
          <a href={resolve('/terms', {})}>Terms of Service</a>
        </div>
      </div>
    </div>
  </footer>
</div>

<style>
  .landing {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    color: var(--color-text);
    background: var(--color-background);
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
  .btn-coral { display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: var(--color-primary); color: var(--color-brand-on-coral); font-weight: 700; border: none; border-radius: 9999px; cursor: pointer; text-decoration: none; transition: all .3s; }
  .btn-coral:hover { background: var(--color-primary); transform: translateY(-2px); box-shadow: 0 16px 40px rgba(136,19,55,0.35); }
  .btn-coral:active { transform: scale(0.97); }
  .btn-sm { padding: 10px 24px; font-size: 14px; }

  /* Header */
  .site-header { position: sticky; top: 0; z-index: 50; background: var(--color-background); border-bottom: 1px solid var(--card-border); }
  .header-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; height: 72px; display: flex; align-items: center; justify-content: space-between; }
  .header-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; color: var(--color-text); }
  .header-brand span { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
  .header-nav { display: none; gap: 32px; }
  .header-nav a { background: var(--color-background); border-radius: 6px; font-size: 14px; font-weight: 500; color: var(--color-text-secondary); text-decoration: none; transition: color .2s; }
  .header-nav a:hover { color: var(--color-primary-readable); }
  .header-nav a.active { color: var(--color-primary-readable); font-weight: 600; }
  .header-actions { display: flex; align-items: center; gap: 12px; }
  .locale-picker { position: relative; }
  .locale-trigger { align-items: center; background: var(--color-surface); border: 1px solid var(--card-border-strong); border-radius: 9999px; color: var(--color-text); cursor: pointer; display: inline-flex; font-size: 14px; font-weight: 700; gap: 7px; height: 40px; justify-content: center; min-width: 76px; padding: 0 12px; }
  .locale-trigger:hover { border-color: var(--color-primary-readable); color: var(--color-primary-readable); }
  .locale-trigger:focus-visible, .locale-option:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 3px; }
  .locale-menu { background: var(--color-surface); border: 1px solid var(--card-border-strong); border-radius: 16px; box-shadow: var(--elev-4); display: grid; gap: 4px; min-width: 220px; padding: 8px; position: absolute; right: 0; top: calc(100% + 10px); z-index: 60; }
  .locale-option { align-items: center; background: transparent; border: 0; border-radius: 10px; color: var(--color-text); cursor: pointer; display: grid; grid-template-columns: 34px 1fr 18px; font: inherit; gap: 8px; min-height: 44px; padding: 8px 10px; text-align: left; width: 100%; }
  .locale-option:hover, .locale-option.selected { background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface)); }
  .locale-option.selected { color: var(--color-primary-readable); }
  .locale-code { font-weight: 800; }
  .locale-name { color: var(--color-text-secondary); font-size: 13px; }
  .locale-option.selected .locale-name { color: inherit; }
  .header-signin { font-size: 14px; font-weight: 600; color: var(--color-text); text-decoration: none; display: none; }
  .header-signin:hover { color: var(--color-primary-readable); }
  .header-github { display: inline-flex; align-items: center; justify-content: center; gap: 8px; width: 40px; height: 40px; padding: 0; background: var(--color-surface); border: 1px solid var(--card-border-strong); border-radius: 9999px; color: var(--color-text); font-size: 14px; font-weight: 600; text-decoration: none; transition: all .2s; cursor: pointer; }
  .header-github:hover { background: var(--color-text); color: var(--color-surface); border-color: var(--color-text); transform: translateY(-1px); box-shadow: 0 8px 20px rgba(0,0,0,0.15); }
  .header-github span { display: none; }
  .menu-toggle { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; padding: 0; background: var(--color-surface); border: 1px solid var(--card-border-strong); border-radius: 9999px; color: var(--color-text); cursor: pointer; transition: all .2s; }
  .menu-toggle:hover { background: var(--color-surface-variant); border-color: var(--card-border-strong); }
  @media (max-width: 639px) {
    .header-github,
    .header-actions .btn-sm {
      display: none;
    }
    .locale-menu { min-width: 200px; right: -4px; }
  }
  @media (min-width: 768px) {
    .header-nav { display: flex; }
    .header-signin { display: block; }
    .header-actions { gap: 16px; }
    .header-github { width: auto; height: auto; padding: 8px 16px; }
    .header-github span { display: inline; }
    .menu-toggle { display: none; }
    .mobile-menu, .mobile-menu-backdrop { display: none; }
  }
  @media (min-width: 768px) and (max-width: 1023px) {
    .header-nav { gap: 12px; }
    .header-actions { gap: 8px; }
    .header-signin { display: none; }
    .header-github { width: 40px; height: 40px; padding: 0; }
    .header-github span { display: none; }
    .header-actions .btn-sm { padding-inline: 12px; }
  }

  /* Mobile menu */
  .mobile-menu-backdrop { position: fixed; inset: 72px 0 0 0; background: rgba(15,23,42,0.35); z-index: 49; }
  .mobile-menu { position: fixed; top: 72px; left: 0; right: 0; z-index: 50; display: flex; flex-direction: column; gap: 4px; padding: 16px 24px 24px; background: var(--color-surface); border-bottom: 1px solid var(--card-border); box-shadow: 0 16px 32px rgba(0,0,0,0.15); max-height: calc(100vh - 72px); overflow-y: auto; }
  .mobile-menu a { display: block; padding: 12px 4px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15px; font-weight: 600; color: var(--color-text); text-decoration: none; border-radius: 8px; }
  .mobile-menu a:hover { color: var(--color-primary-readable); }
  .mobile-menu-divider { height: 1px; background: var(--card-border); margin: 8px 0; }
  .mobile-menu-cta { background: var(--color-primary); color: var(--color-action-on-coral) !important; text-align: center; border-radius: 9999px; font-weight: 700; }
  .mobile-menu-cta:hover { background: var(--color-primary-variant); color: var(--color-action-on-coral) !important; }
  .mobile-menu-github { display: flex !important; align-items: center; gap: 8px; color: var(--color-text) !important; }

  /* Footer */
  .site-footer { background: var(--color-surface); color: var(--color-text); padding: 80px 0 32px; margin-top: auto; border-top: 1px solid var(--card-border); }
  .footer-grid { display: grid; grid-template-columns: 1fr; gap: 48px; margin-bottom: 48px; }
  @media (min-width: 768px) { .footer-grid { grid-template-columns: 2fr 1fr; } }
  .footer-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
  .footer-logo span { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 22px; font-weight: 700; color: var(--color-text); }
  .footer-brand p { color: var(--color-text-secondary); font-weight: 500; line-height: 1.7; margin: 0; max-width: 360px; position: relative; z-index: 1; background: var(--color-surface); }
  .footer-links { display: grid; grid-template-columns: repeat(2, 1fr); gap: 32px; }
  .link-col h2 { font-size: 18px; font-weight: 700; margin: 0 0 16px; color: var(--color-text); }
  .link-col a { display: block; color: var(--color-text-secondary); text-decoration: none; margin-bottom: 12px; font-weight: 500; transition: color .2s; }
  .link-col a:hover { color: var(--color-primary-readable); }
  .footer-bottom { padding-top: 32px; border-top: 1px solid var(--card-border); display: flex; flex-direction: column; gap: 16px; align-items: center; text-align: center; color: var(--color-text-tertiary); font-size: 14px; font-weight: 500; }
  .footer-bottom p { margin: 0; color: var(--color-text); }
  .footer-legal { display: flex; gap: 24px; }
  .footer-legal a { color: var(--color-text-tertiary); text-decoration: none; transition: color .2s; }
  .footer-legal a:hover { color: var(--color-text); }
  @media (min-width: 768px) { .footer-bottom { flex-direction: row; justify-content: space-between; } }
</style>
