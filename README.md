<div align="center">

<h1>MicroMatch</h1>

<br />

[![License: MIT](https://img.shields.io/badge/License-MIT-FF6B6B.svg)](https://opensource.org/licenses/MIT)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?logo=svelte&logoColor=white)](https://kit.svelte.dev/)
[![Appwrite](https://img.shields.io/badge/Appwrite-F02E65?logo=appwrite&logoColor=white)](https://appwrite.io/)
[![Bun](https://img.shields.io/badge/Bun-FBF0DF?logo=bun&logoColor=black)](https://bun.sh/)

</div>

<br />

> **A micro-volunteering platform connecting nonprofits with skilled volunteers.** Complete quick 5 to 30-minute missions, help verified charities, and earn skill badges.

## 💡 What is MicroMatch?

Nonprofits and community organizations often need quick help with specific tasks (translating a document, designing a flyer, reviewing data, or writing copy), but recruiting full-time volunteers is slow and difficult. MicroMatch breaks volunteering down into bite-sized missions that busy people can complete in under 30 minutes.

Volunteers pick tasks that match their skills, submit their work, and earn verified digital badges for their portfolio. Nonprofits get tasks completed quickly by motivated contributors without endless administrative overhead.

## ✨ Key Features

- **Bite-sized task feed**: Filter by time (`≤15 / ≤20 / ≤30 min`), cause hashtags, or shortest duration first.
- **Volunteer portal**: Claim tasks, submit proof of work via file or link, track review status, and collect skill badges.
- **Nonprofit dashboard**: Post tasks with deadlines and volunteer caps, review submissions, and manage organization badge awards.
- **Charity verification**: Simple trust verification where nonprofits submit their tax or charity ID, verified against public registries with a verified badge displayed on their tasks.
- **Custom badge awards**: Organizations define custom award badges (label, color, icon, criteria) automatically awarded upon task approval.
- **Worldwide localization**: Paraglide provides type-safe, reviewed UI catalogs and locale-prefixed routes; self-hosted LibreTranslate handles user-created task content on the server.
- **Email updates**: Automated email notifications keep volunteers and organizations informed of approvals and submissions.

## 🔄 How it works

The core loop, end-to-end:

```mermaid
sequenceDiagram
  autonumber
  actor V as Volunteer
  actor N as NGO
  participant App as MicroMatch
  participant DB as Appwrite
  participant Mail as Plunk

  N->>App: Post task
  App->>DB: tasks.create (isVerified ← NGO's verification status)

  V->>App: Browse feed, claim task
  App->>DB: claims.create (status=pending)

  V->>App: Submit proof (URL or file)
  App->>DB: claims.update (proofUrl, notes)

  N->>App: Approve claim
  App->>DB: claims.update (status=approved)
  App->>DB: badges.create (matching BadgeDefinitions for org)
  App-->>V: Dashboard updates, badge appears in vault

  Note over N,Mail: Verification flow (parallel)
  N->>App: Submit verification (tax ID + doc)
  App->>DB: ngoVerifications.create (status=pending)
  Note over App: Admin reviews queue with ProPublica enrichment
  App->>DB: status=approved, back-fill tasks.isVerified
  App->>Mail: Send "you're verified" email
  Mail-->>N: 📧
```

## 🚀 Tech stack

| | |
| --- | --- |
| **Framework** | [SvelteKit](https://kit.svelte.dev/) on [Vercel](https://vercel.com/) (`adapter-vercel`, `nodejs22.x` runtime) |
| **Runtime + package manager** | [Bun](https://bun.sh/) |
| **Backend** | [Appwrite Cloud](https://appwrite.io/) — Database (TablesDB), Auth, Storage, Teams |
| **Email** | [Plunk](https://useplunk.com/) as the transactional email provider (server-side HTTP API migration) |
| **NGO verification** | [ProPublica Nonprofit Explorer API](https://projects.propublica.org/nonprofits/api/) for US 501(c)(3) lookups |
| **Translation** | Self-hosted [LibreTranslate](https://libretranslate.com/) on an ARM64 Oracle VM behind `translate.micromatch.app` |
| **Static UI localization** | [Paraglide JS](https://paraglidejs.com/sveltekit) with committed catalogs for English, Spanish, French, German, Portuguese, Chinese, and Arabic |
| **UI** | Being redesigned from scratch on this branch |
| **Testing** | [Vitest](https://vitest.dev/) (server modules, API endpoints, page loaders) |

## 🏁 Getting started

Quick path:

```sh
git clone https://github.com/Builder106/micro-match.git
cd MicroMatch
bun install
cp .env.example .env

# Fill in Appwrite + Plunk + ProPublica + LibreTranslate values

bun run dev
```

The app runs at [http://localhost:5173](http://localhost:5173). Full setup (Appwrite resources, environment variables, project layout, conventions) lives in [CONTRIBUTING.md](CONTRIBUTING.md).

## Common scripts

```sh
bun run dev             # dev server with HMR
bun run build           # production build (uses adapter-vercel)
bun run check           # svelte-check + tsc
bun run test            # vitest
bun run seed            # (re)seed the demo NGO + tasks
bun run verify:libretranslate # live health and API-key smoke check
```

## 🧪 Testing

- **Server modules** (vitest, node): helpers and DB access, with fetch and Appwrite mocked at the module boundary.
- **API endpoints** (vitest, node): auth gates, validation, and multi-step side effects.
- **Page loaders** (vitest, node): the data each route's `+page.server.ts` returns.

`bun run test:coverage` enforces 100% coverage and writes an HTML report to `coverage/`. Browser tests return with the new frontend.

## 📦 Data model & Provisioning

Stored in Appwrite TablesDB (see [docs/appwrite-schema.md](docs/appwrite-schema.md) for full schema details):

| Table | Holds |
| --- | --- |
| `tasks` | Mission cards posted by NGOs (title, tags, time estimate, deadline, status, isVerified) |
| `claims` | Volunteer submissions for tasks (proofUrl, notes, status: pending / approved / rejected) |
| `badges` | Awarded badge instances (userId, taskId, label, color) |
| `badgeDefinitions` | Org-owned badge templates (orgId, label, criteria, taskId for task-specific) |
| `ngoVerifications` | Verification queue (orgName, country, taxId, docFileId, status, reason) |

Plus three Appwrite Teams (`volunteers`, `ngos`, `admins`) for role + moderation gating. Storage uses separate `avatars` and `verifications` buckets with file-level permissions. To automatically provision the database tables, attributes, and storage buckets:

```sh
bun scripts/setup-appwrite.ts
```

## 📝 Documentation

- [CONTRIBUTING.md](CONTRIBUTING.md) — local setup, project layout, conventions, PR process
- [docs/index.md](docs/index.md) — platform docs index
- [docs/volunteer.md](docs/volunteer.md) — volunteer guide
- [docs/ngo.md](docs/ngo.md) — NGO guide
- [docs/api.md](docs/api.md) — full API specification (public & authenticated endpoints)
- [docs/appwrite-schema.md](docs/appwrite-schema.md) — database schema and Appwrite resources specification
- [docs/faq.md](docs/faq.md) — FAQ

## 📜 License

MIT — see [LICENSE](LICENSE).
