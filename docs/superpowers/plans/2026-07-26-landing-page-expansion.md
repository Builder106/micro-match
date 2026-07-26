# Landing Page Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn MicroMatch's pre-login site from one page (with an anchor-only nav) into a real multi-page site: fixed navigation, four new pages (How It Works, For NGOs, For Volunteers, Impact), and fleshed-out existing pages (About, Help, Docs).

**Architecture:** All new pages are SvelteKit routes (`src/routes/<slug>/+page.svelte`) built with the existing `$lib/components/StaticArticle.svelte` shell, the same pattern `/about` and `/help` already use. The homepage (`src/routes/+page.svelte`) header/footer/mobile-menu get their anchor links swapped for real `href`s. The `/impact` page adds one new server-side aggregation function to `src/lib/server/appwrite.ts` and a `+page.server.ts` load function — no fabricated numbers anywhere.

**Tech Stack:** SvelteKit, TypeScript, Appwrite (via `src/lib/server/appwrite.ts`), Vitest/`deno test` for unit tests (per project convention — see `docs/superpowers/specs/2026-07-26-landing-page-expansion-design.md`), Playwright for e2e.

## Global Constraints

- No pricing page — MicroMatch is free/FOSS, never paid.
- No new shared components — every new page reuses `StaticArticle.svelte`.
- No changes to `/tasks`, `/dashboard`, or any authenticated route.
- `/impact` numbers must come from real queries (`getClaims`, `getBadges`, `getTasks`) — never hardcoded. The homepage's "Level 12 Volunteer" demo card is explicitly a marketing mock and is left untouched; the new `/impact` page must not repeat that pattern.
- `Claim.status` is `'pending' | 'approved' | 'rejected'` (`src/lib/types.ts:19-28`). "Completed" tasks = claims with `status === 'approved'`.
- `Task.orgId` is optional (`src/lib/types.ts:1-16`) — aggregation must filter out `undefined` before counting distinct NGOs.

---

### Task 1: Add `getPublicImpactStats` to the Appwrite server module

**Files:**
- Modify: `src/lib/server/appwrite.ts` (add new exported function; existing exports `getTasks`, `getClaims`, `getBadges` are at lines 68, 301, 426)
- Test: `src/lib/server/appwrite.impact-stats.test.ts` (new)

**Interfaces:**
- Consumes: `getTasks(): Promise<Task[]>`, `getClaims(filters?): Promise<Claim[]>`, `getBadges(): Promise<Badge[]>` (all already exported from this file)
- Produces: `getPublicImpactStats(): Promise<{ tasksCompleted: number; activeVolunteers: number; ngosOnboarded: number; badgesAwarded: number }>` — this is what Task 6's `+page.server.ts` will call.

- [ ] **Step 1: Write the failing test**

Check how existing tests in this file mock Appwrite before writing this — read `src/lib/server/appwrite.appwrite-mode.test.ts` for the mocking pattern used in this project, then follow the same pattern. Write:

```typescript
import { describe, it, expect, vi } from 'vitest';

vi.mock('$lib/server/appwrite', async () => {
  const actual = await vi.importActual<typeof import('$lib/server/appwrite')>('$lib/server/appwrite');
  return {
    ...actual,
    getTasks: vi.fn(),
    getClaims: vi.fn(),
    getBadges: vi.fn(),
  };
});

import { getPublicImpactStats, getTasks, getClaims, getBadges } from '$lib/server/appwrite';

describe('getPublicImpactStats', () => {
  it('aggregates real counts without fabricating numbers', async () => {
    vi.mocked(getTasks).mockResolvedValue([
      { id: 't1', orgId: 'org-a', title: 'A', shortDescription: '', tags: [] },
      { id: 't2', orgId: 'org-b', title: 'B', shortDescription: '', tags: [] },
      { id: 't3', orgId: 'org-a', title: 'C', shortDescription: '', tags: [] },
      { id: 't4', title: 'D', shortDescription: '', tags: [] }, // no orgId
    ] as any);
    vi.mocked(getClaims).mockResolvedValue([
      { id: 'c1', taskId: 't1', userId: 'u1', status: 'approved' },
      { id: 'c2', taskId: 't2', userId: 'u2', status: 'approved' },
      { id: 'c3', taskId: 't3', userId: 'u1', status: 'pending' },
      { id: 'c4', taskId: 't1', userId: 'u3', status: 'rejected' },
    ] as any);
    vi.mocked(getBadges).mockResolvedValue([{}, {}, {}] as any);

    const stats = await getPublicImpactStats();

    expect(stats).toEqual({
      tasksCompleted: 2, // c1, c2 are 'approved'
      activeVolunteers: 2, // distinct userId among approved claims: u1, u2
      ngosOnboarded: 2, // distinct orgId across tasks: org-a, org-b
      badgesAwarded: 3,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd "/Users/yinkavaughan/My Drive (yvaughan@wesleyan.edu)/CS/Projects/SWE/MicroMatch" && npx vitest run src/lib/server/appwrite.impact-stats.test.ts`
Expected: FAIL with "getPublicImpactStats is not a function" or import error.

- [ ] **Step 3: Write minimal implementation**

Add to `src/lib/server/appwrite.ts` near the other read-oriented exports (e.g. after `getBadgeAnalytics`, around line 488+):

```typescript
export async function getPublicImpactStats(): Promise<{
  tasksCompleted: number;
  activeVolunteers: number;
  ngosOnboarded: number;
  badgesAwarded: number;
}> {
  const [tasks, claims, badges] = await Promise.all([getTasks(), getClaims(), getBadges()]);

  const approvedClaims = claims.filter((c) => c.status === 'approved');
  const tasksCompleted = approvedClaims.length;
  const activeVolunteers = new Set(approvedClaims.map((c) => c.userId).filter(Boolean)).size;
  const ngosOnboarded = new Set(tasks.map((t) => t.orgId).filter(Boolean)).size;
  const badgesAwarded = badges.length;

  return { tasksCompleted, activeVolunteers, ngosOnboarded, badgesAwarded };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd "/Users/yinkavaughan/My Drive (yvaughan@wesleyan.edu)/CS/Projects/SWE/MicroMatch" && npx vitest run src/lib/server/appwrite.impact-stats.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/appwrite.ts src/lib/server/appwrite.impact-stats.test.ts
git commit -m "Add getPublicImpactStats aggregation for the public impact page"
```

---

### Task 2: `/impact` page

**Files:**
- Create: `src/routes/impact/+page.server.ts`
- Create: `src/routes/impact/+page.svelte`

**Interfaces:**
- Consumes: `getPublicImpactStats()` from Task 1.
- Produces: route `/impact`, used by Task 7 (nav links) and Task 3 (StaticArticle siblings list).

- [ ] **Step 1: Write `+page.server.ts`**

```typescript
import type { PageServerLoad } from './$types';
import { getPublicImpactStats } from '$lib/server/appwrite';

export const load: PageServerLoad = async () => {
  const stats = await getPublicImpactStats();
  return { stats };
};
```

- [ ] **Step 2: Write `+page.svelte`**

```svelte
<script lang="ts">
  import StaticArticle from '$lib/components/StaticArticle.svelte';
  export let data;
</script>

<StaticArticle
  title="Our Impact"
  lede="Real numbers from the MicroMatch community — updated live, never estimated."
>
  <div class="stat-grid">
    <div class="stat">
      <span class="stat-value">{data.stats.tasksCompleted}</span>
      <span class="stat-label">Tasks completed</span>
    </div>
    <div class="stat">
      <span class="stat-value">{data.stats.activeVolunteers}</span>
      <span class="stat-label">Active volunteers</span>
    </div>
    <div class="stat">
      <span class="stat-value">{data.stats.ngosOnboarded}</span>
      <span class="stat-label">NGOs onboarded</span>
    </div>
    <div class="stat">
      <span class="stat-value">{data.stats.badgesAwarded}</span>
      <span class="stat-label">Badges awarded</span>
    </div>
  </div>
  <p>
    Every number above comes directly from the tasks, claims, and badges recorded in MicroMatch — nothing here is a mockup or a projection. As the community grows, so do these counts.
  </p>
  <p>
    Want to be part of the next update? <a href="/for-volunteers">Join as a volunteer</a> or <a href="/for-ngos">post a task as an NGO</a>.
  </p>
</StaticArticle>

<style>
  .stat-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-4);
    margin: 0 0 var(--space-5) 0;
  }
  @media (min-width: 480px) {
    .stat-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }
  .stat {
    display: flex;
    flex-direction: column;
    gap: 4px;
    text-align: center;
    padding: var(--space-4) var(--space-2);
    background: var(--color-surface-variant, #f8f8f8);
    border-radius: var(--radius-md, 16px);
  }
  .stat-value {
    font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
    font-size: clamp(1.5rem, 3vw, 2rem);
    font-weight: 800;
    color: var(--color-text);
  }
  .stat-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-text-secondary);
  }
</style>
```

- [ ] **Step 3: Manually verify**

Run: `cd "/Users/yinkavaughan/My Drive (yvaughan@wesleyan.edu)/CS/Projects/SWE/MicroMatch" && npm run dev` (or the ampere-dev tunneled dev server per project convention), then visit `/impact` and confirm the four stats render without errors and match what a manual Appwrite query returns for `getClaims`/`getTasks`/`getBadges`.

- [ ] **Step 4: Commit**

```bash
git add src/routes/impact
git commit -m "Add /impact page with real aggregated stats"
```

---

### Task 3: `/how-it-works`, `/for-ngos`, `/for-volunteers` pages + StaticArticle siblings update

**Files:**
- Create: `src/routes/how-it-works/+page.svelte`
- Create: `src/routes/for-ngos/+page.svelte`
- Create: `src/routes/for-volunteers/+page.svelte`
- Modify: `src/lib/components/StaticArticle.svelte:8-16` (siblings array)

**Interfaces:**
- Consumes: `StaticArticle.svelte` component (existing, `title`/`lede`/`updated` props + default slot).
- Produces: routes `/how-it-works`, `/for-ngos`, `/for-volunteers`, referenced by Task 7 (homepage nav/footer).

- [ ] **Step 1: Write `/how-it-works`**

```svelte
<script lang="ts">
  import StaticArticle from '$lib/components/StaticArticle.svelte';
</script>

<StaticArticle
  title="How It Works"
  lede="From browsing a task to earning a badge — the full lifecycle of a micro-volunteering contribution."
>
  <h2>1. Browse</h2>
  <p>
    NGOs post tasks scoped to a few minutes to an hour: translation, tagging, light design, data checks. Filter the <a href="/tasks">task feed</a> by time and tags to find one that fits your schedule and skills.
  </p>
  <h2>2. Claim</h2>
  <p>
    Claim a task only when you can realistically finish it within the estimated time — this keeps the feed honest for other volunteers and lets NGOs plan around real commitments.
  </p>
  <h2>3. Learn</h2>
  <p>
    Many tasks link to just-in-time learning resources, so you don't need prior expertise to contribute — just enough context to do the specific task well.
  </p>
  <h2>4. Submit proof</h2>
  <p>
    When you're done, submit your work through the flow on the task page. NGOs review submissions and approve or request changes.
  </p>
  <h2>5. Earn recognition</h2>
  <p>
    Approved work earns you a badge and contributes to your visible track record. See the community's aggregate <a href="/impact">impact</a> as it grows.
  </p>
</StaticArticle>
```

- [ ] **Step 2: Write `/for-ngos`**

```svelte
<script lang="ts">
  import StaticArticle from '$lib/components/StaticArticle.svelte';
</script>

<StaticArticle
  title="For NGOs"
  lede="Post the small stuff that never gets done, and get it done by volunteers in minutes, not weeks."
>
  <h2>Post tasks, not job openings</h2>
  <p>
    Break your backlog into scoped units — a translation, a tagging pass, a data check — instead of recruiting for a role. Volunteers can help without a long onboarding process, and you get discrete, reviewable pieces of work back.
  </p>
  <h2>Verification keeps quality high</h2>
  <p>
    Organizations can be marked verified once reviewed, which surfaces their tasks with added trust signals in the feed. Every submission is reviewed by your team before it's approved, so nothing ships without a human check.
  </p>
  <h2>Getting started</h2>
  <p>
    Create an account and choose the NGO role, complete your organization profile, then post your first task. See <a href="/how-it-works">How It Works</a> for the full lifecycle, or head straight to <a href="/signup">sign up</a>.
  </p>
</StaticArticle>
```

- [ ] **Step 3: Write `/for-volunteers`**

```svelte
<script lang="ts">
  import StaticArticle from '$lib/components/StaticArticle.svelte';
</script>

<StaticArticle
  title="For Volunteers"
  lede="Real impact in the time it takes to finish a coffee break."
>
  <h2>What counts as "micro"</h2>
  <p>
    Most tasks are scoped to 5–60 minutes and show an estimated time up front, so you can pick something that fits the time you actually have right now.
  </p>
  <h2>Claim, learn, submit</h2>
  <p>
    Claim a task you can realistically finish, use the linked learning resources if you need context, then submit your work for the NGO to review. See the full walkthrough in <a href="/how-it-works">How It Works</a>.
  </p>
  <h2>Badges and recognition</h2>
  <p>
    Approved work earns badges and XP that build a visible record of what you've contributed — check the community-wide numbers on the <a href="/impact">Impact</a> page.
  </p>
  <h2>Getting started</h2>
  <p>
    <a href="/signup">Create an account</a>, choose Volunteer, and browse the <a href="/tasks">task feed</a> for something that matches your skills and available time.
  </p>
</StaticArticle>
```

- [ ] **Step 4: Update `StaticArticle.svelte` siblings list**

In `src/lib/components/StaticArticle.svelte`, replace the `siblings` array (lines 8-16):

```typescript
  const siblings = [
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/for-ngos', label: 'For NGOs' },
    { href: '/for-volunteers', label: 'For Volunteers' },
    { href: '/impact', label: 'Impact' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
    { href: '/help', label: 'Help' },
    { href: '/docs', label: 'Docs' },
    { href: '/privacy', label: 'Privacy' },
    { href: '/terms', label: 'Terms' },
    { href: '/cookies', label: 'Cookies' },
  ];
```

- [ ] **Step 5: Manually verify**

Run the dev server and visit `/how-it-works`, `/for-ngos`, `/for-volunteers` — confirm each renders with the shared header/footer, and that the "related pages" nav at the bottom of every `StaticArticle` page (including `/about`, `/help`, etc.) now lists all 11 siblings correctly, excluding the current page.

- [ ] **Step 6: Commit**

```bash
git add src/routes/how-it-works src/routes/for-ngos src/routes/for-volunteers src/lib/components/StaticArticle.svelte
git commit -m "Add How It Works, For NGOs, and For Volunteers pages"
```

---

### Task 4: Flesh out `/about`

**Files:**
- Modify: `src/routes/about/+page.svelte` (currently 18 lines, full file shown in spec)

**Interfaces:**
- Consumes: `StaticArticle.svelte` (unchanged).
- Produces: nothing new consumed elsewhere.

- [ ] **Step 1: Replace the page content**

```svelte
<script lang="ts">
  import StaticArticle from '$lib/components/StaticArticle.svelte';
</script>

<StaticArticle
  title="About MicroMatch"
  lede="MicroMatch connects volunteers with short, high-impact tasks from NGOs and community projects."
>
  <p>
    We built MicroMatch so people can contribute real work in minutes, not hours. Tasks are scoped to fit into a lunch break, paired with learning resources when you need them, and tracked so your impact is visible.
  </p>
  <p>
    NGOs post needs as small units—translation, tagging, light design, data checks—so volunteers can help without a long onboarding. Volunteers earn recognition through badges and a clear record of completed work.
  </p>
  <h2>How the project works</h2>
  <p>
    Every task on MicroMatch moves through the same lifecycle: an NGO posts it, a volunteer claims and completes it, the NGO reviews the submission, and an approved submission earns a badge. See the full walkthrough on <a href="/how-it-works">How It Works</a>, or the community's real numbers on <a href="/impact">Impact</a>.
  </p>
  <p>
    The platform is open to grow with your organization: self-host Appwrite for full control, or use managed hosting when you want less ops overhead.
  </p>
</StaticArticle>
```

- [ ] **Step 2: Manually verify**

Visit `/about` in the dev server and confirm the new "How the project works" section renders and links to `/how-it-works` and `/impact` work.

- [ ] **Step 3: Commit**

```bash
git add src/routes/about/+page.svelte
git commit -m "Expand About page with project lifecycle summary"
```

---

### Task 5: Flesh out `/help` with a real FAQ

**Files:**
- Modify: `src/routes/help/+page.svelte` (currently 20 lines, full file shown in spec)

- [ ] **Step 1: Replace the page content**

```svelte
<script lang="ts">
  import StaticArticle from '$lib/components/StaticArticle.svelte';
</script>

<StaticArticle title="Help Center" lede="Quick answers for volunteers and NGOs using MicroMatch.">
  <h2>Getting started</h2>
  <p><strong>How do I create an account?</strong></p>
  <p>
    Sign up and choose Volunteer or NGO, then complete your profile so we can match tasks and permissions correctly.
  </p>
  <p><strong>What's the difference between a Volunteer and an NGO account?</strong></p>
  <p>
    Volunteers browse and claim tasks; NGOs post tasks and review submissions. See <a href="/for-volunteers">For Volunteers</a> or <a href="/for-ngos">For NGOs</a> for details on each.
  </p>
  <h2>Tasks and claims</h2>
  <p><strong>How do I know which tasks to claim?</strong></p>
  <p>
    Browse the task feed, filter by time and tags, then open a task to read full details. Claim a task only when you can finish within the estimated time.
  </p>
  <p><strong>How do I submit my work?</strong></p>
  <p>
    Submit proof through the flow on the task page so NGOs can review your work. You'll be notified once it's approved or if changes are requested.
  </p>
  <p><strong>What happens after my submission is approved?</strong></p>
  <p>
    You earn a badge for the contribution, and it's added to your visible record. See <a href="/how-it-works">How It Works</a> for the full lifecycle.
  </p>
  <h2>Still stuck?</h2>
  <p>
    More detailed guides live in the <a href="/docs">documentation</a> section. For account problems, use <a href="/contact">Contact</a>.
  </p>
</StaticArticle>
```

- [ ] **Step 2: Manually verify**

Visit `/help` and confirm the FAQ sections render and all links (`/for-volunteers`, `/for-ngos`, `/how-it-works`, `/docs`, `/contact`) resolve.

- [ ] **Step 3: Commit**

```bash
git add src/routes/help/+page.svelte
git commit -m "Expand Help Center into a real FAQ"
```

---

### Task 6: Flesh out `/docs`

**Files:**
- Modify: `src/routes/docs/+page.svelte` (currently 12 lines, full file shown in spec)
- Read (no changes): `src/routes/api/tasks/+server.ts`, `src/routes/api/badges/+server.ts` — confirm which HTTP methods on these are genuinely unauthenticated/public before documenting them as such. Only document endpoints confirmed to require no auth; if `/api/badges` requires auth, list it under a "requires sign-in" note instead of alongside the public `/api/tasks` entry.

- [ ] **Step 1: Check auth requirements of candidate endpoints**

Run: `cd "/Users/yinkavaughan/My Drive (yvaughan@wesleyan.edu)/CS/Projects/SWE/MicroMatch" && grep -n "locals.session\|getSession\|401" src/routes/api/badges/+server.ts src/routes/api/claims/+server.ts src/routes/api/tasks/+server.ts`

Use the output to decide which GET endpoints are truly public before writing Step 2 — do not assume.

- [ ] **Step 2: Replace the page content**

Base this on the actual auth-check findings from Step 1. If `GET /api/badges` turns out to be public (no session check), use this content:

```svelte
<script lang="ts">
  import StaticArticle from '$lib/components/StaticArticle.svelte';
</script>

<StaticArticle title="Documentation" lede="Guides and references for using MicroMatch and integrating with the public API.">
  <h2>Public API</h2>
  <p>
    <a href="/docs/api">GET /api/tasks</a> — read-only JSON endpoint for task listings. No authentication required.
  </p>
  <p>
    Other API routes under <code style="background: var(--color-surface-variant); padding: 2px 6px; border-radius: var(--radius-xs);">/api/</code> (claims, profile, teams, verifications) require an authenticated session and are documented for internal use only.
  </p>
  <h2>Guides</h2>
  <p>
    New to the platform? Start with <a href="/how-it-works">How It Works</a>, then <a href="/for-ngos">For NGOs</a> or <a href="/for-volunteers">For Volunteers</a> depending on your role.
  </p>
  <p>
    Additional markdown guides ship in the repository under the <code style="background: var(--color-surface-variant); padding: 2px 6px; border-radius: var(--radius-xs);">docs/</code> folder.
  </p>
</StaticArticle>
```

If Step 1 finds additional public read-only endpoints, add one `<p>` per endpoint following the same `<a href="/docs/api">METHOD /path</a> — description` format, and add a corresponding page under `/docs/api` if one doesn't already document it (check `src/routes/docs/api/+page.svelte` first — extending it is out of scope for this task unless a public endpoint is completely undocumented).

- [ ] **Step 3: Manually verify**

Visit `/docs` and confirm the endpoint list matches the actual auth behavior found in Step 1 — no endpoint should be listed as public if it 401s without a session.

- [ ] **Step 4: Commit**

```bash
git add src/routes/docs/+page.svelte
git commit -m "Expand Docs index with accurate public/authenticated endpoint list"
```

---

### Task 7: Fix homepage nav (header, mobile menu, footer)

**Files:**
- Modify: `src/routes/+page.svelte:133-137` (`.header-nav`)
- Modify: `src/routes/+page.svelte:184-186` (mobile menu links)
- Modify: `src/routes/+page.svelte:409-423` (footer `.link-col` group)

**Interfaces:**
- Consumes: routes `/how-it-works`, `/for-ngos`, `/for-volunteers`, `/impact` (all created in Tasks 2-3).

- [ ] **Step 1: Replace header nav anchors**

In `src/routes/+page.svelte`, replace:

```svelte
      <nav class="header-nav">
        <a href="#how-it-works">How it Works</a>
        <a href="#tasks">Browse Tasks</a>
        <a href="#impact">Impact</a>
      </nav>
```

with:

```svelte
      <nav class="header-nav">
        <a href="/how-it-works">How it Works</a>
        <a href="/tasks">Browse Tasks</a>
        <a href="/for-ngos">For NGOs</a>
        <a href="/for-volunteers">For Volunteers</a>
      </nav>
```

- [ ] **Step 2: Replace mobile menu anchors**

Replace:

```svelte
      <a href="#how-it-works" bind:this={firstMenuLinkEl} on:click={closeMenu}>How it Works</a>
      <a href="#tasks" on:click={closeMenu}>Browse Tasks</a>
      <a href="#impact" on:click={closeMenu}>Impact</a>
```

with:

```svelte
      <a href="/how-it-works" bind:this={firstMenuLinkEl} on:click={closeMenu}>How it Works</a>
      <a href="/tasks" on:click={closeMenu}>Browse Tasks</a>
      <a href="/for-ngos" on:click={closeMenu}>For NGOs</a>
      <a href="/for-volunteers" on:click={closeMenu}>For Volunteers</a>
```

- [ ] **Step 3: Add new links to the footer**

In the footer's `.link-col` group (the "Resources" column), add the four new pages before the existing entries:

```svelte
          <div class="link-col">
            <h4>Resources</h4>
            <a href="/how-it-works">How It Works</a>
            <a href="/for-ngos">For NGOs</a>
            <a href="/for-volunteers">For Volunteers</a>
            <a href="/impact">Impact</a>
            <a href="/docs/api">API Docs</a>
            <a href="/about">About Us</a>
            <a href="/help">Help Center</a>
          </div>
```

- [ ] **Step 4: Manually verify**

Run the dev server, load `/`, and click through every header-nav link (desktop width) and every mobile-menu link (narrow viewport) confirming each navigates to a real page rather than scrolling. Confirm the footer's new links resolve too.

- [ ] **Step 5: Run the existing landing e2e spec to confirm no regression**

Run: `cd "/Users/yinkavaughan/My Drive (yvaughan@wesleyan.edu)/CS/Projects/SWE/MicroMatch" && npx playwright test e2e/demo/01-landing-tour.spec.ts`
Expected: PASS — this spec scrolls to on-page headings (`How It Works`, `Featured Tasks`, `Track Your Impact`) which still exist in the homepage body; it does not assert on the nav `href`s that changed, so it should be unaffected.

- [ ] **Step 6: Commit**

```bash
git add src/routes/+page.svelte
git commit -m "Point homepage nav and footer at real pages instead of anchors"
```

---

## Post-plan check

After all 7 tasks: click through the full public site (`/`, `/how-it-works`, `/for-ngos`, `/for-volunteers`, `/impact`, `/about`, `/help`, `/docs`, `/docs/api`, `/contact`, `/privacy`, `/terms`, `/cookies`) confirming the `StaticArticle` "related pages" footer nav is present and correct on every non-homepage page, and that no page under `StaticArticle` 404s.
