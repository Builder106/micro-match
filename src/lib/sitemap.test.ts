import { describe, it, expect } from 'vitest';
import { SITEMAP_PATHS, sitemapXml } from './sitemap';
import { locales } from './locale';
import { GET } from '../routes/sitemap.xml/+server';

describe('sitemap', () => {
  it('lists every public block and the feed under each locale', () => {
    const xml = sitemapXml('https://trymicromatch.com');
    expect(xml).toContain('<loc>https://trymicromatch.com/en</loc>');
    expect(xml).toContain('<loc>https://trymicromatch.com/en/tasks</loc>');
    expect(xml).toContain('<loc>https://trymicromatch.com/ar/tasks</loc>');
    expect(xml.match(/<url>/g)).toHaveLength(SITEMAP_PATHS.length * locales.length);
  });
  it('is served as XML from the request origin', async () => {
    const res = await GET({ url: new URL('http://127.0.0.1:4173/sitemap.xml') } as Parameters<
      typeof GET
    >[0]);
    expect(res.headers.get('content-type')).toMatch(/application\/xml/);
    expect(await res.text()).toContain('http://127.0.0.1:4173/en/how-it-works');
  });
});
