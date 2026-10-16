// Client-side navigation that keeps the visitor's locale prefix (resolve() cannot add it).
import { goto } from '$app/navigation';
import { hrefFor } from './site';
import type { Locale } from './locale';

export function go(path: string, locale: Locale = 'en', options?: Parameters<typeof goto>[1]) {
  // eslint-disable-next-line svelte/no-navigation-without-resolve -- hrefFor() adds the locale prefix
  return goto(hrefFor(path, locale), options);
}
