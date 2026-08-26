# Frequently Asked Questions (FAQ)

## General

### Do I need an account to use MicroMatch

Browsing the public task feed and viewing task details is open to all visitors. Claiming tasks, submitting proof, posting tasks, and earning badges require an account.

### Can I switch between Volunteer and NGO roles

Yes. MicroMatch supports full role mobility. You can toggle your role under `/profile`. If you downgrade from NGO to Volunteer, any active NGO verification application is safely withdrawn, and the verified status on your posted tasks is cleared.

---

## NGO Verification & Trust

### Does the ProPublica lookup work for international NGOs

No. ProPublica's Nonprofit Explorer API only covers US-based 501(c)(3) organizations registered with the IRS. For international NGOs or non-US charities, verification relies on uploading official tax or charity registration documents (PDF, PNG, or JPEG) during application submission for admin review.

### How does the "Verified" task chip work

Once an admin approves an NGO's verification application, MicroMatch automatically back-fills the **Verified** chip onto all current and future tasks created by that organization.

### What happens if my NGO verification is rejected

You will receive an automated email notification via Mailgun explaining the reviewer's reason. You can update your tax ID or upload supplementary registration documents at `/org` and resubmit.

---

## Tasks, Translation & Moderation

### How do translations work

The language picker changes the locale prefix, such as `/es/tasks` or `/fr/task/123`. Paraglide supplies the reviewed static UI messages. LibreTranslate translates user-created task display fields on the server for the selected locale. Tasks with an active translation display an "Auto-translated" badge. If the translation service is unavailable, the page shows the original text. Older `/task/123?lang=es` links redirect to `/es/task/123`.

### Why was my task or claim note blocked

All user-submitted text passes through automated moderation (Azure AI Content Safety). Inputs containing harmful, offensive, or inappropriate material are blocked automatically before database entry.

---

## Developer & API Integrations

### Can third parties consume MicroMatch task data

Yes. MicroMatch exposes a public read-only REST endpoint (`GET /api/tasks`) for task discovery. Full interactive API documentation is available at `/docs/api` and in [`docs/api.md`](./api.md).
