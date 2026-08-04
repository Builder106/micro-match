# Contributing to MicroMatch

Thanks for taking the time to contribute. This doc covers how to get the
project running locally, how the codebase is organized, and what we expect
from a pull request.

## Prerequisites

- **[Bun](https://bun.sh)** ≥ 1.3 — package manager + dev server runner
- **[Appwrite](https://appwrite.io)** project — needed for tasks, claims, badges,
  verifications, auth, and avatar/doc storage. A free Appwrite Cloud project
  is enough for local development.
- **[Mailgun](https://www.mailgun.com)** account — only needed if you're working
  on the verification approval/rejection flow. Without an API key the email
  pipeline silently no-ops in development; everything else still works.
- **macOS / Linux / WSL** — the dev path is tested on macOS; Windows-native
  may work but isn't tested.

## Local setup

```sh
git clone https://github.com/Builder106/micro-match.git
cd MicroMatch
bun install
cp .env.example .env
# Fill in the Appwrite + Mailgun keys (see the comments in .env.example)
bun run dev
```

The dev server listens on `http://localhost:5173`.

### Appwrite resources

The app expects these resources in your Appwrite project (most can be created
through the Console):

| Resource           | Env var                                                             | Notes                                                  |
| ------------------ | ------------------------------------------------------------------- | ------------------------------------------------------ |
| Database           | `APPWRITE_DB_ID`                                                    | One database, the rest are tables inside it            |
| `tasks` table      | `APPWRITE_TASKS_TABLE_ID`                                           |                                                        |
| `claims` table     | `APPWRITE_CLAIMS_TABLE_ID`                                          |                                                        |
| `badges` table     | `APPWRITE_BADGES_TABLE_ID`                                          | Awarded-badge instances                                |
| `badgeDefinitions` | `APPWRITE_BADGE_DEFS_TABLE_ID`                                      | Org-owned templates                                    |
| `ngoVerifications` | `APPWRITE_VERIFICATIONS_TABLE_ID`                                   | NGO verification queue                                 |
| Storage bucket     | `APPWRITE_AVATARS_BUCKET_ID` and `APPWRITE_VERIFICATIONS_BUCKET_ID` | Can be the same bucket if `fileSecurity` is enabled    |
| `volunteers` team  | `APPWRITE_VOLUNTEER_TEAM_ID`                                        | Created on first profile save                          |
| `ngos` team        | `APPWRITE_NGO_TEAM_ID`                                              | Same                                                   |
| `admins` team      | `APPWRITE_ADMIN_TEAM_ID`                                            | Manually add yourself to access `/admin/verifications` |

The schema for `ngoVerifications` and `badgeDefinitions` is documented in the
relevant server modules ([src/lib/server/verifications.ts](src/lib/server/verifications.ts),
[src/lib/server/badgeDefs.ts](src/lib/server/badgeDefs.ts)).

## Common tasks

```sh
bun run dev             # dev server with HMR
bun run check           # svelte-check + tsc
bun run test            # vitest (unit + API + component)
bun run test:watch      # vitest watch mode
bun run test:coverage   # v8 coverage → coverage/index.html
bun run test:e2e        # Playwright (run `bunx playwright install` once first)
bun run test:e2e:ui     # Playwright UI mode
bun run lint            # eslint
bun run format          # prettier write
bun run build           # production build
bun run seed            # (re)seed the demo NGO + tasks
bun run demo            # seed, record the demo suite, convert to GIFs
```

CI should at minimum run `bun run check` and `bun run test`.

## Recording the demos

The GIFs in the README come from `e2e/demo/` — a separate Playwright suite from
the QA one in `e2e/smoke.spec.ts`. It shares the step helpers but has its own
config (`playwright.demo.config.ts`), runs single-worker with `slowMo`, and is
never part of CI. Only touch it when you're regenerating the README recordings.

```sh
bun run demo
```

That reseeds, records, and converts in one go. A few things worth knowing before
you run it:

**Reseeding is mandatory, not hygiene.** `bun run demo` calls `bun run seed`
first on purpose. Two separate things break without it:

- `filterTasksForFeed()` auto-archives any task with a `lastActivityAt` more
  than 30 days stale. Demo tasks never get organic activity, so the feed quietly
  empties out about a month after the last seed with no error anywhere. (See
  `JOURNAL.md`, 2026-07-16.)
- `04-closed-loop` needs the demo volunteer to hold *zero* badges. The awarder
  skips any label the volunteer already has, so on a second run the approval
  mints nothing and the payoff shot is empty — while every assertion still
  passes. The seed clears the volunteer's claims and badges each run.

**The loop demo needs sign-in-able accounts.** Set `SEED_DEMO_PASSWORD` in
`.env` to a strong random value; the seed then gives the demo NGO and volunteer
a password, and `04` / `06` can sign in through the real login form. Leave it
unset and the seed skips those fixtures — the other scenarios still record fine,
but the two authenticated ones will fail with a clear message.

Don't hardcode that password. These accounts live on the same Appwrite project
as the deployed site, and the NGO one can approve claims and mint badges.

**Why the NGO account is the seeded one.** `/api/claims/[id]/approve` rejects a
reviewer who doesn't own the task, so the approving account has to be the org
that owns the seeded tasks. A separate reviewer account can't stand in.

**Writing a new scenario.** Plain Playwright `.spec.ts`, not Gherkin — that's
deliberate. Number the file so it sorts into narrative order (specs run
alphabetically, single worker). Then:

- `slowMo` only pauses *between actions*. It doesn't cover `page.goto()`, and
  assertions resolve the instant the element exists. Call `dwellForDemo(page)`
  at every "thing just appeared" beat or it flashes past unreadably.
- Use `slowFill()` instead of `.fill()` so typing animates.
- Call `waitForAuthHydration()` before clicking anything on `/login` or
  `/signup`. Those handlers are Svelte `on:` bindings — click before hydration
  and the login form does a native GET that puts the password in the URL.
- Prefer `toBeInViewport()` over `toBeVisible()` for a payoff shot.
  `scrollIntoViewIfNeeded()` scrolls the *minimum* distance, so anchoring on a
  section heading happily parks the thing you're showing off just below the fold
  with the assertion still green.
- Don't pass `--reporter` on the command line. It replaces the config's reporter
  array, and the custom one in `e2e/demo/reporter.ts` is what converts the webm
  to mp4 — override it and the recording silently never appears.

## Project layout

```text
src/
├── app.css                       # global brand classes, scrollbar, dark-mode tokens
├── app.d.ts                      # SvelteKit ambient types
├── hooks.server.ts               # session cookie → locals.userRole
├── lib/
│   ├── components/               # shared Svelte components (TaskCard, VerificationCard, …)
│   ├── server/                   # server-only modules
│   │   ├── appwrite.ts           # tasks, claims, badges DB + tasks-isVerified backfill
│   │   ├── auth.ts               # role detection from JWT / cookies
│   │   ├── badgeAwarder.ts       # claim approval → badge award pipeline
│   │   ├── badgeCriteria.ts      # DB-backed BadgeDefinition matcher
│   │   ├── badgeDefs.ts          # org-owned badge template CRUD
│   │   ├── email.ts              # Mailgun transport (HTTP, no SDK)
│   │   ├── propublica.ts         # US 501(c)(3) lookup by EIN
│   │   ├── teams.ts              # ngo / volunteer / admin team helpers
│   │   └── verifications.ts      # ngoVerifications CRUD + prefs sync
│   ├── types.ts                  # shared TS types (Task, Claim, Badge, …)
│   └── utils/tagColors.ts        # tag→{bg,color} palette
├── routes/                       # SvelteKit pages + API endpoints
│   ├── +layout.svelte            # app shell, font load, account.get gate
│   ├── admin/verifications/      # admin queue page (gated by admins team)
│   ├── api/                      # endpoint handlers
│   ├── badges/{manage,analytics}/
│   ├── dashboard/                # routes to NGODashboard or VolunteerDashboard
│   ├── org/                      # NGO post-a-task form
│   ├── profile/                  # user profile + role picker + verification card
│   ├── task/[id]/                # task detail + claim submission
│   └── tasks/                    # public feed
├── tests/
│   ├── api/                      # endpoint tests (vitest, node)
│   ├── components/               # component tests (vitest, jsdom)
│   └── setup.ts                  # cleanup hooks
├── e2e/                          # Playwright specs
└── static/                       # logo, favicon, lottie animations
```

The split between `src/tests/api/` (vitest, node env) and `src/tests/components/`
(vitest, jsdom env, browser-condition Svelte resolution) is configured in
`vite.config.ts` via vitest's `projects` array.

## Style + conventions

- **Conventional Commits.** Commit messages use `feat(scope):`, `fix(scope):`,
  `chore(scope):`, `test(scope):`, etc. The git log is the authoritative
  source of style — `git log --oneline -20` to see recent examples.
- **No co-authored-by trailers.** Commit messages attribute authorship to the
  contributor only.
- **Type strictness.** `bun run check` must pass before opening a PR. We don't
  use `any` casually — when we do, it's accompanied by a comment explaining
  why.
- **TODOs.** Prefer fixing the thing now over leaving a TODO. When a TODO is
  unavoidable, link to a tracking issue.
- **No emojis in code, comments, or commits.** README and docs are fine.
- **Brand-forward editorial visual language.** Inner pages use the `brand-card`,
  `btn-coral`, `btn-outline-dark`, `coral-gradient`, `tag` classes from
  `src/app.css` and the Plus Jakarta Sans display face. New pages should match.

## Pull requests

1. **Branch** off `main`. Keep branches focused on one logical change.
2. **Tests.** New behavior gets new tests. Bug fixes ideally come with a
   failing test that the fix turns green.
3. **Local checks.** `bun run check && bun run test` before pushing. CI will
   re-run, but it's faster to catch failures locally.
4. **Description.** Open the PR with a one-line *what* and a brief *why*.
   Screenshots for UI changes; reproduction steps for bug fixes.
5. **Scope.** Avoid drive-by reformats in feature PRs — they make the diff
   harder to review. Send formatting / refactor changes as separate PRs.
6. **Reviews.** At least one approval before merge. Squash on merge to keep
   the history readable.

## Reporting bugs

Open a [GitHub issue](https://github.com/Builder106/micro-match/issues) with:

- A summary of what you expected and what happened
- Steps to reproduce (ideally a minimal scenario)
- Browser + OS if it's a UI issue
- Relevant console / network output

Security-sensitive issues should be reported privately — email the maintainer
listed in `package.json` rather than opening a public issue.

## License

By contributing, you agree that your contributions will be licensed under
the project's [MIT License](LICENSE).
