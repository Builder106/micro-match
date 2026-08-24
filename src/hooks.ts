import type { Reroute } from '@sveltejs/kit';
import { localeFromPath, stripLocale } from '$lib/locale';

export const reroute: Reroute = ({ url }) => {
  const canonicalPath = localeFromPath(url.pathname) ? stripLocale(url.pathname) : url.pathname;
  if (canonicalPath === '/api' || canonicalPath.startsWith('/api/')) return;
  if (canonicalPath.startsWith('/_app/') || canonicalPath.includes('.')) return;
  if (localeFromPath(url.pathname)) return canonicalPath;
};
