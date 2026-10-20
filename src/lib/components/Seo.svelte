<script lang="ts">
  import { page } from '$app/state';
  import { canonicalPath } from '$lib/site';
  import { locales, type Locale } from '$lib/locale';

  type Props = { title: string; description: string; noindex?: boolean; jsonLd?: Record<string, unknown> };
  let { title, description, noindex = false, jsonLd }: Props = $props();

  const origin = $derived((page.data.origin as string | undefined) ?? page.url.origin);
  const path = $derived(canonicalPath(page.url.pathname));
  const locale = $derived((page.data.locale as Locale | undefined) ?? 'en');
  const urlFor = (l: Locale) => `${origin}/${l}${path === '/' ? '' : path}`;
  const canonical = $derived(urlFor(locale));
  const image = $derived(`${origin}/og.png`);
  const ld = $derived(jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</` + 'script>' : '');
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonical} />
  {#if !noindex}
    {#each locales as l (l)}<link rel="alternate" hreflang={l} href={urlFor(l)} />{/each}
    <link rel="alternate" hreflang="x-default" href={urlFor('en')} />
  {/if}
  {#if noindex}<meta name="robots" content="noindex" />{/if}
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="MicroMatch" />
  <meta property="og:locale" content={locale} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={canonical} />
  <meta property="og:image" content={image} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={image} />
  <!-- eslint-disable-next-line svelte/no-at-html-tags -- static JSON-LD built from our own object, with "<" escaped -->
  {@html ld}
</svelte:head>
