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
            │  - Storage Buckets   │  │  - Azure Translate│
            │  - Teams (RBAC)      │  │  - Mailgun Email │
            └──────────────────────┘  └──────────────────┘
```

---

## 2. Server Architecture & Modules

The backend logic resides in `$lib/server/` with isolated domain modules:

- **[`appwrite.ts`](file:///Users/yinkavaughan/My%20Drive%20%28yvaughan@wesleyan.edu%29/CS/projects/swe/micro-match/src/lib/server/appwrite.ts)**: Appwrite server client initialization, database helpers, and session context handling.
- **[`verifications.ts`](file:///Users/yinkavaughan/My%20Drive%20%28yvaughan@wesleyan.edu%29/CS/projects/swe/micro-match/src/lib/server/verifications.ts)**: Verification CRUD, status transitions, backfilling `isVerified` on tasks, and in-memory fallback for local dev.
- **[`propublica.ts`](file:///Users/yinkavaughan/My%20Drive%20%28yvaughan@wesleyan.edu%29/CS/projects/swe/micro-match/src/lib/server/propublica.ts)**: Lookup helper for ProPublica Nonprofit Explorer (US 501(c)(3) EIN validation).
- **[`badgeAwarder.ts`](file:///Users/yinkavaughan/My%20Drive%20%28yvaughan@wesleyan.edu%29/CS/projects/swe/micro-match/src/lib/server/badgeAwarder.ts)**: Event-driven badge evaluator that mints badges on claim approval.
- **[`contentsafety.ts`](file:///Users/yinkavaughan/My%20Drive%20%28yvaughan@wesleyan.edu%29/CS/projects/swe/micro-match/src/lib/server/contentsafety.ts)**: Azure AI Content Safety moderation scanner.
- **[`email.ts`](file:///Users/yinkavaughan/My%20Drive%20%28yvaughan@wesleyan.edu%29/CS/projects/swe/micro-match/src/lib/server/email.ts)**: Mailgun transactional email engine.

---

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
  - Email: Mailgun approval notice                     - Email: Mailgun rejection reason
```

### Role Mobility Teardown

When an NGO downgrades to a Volunteer role (`POST /api/profile/role`):

1. `withdrawVerification(userId)` deletes the pending/approved row in `ngoVerifications`.
2. User preference `verificationStatus` is cleared (`""`).
3. `isVerified` flag is reset to `false` across all tasks created by the account.

---

## 5. Future Global Scaling & Architecture Expansion

To support scaling as the user base and international footprint grow:

1. **Multi-Country Verification Strategy (`VerificationAdapter`)**:
   - Refactor `propublica.ts` into a strategy registry matching national APIs (`USProPublicaAdapter`, `UKCharityCommissionAdapter`, `EveryOrgGlobalAdapter`).
   - Integrate OCR / AI document pre-parsing for international non-US document uploads.

2. **Edge Caching & Performance**:
   - Cache `/api/tasks` and public task detail pages at the CDN edge with `s-maxage=300, stale-while-revalidate=600`.
   - Utilize composite indexing on Appwrite Tables (`[isVerified, createdAt]`, `[language, isVerified]`).

3. **Asynchronous Background Processing**:
   - Move badge evaluation and Mailgun transactional emails to background Appwrite Functions or event queues, decoupling side effects from synchronous HTTP response paths.
