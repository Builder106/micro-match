import type { RequestHandler } from '@sveltejs/kit';
import { sitemapXml } from '$lib/sitemap';

export const GET: RequestHandler = ({ url }) =>
  new Response(sitemapXml(url.origin), {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
