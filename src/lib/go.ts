// Client-side navigation that keeps the locale prefix and applies the configured base path.
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import type { ResolvedPathname } from '$app/types';
import { hrefFor } from './site';
import type { Locale } from './locale';

export function go(path: string, locale: Locale = 'en', options?: Parameters<typeof goto>[1]) {
  const resolvePath = resolve as (pathname: string) => ResolvedPathname;
  return goto(resolvePath(hrefFor(path, locale)), options);
}
