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
| `tags` | String Array | 64 | Task tags (e.g. `documentation`, `design`) |
| `estimatedMinutes` | Integer | Min: 5, Max: 60 | Estimated time to complete (≤30 min) |
| `language` | String | 32 | Task language (e.g. `English`, `Spanish`) |
| `orgID` | String | 64 | Appwrite Team / User ID of posting NGO |
| `status` | String | Enum (`active`, `archived`, `completed`) | Current task lifecycle status |
| `deadline` | Datetime | Optional | Target completion deadline |
| `isVerified` | Boolean | Default: `false` | Whether posting NGO is verified 501(c)(3) |

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
| `submittedAt` | Datetime | Default: `now()` | Timestamp of submission |
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
| `awardedAt` | Datetime | Default: `now()` | Timestamp awarded |
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
* **File Security**: Disabled (public read)
* **Allowed Extensions**: `jpg`, `png`, `svg`
* **Maximum File Size**: 50 MB

---

## Automated Provisioning

Run the automated provisioning script using Bun:

```bash
bun scripts/setup-appwrite.ts
```

Ensure `APPWRITE_PROJECT_ID` and `APPWRITE_API_KEY` are exported in your environment.
