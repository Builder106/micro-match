# NGO Guide

This handbook covers organization onboarding, verification, task creation, claim reviewing, and role management on MicroMatch.

---

## 1. Account Setup & Role Selection

- Users can register and select the **NGO** role, or switch their role anytime from the profile page (`/profile`).
- Role permissions are enforced server-side via Appwrite Teams and user preferences.

---

## 2. NGO Verification Pipeline

MicroMatch uses a soft-gate trust system to assign a **Verified NGO** chip to tasks.

### Verification Process

1. Go to `/org`or`/profile` and open the **Verification Card**.
2. Provide your **Organization Name**, **Country**, and **Tax / Charity Registration ID** (e.g., IRS EIN for US entities).
3. *(Optional / International)* Upload an official registration document (PDF, PNG, or JPEG) if your organization is outside the US or not indexed in public registries.
4. Submit your application. Status transitions to `Pending`.

### Automated Enrichment & Review

- **US Organizations**: Submissions with a 9-digit EIN are automatically cross-checked against the **ProPublica Nonprofit Explorer API** (IRS Form 990 database) for admin verification.
- **International Organizations**: ProPublica coverage is strictly US-only. For international NGOs, platform admins review the uploaded registration document.
- **Approval & Backfilling**: When an admin approves an application, your organization's tasks receive the **Verified** chip automatically across the feed and task detail pages.
- **Rejection & Feedback**: If rejected, an email is sent via Mailgun with specific feedback notes so you can update and resubmit.

---

## 3. Role Mobility & Teardown

- Users can switch between **Volunteer**and**NGO** roles.
- If an NGO downgrades to a Volunteer role, MicroMatch executes a clean transactional teardown:
  - Pending/approved verification records are withdrawn.
  - The `isVerified` badge is automatically cleared from all tasks created by the account.

---

## 4. Posting Effective Tasks

- **URL**: Navigate to `/org` (NGO role required).
- **Scope**: Keep tasks bite-sized (15–60 minutes estimated effort).
- **Details**: Provide clear outcomes, step-by-step instructions, and acceptance criteria.
- **Learning Primers**: Attach curated learning links (e.g., DataCamp, Educative, documentation) to help volunteers complete the task quickly.
- **Content Safety**: Submissions are automatically scanned by Azure AI Content Safety. Text containing harmful language will be blocked.

---

## 5. Reviewing Volunteer Claims & Awarding Badges

1. Go to your posted task page or review dashboard to see pending claims.
2. Review the proof URL/file and notes submitted by the volunteer.
3. Click **Approve**or**Reject**:

- Approving a claim updates volunteer XP and automatically awards any custom or milestone badges configured for the task.
- Rejection provides constructive feedback to the volunteer.
