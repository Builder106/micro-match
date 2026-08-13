# MicroMatch Badge & Award System Architecture

This document details the design, implementation, icon system, criteria evaluation engine, known technical gaps, and roadmap for MicroMatch's Gamification & Award System.

---

## 1. Overview & Iconography

MicroMatch features an event-driven gamification engine that allows NGOs to define custom achievement badges and auto-award them to volunteers upon task approval.

* **Icon Library**: Built on **[Iconify](https://iconify.design/)**using**Hugeicons** (`hugeicons:*`) for a modern, tactile aesthetic.
* **Predefined Starter Badges**:
  * **First Mission**: `hugeicons:trophy-01` (Gold gradient)
  * **Speed Demon**: `hugeicons:fire` (Rose gradient)
  * **Global Citizen**: `hugeicons:globe-02` (Indigo gradient)
  * **Perfect Week**: `hugeicons:sparkles` (Emerald gradient)
* **General Badge Indicator**: `hugeicons:award-01`(rendered in`<BadgeChip />`).

---

## 2. Architecture & Data Flow

### Data Model (`Appwrite` / In-Memory Fallback)

* **`badgeDefinitions`**: Stores NGO-scoped templates (`orgID`, `label`, `color`, `icon`, `criteria`, `taskID`, `description`).
* **`badges`**: Stores badges awarded to volunteers (`userId`, `taskId`, `label`, `color`, `awardedAt`).

### Automatic Award Pipeline

1. NGO approves a volunteer claim via `POST /api/claims/review`.
2. Upon approval, `onTaskApproved()`in`src/lib/server/badgeAwarder.ts` is triggered.
3. The engine fetches badge definitions owned by the NGO that created the task ([badgeCriteria.ts](file:///Users/yinkavaughan/My%20Drive%20%28yvaughan@wesleyan.edu%29/CS/projects/swe/micro-match/src/lib/server/badgeCriteria.ts)).
4. `processBadgeAwards()`checks existing volunteer badges to deduplicate by`(userId, label)`.
5. Newly matched badges are written to the `badges` table and returned to the client to trigger celebratory UI bursts (confetti & Lottie animations).
6. **Best-Effort Failure Handling**: If badge awarding fails or throws an error, the claim approval process completes cleanly without blocking user operations.

---

## 3. Implemented vs. Pending Criteria Engine Features

| Criteria Type | Status | Engine Behavior |
| :--- | :---: | :--- |
| `task-completion` | ✅ Active | Auto-awards on *any* approved task claim under the NGO. |
| `task-specific` | ✅ Active | Auto-awards when the approved task ID matches`definition.taskId`. |
| `time-based` | 🚧 Reserved | Schema & UI supported; backend evaluation stubbed for`maxMinutes` rules. |
| `milestone` | 🚧 Reserved | Schema & UI supported; backend evaluation stubbed for aggregate count rules (e.g. "5 tasks"). |
| `custom` | 🚧 Reserved | Schema & UI supported; reserved for complex conditional rules. |

---

## 4. Current Technical Gaps & Maintenance Items

1. **Backend Milestone Aggregation Engine**:

* *Gap*: `checkMilestoneCriteria()`currently returns`[]`.
* *Action Needed*: Extend `BadgeDefinition`schema with`milestoneCount`and`maxMinutes` fields, and add query helpers for volunteer claim history.
1. **Global System Badges vs. NGO Badges**:

* *Gap*: Starter milestone badges are hardcoded fallbacks on the volunteer dashboard ([VolunteerDashboard.svelte](file:///Users/yinkavaughan/My%20Drive%20%28yvaughan@wesleyan.edu%29/CS/projects/swe/micro-match/src/lib/components/VolunteerDashboard.svelte)).
* *Action Needed*: Seed platform-wide global system badge definitions in Appwrite so unlocked status syncs dynamically across all NGOs.
1. **Deduplication Keying**:

* *Gap*: Deduplication matches strictly on badge `label`.
* *Action Needed*: Update deduplication to key on `badgeDefinitionId` to allow volunteers to earn similarly named badges from different NGOs.

---

## 5. Roadmap & Future Enhancements

* **Public Verification Showcase**: Public profile badge gallery and downloadable shareable badge cards for LinkedIn/resume proof.
* **Tiered Badges**: Progressive Bronze, Silver, Gold badge tiers for milestone achievements.
* **Offline/Background Notifications**: Send email notifications via SendGrid/Appwrite messaging when badges are awarded asynchronously.
* **Leaderboards & Analytics**: NGO dashboard engagement metrics and volunteer community leaderboards.
