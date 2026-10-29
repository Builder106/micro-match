<script lang="ts">
  // The languages, each a link to this same page in it and named in its own language. A full
  // page load, so every string, the direction and the task translations switch together.
  import { page } from '$app/state';
  import { locales, localizedHref, type Locale } from '#lib/locale.js';
  import * as m from '#lib/paraglide/messages.js';

  const NAMES: Record<Locale, string> = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    pt: 'Português',
    zh: '中文',
    ar: 'العربية'
  };
  const current = $derived((page.data.locale as Locale | undefined) ?? 'en');
  /** `list` shows the languages as a plain list (the contents page) instead of a disclosure. */
  let { list = false }: { list?: boolean } = $props();
</script>

{#snippet links()}
  {#each locales as l (l)}
    <li>
      <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the same page under another locale prefix -->
      <a href={localizedHref(page.url.pathname, l, page.url.search)} hreflang={l} lang={l} aria-current={l === current ? 'true' : undefined} data-sveltekit-reload class:link={list}>{NAMES[l]}</a>
    </li>
  {/each}
{/snippet}

{#if list}
  <ul class="plain langs-list">{@render links()}</ul>
{:else}
  <details class="langs">
    <summary><span class="sr-only">{m.lang_picker_label()}: </span><span lang={current}>{NAMES[current]}</span></summary>
    <ul aria-label={m.lang_picker_label()}>{@render links()}</ul>
  </details>
{/if}

<style>
  .langs {
    position: relative;
    z-index: 3;
  }
  summary {
    display: inline-block;
    padding-block: 0.3rem;
    cursor: pointer;
    text-decoration: underline 1px;
    text-underline-offset: 0.18em;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary::after {
    content: ' ▾';
  }
  [open] summary::after {
    content: ' ▴';
  }
  .langs ul {
    position: absolute;
    inset-inline-start: -0.6rem;
    top: calc(100% + 0.2rem);
    display: grid;
    gap: 0;
    min-width: 9rem;
    margin: 0;
    padding: 0.35rem 0.6rem;
    list-style: none;
    background: var(--cloth-muslin);
    border: 1.5px dashed color-mix(in srgb, var(--c-fg) 40%, transparent);
    box-shadow: 0 6px 14px -4px rgb(0 0 0 / 0.3);
  }
  .langs-list a {
    display: inline-block;
    padding-block: 0.15rem;
  }
  .langs-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 1.2rem;
  }
  a[aria-current] {
    font-weight: 700;
    text-decoration: none;
  }
  @media (hover: hover) {
    summary:hover {
      color: var(--c-danger);
    }
  }
</style>
