<script lang="ts">
  // Internal links carry the visitor's locale prefix. SvelteKit's resolve() cannot add it,
  // so every internal link in the app goes through this one component.
  import { page } from '$app/state';
  import { hrefFor } from '$lib/site';
  import type { Locale } from '$lib/locale';
  import type { HTMLAnchorAttributes } from 'svelte/elements';

  let { href, children, ...rest }: HTMLAnchorAttributes & { href: string } = $props();
  const locale = $derived((page.data.locale as Locale | undefined) ?? 'en');
  const target = $derived(hrefFor(href, locale));
</script>

<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- hrefFor() adds the locale prefix that resolve() cannot -->
<a href={target} {...rest}>{@render children?.()}</a>
