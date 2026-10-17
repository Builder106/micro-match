<script lang="ts">
  // The quilt's contents: every block as a plain link. It is the way through the site for
  // anyone who would rather read a list than pan a quilt.
  import { page } from '$app/state';
  import Seo from '$lib/components/Seo.svelte';
  import Link from '$lib/components/Link.svelte';
  import { block } from '$lib/quilt/world';

  const signedIn = $derived(page.data.userRole && page.data.userRole !== 'anonymous');
  const entries = [
    { id: 'tasks', href: '/tasks', name: 'Tasks', line: 'Every open task, with search and filters.' },
    { id: 'how', href: '/how-it-works', name: 'How a patch is made', line: 'The four steps from a posted task to a patch.' },
    { id: 'volunteers', href: '/for-volunteers', name: 'For volunteers', line: 'Pick by the time you have.' },
    { id: 'nonprofits', href: '/for-nonprofits', name: 'For nonprofits', line: 'Verification, posting, reviewing and designing patches.' },
    { id: 'community', href: '/impact', name: 'The community block', line: 'The whole quilt and what it adds up to.' },
    { id: 'about', href: '/about', name: 'About', line: 'Who makes this and why.' },
    { id: 'help', href: '/help', name: 'Help', line: 'Answers to common questions.' },
    { id: 'docs', href: '/docs', name: 'Docs', line: 'Guides for volunteers and nonprofits.' },
    { id: 'api', href: '/docs/api', name: 'API', line: 'The open task feed and the endpoints.' },
    { id: 'contact', href: '/contact', name: 'Contact', line: 'Two inboxes and the bug tracker.' }
  ] as const;
</script>

<Seo title="Contents | MicroMatch" description="Every block of the MicroMatch quilt as a plain list: tasks, guides, the community quilt, help, docs, the API and the small print." />

<header class="page-head">
  <h1 class="display h-xl" tabindex="-1">Contents</h1>
  <p class="lede">Every block on the quilt, as a list.</p>
</header>

<ul class="contents">
  {#each entries as e (e.id)}
    <li>
      <Link href={e.href} class="entry">
        <span class="entry__swatch" style:background={block(e.id).fabrics[0] === '#1C1F3B' ? 'var(--c-weld)' : block(e.id).fabrics[0]} aria-hidden="true"></span>
        <span class="entry__name">{e.name}</span>
        <span class="entry__line">{e.line}</span>
      </Link>
    </li>
  {/each}
</ul>

<section class="part" aria-labelledby="account">
  <h2 id="account">Your account</h2>
  <ul class="plain">
    {#if signedIn}
      <li><Link href="/dashboard" class="link">Your block</Link></li>
      <li><Link href="/profile" class="link">Profile</Link></li>
    {:else}
      <li><Link href="/login" class="link">Sign in</Link></li>
      <li><Link href="/signup" class="link">Join</Link></li>
      <li><Link href="/forgot-password" class="link">Forgot password</Link></li>
    {/if}
  </ul>
</section>

<section class="part" aria-labelledby="small">
  <h2 id="small">The small print</h2>
  <ul class="plain">
    <li><Link href="/privacy" class="link">Privacy policy</Link></li>
    <li><Link href="/terms" class="link">Terms of service</Link></li>
    <li><Link href="/cookies" class="link">Cookie policy</Link></li>
  </ul>
</section>

<style>
  .contents {
    list-style: none;
    padding: 0;
    display: grid;
    border-top: 1.5px dashed var(--c-line);
  }
  .contents li {
    border-bottom: 1.5px dashed var(--c-line);
  }
  .contents :global(.entry) {
    display: grid;
    grid-template-columns: 1.1rem minmax(10rem, 16rem) 1fr;
    gap: 1rem;
    align-items: baseline;
    padding: 0.9rem 0.25rem;
    transition: translate 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @media (hover: hover) {
    .contents :global(.entry:hover) {
      translate: 6px 0;
    }
  }
  .entry__swatch {
    width: 1.1rem;
    height: 1.1rem;
    border-radius: 2px;
    align-self: center;
  }
  .entry__name {
    font-family: var(--f-display);
    font-weight: 700;
    font-size: 1.1rem;
  }
  .entry__line {
    color: var(--c-muted);
    font-size: 0.95rem;
  }
  @media (max-width: 599px) {
    .contents :global(.entry) {
      grid-template-columns: 1.1rem 1fr;
    }
    .entry__line {
      grid-column: 2;
    }
  }
</style>
