# Landing page expansion — design

## Problem

The homepage's primary header nav (`#how-it-works`, `#tasks`, `#impact`) only scrolls the same page — there's no real pre-login site to explore. Real pages already exist (`/about`, `/contact`, `/help`, `/docs/api`, `/privacy`, `/terms`, `/cookies`) via a shared `StaticArticle` layout, but they're thin and only linked from the footer, and there's no audience-specific pitch for NGOs vs. volunteers, no full explanation of the task lifecycle, and no real impact numbers.

## Scope

### 1. Header nav → real routes
`src/routes/+page.svelte`: replace the anchor links in `.header-nav` and the mobile `#mobile-menu` with real routes:
- `How It Works` → `/how-it-works`
- `Browse Tasks` → `/tasks` (unchanged destination, already real)
- `For NGOs` → `/for-ngos`
- `For Volunteers` → `/for-volunteers`

The homepage's existing `#how-it-works`, `#tasks`, `#impact` sections stay in place as a teaser; they're just no longer the nav's only destination.

### 2. New routes (StaticArticle pattern)
Each new page is a `+page.svelte` using `$lib/components/StaticArticle.svelte` (same pattern as `/about`), so it inherits the shared public header/footer/sibling-nav automatically. Update `StaticArticle.svelte`'s `siblings` list to include the four new pages.

- **`/how-it-works`** — full task lifecycle: browse → claim → learn (just-in-time resources) → submit proof → NGO review → badge awarded. Written for both audiences, expands on the homepage's 3-step teaser.
- **`/for-ngos`** — how to post a task, how verification works (see `/help` mention of "verified" orgs and `setTasksVerifiedForOrg`), why scoping work into micro-units helps get things done, CTA to `/signup`.
- **`/for-volunteers`** — how claiming works, what counts as "micro" (time estimates), learning resources, badges/XP, CTA to `/signup`.
- **`/impact`** — real aggregate numbers only, computed server-side in `+page.server.ts`:
  - tasks completed = count of `Claim` rows with `status === 'approved'` (via `getClaims()`)
  - active volunteers = distinct `userId` across approved claims
  - NGOs onboarded = distinct `orgId` across `getTasks()`
  - badges awarded = `(await getBadges()).length`
  No fabricated figures (the homepage's "Level 12 Volunteer" demo card is explicitly marketing-mock and stays as is — this new page must not repeat that pattern).

### 3. Flesh out existing StaticArticle pages
- `/about` — add a short "how the project works" paragraph beyond the current 3-paragraph pitch.
- `/help` — replace the two bullet groups with a proper FAQ (still plain `<dl>`/`<p>` markup, no new component needed).
- `/docs` (currently just `/docs/api`) — document the other public read endpoints beyond `GET /api/tasks` (check `src/routes/api/**` for which are safe to document as public/read-only).
- `/contact`, `/privacy`, `/terms`, `/cookies` — out of scope, left as-is.

### 4. Footer
`src/routes/+page.svelte` footer `.link-col` — add `How It Works`, `For NGOs`, `For Volunteers`, `Impact` links alongside the existing About/Help/Docs group.

## Non-goals
- No pricing page (MicroMatch is free/FOSS, not paid — see project memory).
- No new shared components; reuse `StaticArticle`.
- No changes to `/tasks`, `/dashboard`, or any authenticated route.

## Testing
- Manual click-through of header nav (desktop + mobile menu) confirming no `#anchor`-only links remain for the four moved items.
- `/impact` numbers checked against a manual query (e.g. via existing admin/badge-analytics view) to confirm they aren't hardcoded.
- Existing Playwright e2e (`e2e/demo/01-landing-tour.spec.ts`) reviewed for anchor-link assertions that need updating to route assertions.
