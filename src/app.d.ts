/// <reference types="svelte" />
/// <reference types="vite/client" />

declare namespace App {
  interface SessionUser {
    id?: string | null;
    email?: string | null;
    name?: string | null;
  }
  interface Session {
    user?: SessionUser | null;
  }
  interface Locals {
    locale?: import('$lib/locale').Locale;
    session?: Session | null;
    userRole?: 'anonymous' | 'user' | 'ngo' | 'volunteer';
    isAdmin?: boolean;
    appwrite?: {
      endpoint: string;
      projectId: string;
    };
  }
  interface PageData {
    locale?: import('$lib/locale').Locale;
    origin?: string;
    userRole?: 'anonymous' | 'user' | 'ngo' | 'volunteer';
    isAdmin?: boolean;
    session?: Session | null;
  }
}
