# MicroMatch Appwrite Schema Specification

This document details the Appwrite database tables, attributes, storage buckets, and automated setup procedures for MicroMatch.

---

## Architecture Overview

MicroMatch uses **Appwrite Cloud TablesDB API** to manage persistent data.

### Database ID

* `micromatch` (default database ID)

---

## Tables & Collections

### 1. `tasks`

Stores micro-volunteering task listings posted by NGOs.

| Attribute | Type | Size / Constraint | Description |
| :--- | :--- | :--- | :--- |
| `title` | String | 256 | Task title |
| `shortDescription` | String | 512 | Short summary for cards |
| `description` | String | 4096 | Detailed task instructions |
| `tags` | String Array | 64 | Task tags (e.g.`documentation`, `design`) |
| `estimatedMinutes` | Integer | Min: 5, Max: 60 | Estimated time to complete (≤30 min) |
| `language` | String | 32 | Task language (e.g.`English`, `Spanish`) |
| `orgID` | String | 64 | Appwrite Team / User ID of posting NGO |
| `status` | String | Enum (`active`, `archived`, `completed`) | Current task lifecycle status |
| `deadline` | Datetime | Optional | Target completion deadline |
| `isVerified` | Boolean | Default:`false` | Whether posting NGO is verified 501(c)(3) |
| `evergreen` | Boolean | Optional; unset means `false` in the app | Curated task that stays in the feed without activity (skips the 30-day auto-archive) |

#### Indexes

* `status` (Key, ASC)
* `deadline` (Key, ASC)
* `orgID` (Key, ASC)

---

### 2. `claims`

Tracks volunteer task claims and proof-of-work submissions.

| Attribute | Type | Size / Constraint | Description |
| :--- | :--- | :--- | :--- |
| `taskId` | String | 64 | Referenced task ID |
| `volunteerId` | String | 64 | Appwrite User ID of volunteer |
| `status` | String | Enum (`pending`, `approved`, `rejected`) | Submission status |
| `notes` | String | 2048 | Volunteer submission notes / links |
| `proofUrl` | String | 1024 | Optional link or uploaded attachment URL |
| `submittedAt` | Datetime | Default:`now()` | Timestamp of submission |
| `reviewNotes` | String | 1024 | Optional feedback from NGO reviewer |

#### Indexes

* `taskId` (Key, ASC)
* `volunteerId` (Key, ASC)
* `status` (Key, ASC)

---

### 3. `badges`

Records badges earned by volunteers.

| Attribute | Type | Size / Constraint | Description |
| :--- | :--- | :--- | :--- |
| `userId` | String | 64 | Volunteer user ID |
| `label` | String | 128 | Badge title |
| `awardedAt` | Datetime | Default:`now()` | Timestamp awarded |
| `taskId` | String | 64 | Originating task ID |

---

### 4. `badgeDefinitions`

Custom badge templates defined by NGOs.

| Attribute | Type | Size / Constraint | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | 128 | Badge name |
| `description` | String | 512 | Description of requirement |
| `icon` | String | 128 | Iconify icon string |
| `triggerTag` | String | 64 | Task tag triggering award |
| `requiredCount` | Integer | Min: 1 | Required claims count |
| `orgId` | String | 64 | NGO organization owner ID |

---

## Storage Buckets

### `avatars`

* **ID**: `avatars`
* **File Security**: Enabled
* **Bucket permissions**: No bucket-wide read permission
* **Avatar file permissions**: Public read, set on each avatar file
* **Allowed Extensions**: `jpg`, `jpeg`, `png`, `svg`, `webp`, `pdf` when shared with verification uploads
* **Maximum File Size**: At least 10 MB

### Verification documents

Set `APPWRITE_VERIFICATIONS_BUCKET_ID=avatars` to use the existing bucket. Verification uploads grant read access only to the owner and admin team. Keep file security enabled and bucket-wide read permissions empty; otherwise file permissions cannot protect the documents.

---

## Existing Project Migration

MicroMatch uses one Appwrite project, `micromatch-prod`. The production table now has an `evergreen` column, and its eight curated rows are set to `true`. For a new installation:

1. Add an optional Boolean `evergreen` column to the `tasks` table. The app treats unset values as `false`; the seed script sets it to `true` on the eight curated tasks.
2. Enable file security on the upload bucket and remove bucket-wide read permissions. Check these settings in the Appwrite Console; the runtime key does not need bucket metadata access.
3. Set `APPWRITE_VERIFICATIONS_BUCKET_ID=avatars` in both server environments. Set `APPWRITE_PROJECT_ID=micromatch-prod` and `PUBLIC_APPWRITE_PROJECT_ID=micromatch-prod` in Production and Preview.
4. Run `verify:staging` with Preview credentials. It checks the expected QA table and team IDs, their access, the `evergreen` column, and bucket access. Check bucket security separately in the Console.

The setup script creates missing table shells but does not add columns to existing tables. Add the column in the Appwrite Console or with a schema migration before running the seed script. `appwrite.config.json` is a local, gitignored file; a fresh checkout needs its own schema configuration before using the setup script or CLI push commands below.

---

## Automated Provisioning

### Existing project

Ensure `APPWRITE_PROJECT_ID=micromatch-prod` and `APPWRITE_API_KEY` are exported in your environment:

```bash
bun scripts/setup-appwrite.ts
```

### Preview within the same project

Keep the same endpoint and project ID in Production and Preview. The `staging` Preview branch uses `tasks_qa`, `claims_qa`, `badges_qa`, `ngoVerifications_qa`, and `badgeDefinitions_qa`, plus `ngo_qa`, `volunteer_qa`, and `admins_qa` teams. Production uses the corresponding unsuffixed IDs. Auth users and storage files still belong to the same Appwrite project, so use dedicated test accounts and private file permissions. Run the seed only with dedicated QA identities.

To check the configured Preview resources:

```bash
APPWRITE_PROJECT_ID=micromatch-prod APPWRITE_API_KEY=<preview_key> bun run verify:staging
```

