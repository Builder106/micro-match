<script lang="ts">
  import { page } from '$app/state';

  export let title: string;
  export let lede: string | undefined = undefined;
  export let updated: string | undefined = undefined;

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
    { href: '/cookies', label: 'Cookies' },
  ];

  $: pathname = page.url.pathname;
  $: userRole = (page.data?.userRole as string | undefined) ?? 'anonymous';
  $: isSignedIn = userRole !== 'anonymous';
  $: year = new Date().getFullYear();
</script>

<svelte:head>
  <title>{title} · MicroMatch</title>
</svelte:head>

<div class="public-shell">
  <header class="public-header">
    <a class="brand" href="/" aria-label="MicroMatch home">
      <img src="/logo.png" alt="" width="32" height="32" />
      <span>MicroMatch</span>
    </a>
    <nav class="public-actions" aria-label="Account">
      {#if isSignedIn}
        <a class="nav-link" href="/dashboard">Dashboard</a>
      {:else}
        <a class="nav-link" href="/login">Sign in</a>
        <a class="nav-cta" href="/signup">Create account</a>
      {/if}
    </nav>
  </header>

  <article class="static-article">
    <header class="article-head">
      <h1>{title}</h1>
      {#if lede}<p class="lede">{lede}</p>{/if}
      {#if updated}<p class="updated">Last updated · {updated}</p>{/if}
    </header>
    <div class="static-body">
      <slot />
    </div>
  </article>

  <nav class="related" aria-label="Related pages">
    {#each siblings.filter((s) => s.href !== pathname) as s}
      <a href={s.href}>{s.label}</a>
    {/each}
  </nav>

  <footer class="public-footer">
    <small>© {year} MicroMatch</small>
    <small><a href="/">Back to home</a></small>
  </footer>
</div>

<style>
  .public-shell {
    max-width: 760px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .public-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding: var(--space-2) 0;
  }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: var(--color-text);
    text-decoration: none;
  }
  .brand img {
    display: block;
    border-radius: 8px;
  }
  .brand span {
    font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
    font-weight: 700;
    font-size: 1.1rem;
    letter-spacing: -0.01em;
  }
  .public-actions {
    display: inline-flex;
    align-items: center;
    gap: var(--space-3);
  }
  .nav-link {
    color: var(--color-text-secondary);
    text-decoration: none;
    font-size: 0.95rem;
    font-weight: 600;
    padding: 8px 12px;
    border-radius: 9999px;
    transition: color 0.15s ease, background 0.15s ease;
  }
  .nav-link:hover {
    color: var(--color-text);
    background: rgba(0, 0, 0, 0.04);
  }
  .nav-cta {
    background: var(--color-primary, #ff6b6b);
    color: #fff;
    padding: 9px 16px;
    border-radius: 9999px;
    font-size: 0.95rem;
    font-weight: 700;
    text-decoration: none;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .nav-cta:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 22px rgba(255, 107, 107, 0.3);
  }

  .static-article {
    background: var(--color-surface, #fff);
    border: 1px solid var(--color-outline-variant, rgba(0, 0, 0, 0.06));
    border-radius: var(--radius-lg, 24px);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02), 0 8px 28px rgba(15, 23, 42, 0.04);
    padding: clamp(28px, 5vw, 48px);
  }
  .article-head h1 {
    font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
    font-size: clamp(1.75rem, 2.6vw + 0.5rem, 2.5rem);
    line-height: 1.15;
    letter-spacing: -0.02em;
    margin: 0 0 var(--space-3) 0;
    color: var(--color-text);
  }
  .article-head .lede {
    font-size: 1.125rem;
    line-height: 1.55;
    color: var(--color-text-secondary);
    margin: 0 0 var(--space-2) 0;
    max-width: 60ch;
  }
  .article-head .updated {
    margin: var(--space-3) 0 0 0;
    font-size: 0.85rem;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: 600;
  }
  .article-head {
    padding-bottom: var(--space-5);
    margin-bottom: var(--space-6);
    border-bottom: 1px solid var(--color-outline-variant, rgba(0, 0, 0, 0.06));
  }

  .static-body :global(p),
  .static-body :global(ul),
  .static-body :global(ol) {
    color: var(--color-text);
    font-size: 1rem;
    line-height: 1.7;
    margin: 0 0 var(--space-4) 0;
    max-width: 65ch;
  }
  .static-body :global(p:last-child),
  .static-body :global(ul:last-child),
  .static-body :global(ol:last-child) {
    margin-bottom: 0;
  }
  .static-body :global(ul),
  .static-body :global(ol) {
    padding-left: 1.25rem;
  }
  .static-body :global(li) {
    margin-bottom: var(--space-2);
  }
  .static-body :global(li:last-child) {
    margin-bottom: 0;
  }
  .static-body :global(h2) {
    font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
    font-size: 1.25rem;
    line-height: 1.3;
    letter-spacing: -0.01em;
    margin: var(--space-7) 0 var(--space-3) 0;
    color: var(--color-text);
  }
  .static-body :global(strong) {
    color: var(--color-text);
    font-weight: 700;
  }
  .static-body :global(a) {
    color: var(--color-primary, #ff6b6b);
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
    text-decoration-thickness: 1.5px;
  }
  .static-body :global(a:hover) {
    color: var(--color-primary-variant, #e85a5a);
  }

  .related {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-4);
    align-items: center;
    justify-content: center;
    padding-top: var(--space-2);
  }
  .related a {
    color: var(--color-text-secondary);
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 500;
  }
  .related a:hover {
    color: var(--color-primary, #ff6b6b);
  }

  .public-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-4) 0 var(--space-6);
    color: var(--color-text-secondary);
  }
  .public-footer a {
    color: inherit;
    text-decoration: none;
    font-weight: 600;
  }
  .public-footer a:hover {
    color: var(--color-primary, #ff6b6b);
  }

  @media (max-width: 540px) {
    .public-header {
      gap: var(--space-2);
    }
    .nav-link {
      padding: 6px 10px;
      white-space: nowrap;
    }
    .nav-cta {
      display: none;
    }
    .related {
      gap: var(--space-2) var(--space-3);
    }
    .public-footer {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
