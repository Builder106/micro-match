/* global App */

import type { ServerLoadEvent, LoadEvent, Cookies } from '@sveltejs/kit';
import { vi } from 'vitest';

export type PageLoadEvent<
  Params extends Record<string, string> = Record<string, string>,
  Data extends Record<string, unknown> = Record<string, unknown>,
  ParentData extends Record<string, unknown> = Record<string, unknown>,
  RouteId extends string | null = string | null
> = LoadEvent<Params, Data, ParentData, RouteId>;

type LoadTracing = ServerLoadEvent['tracing'];
type LoadSpan = LoadTracing['root'];

const noopSpan = new Proxy({} as LoadSpan, {
  get: (_target, property: string | symbol) => {
    if (property === 'isRecording') {
      return () => false;
    }

    if (property === 'spanContext') {
      return () => ({ traceId: '', spanId: '', traceFlags: 0 });
    }

    return () => noopSpan;
  }
});

const createNoopTracing = (): LoadTracing => ({
  enabled: false,
  root: noopSpan,
  current: noopSpan
});

export interface MockCookies extends Cookies {
  _store: Map<string, string>;
  get: ReturnType<typeof vi.fn<(name: string) => string | undefined>>;
  getAll: ReturnType<typeof vi.fn<() => Array<{ name: string; value: string }>>>;
  set: ReturnType<typeof vi.fn<(name: string, value: string, opts?: unknown) => void>>;
  delete: ReturnType<typeof vi.fn<(name: string, opts?: unknown) => void>>;
  serialize: ReturnType<typeof vi.fn<(name: string, value: string, opts?: unknown) => string>>;
}

export function createMockCookies(initial: Record<string, string> = {}): MockCookies {
  const store = new Map<string, string>(Object.entries(initial));

  const cookies: MockCookies = {
    _store: store,
    get: vi.fn((name: string) => store.get(name)),
    getAll: vi.fn(() => Array.from(store.entries()).map(([name, value]) => ({ name, value }))),
    set: vi.fn((name: string, value: string) => {
      store.set(name, value);
    }),
    delete: vi.fn((name: string) => {
      store.delete(name);
    }),
    serialize: vi.fn((name: string, value: string) => `${name}=${encodeURIComponent(value)}`)
  };

  return cookies;
}

export interface CreateServerLoadEventOptions<
  Params extends Record<string, string> = Record<string, string>,
  ParentData extends Record<string, unknown> = Record<string, unknown>,
  RouteId extends string | null = string | null
> {
  url?: URL | string;
  params?: Params;
  route?: { id: RouteId } | RouteId;
  cookies?: Record<string, string> | Cookies;
  locals?: Partial<App.Locals>;
  userRole?: App.Locals['userRole'];
  userId?: string;
  email?: string;
  session?: App.Session | null;
  request?: Request;
  fetch?: typeof fetch;
  getClientAddress?: () => string;
  setHeaders?: (headers: Record<string, string>) => void;
  parent?: () => Promise<ParentData>;
  parentData?: ParentData;
  isDataRequest?: boolean;
  isSubRequest?: boolean;
  platform?: Readonly<App.Platform>;
  depends?: (...deps: string[]) => void;
  untrack?: <T>(fn: () => T) => T;
  tracing?: LoadTracing;
  isRemoteRequest?: boolean;
}

export interface CreatePageLoadEventOptions<
  Params extends Record<string, string> = Record<string, string>,
  Data extends Record<string, unknown> = Record<string, unknown>,
  ParentData extends Record<string, unknown> = Record<string, unknown>,
  RouteId extends string | null = string | null
> {
  url?: URL | string;
  params?: Params;
  route?: { id: RouteId } | RouteId;
  data?: Data;
  parent?: () => Promise<ParentData>;
  parentData?: ParentData;
  fetch?: typeof fetch;
  depends?: (...deps: string[]) => void;
  untrack?: <T>(fn: () => T) => T;
  setHeaders?: (headers: Record<string, string>) => void;
  tracing?: PageLoadEvent['tracing'];
}

export function createServerLoadEvent<
  Params extends Record<string, string> = Record<string, string>,
  ParentData extends Record<string, unknown> = Record<string, unknown>,
  RouteId extends string | null = string | null
>(
  options: CreateServerLoadEventOptions<Params, ParentData, RouteId> = {}
): ServerLoadEvent<Params, ParentData, RouteId> {
  const url = options.url instanceof URL
    ? options.url
    : typeof options.url === 'string'
      ? new URL(options.url, 'http://localhost:5173')
      : options.request
        ? new URL(options.request.url)
        : new URL('http://localhost:5173/');

  const routeId = (
    typeof options.route === 'object' && options.route !== null
      ? options.route.id
      : (options.route ?? null)
  ) as RouteId;

  let cookies: Cookies;
  if (options.cookies && 'get' in options.cookies && typeof options.cookies.get === 'function') {
    cookies = options.cookies as Cookies;
  } else {
    cookies = createMockCookies(options.cookies as Record<string, string> | undefined);
  }

  const session = options.session !== undefined
    ? options.session
    : options.userId !== undefined
      ? { user: { id: options.userId, email: options.email ?? 'jane@example.com' } }
      : (options.locals?.session ?? undefined);

  const resolvedLocals: App.Locals = {
    userRole: options.userRole ?? options.locals?.userRole ?? 'anonymous',
    ...options.locals,
    ...(options.userRole ? { userRole: options.userRole } : {}),
    ...(session !== undefined ? { session } : {})
  };

  const request = options.request ?? new Request(url.href);

  const mockFetch = (options.fetch ?? vi.fn(
    typeof globalThis.fetch === 'function' ? globalThis.fetch : async () => new Response('ok')
  )) as typeof fetch;

  const untrackFn: <T>(fn: () => T) => T = options.untrack ?? ((fn) => fn());

  return {
    cookies,
    fetch: mockFetch,
    getClientAddress: options.getClientAddress ?? vi.fn(() => '127.0.0.1'),
    locals: resolvedLocals,
    params: (options.params ?? {}) as Params,
    parent: options.parent ?? vi.fn(async () => ((options.parentData ?? {}) as ParentData)),
    platform: options.platform,
    request,
    route: { id: routeId },
    setHeaders: options.setHeaders ?? vi.fn(),
    url,
    isDataRequest: options.isDataRequest ?? false,
    isSubRequest: options.isSubRequest ?? false,
    isRemoteRequest: options.isRemoteRequest ?? false,
    depends: options.depends ?? vi.fn(),
    untrack: untrackFn,
    tracing: options.tracing ?? createNoopTracing()
  };
}

export function createPageLoadEvent<
  Params extends Record<string, string> = Record<string, string>,
  Data extends Record<string, unknown> = Record<string, unknown>,
  ParentData extends Record<string, unknown> = Record<string, unknown>,
  RouteId extends string | null = string | null
>(
  options: CreatePageLoadEventOptions<Params, Data, ParentData, RouteId> = {}
): PageLoadEvent<Params, Data, ParentData, RouteId> {
  const url = typeof options.url === 'string'
    ? new URL(options.url, 'http://localhost:5173')
    : (options.url ?? new URL('http://localhost:5173/'));

  const routeId = (
    typeof options.route === 'object' && options.route !== null
      ? options.route.id
      : (options.route ?? null)
  ) as RouteId;

  const mockFetch = (options.fetch ?? vi.fn(
    typeof globalThis.fetch === 'function' ? globalThis.fetch : async () => new Response('ok')
  )) as typeof fetch;

  const untrackFn: <T>(fn: () => T) => T = options.untrack ?? ((fn) => fn());

  return {
    url,
    params: (options.params ?? {}) as Params,
    route: { id: routeId },
    data: (options.data ?? {}) as Data,
    parent: options.parent ?? vi.fn(async () => ((options.parentData ?? {}) as ParentData)),
    fetch: mockFetch,
    depends: options.depends ?? vi.fn(),
    untrack: untrackFn,
    setHeaders: options.setHeaders ?? vi.fn(),
    tracing: options.tracing ?? createNoopTracing()
  };
}

export interface CreateLoadEvent {
  <
    Params extends Record<string, string> = Record<string, string>,
    Data extends Record<string, unknown> = Record<string, unknown>,
    ParentData extends Record<string, unknown> = Record<string, unknown>,
    RouteId extends string | null = string | null
  >(
    options: CreatePageLoadEventOptions<Params, Data, ParentData, RouteId> & { type: 'page' }
  ): PageLoadEvent<Params, Data, ParentData, RouteId>;
  <
    Params extends Record<string, string> = Record<string, string>,
    ParentData extends Record<string, unknown> = Record<string, unknown>,
    RouteId extends string | null = string | null
  >(
    options?: CreateServerLoadEventOptions<Params, ParentData, RouteId> & { type?: 'server' }
  ): ServerLoadEvent<Params, ParentData, RouteId>;
}

export const createLoadEvent: CreateLoadEvent = ((
  options:
    | (CreateServerLoadEventOptions & { type?: 'server' })
    | (CreatePageLoadEventOptions & { type: 'page' }) = {}
): ServerLoadEvent | PageLoadEvent => {
  if ('type' in options && options.type === 'page') {
    return createPageLoadEvent(options);
  }
  return createServerLoadEvent(options);
}) as CreateLoadEvent;
