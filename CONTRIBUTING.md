# Contributing to MicroMatch

Thanks for taking the time to contribute. This doc covers how to get the
project running locally, how the codebase is organized, and what we expect
from a pull request.

## Prerequisites

- **[Bun](https://bun.sh)** ≥ 1.3 — package manager + dev server runner
- **[Appwrite](https://appwrite.io)** project — needed for tasks, claims, badges,

  verifications, auth, and avatar/doc storage. A free Appwrite Cloud project
  is enough for local development.

- **[Plunk](https://useplunk.com)** account — only needed if you're working

  on the verification approval/rejection flow. Without an API key the email
  pipeline silently no-ops in development; everything else still works.

- **[LibreTranslate](https://libretranslate.com/)** instance (optional) for

  the auto-translate feature. Set `LIBRETRANSLATE_ENDPOINT` and
  `LIBRETRANSLATE_API_KEY` in `.env`. Without these values, translation returns
  the original text.

- **macOS / Linux / WSL** — the dev path is tested on macOS; Windows-native

  may work but isn't tested.

## Local setup

```sh
git clone https://github.com/Builder106/micro-match.git
cd MicroMatch
bun install
cp .env.example .env

# Fill in the Appwrite + Plunk + LibreTranslate values (see .env.example)

bun run dev
```

The dev server listens on `http://localhost:5173`.

For deployed environments, `main` uses Production variables and
`micromatch-prod`; the `staging` branch uses the Vercel Preview scope and the
same Appwrite project. Preview uses separate QA tables and teams. Each scope
requires an Appwrite endpoint, project ID, API key, database, table, bucket,
and team IDs, plus public Appwrite settings
and `PUBLIC_APP_URL`. Transactional email requires server-only
`PLUNK_SECRET_KEY` and `PLUNK_FROM_ADDRESS`; `PLUNK_API_URL` and
`PLUNK_FROM_NAME` are optional. LibreTranslate uses
`LIBRETRANSLATE_ENDPOINT` and `LIBRETRANSLATE_API_KEY`. These are repository
requirements; this guide does not change provider or deployment dashboards.

## Appwrite resources

The app expects these resources in your Appwrite project (most can be created
through the Console):

| Resource             | Env var                                                           | Notes                                                     |
| -------------------- | ----------------------------------------------------------------- | --------------------------------------------------------- |
| Database             | `APPWRITE_DB_ID`                                                  | One database, the rest are tables inside it               |
| `tasks` table        | `APPWRITE_TASKS_TABLE_ID`                                         |                                                           |
| `claims` table       | `APPWRITE_CLAIMS_TABLE_ID`                                        |                                                           |
| `badges` table       | `APPWRITE_BADGES_TABLE_ID`                                        | Awarded-badge instances                                   |
| `badgeDefinitions`   | `APPWRITE_BADGE_DEFS_TABLE_ID`                                    | Org-owned templates                                       |
| `ngoVerifications`   | `APPWRITE_VERIFICATIONS_TABLE_ID`                                 | NGO verification queue                                    |
| Avatars bucket       | `APPWRITE_AVATARS_BUCKET_ID`, `PUBLIC_APPWRITE_AVATARS_BUCKET_ID` | File previews use the public variable in client code      |
| Verification uploads | `APPWRITE_VERIFICATIONS_BUCKET_ID`                                | Set to `avatars`; file permissions keep documents private |
| `volunteers` team    | `APPWRITE_VOLUNTEER_TEAM_ID`                                      | Created on first profile save                             |
| `ngos` team          | `APPWRITE_NGO_TEAM_ID`                                            | Same                                                      |
| `admins` team        | `APPWRITE_ADMIN_TEAM_ID`                                          | Manually add yourself to access `/admin/verifications`    |

The schema for `ngoVerifications`and`badgeDefinitions` is documented in the
relevant server modules ([src/lib/server/verifications.ts](src/lib/server/verifications.ts),
[src/lib/server/badgeDefs.ts](src/lib/server/badgeDefs.ts)).

## Common tasks

```sh
bun run dev             # dev server with HMR
bun run check           # svelte-check + tsc
bun run test            # vitest (server modules, API, page loaders)
bun run test:watch      # vitest watch mode
bun run test:functional # Playwright: the real flows
bun run test:responsiveness # Playwright: overflow at 320 to 1440 px
bun run test:visual     # Playwright: visual baselines (add --update-snapshots after a deliberate change)
bun run test:coverage   # v8 coverage → coverage/index.html
bun run lint            # eslint
bun run format          # prettier write
bun run build           # production build
bun run seed            # (re)seed the demo NGO + tasks
bun run verify:libretranslate # live LibreTranslate health and auth check
```

CI runs check, lint, unit tests with coverage, the build and the three browser suites; the required gate needs all of them.

## Seeding

`bun run seed` creates the demo NGO and its tasks, and is safe to rerun.
`filterTasksForFeed()` auto-archives any task whose `lastActivityAt` is more
than 30 days old, so demo tasks drop out of the feed about a month after the
last seed. (See `JOURNAL.md`, 2026-07-16.)

Set `SEED_DEMO_PASSWORD` in `.env` to give the demo NGO and volunteer a
password so they can sign in. Don't hardcode it: these accounts live on the
same Appwrite project as the deployed site, and the NGO account can approve
claims and mint badges.

## Project layout

```text
src/
├── app.html                      # document shell; sets html.js and html.motion before paint
├── app.d.ts                      # SvelteKit ambient types
├── hooks.server.ts               # locale routing, session cookie → locals.userRole
├── hooks.ts                      # locale reroute
├── lib/
│   ├── server/                   # server-only modules
│   │   ├── appwrite.ts           # tasks, claims, badges DB + tasks-isVerified backfill
│   │   ├── auth.ts               # role detection from JWT / cookies
│   │   ├── badgeAwarder.ts       # claim approval → badge award pipeline
│   │   ├── badgeCriteria.ts      # DB-backed BadgeDefinition matcher
│   │   ├── badgeDefs.ts          # org-owned badge template CRUD
│   │   ├── email.ts              # Plunk transactional email transport
│   │   ├── propublica.ts         # US 501(c)(3) lookup by EIN
│   │   ├── teams.ts              # ngo / volunteer / admin team helpers
│   │   └── verifications.ts      # ngoVerifications CRUD + prefs sync
│   ├── components/               # Svelte components
│   │   ├── world/                # the quilt the site is made of: blocks, panel, corner tags
│   │   └── art/                  # Glaxnimate artwork (needle, pin, scissors, swatch)
│   ├── quilt/                    # quilt logic: log cabin layout, block patterns, fabrics, icons, map
│   ├── i18n/                     # locale-aware formatters
│   ├── locale.ts                 # supported locales and localized paths
│   ├── types.ts                  # shared TS types (Task, Claim, Badge, …)
│   ├── site.ts, feed.ts, …       # small pure helpers with unit tests
│   └── utils/tagColors.ts        # tag→{bg,color} palette
├── engine/                       # camera, panel unfold/fold, panel scroll, idle input (GSAP)
├── styles/                       # tokens.css, base.css, world.css (global on purpose)
├── routes/                       # page loaders (+page.server.ts) and API endpoints
│   ├── +layout.svelte            # the quilt, the panel and the navigation lifecycle
│   └── api/                      # endpoint handlers
└── tests/
    ├── api/                      # endpoint tests
    ├── pages/                    # page loader tests
    └── setup.ts                  # localStorage shim
```

Unit tests run in vitest's node environment (`vite.config.ts`). Browser
suites live in `e2e/` and run through `playwright.config.ts`. Design
decisions, the structure plan and the art direction are in `DESIGN.md`;
Glaxnimate source art is in `design/glaxnimate/`.

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
- **The quilt is the interface.** A new public page is a block on the quilt:
  add it to `BLOCKS` in `src/lib/quilt/world.ts` and route it there. Use the
  shared classes in `src/styles/base.css` (`patch-btn`, `stitch-link`, `part`,
  `field`, `input`) and the tokens in `tokens.css`. Read `DESIGN.md` first.
- **Internal links go through `Link.svelte`** (or `go()` in scripts) so the
  locale prefix is kept.
- **Never invent content.** No made-up people, quotes, counts or partners; the
  quilt shows real approved claims only.

## Pull requests

1. **Branch** off `main`. Keep branches focused on one logical change.
2. **Tests.** New behavior gets new tests. Bug fixes ideally come with a

   failing test that the fix turns green.

3. **Local checks.** `bun run check && bun run test` before pushing. CI will

   re-run, but it's faster to catch failures locally.

4. **Description.** Open the PR with a one-line *what*and a brief*why*.

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
