# MicroMatch — Summer + Fall 2026 launch plan

Working plan for the Wesleyan fall 2026 launch. High-level founder context and GTM strategy live in [PLAN.md](../PLAN.md); this doc is the operational timeline.

## Goal

Be ready for a credible launch to the Wesleyan community in the late-Aug / early-Sep arrivals window, with a non-empty feed, a single-player wedge feature, and at least one piece of campus press queued for week 1.

## Summer (May – Aug 2026): launch readiness

Roughly 3.5 months. Four workstreams, in priority order.

## 1. Single-player badge vault (highest priority)

The only feature change that materially raises launch success probability. With it, an incoming freshman can use the product the same week they arrive — no NGO supply required. Without it, the marketplace's empty-feed problem is what new users see first.

### Scope

- Volunteer logs off-platform community work: org name, contact email, brief description, optional date/duration.
- System emails the org contact a one-click verification link.
- On confirmation, the badge mints into the vault.
- Vault view: chronological list of verified badges, shareable public profile URL.

### Suggested phasing

- **May:** schema (`offplatform_claims`or extend`claims`), verification token table, server route for the email-verify callback. Tests at module and endpoint level.
- **June:** UI — log-work form, vault page, public profile route. Component tests for each state branch (pending / verified / rejected).
- **July (buffer):** polish, deliverability QA on the verification email (DKIM, SPF, plain-text fallback), spam audit on the public profile.

### Done means

- A first-year arriving on campus can sign up, log three high-school volunteer experiences, get email-verified, and have a shareable badge vault — without MicroMatch having any NGO posts.

## 2. Concierge seed — 20–30 real campus tasks

Hand-curated supply so the marketplace side is non-empty at launch. Founder-as-NGO; the orgs only have to approve when proof comes in.

### Target orgs (5 threads to start)

- A campus club you've been involved in
- A professor you've TA'd or taken a small seminar with
- A student-run publication (the Argus, WesWaves, etc.)
- A campus food / mutual-aid initiative
- The library's digitization / archives team

### Suggested cadence

- **June (week 1):** draft a single email template — what MicroMatch is, what you'll do for them, what they have to do (≈ nothing). Adapt per org.
- **June (week 2–3):** send to all five. Follow up once after 7 days.
- **June – July:** for each `yes`, scope and write 4–6 tasks together. You write the post; they sanity-check.
- **August:** publish tasks, set deadlines clustered around early Sep so volunteers see fresh activity at launch.

### Done means

- 3 of 5 orgs onboarded.
- 15–25 tasks live with realistic deadlines in the launch window.
- Each org has a working approval flow they've used at least once on a test claim.

## 3. Faculty sponsor

One named CS or sociology / civic-studies professor on the project page. Two effects: institutional weight at a small school, and a cleaner read for ISSS as "academically affiliated" rather than "student running a business."

### Suggested phasing

- **May – early June:** identify two candidates (someone whose research touches civic tech, community organizing, HCI, or social informatics).
- **Mid June:** email with a one-page summary and a specific ask — name on the project page, optional 30-min check-in once a semester, no formal commitment beyond that.
- **Done by:** end of July, so the sponsor's name is on the launch-week press materials.

## 4. Open-source contributor onboarding

Reduces founder hours during fall-semester crunch. MIT-licensed, F-1 safe.

### Suggested phasing

- **July:** tag 6–8 `good-first-issue`s spread across components, server routes, and tests. Each issue: clear acceptance criteria, file paths, 1–3 hour scope.
- **July:** lightweight `CONTRIBUTING.md` section on PR process + commit style (existing one already covers the basics — confirm it's current).
- **August:** post once in the SvelteKit Discord and r/sveltejs. Don't spam; one well-written post per channel.
- **Done means:** at least one external PR merged before launch — proves the loop works end-to-end.

## Fall (late Aug – Sep 2026): launch beat

### Pre-launch (mid-August)

- **WSA + club leader outreach.** Identify 5–10 student org presidents from the WSA roster or last year's org fair. Email mid-August: "I have a tool that lets your members earn verifiable badges for community work — can I post 2–3 of your fall tasks on it?" Pre-seed half a dozen yeses so launch week has fresh org-side activity.
- **The Argus pitch.** Email the features editor 2–3 weeks before classes. Angle: student-built free tool for the Wesleyan community, with verifiable badges and concrete fall-semester tasks already live. Aim for a piece in week 1 of classes, not week 4.
- **Physical materials.** Print one tabling card with a single QR code → badge vault landing page. Pitch on the card is "track your community service hours and get verifiable badges" — *not* "join a volunteering marketplace." The vault is the wedge; the marketplace is what users discover after they're on the platform.

### Launch week (WesFest / student-org fair / orientation)

- **Table at the student-org fair.** QR + badge vault + one sentence of pitch. Goal: 100 signups during the fair, not 1,000.
- **Argus piece runs.** Reinforces the table presence with a parallel channel.
- **Pre-seeded orgs activate** their tasks. Volunteers signing up that week should see at least 15 live tasks and at least 3 named campus orgs.
- **Monitor signup → first-claim funnel daily.** At <100 users, you can read the events table by eye and patch friction in real time.

### Weeks 2–4 (sustain)

- **Weekly Argus follow-up?** If the first piece does well, pitch a "first month of MicroMatch" follow-up around week 4.
- **Office hours / weekly community standup** — open Zoom or in-person, treat as community-building rather than user research. Frames the project as a campus thing, not a startup.
- **First contributor PR review queue** stays warm — outside contributors are time-bombs if they get ignored.
- **Patricelli Center conversation** if not already done — endorsement, not money. Their amplification reach within civic-engagement-minded students is the highest organic-channel ROI on campus after the Argus.

## Success criteria

By the end of week 4 of fall semester:

- 200+ signups (Wesleyan email-domain mix preferred; not strictly required).
- 30+ verified badges minted (mix of off-platform vault + on-platform claims).
- 5+ campus orgs with at least one task posted.
- At least one Argus piece published.
- At least one named faculty sponsor on the project page.
- At least one external contributor PR merged.

These are anchors, not targets to optimize against — if signups are lower but claim-completion rate is high, that's healthier than the inverse.

## Biggest risk

The biggest risk to fall launch isn't software readiness — it's that summer is also when you might be doing an OPT-track internship, summer classes, or visiting home. Be honest about how many of those seeding emails actually get sent in July.

**If founder hours look thin, protect the badge vault.** It's the feature that lets the launch succeed even if the concierge seeding doesn't — a Wesleyan student arriving in September with no MicroMatch tasks visible can still get value from the vault as a portfolio artifact, which converts them to a returning user when supply does ramp.

Drop in this priority order if time compresses:

1. Argus pre-pitch (can do during week 0 if needed)
2. Contributor onboarding (can happen post-launch)
3. Concierge seed past the first 3 orgs
4. *Never drop:* the badge vault, the faculty sponsor name, the tabling card.
