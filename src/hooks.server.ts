import { env } from '$env/dynamic/private';
import { getUserRole } from '$lib/server/auth';
import { getSession } from '$lib/server/session';
import type { Handle } from '@sveltejs/kit';

// Polyfills for Appwrite Browser SDK to work in SvelteKit SSR (both during build and at runtime)
// See https://github.com/appwrite/appwrite/discussions/5435
if (typeof globalThis.atob === 'undefined') {
  globalThis.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');
}
if (typeof globalThis.sessionStorage === 'undefined') {
  globalThis.sessionStorage = new Map<string, string>() as unknown as Storage;
}

export const handle: Handle = async ({ event, resolve }) => {
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
  return await resolve(event);
};

