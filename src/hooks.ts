import type { Reroute } from '@sveltejs/kit';
import { deLocalizeUrl } from '$lib/paraglide/runtime';

export const reroute: Reroute = ({ url }) => {
  const canonicalUrl = deLocalizeUrl(url);
  const canonicalPath = canonicalUrl.pathname;
  if (canonicalPath === '/api' || canonicalPath.startsWith('/api/')) return;
  if (canonicalPath.startsWith('/_app/') || canonicalPath.includes('.')) return;
  if (canonicalPath !== url.pathname) return canonicalPath;
};
