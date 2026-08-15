// PROD: Replace with Redis or database-backed session store
// PROD: Add session encryption and security
// PROD: Add session replication for high availability
// Simple in-memory session store (dev). Replace with Redis/DB in production.
import { randomUUID } from 'node:crypto';
export type SessionRecord = {
  id: string;
  userId: string;
  email: string;
  role: 'user' | 'ngo' | 'volunteer';
  expiresAt: number; // epoch ms
};

// PROD: Use Redis or database for session storage
// PROD: Add session cleanup and garbage collection
// PROD: Add session analytics and monitoring
const sessions = new Map<string, SessionRecord>();

// PROD: Make session TTL configurable per environment
// PROD: Add session refresh mechanism
// PROD: Add session security policies
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days

function now(): number {
  return Date.now();
}

// PROD: Move session cleanup to a background job
// PROD: Add proper error handling for cleanup failures
// PROD: Add cleanup metrics and monitoring
function purgeExpired(): void {
  const nowMs = now();
  for (const [id, s] of sessions) {
    if (s.expiresAt <= nowMs) sessions.delete(id);
  }
}

// PROD: Add session security validation
// PROD: Add session fingerprinting for security
// PROD: Add session audit logging
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

// PROD: Add session validation and security checks
// PROD: Add session activity tracking
// PROD: Add session anomaly detection
export function getSession(id: string): SessionRecord | null {
  const s = sessions.get(id);
  if (!s) return null;
  if (s.expiresAt <= now()) {
    sessions.delete(id);
    return null;
  }
  return s;
}

// PROD: Add session invalidation logging
// PROD: Add session cleanup for related resources
// PROD: Add session deletion confirmation
export function deleteSession(id: string): void {
  sessions.delete(id);
}

