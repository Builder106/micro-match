import { describe, it, expect } from 'vitest';
import { appNav, canonicalPath, hrefFor, isCurrent, isPublicPath, safeNext } from './site';

describe('site map', () => {
  it('strips the locale and a trailing slash', () => {
    expect(canonicalPath('/en/docs/api/')).toBe('/docs/api');
    expect(canonicalPath('/en')).toBe('/');
    expect(canonicalPath('/fr/')).toBe('/');
  });
  it('knows which pages are public', () => {
    expect(isPublicPath('/en/how-it-works')).toBe(true);
    expect(isPublicPath('/en')).toBe(true);
    expect(isPublicPath('/en/tasks')).toBe(false);
  });
  it('marks the current item, including pages inside it', () => {
    expect(isCurrent('/en/badges/manage', '/badges/manage')).toBe(true);
    expect(isCurrent('/en/task/1/claim', '/task')).toBe(true);
    expect(isCurrent('/en', '/')).toBe(true);
    expect(isCurrent('/en/about', '/')).toBe(false);
    expect(isCurrent('/en/about', '/help')).toBe(false);
  });
  it('adds the locale to internal links and keeps the query', () => {
    expect(hrefFor('/tasks?max=15', 'en')).toBe('/en/tasks?max=15');
    expect(hrefFor('/', 'es')).toBe('/es');
    expect(hrefFor('https://example.org', 'en')).toBe('https://example.org');
    expect(hrefFor('mailto:a@b.c', 'en')).toBe('mailto:a@b.c');
    expect(hrefFor('#main', 'en')).toBe('#main');
  });
  it('lists account tools by role', () => {
    expect(appNav('volunteer', false).map((i) => i.label)).toEqual([
      'My block',
      'Tasks',
      'Profile',
    ]);
    expect(appNav('ngo', true).map((i) => i.href)).toEqual([
      '/dashboard',
      '/tasks',
      '/org',
      '/badges/manage',
      '/admin/verifications',
      '/profile',
    ]);
  });
  it('only follows same-origin next paths', () => {
    expect(safeNext('/task/1/claim')).toBe('/task/1/claim');
    expect(safeNext('//evil.example')).toBe('/dashboard');
    expect(safeNext('https://evil.example')).toBe('/dashboard');
    expect(safeNext(null, '/')).toBe('/');
  });
});
