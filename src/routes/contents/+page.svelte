<script lang="ts">
  // The quilt's contents: every block as a plain link. It is the way through the site for
  // anyone who would rather read a list than pan a quilt.
  import { page } from '$app/state';
  import Seo from '#lib/components/Seo.svelte';
  import Link from '#lib/components/Link.svelte';
  import LanguagePicker from '#lib/components/LanguagePicker.svelte';
  import { block } from '#lib/quilt/world.js';
  import * as m from '#lib/paraglide/messages.js';

  const signedIn = $derived(page.data.userRole && page.data.userRole !== 'anonymous');
  const entries = [
    { id: 'tasks', href: '/tasks', name: m.block_tasks_title, line: m.contents_tasks },
    { id: 'how', href: '/how-it-works', name: m.block_how_title, line: m.contents_how },
    { id: 'volunteers', href: '/for-volunteers', name: m.block_volunteers_title, line: m.contents_volunteers },
    { id: 'nonprofits', href: '/for-nonprofits', name: m.block_nonprofits_title, line: m.contents_nonprofits },
    { id: 'community', href: '/impact', name: m.block_community_title, line: m.contents_community },
    { id: 'about', href: '/about', name: m.block_about_title, line: m.contents_about },
    { id: 'help', href: '/help', name: m.block_help_title, line: m.contents_help },
    { id: 'docs', href: '/docs', name: m.block_docs_title, line: m.contents_docs },
    { id: 'api', href: '/docs/api', name: m.block_api_title, line: m.contents_api },
    { id: 'contact', href: '/contact', name: m.block_contact_title, line: m.contents_contact }
  ] as const;
</script>

<Seo title={m.contents_meta_title()} description={m.contents_meta_description()} />

<header class="page-head">
  <h1 class="display h-xl" tabindex="-1">{m.tag_contents()}</h1>
  <p class="lede">{m.contents_lede()}</p>
</header>

<ul class="contents">
  {#each entries as e (e.id)}
    <li>
      <Link href={e.href} class="entry">
        <span class="entry__swatch" style:background={block(e.id).fabrics[0] === '#1C1F3B' ? 'var(--c-weld)' : block(e.id).fabrics[0]} aria-hidden="true"></span>
        <span class="entry__name">{e.name()}</span>
        <span class="entry__line">{e.line()}</span>
      </Link>
    </li>
  {/each}
</ul>

<section class="part" aria-labelledby="account">
  <h2 id="account">{m.contents_account()}</h2>
  <ul class="plain">
    {#if signedIn}
      <li><Link href="/dashboard" class="link">{m.block_account_title()}</Link></li>
      <li><Link href="/profile" class="link">{m.nav_profile()}</Link></li>
    {:else}
      <li><Link href="/login" class="link">{m.menu_sign_in()}</Link></li>
      <li><Link href="/signup" class="link">{m.contents_join()}</Link></li>
      <li><Link href="/forgot-password" class="link">{m.contents_forgot()}</Link></li>
    {/if}
  </ul>
</section>

<section class="part" aria-labelledby="language">
  <h2 id="language">{m.lang_picker_label()}</h2>
  <LanguagePicker list />
</section>

<section class="part" aria-labelledby="small">
  <h2 id="small">{m.block_label_name()}</h2>
  <ul class="plain">
    <li><Link href="/privacy" class="link">{m.contents_privacy()}</Link></li>
    <li><Link href="/terms" class="link">{m.contents_terms()}</Link></li>
    <li><Link href="/cookies" class="link">{m.contents_cookies()}</Link></li>
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
