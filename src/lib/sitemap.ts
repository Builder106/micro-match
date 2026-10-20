// The sitemap lists the public blocks of the quilt plus the task feed, in every language.
import { PUBLIC_PATHS } from './site';
import { locales } from './locale';

export const SITEMAP_PATHS = [...PUBLIC_PATHS, '/tasks', '/contents'] as const;

export function sitemapXml(origin: string): string {
  const urls = locales
    .flatMap((l) => SITEMAP_PATHS.map((p) => `  <url><loc>${origin}/${l}${p === '/' ? '' : p}</loc></url>`))
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
