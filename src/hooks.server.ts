import { env } from '$env/dynamic/private';
import { getUserRole } from '$lib/server/auth';
import { getSession } from '$lib/server/session';
import type { Handle } from '@sveltejs/kit';
import {
  directionForLocale,
  localeCookie,
  localeFromPath,
  localizedPath,
  negotiateLocale,
  type Locale
} from '$lib/locale';
import { paraglideMiddleware } from '$lib/paraglide/server';

// Polyfills for Appwrite Browser SDK to work in SvelteKit SSR (both during build and at runtime)
// See https://github.com/appwrite/appwrite/discussions/5435
if (typeof globalThis.atob === 'undefined') {
  globalThis.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');
}
if (typeof globalThis.sessionStorage === 'undefined') {
  globalThis.sessionStorage = new Map<string, string>() as unknown as Storage;
}

export const handle: Handle = async ({ event, resolve }) => {
  const pathLocale = localeFromPath(event.url.pathname);
  const canonicalPath = pathLocale ? event.url.pathname.slice(pathLocale.length + 1) || '/' : event.url.pathname;
  const isApi = canonicalPath === '/api' || canonicalPath.startsWith('/api/');
  const isAsset = canonicalPath.startsWith('/_app/') || canonicalPath.includes('.');
  const locale: Locale = pathLocale ?? negotiateLocale(event.request, event.cookies.get(localeCookie));
  event.locals.locale = locale;

  if (!isApi && !isAsset && !pathLocale) {
    const location = `${localizedPath(event.url.pathname, locale)}${event.url.search}`;
    event.cookies.set(localeCookie, locale, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: event.url.protocol === 'https:',
      maxAge: 60 * 60 * 24 * 365
    });
    return new Response(null, {
      status: 308,
      headers: {
        Location: location,
        'Cache-Control': 'private, no-store',
        Vary: 'Accept-Language, Cookie'
      }
    });
  }
  if (pathLocale) {
    event.cookies.set(localeCookie, pathLocale, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: event.url.protocol === 'https:',
      maxAge: 60 * 60 * 24 * 365
    });
  }

  // Set Appwrite context from server-side variables
  event.locals.appwrite = {
    endpoint: env.APPWRITE_ENDPOINT || '',
    projectId: env.APPWRITE_PROJECT_ID || ''
  };

  // Authorization-relevant role must only ever come from a server-validated
  // session or JWT. The `mm_role` cookie is a client-writable resilience
  // hint read directly by the browser (see Sidebar.svelte / +layout.svelte)
  // for optimistic UI only — it must never populate locals.userRole, since
  // getUserRole() treats locals.userRole as authoritative for every
  // privileged API route.
  const sessionId = event.cookies.get('mm_session');
  if (sessionId) {
    const s = getSession(sessionId);
    if (s) {
      event.locals.userRole = s.role;
      event.locals.session = { user: { id: s.userId, email: s.email } };
    }
  }
  if (!event.locals.userRole) {
    event.locals.userRole = await getUserRole(event);
  }
  if (isApi || isAsset) return await resolve(event);

  return paraglideMiddleware(event.request, ({ request, locale: middlewareLocale }) => {
    event.locals.locale = middlewareLocale as Locale;
    return resolve({ ...event, request }, {
      transformPageChunk: ({ html }) =>
        html.replace('%lang%', middlewareLocale).replace('%dir%', directionForLocale(middlewareLocale as Locale))
    });
  });
};
