### Appwrite identity + SvelteKit HttpOnly session (long‑term)

- Env wiring
  - Add `APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`, `APPWRITE_API_KEY` (.env).
  - Enforce HTTPS anywhere `secure` cookies are set.

- Session store (dev → in‑memory; prod → Redis/DB)
  - Create `src/lib/server/session.ts`with`createSession`, `getSession`, `deleteSession`.
  - Fields: `userId`, `email`, `role`, `expiresAt`; TTL ~7–30 days.

- Session exchange endpoint
  - Add `POST src/routes/api/auth/session/+server.ts`:
    - Body `{ jwt }` from client after Appwrite OAuth redirect.
    - Verify via `node-appwrite` (`setJWT(jwt)`→`account.get()`).
    - Derive role from `user.prefs.role` (`ngo`|`volunteer`| default`user`).
    - Create session; set `mm_session` cookie (HttpOnly, Secure, SameSite=Strict, Path=/, Max‑Age).

- Logout endpoint
  - Add `POST src/routes/api/auth/logout/+server.ts`to delete session and clear`mm_session` cookie.

- Server hook
  - Update `src/hooks.server.ts`to read`mm_session`, load session, and set `event.locals.user`and`event.locals.userRole`(fallback`'anonymous'`).
  - Keep existing Appwrite env injection.

- Auth utility
  - In `src/lib/server/auth.ts`, prefer `event.locals.userRole` when present; keep Bearer JWT fallback during migration.

- Protect API routes via locals
  - Ensure `src/routes/api/tasks/+server.ts`, `src/routes/api/tasks/[id]/claim/+server.ts`, `src/routes/api/claims/[id]/approve/+server.ts`check`event.locals.userRole`.

- Client bootstrap after OAuth
  - On first load post‑redirect (e.g., `+layout.svelte` `onMount`):
    - Call `account.get()`(optional) then`getJWT()` once.
    - `fetch('/api/auth/session', { method: 'POST', credentials: 'include', body: JSON.stringify({ jwt }) })`.
  - Do not send Authorization headers on normal API calls.

- UI actions
  - “Sign out” → `POST /api/auth/logout`, then redirect.
  - Show signed‑in state from data derived via `locals`.

- CSRF and security
  - For state‑changing routes, add CSRF protection (SameSite=Strict + Origin/Referer checks or double‑submit token).
  - Same‑origin only; `credentials: 'include'` for writes.
  - Rotate/expire sessions; idle timeout; invalidate on logout.

- Production hardening
  - Replace in‑memory sessions with Redis/DB.
  - Rate‑limit session exchange.
  - `secure: true` cookies only on HTTPS.

- Testing
  - Login → exchange → protected POSTs succeed without Authorization header.
  - Expiry path: expired session → 401/403 → re‑exchange with fresh Appwrite JWT restores access.
  - Logout clears cookie and denies protected routes.

- Cleanup (optional)
  - Remove Authorization Bearer fallback in `getUserRole`and any unused`authHeader()` usage once stable.

References

- HttpOnly cookie best practices: <https://www.wisp.blog/blog/best-practices-in-implementing-jwt-in-nextjs-15>
- Why web apps should prefer sessions: <https://thnee.se/authentication-http-modern-frontend>
- SvelteKit cookie proxy pattern: <https://www.loopwerk.io/articles/2021/sveltekit-cookies-tokens/>
- Appwrite SSR auth tutorial: <https://appwrite.io/docs/tutorials/sveltekit-ssr-auth/step-3>
- Appwrite SSR example (admin/session clients): <https://appwrite.io/blog/post/introducing-support-for-server-side-rendering>
- SvelteKit auth guidance: <https://svelte.dev/docs/kit/llms.txt>
