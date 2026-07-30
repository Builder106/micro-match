# MicroMatch API Specification

This document details the REST API endpoints provided by the MicroMatch backend for task management, volunteer claims, NGO verifications, badges, and user profile management.

---

## Task Management

### `GET /api/tasks`
Retrieves public task listings. Supports filtering by maximum duration and optional language translation.

* **Authentication**: Optional
* **Query Parameters**:
  * `duration`: Maximum task duration in minutes (e.g. `15`, `20`, `30`).
  * `lang`: Target ISO language code for auto-translation (e.g. `es`, `fr`).
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
    "status": "open",
    "ngoId": "org_456",
    "isVerified": true
  }
]
```

### `POST /api/tasks`
Creates a new micro-task listing.

* **Authentication**: Required (NGO or Admin role)
* **Request Body**:
```json
{
  "title": "Proofread Social Media Graphics",
  "shortDescription": "Check 5 PNG graphics for typos and accessibility alt-text.",
  "tags": ["social-media", "accessibility"],
  "estimatedMinutes": 20,
  "maxVolunteers": 3,
  "deadline": "2026-08-15T00:00:00Z"
}
```
* **Response (201 Created)**: Returns the newly created task object.

### `DELETE /api/tasks/[id]`
Deletes or archives an existing task listing.

* **Authentication**: Required (Task owner or Admin)
* **Response (200 OK)**: `{ "success": true }`

### `POST /api/tasks/[id]/claim`
Claims an active task for the logged-in volunteer.

* **Authentication**: Required (Volunteer role)
* **Response (200 OK)**: Returns the created claim object.

---

## Claims & Submissions

### `GET /api/claims`
Retrieves submitted task claims for the authenticated user (volunteers see their own claims; NGOs see claims for their posted tasks).

* **Authentication**: Required
* **Response (200 OK)**: Array of claim objects with submission notes and status (`pending`, `approved`, `rejected`).

### `POST /api/claims/[id]/approve`
Approves a volunteer's submitted proof-of-work, granting XP and triggering badge evaluation.

* **Authentication**: Required (NGO task owner or Admin)
* **Response (200 OK)**: `{ "status": "approved", "badgeAwarded": true }`

### `POST /api/claims/[id]/reject`
Rejects a submitted claim with review feedback notes.

* **Authentication**: Required (NGO task owner or Admin)
* **Request Body**: `{ "reason": "Proof screenshot link is inaccessible." }`
* **Response (200 OK)**: `{ "status": "rejected" }`

---

## NGO Verification

### `POST /api/verifications`
Submits an NGO verification application with EIN and documentation.

* **Authentication**: Required (NGO role)
* **Request Body**:
```json
{
  "ein": "12-3456789",
  "organizationName": "Community Tech Action",
  "documentId": "file_789"
}
```
* **Response (201 Created)**: Returns the pending verification record.

### `GET /api/verifications/me`
Checks the current NGO's verification status.

* **Authentication**: Required (NGO role)
* **Response (200 OK)**: `{ "status": "approved" | "pending" | "rejected" | "none" }`

### `POST /api/verifications/[userId]/approve`
Approves an NGO's verification application, adding the "Verified" badge to all organization tasks.

* **Authentication**: Required (Admin role)
* **Response (200 OK)**: `{ "success": true, "verified": true }`

---

## Badges & Custom Templates

### `GET /api/badges`
Fetches badges earned by the authenticated volunteer or defined by the authenticated NGO.

* **Authentication**: Required
* **Response (200 OK)**: Array of badge records.

### `POST /api/badges/manage`
Creates or updates custom badge definitions for an NGO organization.

* **Authentication**: Required (NGO role)
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
* **Response (200 OK)**: Returns the badge definition object.

---

## User Profile & Roles

### `POST /api/profile/role`
Updates or switches the authenticated user's active role between Volunteer and NGO.

* **Authentication**: Required
* **Request Body**: `{ "targetRole": "ngo" | "volunteer" }`
* **Response (200 OK)**: `{ "activeRole": "ngo" }`