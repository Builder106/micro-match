<script lang="ts">
  // The tools inside the "Your block" panel. Real links, the current one marked.
  import { page } from '$app/state';
  import { invalidateAll } from '$app/navigation';
  import Link from './Link.svelte';
  import { appNav, isCurrent, hrefFor, type Role } from '$lib/site';
  import type { Locale } from '$lib/locale';
  import * as m from '$lib/paraglide/messages.js';

  const role = $derived((page.data.userRole ?? 'anonymous') as Role);
  const items = $derived(appNav(role, Boolean(page.data.isAdmin)).filter((i) => i.href !== '/tasks'));

  async function signOut() {
    const client = await import('$lib/appwrite.client');
    await client.signOut();
    await invalidateAll();
    location.assign(hrefFor('/', (page.data.locale as Locale | undefined) ?? 'en'));
  }
</script>

<nav class="acct" aria-label={m.contents_account()}>
  <ul>
    {#each items as item (item.href)}
      <li><Link href={item.href} class="acct__link" aria-current={isCurrent(page.url.pathname, item.href) ? 'page' : undefined}>{item.label}</Link></li>
    {/each}
  </ul>
  <button type="button" class="acct__out" onclick={signOut}>{m.acct_sign_out()}</button>
</nav>

<style>
  .acct {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin: -0.5rem 0 clamp(1.5rem, 3vw, 2.5rem);
    padding-bottom: 0.9rem;
    border-bottom: 1.5px dashed var(--c-line);
  }
  ul {
    list-style: none;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }
  .acct :global(.acct__link) {
    display: inline-flex;
    align-items: center;
    min-height: 2.4rem;
    padding: 0.35rem 0.85rem;
    border-radius: var(--radius);
    font-weight: 560;
    font-size: 0.95rem;
    transition: background-color 0.2s, box-shadow 0.2s;
  }
  @media (max-width: 699px) {
    .acct {
      flex-wrap: nowrap;
    }
    ul {
      flex-wrap: nowrap;
      overflow-x: auto;
      scrollbar-width: none;
      -webkit-mask: linear-gradient(90deg, #000 calc(100% - 1.5rem), #0000);
      mask: linear-gradient(90deg, #000 calc(100% - 1.5rem), #0000);
      padding-right: 1.25rem;
    }
    .acct :global(.acct__link),
    .acct__out {
      white-space: nowrap;
    }
  }
  @media (hover: hover) {
    .acct :global(.acct__link:hover) {
      box-shadow: inset 0 0 0 1.5px var(--c-fg);
    }
  }
  .acct :global(.acct__link[aria-current='page']) {
    background: var(--c-fg);
    color: var(--c-bg);
  }
  .acct__out {
    min-height: 1.6rem;
    font-size: 0.92rem;
    color: var(--c-muted);
    text-decoration: underline 1px;
    text-underline-offset: 0.2em;
  }
  @media (hover: hover) {
    .acct__out:hover {
      color: var(--c-fg);
    }
  }
</style>
