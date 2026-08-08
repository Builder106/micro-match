<script lang="ts">
  import { page } from '$app/state';
  import PublicShell from '$lib/components/PublicShell.svelte';
  import Icon from '@iconify/svelte';

  export let title: string;
  export let titleHighlight: string | undefined = undefined;
  export let badge: string | undefined = 'Legal & Compliance';
  export let lede: string | undefined = undefined;
  export let updated: string | undefined = undefined;
  export let readTime: string | undefined = undefined;
  export let wide: boolean = false;
  export let showRelated: boolean = true;
  export let sections: { id: string; label: string; num?: string }[] = [];
  export let ctaTitle: string | undefined = undefined;
  export let ctaText: string | undefined = undefined;
  export let ctaPrimaryHref: string | undefined = undefined;
  export let ctaPrimaryLabel: string | undefined = undefined;
  export let ctaSecondaryHref: string | undefined = undefined;
  export let ctaSecondaryLabel: string | undefined = undefined;

  const siblings = [
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/for-ngos', label: 'For NGOs' },
    { href: '/for-volunteers', label: 'For Volunteers' },
    { href: '/impact', label: 'Impact' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
    { href: '/help', label: 'Help' },
    { href: '/docs', label: 'Docs' },
    { href: '/privacy', label: 'Privacy' },
    { href: '/terms', label: 'Terms' },
  ];

  /* eslint-disable-next-line svelte/no-immutable-reactive-statements */
  $: pathname = page.url.pathname;

  let activeSection = '';

  function scrollToSection(id: string) {
    activeSection = id;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  $: mainTitle =
    titleHighlight && title.includes(titleHighlight)
      ? title.replace(titleHighlight, '').trim()
      : title;
  $: highlightText =
    titleHighlight && title.includes(titleHighlight) ? titleHighlight : '';
</script>

<svelte:head>
  <title>{title} | MicroMatch</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link
    href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<PublicShell activeTab={pathname === '/impact' ? 'impact' : undefined}>
  <div class="static-page-wrapper">
    <div class="static-container" class:wide-container={wide}>
      <!-- Top Hero Header -->
      <header class="static-hero">
        {#if badge}
          <div class="hero-badge">
            <Icon icon="lucide:shield-check" width="14" height="14" />
            <span>{badge}</span>
          </div>
        {/if}

        <h1 class="hero-title">
          {#if highlightText}
            {mainTitle} <span class="coral-gradient">{highlightText}</span>
          {:else}
            {title}
          {/if}
        </h1>

        {#if lede}
          <p class="hero-lede">{lede}</p>
        {/if}

        <div class="hero-meta">
          {#if updated}
            <div class="meta-tag">
              <Icon icon="lucide:clock" width="13" height="13" />
              <span>Last updated: {updated}</span>
            </div>
          {/if}
          {#if readTime}
            <div class="meta-tag">
              <Icon icon="lucide:book-open" width="13" height="13" />
              <span>{readTime}</span>
            </div>
          {/if}
          <div class="meta-tag meta-tag-accent">
            <Icon icon="lucide:sparkles" width="13" height="13" />
            <span>Educational Portfolio Platform</span>
          </div>
        </div>
      </header>

      <!-- Section Ribbon Navigation (if sections provided) -->
      {#if sections.length > 0}
        <nav class="sections-ribbon" aria-label="Section navigation">
          {#each sections as sec, i (sec.id)}
            <button
              type="button"
              class="ribbon-btn"
              class:active={activeSection === sec.id}
              on:click={() => scrollToSection(sec.id)}
            >
              {#if sec.num}
                <span class="ribbon-num">{sec.num}</span>
              {/if}
              <span class="ribbon-label">{sec.label}</span>
            </button>
            {#if i < sections.length - 1}
              <span class="ribbon-dot">•</span>
            {/if}
          {/each}
        </nav>
      {/if}

      <!-- Main Content Article -->
      <article class="static-article">
        <div class="static-body">
          <slot />
        </div>
      </article>

      <!-- Optional Bottom CTA Banner -->
      {#if ctaTitle}
        <section class="cta-banner">
          <div class="cta-content">
            <h2>{ctaTitle}</h2>
            {#if ctaText}<p>{ctaText}</p>{/if}
            <div class="cta-actions">
              {#if ctaPrimaryHref && ctaPrimaryLabel}
                <a href={ctaPrimaryHref} class="btn-coral">{ctaPrimaryLabel} →</a>
              {/if}
              {#if ctaSecondaryHref && ctaSecondaryLabel}
                <a href={ctaSecondaryHref} class="btn-outline-dark">{ctaSecondaryLabel}</a>
              {/if}
            </div>
          </div>
        </section>
      {/if}

      <!-- Related Navigation Links -->
      {#if showRelated}
        <nav class="related" aria-label="Related pages">
          <span class="related-label">Quick Links:</span>
          {#each siblings.filter((s) => s.href !== pathname) as s (s.href)}
            <a href={s.href}>{s.label}</a>
          {/each}
        </nav>
      {/if}
    </div>
  </div>
</PublicShell>

<style>
  /* Page Base Wrapper */
  .static-page-wrapper {
    background: #fdfcf8;
    width: 100%;
    min-height: 100vh;
    padding-bottom: 96px;
  }

  .static-container {
    max-width: 860px;
    margin: 0 auto;
    padding: 48px 24px 0;
    display: flex;
    flex-direction: column;
    gap: 32px;
  }
  .static-container.wide-container {
    max-width: 1280px;
  }

  /* Hero Section */
  .static-hero {
    text-align: center;
    max-width: 720px;
    margin: 0 auto 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    background: #fff5f0;
    color: #ff6b6b;
    border-radius: 9999px;
    font-size: 13px;
    font-weight: 700;
    margin-bottom: 16px;
  }

  .hero-title {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: clamp(2.25rem, 4vw, 3.25rem);
    font-weight: 800;
    line-height: 1.15;
    color: #0f172a;
    margin: 0 0 16px;
    letter-spacing: -0.02em;
  }

  .coral-gradient {
    background: linear-gradient(135deg, #ff6b6b, #ff9e5e);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .hero-lede {
    font-size: 18px;
    color: #475569;
    line-height: 1.6;
    margin: 0 0 20px;
    max-width: 62ch;
  }

  .hero-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }

  .meta-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
  }

  .meta-tag-accent {
    background: #fff5f0;
    border-color: #ffd1c2;
    color: #ff6b6b;
  }

  /* Section Ribbon Navigation */
  .sections-ribbon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px 12px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 9999px;
    padding: 10px 20px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.03);
    margin: 0 auto;
    max-width: 100%;
  }

  .ribbon-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 6px 14px;
    border-radius: 9999px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  .ribbon-btn:hover {
    background: #fff5f0;
    color: #ff6b6b;
    transform: translateY(-1px);
  }

  .ribbon-btn:hover .ribbon-num {
    background: #ff6b6b;
    color: #ffffff;
  }

  .ribbon-btn:hover .ribbon-label {
    color: #ff6b6b;
  }

  .ribbon-num {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #f1f5f9;
    color: #64748b;
    font-size: 11px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .ribbon-label {
    font-size: 13px;
    font-weight: 700;
    color: #475569;
    transition: color 0.2s ease;
  }

  .ribbon-dot {
    color: #cbd5e1;
    font-size: 12px;
  }

  /* Main Card Article */
  .static-article {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .static-body {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  /* Legal Card styling inside static-body */
  .static-body :global(.legal-card) {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 24px;
    padding: clamp(24px, 4vw, 36px);
    box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03);
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .static-body :global(.legal-card:hover) {
    border-color: #cbd5e1;
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
  }

  .static-body :global(.notice-card) {
    background: #fff5f0;
    border-color: #ffd1c2;
  }

  .static-body :global(.legal-card-header) {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .static-body :global(.section-badge-pill) {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: #fff5f0;
    color: #ff6b6b;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 800;
  }

  .static-body :global(.notice-card .section-badge-pill) {
    background: #ff6b6b;
    color: #ffffff;
  }

  .static-body :global(.section-badge-num) {
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  .static-body :global(.legal-card h2) {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 20px;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
    letter-spacing: -0.01em;
  }

  .static-body :global(.legal-card p) {
    color: #475569;
    font-size: 15px;
    line-height: 1.7;
    margin: 0 0 16px 0;
  }

  .static-body :global(.legal-card p:last-child) {
    margin-bottom: 0;
  }

  .static-body :global(.legal-card strong) {
    color: #0f172a;
    font-weight: 700;
  }

  .static-body :global(.legal-card a) {
    color: #ff6b6b;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .static-body :global(.legal-card a:hover) {
    color: #ff5252;
  }

  .static-body :global(code) {
    background: #f1f5f9;
    color: #0f172a;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 13px;
    font-family: var(--font-mono, monospace);
    font-weight: 600;
  }

  /* Sub-processor Vendor Grid */
  .static-body :global(.vendor-grid) {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
    margin-top: 20px;
  }
  @media (min-width: 640px) {
    .static-body :global(.vendor-grid) {
      grid-template-columns: 1fr 1fr;
    }
  }

  .static-body :global(.vendor-card) {
    background: #fdfcf8;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 12px;
    transition: all 0.2s ease;
  }

  .static-body :global(.vendor-card:hover) {
    transform: translateY(-2px);
    border-color: #ff6b6b;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
  }

  .static-body :global(.vendor-head) {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .static-body :global(.vendor-icon) {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0f172a;
    color: #ffffff;
  }

  .static-body :global(.vendor-icon.appwrite-icon) {
    background: #f02e65;
  }

  .static-body :global(.vendor-card h3) {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 16px;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
  }

  .static-body :global(.vendor-role) {
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
  }

  .static-body :global(.vendor-card p) {
    font-size: 13px;
    line-height: 1.55;
    margin: 0;
  }

  .static-body :global(.vendor-link) {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    font-weight: 700;
    color: #ff6b6b;
    text-decoration: none !important;
  }

  /* Guarantee / Highlight Box */
  .static-body :global(.guarantee-box) {
    background: #fff5f0;
    border: 1px solid #ffd1c2;
    border-radius: 16px;
    padding: 20px;
    margin-top: 16px;
  }

  .static-body :global(.guarantee-head) {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .static-body :global(.guarantee-head h4) {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
  }

  .static-body :global(.guarantee-box p) {
    font-size: 14px;
    margin: 0;
  }

  /* Tokens List & Lists with Icons */
  .static-body :global(.tokens-list) {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 16px;
  }

  .static-body :global(.token-item) {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px 16px;
    background: #fdfcf8;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
  }

  .static-body :global(.rights-list),
  .static-body :global(.rules-list) {
    list-style: none;
    padding: 0;
    margin: 16px 0 0 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .static-body :global(.rights-list li),
  .static-body :global(.rules-list li) {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 14px;
    line-height: 1.55;
    color: #475569;
  }

  .static-body :global(.check-icon) {
    color: #ff6b6b;
    margin-top: 2px;
    flex-shrink: 0;
  }

  /* CTA Banner */
  .cta-banner {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 28px;
    padding: 40px 32px;
    text-align: center;
    box-shadow: 0 8px 32px rgba(15, 23, 42, 0.04);
  }

  .cta-content h2 {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 22px;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 8px;
  }

  .cta-content p {
    font-size: 15px;
    color: #64748b;
    margin: 0 0 24px;
  }

  .cta-actions {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 12px;
  }

  .btn-coral {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 12px 24px;
    background: #ff6b6b;
    color: #ffffff;
    border-radius: 9999px;
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
    box-shadow: 0 4px 14px rgba(255, 107, 107, 0.25);
    transition: all 0.2s ease;
  }

  .btn-coral:hover {
    background: #ff5252;
    transform: translateY(-2px);
    box-shadow: 0 8px 22px rgba(255, 107, 107, 0.35);
  }

  .btn-outline-dark {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 12px 24px;
    background: #ffffff;
    color: #0f172a;
    border: 1px solid #cbd5e1;
    border-radius: 9999px;
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .btn-outline-dark:hover {
    border-color: #94a3b8;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
  }

  /* Related Navigation Links */
  .related {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    align-items: center;
    justify-content: center;
    padding-top: 16px;
  }
  .related-label {
    font-size: 13px;
    font-weight: 700;
    color: #64748b;
  }
  .related a {
    color: #64748b;
    text-decoration: none;
    font-size: 13px;
    font-weight: 600;
    transition: color 0.2s ease;
  }
  .related a:hover {
    color: #ff6b6b;
  }
</style>
