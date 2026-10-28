/* eslint-disable @typescript-eslint/no-deprecated -- this test calls the deprecated positional form on purpose, to prove the object form sends the same request */
// The app moved every Appwrite call from positional arguments to one options object. Both forms
// go through the same SDK method, so the move is safe only if they put identical requests on the
// wire. This runs the real SDKs against a local server and compares what each form sends, for
// every method the app and its scripts call, with the argument shapes they use.
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  Account as ServerAccount,
  Client as ServerClient,
  Storage as ServerStorage,
  TablesDB,
  Teams,
  Users,
} from 'node-appwrite';
import {
  Account as WebAccount,
  Client as WebClient,
  OAuthProvider,
  Storage as WebStorage,
} from 'appwrite';

type Recorded = { method: string; url: string; type: string; body: string };

let server: Server;
let endpoint = '';
let log: Recorded[] = [];

beforeAll(async () => {
  server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => {
      const type = req.headers['content-type'] ?? '';
      let body = Buffer.concat(chunks).toString('latin1');
      // Multipart boundaries are random per request, so compare the parts, not the boundary.
      const boundary = /boundary=(.+)$/.exec(type)?.[1];
      if (boundary) body = body.split(boundary).join('BOUNDARY');
      log.push({ method: req.method ?? '', url: req.url ?? '', type: type.split(';')[0], body });
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ $id: 'x', rows: [], total: 0, users: [], memberships: [] }));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  endpoint = `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1`;
});

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

/** What a call sent: its requests, or the URL it built for calls that only build one. */
async function capture(call: () => unknown): Promise<unknown> {
  log = [];
  const result = await call();
  return { requests: log, url: typeof result === 'string' ? result : undefined };
}

function serverSdk() {
  const client = new ServerClient().setEndpoint(endpoint).setProject('p').setKey('k');
  return {
    tables: new TablesDB(client),
    users: new Users(client),
    teams: new Teams(client),
    storage: new ServerStorage(client),
    account: new ServerAccount(new ServerClient().setEndpoint(endpoint).setProject('p')),
  };
}

function webSdk() {
  const client = new WebClient().setEndpoint(endpoint).setProject('p');
  return { account: new WebAccount(client), storage: new WebStorage(client) };
}

const file = () =>
  new File([new Uint8Array([137, 80, 78, 71])], 'avatar.png', { type: 'image/png' });
const queries = ['{"method":"limit","values":[10]}'];
const data = { title: 'Translate a flyer', tags: ['health'], minutes: 15 };

type Sdk = ReturnType<typeof serverSdk>;
const SERVER: [string, (s: Sdk) => unknown, (s: Sdk) => unknown][] = [
  [
    'tables.listRows',
    (s) => s.tables.listRows('db', 'tasks', queries),
    (s) => s.tables.listRows({ databaseId: 'db', tableId: 'tasks', queries }),
  ],
  [
    'tables.listRows without queries',
    (s) => s.tables.listRows('db', 'tasks'),
    (s) => s.tables.listRows({ databaseId: 'db', tableId: 'tasks' }),
  ],
  [
    'tables.getRow',
    (s) => s.tables.getRow('db', 'tasks', 'r1'),
    (s) => s.tables.getRow({ databaseId: 'db', tableId: 'tasks', rowId: 'r1' }),
  ],
  [
    'tables.createRow',
    (s) => s.tables.createRow('db', 'tasks', 'r1', data),
    (s) => s.tables.createRow({ databaseId: 'db', tableId: 'tasks', rowId: 'r1', data }),
  ],
  [
    'tables.updateRow',
    (s) => s.tables.updateRow('db', 'tasks', 'r1', { status: 'active' }),
    (s) =>
      s.tables.updateRow({
        databaseId: 'db',
        tableId: 'tasks',
        rowId: 'r1',
        data: { status: 'active' },
      }),
  ],
  [
    'tables.deleteRow',
    (s) => s.tables.deleteRow('db', 'tasks', 'r1'),
    (s) => s.tables.deleteRow({ databaseId: 'db', tableId: 'tasks', rowId: 'r1' }),
  ],
  [
    'tables.getTable',
    (s) => s.tables.getTable('db', 'tasks'),
    (s) => s.tables.getTable({ databaseId: 'db', tableId: 'tasks' }),
  ],
  [
    'tables.createTable',
    (s) => s.tables.createTable('db', 'tasks', 'Tasks', [], true),
    (s) =>
      s.tables.createTable({
        databaseId: 'db',
        tableId: 'tasks',
        name: 'Tasks',
        permissions: [],
        rowSecurity: true,
      }),
  ],
  ['tables.get', (s) => s.tables.get('db'), (s) => s.tables.get({ databaseId: 'db' })],
  [
    'tables.create',
    (s) => s.tables.create('db', 'Main', true),
    (s) => s.tables.create({ databaseId: 'db', name: 'Main', enabled: true }),
  ],
  ['users.list', (s) => s.users.list(queries), (s) => s.users.list({ queries })],
  [
    'users.create',
    (s) => s.users.create('u1', 'a@example.test', undefined, 'pw-123456', 'Ada'),
    (s) =>
      s.users.create({ userId: 'u1', email: 'a@example.test', password: 'pw-123456', name: 'Ada' }),
  ],
  ['users.get', (s) => s.users.get('u1'), (s) => s.users.get({ userId: 'u1' })],
  [
    'users.updatePrefs',
    (s) => s.users.updatePrefs('u1', { role: 'ngo' }),
    (s) => s.users.updatePrefs({ userId: 'u1', prefs: { role: 'ngo' } }),
  ],
  [
    'users.updatePassword',
    (s) => s.users.updatePassword('u1', 'pw-123456'),
    (s) => s.users.updatePassword({ userId: 'u1', password: 'pw-123456' }),
  ],
  [
    'users.updateName',
    (s) => s.users.updateName('u1', 'Ada'),
    (s) => s.users.updateName({ userId: 'u1', name: 'Ada' }),
  ],
  ['teams.get', (s) => s.teams.get('t1'), (s) => s.teams.get({ teamId: 't1' })],
  [
    'teams.create',
    (s) => s.teams.create('t1', 'Volunteers'),
    (s) => s.teams.create({ teamId: 't1', name: 'Volunteers' }),
  ],
  [
    'teams.createMembership',
    (s) => s.teams.createMembership('t1', ['ngo'], undefined, 'u1'),
    (s) => s.teams.createMembership({ teamId: 't1', roles: ['ngo'], userId: 'u1' }),
  ],
  [
    'teams.listMemberships',
    (s) => s.teams.listMemberships('t1', queries),
    (s) => s.teams.listMemberships({ teamId: 't1', queries }),
  ],
  [
    'teams.deleteMembership',
    (s) => s.teams.deleteMembership('t1', 'm1'),
    (s) => s.teams.deleteMembership({ teamId: 't1', membershipId: 'm1' }),
  ],
  [
    'storage.getBucket',
    (s) => s.storage.getBucket('avatars'),
    (s) => s.storage.getBucket({ bucketId: 'avatars' }),
  ],
  [
    'storage.createBucket',
    (s) => s.storage.createBucket('avatars', 'Avatars', [], false, true, 1000, ['png']),
    (s) =>
      s.storage.createBucket({
        bucketId: 'avatars',
        name: 'Avatars',
        permissions: [],
        fileSecurity: false,
        enabled: true,
        maximumFileSize: 1000,
        allowedFileExtensions: ['png'],
      }),
  ],
  [
    'storage.createFile',
    (s) => s.storage.createFile('avatars', 'f1', file(), ['read("any")']),
    (s) =>
      s.storage.createFile({
        bucketId: 'avatars',
        fileId: 'f1',
        file: file(),
        permissions: ['read("any")'],
      }),
  ],
  [
    'storage.getFilePreview',
    (s) => s.storage.getFilePreview('avatars', 'f1', 128, 128),
    (s) => s.storage.getFilePreview({ bucketId: 'avatars', fileId: 'f1', width: 128, height: 128 }),
  ],
  [
    'storage.getFileDownload',
    (s) => s.storage.getFileDownload('docs', 'f1'),
    (s) => s.storage.getFileDownload({ bucketId: 'docs', fileId: 'f1' }),
  ],
  [
    'account.createSession',
    (s) => s.account.createSession('u1', 'secret'),
    (s) => s.account.createSession({ userId: 'u1', secret: 'secret' }),
  ],
];

type Web = ReturnType<typeof webSdk>;
const WEB: [string, (s: Web) => unknown, (s: Web) => unknown][] = [
  [
    'account.create',
    (s) => s.account.create('u1', 'a@example.test', 'pw-123456', 'Ada'),
    (s) =>
      s.account.create({
        userId: 'u1',
        email: 'a@example.test',
        password: 'pw-123456',
        name: 'Ada',
      }),
  ],
  [
    'account.createEmailPasswordSession',
    (s) => s.account.createEmailPasswordSession('a@example.test', 'pw-123456'),
    (s) => s.account.createEmailPasswordSession({ email: 'a@example.test', password: 'pw-123456' }),
  ],
  [
    'account.updatePrefs',
    (s) => s.account.updatePrefs({ role: 'volunteer' }),
    (s) => s.account.updatePrefs({ prefs: { role: 'volunteer' } }),
  ],
  [
    'account.createRecovery',
    (s) => s.account.createRecovery('a@example.test', 'https://example.test/reset'),
    (s) => s.account.createRecovery({ email: 'a@example.test', url: 'https://example.test/reset' }),
  ],
  [
    'account.updateRecovery',
    (s) => s.account.updateRecovery('u1', 'secret', 'pw-123456'),
    (s) => s.account.updateRecovery({ userId: 'u1', secret: 'secret', password: 'pw-123456' }),
  ],
  [
    'account.createOAuth2Token',
    (s) =>
      s.account.createOAuth2Token(
        OAuthProvider.Google,
        'https://example.test/ok',
        'https://example.test/fail',
      ),
    (s) =>
      s.account.createOAuth2Token({
        provider: OAuthProvider.Google,
        success: 'https://example.test/ok',
        failure: 'https://example.test/fail',
      }),
  ],
  [
    'storage.getFilePreview',
    (s) => s.storage.getFilePreview('avatars', 'f1', 64, 64),
    (s) => s.storage.getFilePreview({ bucketId: 'avatars', fileId: 'f1', width: 64, height: 64 }),
  ],
];

describe('Appwrite object arguments send the same requests as positional ones', () => {
  describe('server SDK', () => {
    it.each(SERVER)('%s', async (_name, positional, object) => {
      const before = await capture(() => positional(serverSdk()));
      const after = await capture(() => object(serverSdk()));
      expect(before).toMatchObject({ requests: [expect.anything()] });
      expect(after).toEqual(before);
    });
  });

  describe('browser SDK', () => {
    it.each(WEB)('%s', async (_name, positional, object) => {
      const before = await capture(() => positional(webSdk()));
      const after = await capture(() => object(webSdk()));
      expect(before).not.toEqual({ requests: [], url: undefined });
      expect(after).toEqual(before);
    });
  });
});
