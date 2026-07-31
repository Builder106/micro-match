# MicroMatch API Specification

This document details the complete REST API endpoints provided by the MicroMatch backend for task management, volunteer claims, NGO verifications, badges, teams, user profiles, and authentication.

---

## Overview

### Base URL
- Production: `https://micromatch.org`
- Local Development: `http://localhost:5174`

### Authentication
Most endpoints under `/api/` require an authenticated session. Authentication is passed via HTTP session cookies or session tokens. Public read-only endpoints (such as `GET /api/tasks`) require no authentication.

### Content Safety & Moderation
Text fields submitted to task creation (`title`, `shortDescription`, `description`) and task claim notes are automatically processed through content safety moderation. Submissions containing policy-violating content are rejected with HTTP `400 Bad Request`.

### Standard Error Response
```json
{
  "error": "Error description message",
  "reasons": ["optional_moderation_reasons"]
}
```

---

## 1. Task Management

### `GET /api/tasks`
Retrieves public task listings.

* **Authentication**: Optional (Public)
* **Query Parameters**:
  * `duration` *(optional)*: Maximum task duration in minutes (e.g. `15`, `20`, `30`).
  * `lang` *(optional)*: Target ISO language code for auto-translation (e.g. `es`, `fr`).
* **Response (200 OK)**:
```json
[
  {
    "id": "task_123",
    "title": "Update Volunteer Guidelines",
    "shortDescription": "Review and update our online volunteer onboarding document.",
    "tags": ["documentation", "onboarding"],
    "estimatedMinutes": 15,
    "language": "English",
    "status": "active",
    "orgId": "org_456",
    "isVerified": true
  }
]
```

### `POST /api/tasks`
Creates a new micro-task listing.

* **Authentication**: Required (`ngo` role)
* **Request Body**:
```json
{
  "title": "Proofread Social Media Graphics",
  "shortDescription": "Check 5 PNG graphics for typos and accessibility alt-text.",
  "description": "Full details on graphics location and style guide rules...",
  "tags": ["social-media", "accessibility"],
  "estimatedMinutes": 20,
  "language": "English",
  "maxVolunteers": 3,
  "deadline": "2026-08-15T00:00:00Z"
}
```
* **Response (201 Created)**: Returns the newly created task object.
* **Error Responses**: `400 Bad Request` (missing title/description or content safety block), `401 Unauthorized`, `403 Forbidden` (non-NGO).

### `PATCH /api/tasks/[id]`
Updates an existing task's status or parameters.

* **Authentication**: Required (NGO task owner)
* **Request Body**:
```json
{
  "status": "completed",
  "maxVolunteers": 5,
  "deadline": "2026-09-01T00:00:00Z"
}
```
* **Response (200 OK)**: `{ "success": true }`
* **Error Responses**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden` (not task owner), `404 Not Found`.

### `DELETE /api/tasks/[id]`
Deletes a task listing.

* **Authentication**: Required (NGO task owner)
* **Response (200 OK)**: `{ "success": true }`
* **Error Responses**: `401 Unauthorized`, `403 Forbidden` (not task owner), `404 Not Found`.

### `POST /api/tasks/[id]/claim`
Claims an active task and submits proof-of-work.

* **Authentication**: Required (`volunteer` or authenticated user)
* **Request Body**:
```json
{
  "proofUrl": "https://github.com/org/repo/pull/42",
  "notes": "Completed the proofreading and updated alt-text tags."
}
```
* **Response (201 Created)**: Returns the created claim object.
* **Error Responses**: `400 Bad Request` (content safety block), `401 Unauthorized`, `404 Not Found`.

---

## 2. Claims & Submissions

### `GET /api/claims`
Retrieves claims associated with the authenticated user.

* **Authentication**: Required
* **Query Parameters**:
  * `status` *(optional)*: Filter by claim status (`pending` | `approved` | `rejected`).
  * `limit` *(optional)*: Pagination limit (default `50`, max `100`).
  * `offset` *(optional)*: Pagination offset (default `0`).
* **Response (200 OK)**:
```json
{
  "data": [
    {
      "id": "claim_789",
      "taskId": "task_123",
      "userId": "user_abc",
      "proofUrl": "https://example.com/proof.pdf",
      "notes": "Finished review.",
      "status": "pending",
      "createdAt": "2026-07-31T12:00:00Z"
    }
  ],
  "meta": {
    "total": 1,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  },
  "error": null
}
```

### `POST /api/claims/[id]/approve`
Approves a volunteer's claim, granting XP and triggering badge evaluation.

* **Authentication**: Required (NGO task owner or Admin)
* **Response (200 OK)**: Approved claim object with updated status `approved`.
* **Error Responses**: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

### `POST /api/claims/[id]/reject`
Rejects a submitted claim with review feedback.

* **Authentication**: Required (NGO task owner or Admin)
* **Request Body**:
```json
{
  "reason": "Proof link is inaccessible."
}
```
* **Response (200 OK)**: `{ "status": "rejected" }`
* **Error Responses**: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

---

## 3. NGO Verification

### `POST /api/verifications`
Submits an NGO verification application with EIN and documentation.

* **Authentication**: Required (`ngo` role)
* **Request Body**:
```json
{
  "ein": "12-3456789",
  "organizationName": "Community Tech Action",
  "documentId": "doc_file_001"
}
```
* **Response (201 Created)**: Returns the pending verification record.

### `GET /api/verifications/me`
Fetches the current user's verification application status.

* **Authentication**: Required (`ngo` role)
* **Response (200 OK)**:
```json
{
  "status": "approved",
  "ein": "12-3456789",
  "organizationName": "Community Tech Action"
}
```

### `DELETE /api/verifications/me`
Cancels the pending verification application.

* **Authentication**: Required (`ngo` role)
* **Response (200 OK)**: `{ "success": true }`

### `POST /api/verifications/upload`
Uploads a verification document file (PDF, PNG, JPEG).

* **Authentication**: Required (`ngo` role)
* **Request Format**: `multipart/form-data` with key `file`
* **Response (200 OK)**:
```json
{
  "fileId": "doc_file_001",
  "url": "/api/verifications/user_123/document"
}
```

### `GET /api/verifications/[userId]/document`
Downloads or views the uploaded verification document.

* **Authentication**: Required (Admin or Document Owner)
* **Response (200 OK)**: File binary stream with content disposition headers.

### `POST /api/verifications/[userId]/approve`
Approves an NGO's verification application and sets `isVerified: true` on their tasks.

* **Authentication**: Required (`admin` role)
* **Response (200 OK)**: `{ "success": true, "verified": true }`

### `POST /api/verifications/[userId]/reject`
Rejects an NGO's verification application with feedback notes.

* **Authentication**: Required (`admin` role)
* **Request Body**:
```json
{
  "reason": "EIN document could not be validated with state registry."
}
```
* **Response (200 OK)**: `{ "success": true }`

---

## 4. Badges & Custom Templates

### `GET /api/badges`
Fetches earned badges for the authenticated volunteer or target user.

* **Authentication**: Required
* **Query Parameters**:
  * `userId` *(optional)*: Target user ID to fetch badges for.
* **Response (200 OK)**: Array of badge records.

### `GET /api/badges/manage`
Lists custom badge templates created by the NGO.

* **Authentication**: Required (`ngo` or `admin` role)
* **Response (200 OK)**: Array of badge template definitions.

### `POST /api/badges/manage`
Creates a new custom badge template.

* **Authentication**: Required (`ngo` or `admin` role)
* **Request Body**:
```json
{
  "name": "Documentation Champion",
  "description": "Awarded for completing 5 technical documentation tasks.",
  "icon": "heroicons:document-text",
  "triggerTag": "documentation",
  "requiredCount": 5
}
```
* **Response (201 Created)**: Returns the newly created badge definition.

### `DELETE /api/badges/manage`
Deletes a custom badge template.

* **Authentication**: Required (`ngo` or `admin` role)
* **Request Body**:
```json
{
  "id": "badge_def_001"
}
```
* **Response (200 OK)**: `{ "success": true }`

---

## 5. Profile & Teams

### `POST /api/profile/role`
Switches the active user role (`volunteer` or `ngo`).

* **Authentication**: Required
* **Request Body**:
```json
{
  "role": "ngo"
}
```
* **Response (200 OK)**: `{ "success": true, "role": "ngo" }`

### `POST /api/profile/update`
Updates user profile information (bio, skills, display name, organization name).

* **Authentication**: Required
* **Request Body**:
```json
{
  "name": "Alex Rivera",
  "bio": "Frontend developer & open source volunteer.",
  "skills": ["TypeScript", "Svelte", "Accessibility"],
  "orgName": "Tech For Good"
}
```
* **Response (200 OK)**: `{ "success": true }`

### `POST /api/profile/avatar`
Uploads a user profile avatar image.

* **Authentication**: Required
* **Request Format**: `multipart/form-data` with key `avatar`
* **Response (200 OK)**: `{ "avatarUrl": "https://storage.micromatch.org/avatars/user_123.jpg" }`

### `POST /api/teams/assign`
Assigns a task to team members.

* **Authentication**: Required (`ngo` role)
* **Request Body**:
```json
{
  "taskId": "task_123",
  "memberIds": ["user_abc", "user_def"]
}
```
* **Response (200 OK)**: `{ "success": true }`

---

## 6. Authentication

### `POST /api/auth/session`
Creates or updates the current user session from an authentication provider token.

* **Authentication**: None
* **Request Body**: `{ "token": "session_token_string" }`
* **Response (200 OK)**: `{ "success": true }`

### `POST /api/auth/logout`
Destroys the active session and clears session cookies.

* **Authentication**: Required
* **Response (200 OK)**: `{ "success": true }`