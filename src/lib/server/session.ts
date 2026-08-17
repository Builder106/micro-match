// Simple in-memory session store (dev). Replace with Redis/DB in production.
import { randomUUID } from 'node:crypto';
export type SessionRecord = {
  id: string;
  userId: string;
  email: string;
  role: 'user' | 'ngo' | 'volunteer';
  expiresAt: number; // epoch ms
};

const sessions = new Map<string, SessionRecord>();

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days

function now(): number {
  return Date.now();
}

function purgeExpired(): void {
  const nowMs = now();
  for (const [id, s] of sessions) {
    if (s.expiresAt <= nowMs) sessions.delete(id);
  }
}

export function createSession(input: {
  userId: string;
  email: string;
  role: 'user' | 'ngo' | 'volunteer';
  ttlSeconds?: number;
}): SessionRecord {
  purgeExpired();
  const id = typeof globalThis.crypto !== 'undefined' && 'randomUUID' in globalThis.crypto ? globalThis.crypto.randomUUID() : randomUUID();
  const ttl = Math.max(60, input.ttlSeconds ?? SESSION_TTL_SECONDS);
  const record: SessionRecord = {
    id,
    userId: input.userId,
    email: input.email,
    role: input.role,
    expiresAt: now() + ttl * 1000
  };
  sessions.set(id, record);
  return record;
}

export function getSession(id: string): SessionRecord | null {
  const s = sessions.get(id);
  if (!s) return null;
  if (s.expiresAt <= now()) {
    sessions.delete(id);
    return null;
  }
  return s;
}

export function deleteSession(id: string): void {
  sessions.delete(id);
}

