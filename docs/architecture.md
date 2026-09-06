# MicroMatch — Architecture & Systems Specification

This document details the software architecture, data flow, security model, and scaling roadmap for MicroMatch.

---

## 1. System Overview

MicroMatch is built as a SvelteKit full-stack application backed by Appwrite for authentication, database storage, file storage, and role-based access control.

```txt
┌────────────────────────────────────────────────────────────────────────┐
│                        SvelteKit Frontend (SSR/CSR)                    │
│   Task Feed  │  Task Details  │  Claim Form  │  NGO Portal  │  Admin Queue │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                        ┌───────────┴───────────┐
                        ▼                       ▼
            ┌──────────────────────┐  ┌──────────────────┐
            │ Appwrite BaaS        │  │ External Services│
            │  - Auth & Sessions   │  │  - ProPublica API│
            │  - TablesDB          │  │  - Azure Safety  │
            │  - Storage Buckets   │  │  - LibreTranslate│
            │  - Teams (RBAC)      │  │  - Plunk Email   │
                                    │  - Hail SMS/Voice │
            └──────────────────────┘  └──────────────────┘
```

---

### Environment Topology & Staging Isolation

MicroMatch operates a two-tier environment topology separating production traffic from release candidate testing:

| Environment | Branch | Appwrite Project ID | Frontend Deployment | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Production** | `main` | `micromatch-prod` | `micromatch.app` | Live production service |
| **Staging** | `staging` | `micromatch-staging` | Vercel Preview (`staging` branch alias) | Dedicated QA, schema validation, and seed testing |

- **Data Isolation**: Production and staging maintain isolated Appwrite projects. Staging uses `micromatch-staging` in SFO (`https://sfo.cloud.appwrite.io/v1`), keeping dummy volunteer proofs, test NGO accounts, and automated seeding fixtures separated from real user records.
- **Automated Deployment**: Pushes to `staging` run full CI checks and trigger Vercel deployment via `VERCEL_DEPLOY_HOOK_STAGING`.
- **Environment Scoping**: Vercel injects staging environment variables for preview deployments triggered by the `staging` branch (see [`.env.staging.example`](file:///Users/yinkavaughan/My%20Drive%20%28yvaughan@wesleyan.edu%29/CS/projects/swe/micro-match/.env.staging.example)).
- **Configuration Contract**: Both scopes require matching Appwrite resource IDs, public Appwrite settings, and `PUBLIC_APP_URL`. Plunk requires server-only `PLUNK_SECRET_KEY` and `PLUNK_FROM_ADDRESS`; `PLUNK_API_URL` and `PLUNK_FROM_NAME` are optional. LibreTranslate requires its endpoint and API key. These requirements do not imply that deployment dashboards have been configured.

---

## 2. Server Architecture & Modules

The backend logic resides in `$lib/server/` with isolated domain modules:

- **[`appwrite.ts`](file:///Users/yinkavaughan/My%20Drive%20%28yvaughan@wesleyan.edu%29/CS/projects/swe/micro-match/src/lib/server/appwrite.ts)**: Appwrite server client initialization, database helpers, and session context handling.
- **[`verifications.ts`](file:///Users/yinkavaughan/My%20Drive%20%28yvaughan@wesleyan.edu%29/CS/projects/swe/micro-match/src/lib/server/verifications.ts)**: Verification CRUD, status transitions, backfilling `isVerified` on tasks, and in-memory fallback for local dev.
- **[`propublica.ts`](file:///Users/yinkavaughan/My%20Drive%20%28yvaughan@wesleyan.edu%29/CS/projects/swe/micro-match/src/lib/server/propublica.ts)**: Lookup helper for ProPublica Nonprofit Explorer (US 501(c)(3) EIN validation).
- **[`badgeAwarder.ts`](file:///Users/yinkavaughan/My%20Drive%20%28yvaughan@wesleyan.edu%29/CS/projects/swe/micro-match/src/lib/server/badgeAwarder.ts)**: Event-driven badge evaluator that mints badges on claim approval.
- **[`contentsafety.ts`](file:///Users/yinkavaughan/My%20Drive%20%28yvaughan@wesleyan.edu%29/CS/projects/swe/micro-match/src/lib/server/contentsafety.ts)**: Azure AI Content Safety moderation scanner.
- **[`email.ts`](file:///Users/yinkavaughan/My%20Drive%20%28yvaughan@wesleyan.edu%29/CS/projects/swe/micro-match/src/lib/server/email.ts)**: Server-only transactional email module being migrated to Plunk for verification notices. Appwrite-managed password recovery remains separate.
- **[`libretranslate.ts`](file:///Users/yinkavaughan/My%20Drive%20%28yvaughan@wesleyan.edu%29/CS/projects/swe/micro-match/src/lib/server/libretranslate.ts)**: Server-only LibreTranslate client with a bounded in-memory cache, timeout, API-key authentication, and graceful fallback. The service runs on the Oracle ARM VM behind the named `translate.micromatch.app` Cloudflare Tunnel.

---

### Worldwide i18n boundary

MicroMatch uses two translation systems by design:

- **Paraglide JS** is the preferred system for static product UI. It compiles reviewed message catalogs, supplies typed message functions, handles locale-prefixed URLs, and sets document language and text direction. Supported locales are `en`, `es`, `fr`, `de`, `pt`, `zh`, and `ar`.
- **LibreTranslate** is the preferred system for user-created task content. It runs server-side, keeps its API key out of client bundles, translates task display fields in bounded batches, and falls back to source text when the provider is unavailable.

The locale prefix controls both UI messages and the task-content translation target. For example, `/fr/tasks` renders the French interface and requests French task fields. The locale cookie persists the choice, while `Accept-Language` is used only for the first redirect from an unlocalized request.

## 3. Data Model & Storage

MicroMatch uses Appwrite TablesDB (`APPWRITE_DB_ID`):

| Collection / Table | Primary Fields | Description |
| :--- | :--- | :--- |
| `tasks` | `$id`, `orgID`, `title`, `description`, `tags`, `estimatedMinutes`, `isVerified`, `language` | Micro-volunteering task listings. |
| `claims` | `$id`, `taskID`, `userID`, `proofUrl`, `notes`, `status` (`pending`, `approved`, `rejected`) | Volunteer proof-of-work submissions. |
| `ngoVerifications` | `$id`, `userID`, `orgName`, `country`, `taxId`, `docFileId`, `status`, `reason` | Verification application queue. |
| `badgeDefinitions` | `$id`, `orgID`, `label`, `icon`, `color`, `criteria` | NGO-scoped & global milestone badge definitions. |
| `userBadges` | `$id`, `userID`, `badgeDefinitionId`, `awardedAt` | Awarded badge records. |

---

## 4. NGO Verification & Role Teardown Lifecycle

```txt
[NGO User] ──> Submit EIN / Doc ──> [ngoVerifications (pending)]
                                                │
                                       Admin Review Queue
                                     (US: ProPublica Lookup)
                                                │
                       ┌────────────────────────┴────────────────────────┐
                       ▼                                                 ▼
             [Admin Approves]                                    [Admin Rejects]

  - Status: approved                                   - Status: rejected
  - User Prefs: verificationStatus='approved'          - User Prefs: verificationStatus='rejected'
  - Backfill: isVerified=true on tasks                 - Backfill: isVerified=false on tasks
  - Email: Plunk approval notice                        - Email: Plunk rejection reason

```

### Role Mobility Teardown

When an NGO downgrades to a Volunteer role (`POST /api/profile/role`):

1. `withdrawVerification(userId)`deletes the pending/approved row in`ngoVerifications`.
2. User preference `verificationStatus` is cleared (`""`).
3. `isVerified`flag is reset to`false` across all tasks created by the account.

---

## 5. Future Global Scaling & Architecture Expansion

To support scaling as the user base and international footprint grow:

1. **Multi-Country Verification Strategy (`VerificationAdapter`)**:

- Refactor `propublica.ts` into a strategy registry matching national APIs (`USProPublicaAdapter`, `UKCharityCommissionAdapter`, `EveryOrgGlobalAdapter`).
- Integrate OCR / AI document pre-parsing for international non-US document uploads.

1. **Edge Caching & Performance**:

- Cache `/api/tasks`and public task detail pages at the CDN edge with`s-maxage=300, stale-while-revalidate=600`.
- Utilize composite indexing on Appwrite Tables (`[isVerified, createdAt]`, `[language, isVerified]`).

1. **Asynchronous Background Processing**:

- Move badge evaluation and Plunk transactional emails to background Appwrite Functions or event queues, decoupling side effects from synchronous HTTP response paths. Hail is reserved for a future SMS/voice workflow and is not part of the current notification path.
