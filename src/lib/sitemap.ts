// The sitemap lists the public blocks of the quilt plus the task feed, in English.
import { PUBLIC_PATHS } from './site';

export const SITEMAP_PATHS = [...PUBLIC_PATHS, '/tasks', '/contents'] as const;

export function sitemapXml(origin: string): string {
  const urls = SITEMAP_PATHS.map((p) => `  <url><loc>${origin}/en${p === '/' ? '' : p}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
