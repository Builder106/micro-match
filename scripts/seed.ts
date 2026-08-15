/**
 * MicroMatch idempotent seed.
 *
 *   bun run seed
 *
 * Creates a "MicroMatch Demo" NGO user and a small set of polished tasks
 * under that org so the landing page's Featured Tasks and the /tasks feed
 * have something real to render. Re-running the script never duplicates
 * anything: the user is matched by email, tasks are matched by (orgId,
 * title), and prefs/team-membership writes are idempotent by construction
 * (set-to-known-value, ignore-if-already-member).
 *
 * Reads from process.env (loaded from .env via dotenv). Required:
 *   APPWRITE_ENDPOINT
 *   APPWRITE_PROJECT_ID
 *   APPWRITE_API_KEY
 *
 * Optional (defaulted from appwrite.config.json values):
 *   APPWRITE_DB_ID            → 'micromatch'
 *   APPWRITE_TASKS_TABLE_ID   → 'tasks'
 *   APPWRITE_NGO_TEAM_ID      → 'ngo'
 *   SEED_DEMO_EMAIL           → 'demo@micromatch.app'
 *   SEED_DEMO_NAME            → 'MicroMatch Demo'
 *
 * Demo-recording fixtures (opt-in — only run when SEED_DEMO_PASSWORD is set):
 *   SEED_DEMO_PASSWORD        → gives the demo NGO + volunteer a password they
 *                               can actually sign in with, so e2e/demo can film
 *                               the claim → submit → approve → badge loop.
 *   SEED_VOLUNTEER_EMAIL      → 'jane@example.com'
 *   SEED_VOLUNTEER_NAME       → 'Jane Doe'
 *   SEED_BADGE_LABEL          → 'First Mission'
 *
 * Leave SEED_DEMO_PASSWORD unset and this script behaves exactly as before:
 * task seeding only, no sign-in-able accounts. The password is deliberately
 * never hardcoded — these accounts live on the same Appwrite project the live
 * site uses, and an NGO-role account can approve claims and mint badges.
 */

import 'dotenv/config';
import { Client, Users, Teams, TablesDB, Query, ID } from 'node-appwrite';

const endpoint = process.env.APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
if (!endpoint || !projectId || !apiKey) {
  console.error('Missing APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, or APPWRITE_API_KEY in env.');
  process.exit(1);
}

const dbId = process.env.APPWRITE_DB_ID ?? 'micromatch';
const tasksTable = process.env.APPWRITE_TASKS_TABLE_ID ?? 'tasks';
const claimsTable = process.env.APPWRITE_CLAIMS_TABLE_ID ?? 'claims';
const badgesTable = process.env.APPWRITE_BADGES_TABLE_ID ?? 'badges';
const badgeDefsTable = process.env.APPWRITE_BADGE_DEFS_TABLE_ID ?? 'badgeDefinitions';
const ngoTeamId = process.env.APPWRITE_NGO_TEAM_ID ?? 'ngo';
const volunteerTeamId = process.env.APPWRITE_VOLUNTEER_TEAM_ID ?? 'volunteer';
const demoEmail = process.env.SEED_DEMO_EMAIL ?? 'demo@micromatch.app';
const demoName = process.env.SEED_DEMO_NAME ?? 'MicroMatch Demo';

// Opt-in demo-recording fixtures. Unset → the loop fixtures are skipped.
const demoPassword = process.env.SEED_DEMO_PASSWORD;
const volunteerEmail = process.env.SEED_VOLUNTEER_EMAIL ?? 'jane@example.com';
const volunteerName = process.env.SEED_VOLUNTEER_NAME ?? 'Jane Doe';
// Matches a locked placeholder in VolunteerDashboard's badge vault, so approval
// visibly flips that exact tile from locked to earned on camera.
const badgeLabel = process.env.SEED_BADGE_LABEL ?? 'First Mission';

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const users = new Users(client);
const teams = new Teams(client);
const tables = new TablesDB(client);

type DemoTask = {
  title: string;
  shortDescription: string;
  description: string;
  language: string;
  estimatedMinutes: number;
  tags: string[];
};

// Eight evergreen tasks — no relative deadlines, no time-sensitive copy,
// so they don't rot. Diverse hashtags so the feed's tag chips have
// something to filter on.
const demoTasks: DemoTask[] = [
  {
    title: 'Translate a medical flyer into Spanish',
    shortDescription: 'Help patients understand a one-page flyer about diabetes screenings.',
    description:
      'Translate a single-page patient flyer (~250 words) into clear, accessible Spanish. The original is a plain-language English version we use at clinic intake. Keep medical terms accurate and tone friendly.',
    language: 'English',
    estimatedMinutes: 15,
    tags: ['translation', 'spanish', 'health'],
  },
  {
    title: 'Tag historical photos for an archive',
    shortDescription: 'Add searchable tags (year, location, subject) to a small batch of photos.',
    description:
      'A community history archive needs tags on 20 scanned photos so they show up in search. We provide the photo set and a tag taxonomy; you fill in best-guess metadata.',
    language: 'English',
    estimatedMinutes: 5,
    tags: ['data', 'history'],
  },
  {
    title: 'Draft three social-post captions for an event',
    shortDescription: 'Write three short captions promoting a community clean-up day.',
    description:
      'Three captions, ~50 words each, suitable for Instagram, LinkedIn, and X. We provide the event details and tone notes; you write the variations.',
    language: 'English',
    estimatedMinutes: 10,
    tags: ['design'],
  },
  {
    title: 'Audit alt-text on a learning resource',
    shortDescription: 'Review alt-text for ~15 images on an open-access lesson page.',
    description:
      'Open the linked page, check each image, and either confirm the alt-text is accurate or suggest a better short description. Output is a simple table you fill in.',
    language: 'English',
    estimatedMinutes: 20,
    tags: ['design', 'data'],
  },
  {
    title: 'Categorize community Q&A entries',
    shortDescription: 'Sort 30 forum questions into 6 topic buckets.',
    description:
      'We have 30 community questions and a 6-topic taxonomy. For each question, pick the best topic. Edge cases get a short note explaining your choice.',
    language: 'English',
    estimatedMinutes: 15,
    tags: ['data'],
  },
  {
    title: 'Proofread a plain-language climate explainer',
    shortDescription: 'Catch typos and awkward phrasing in a 600-word explainer.',
    description:
      'A short explainer aimed at high-school readers. We need a careful proofread for grammar, clarity, and any jargon that should be replaced with plainer language.',
    language: 'English',
    estimatedMinutes: 25,
    tags: ['environment'],
  },
  {
    title: 'Build a beginner Excel formula reference',
    shortDescription: 'Write one-line explanations for 10 common Excel formulas.',
    description:
      'For a financial-literacy workshop. We give you the list of formulas; you write one short, plain-English explanation per formula. No screenshots needed.',
    language: 'English',
    estimatedMinutes: 20,
    tags: ['data', 'excel'],
  },
  {
    title: 'Translate a volunteer welcome email to Spanish',
    shortDescription: 'Translate a 150-word onboarding email into warm, casual Spanish.',
    description:
      'New-volunteer welcome email. Keep it warm, casual, and inclusive. We provide the English source and a glossary of names/places not to translate.',
    language: 'English',
    estimatedMinutes: 10,
    tags: ['translation', 'spanish'],
  },
];

async function findUserByEmail(email: string): Promise<{ $id: string } | null> {
  const res = await users.list([Query.equal('email', email), Query.limit(1)]);
  const user = res.users[0];
  return user ? { $id: user.$id } : null;
}

async function ensureDemoUser(): Promise<string> {
  const existing = await findUserByEmail(demoEmail);
  if (existing) {
    console.log(`✓ Demo NGO user exists (${demoEmail}) → ${existing.$id}`);
    return existing.$id;
  }
  // Create with a long random password — no one signs in as this account;
  // we mutate via admin SDK only.
  const password = typeof globalThis.crypto !== 'undefined' && 'randomUUID' in globalThis.crypto ? globalThis.crypto.randomUUID() : Math.random().toString(36).slice(2);
  const created = await users.create(ID.unique(), demoEmail, undefined, password, demoName);
  console.log(`+ Created demo NGO user ${demoEmail} → ${created.$id}`);
  return created.$id;
}

async function ensureUserPrefs(userId: string): Promise<void> {
  const me = await users.get(userId);
  const next = {
    ...(me?.prefs ?? {}),
    role: 'ngo',
    orgName: demoName,
    bio: 'Hand-picked demo tasks so first-time visitors have something to browse.',
    verificationStatus: 'verified',
  };
  await users.updatePrefs(userId, next);
  console.log(`✓ Prefs set on demo user (role=ngo, orgName=${demoName})`);
}

async function ensureNgoTeamMembership(userId: string): Promise<void> {
  if (!ngoTeamId) {
    console.log('· Skipping NGO team membership (APPWRITE_NGO_TEAM_ID not set)');
    return;
  }
  // teams.createMembership with a known userId is idempotent in practice:
  // Appwrite returns the existing membership rather than creating duplicates.
  // If a strict 409 is returned, swallow it.
  try {
    await teams.createMembership(ngoTeamId, ['ngo'], undefined, userId);
    console.log(`✓ Demo user is in '${ngoTeamId}' team`);
  } catch (err: unknown) {
    const errObj = err as { code?: number; response?: { code?: number }; message?: string };
    const status = errObj?.code ?? errObj?.response?.code;
    if (status === 409) {
      console.log(`✓ Demo user already in '${ngoTeamId}' team`);
    } else {
      console.warn(`! Could not add demo user to '${ngoTeamId}' team:`, errObj?.message ?? err);
    }
  }
}

async function listExistingTasks(orgId: string): Promise<Map<string, string>> {
  // Note: tasks DB column is `orgID` (uppercase D), per src/lib/server/appwrite.ts.
  interface TaskRowItem {
    $id: string;
    title?: string;
  }
  const res = await tables.listRows(dbId, tasksTable, [
    Query.equal('orgID', orgId),
    Query.limit(100),
  ]);
  const rows = (res.rows ?? []) as unknown as TaskRowItem[];
  return new Map<string, string>(
    rows.map((r) => [String(r.title ?? ''), String(r.$id)]),
  );
}

// getTasks() drops any row whose lastActivityAt is 30+ days stale (auto-archive,
// see filterTasksForFeed in src/lib/server/appwrite.ts). Demo tasks never get
// organic activity, so re-running this script must bump lastActivityAt on
// existing rows too — otherwise the feed silently goes empty ~30 days after
// the last seed run, with no error anywhere to point at why.
async function ensureTasks(orgId: string): Promise<{ created: number; refreshed: number }> {
  const existing = await listExistingTasks(orgId);
  let created = 0;
  let refreshed = 0;
  const now = new Date().toISOString();
  for (const t of demoTasks) {
    const existingId = existing.get(t.title);
    if (existingId) {
      await tables.updateRow(dbId, tasksTable, existingId, {
        status: 'active',
        lastActivityAt: now,
      });
      refreshed++;
      continue;
    }
    await tables.createRow(dbId, tasksTable, ID.unique(), {
      title: t.title,
      shortDescription: t.shortDescription,
      description: t.description,
      language: t.language,
      estimatedMinutes: t.estimatedMinutes,
      tags: t.tags,
      orgID: orgId,
      createdAt: now,
      status: 'active',
      maxVolunteers: null,
      deadline: null,
      isVerified: true,
      lastActivityAt: now,
    });
    created++;
  }
  console.log(`✓ Tasks: ${created} created, ${refreshed} refreshed (${demoTasks.length} total)`);
  return { created, refreshed };
}

// ───────────────────────── Demo-recording fixtures ─────────────────────────
// Everything below only runs when SEED_DEMO_PASSWORD is set. It exists so
// e2e/demo can film the closed loop (claim → submit → approve → badge), which
// needs two accounts that can actually sign in through the UI.

/**
 * The claim-approval endpoint checks `task.orgId !== reviewerId` and 403s on a
 * mismatch, so the NGO that approves has to be the same user that owns the
 * seeded tasks — a separate "reviewer" account can't stand in. That means the
 * demo NGO user needs a real password rather than the throwaway random one it
 * gets at creation.
 */
async function ensureDemoNgoPassword(userId: string): Promise<void> {
  await users.updatePassword(userId, demoPassword!);
  console.log(`✓ Demo NGO password set (${demoEmail} can now sign in)`);
}

async function ensureVolunteerUser(): Promise<string> {
  const existing = await findUserByEmail(volunteerEmail);
  let userId: string;
  if (existing) {
    userId = existing.$id;
    await users.updatePassword(userId, demoPassword!);
    console.log(`✓ Demo volunteer exists (${volunteerEmail}) → ${userId}`);
  } else {
    const created = await users.create(
      ID.unique(),
      volunteerEmail,
      undefined,
      demoPassword!,
      volunteerName,
    );
    userId = created.$id;
    console.log(`+ Created demo volunteer ${volunteerEmail} → ${userId}`);
  }

  const me = await users.get(userId);
  await users.updatePrefs(userId, { ...(me?.prefs ?? {}), role: 'volunteer' });

  try {
    await teams.createMembership(volunteerTeamId, ['volunteer'], undefined, userId);
    console.log(`✓ Demo volunteer is in '${volunteerTeamId}' team`);
  } catch (err: unknown) {
    const errObj = err as { code?: number; response?: { code?: number }; message?: string };
    const status = errObj?.code ?? errObj?.response?.code;
    if (status === 409) {
      console.log(`✓ Demo volunteer already in '${volunteerTeamId}' team`);
    } else {
      console.warn(`! Could not add demo volunteer to '${volunteerTeamId}':`, errObj?.message ?? err);
    }
  }

  return userId;
}

/**
 * A 'task-completion' definition awards on any approved task under this org
 * (see evaluateBadgeCriteria). Without one, approval succeeds but mints
 * nothing and the loop demo has no payoff to film. Idempotent by (orgID, label).
 */
async function ensureBadgeDefinition(orgId: string): Promise<void> {
  const res = await tables.listRows(dbId, badgeDefsTable, [
    Query.equal('orgID', orgId),
    Query.equal('label', badgeLabel),
    Query.limit(1),
  ]);
  if ((res.rows ?? []).length > 0) {
    console.log(`✓ Badge definition "${badgeLabel}" exists`);
    return;
  }
  await tables.createRow(dbId, badgeDefsTable, ID.unique(), {
    orgID: orgId,
    label: badgeLabel,
    color: '#F59E0B',
    icon: 'hugeicons:trophy-01',
    criteria: 'task-completion',
    taskID: '',
  });
  console.log(`+ Created badge definition "${badgeLabel}"`);
}

/**
 * Reset the volunteer's loop state so the demo is re-recordable.
 *
 * Two independent reasons this is mandatory, not tidiness:
 *  - processBadgeAwards() skips any label the user already holds, so a second
 *    recording would approve the claim and reveal *no* badge — the payoff shot
 *    silently dies with no error.
 *  - createClaim() has no duplicate guard, so every re-run would stack another
 *    pending card into the NGO's "Awaiting your review" queue.
 */
async function resetDemoLoopState(volunteerId: string): Promise<void> {
  let claims = 0;
  let badges = 0;

  interface RowIdItem {
    $id: string;
  }

  const claimRows = await tables.listRows(dbId, claimsTable, [
    Query.equal('userID', volunteerId),
    Query.limit(100),
  ]);
  for (const row of (claimRows.rows ?? []) as unknown as RowIdItem[]) {
    await tables.deleteRow(dbId, claimsTable, row.$id);
    claims++;
  }

  const badgeRows = await tables.listRows(dbId, badgesTable, [
    Query.equal('userID', volunteerId),
    Query.limit(100),
  ]);
  for (const row of (badgeRows.rows ?? []) as unknown as RowIdItem[]) {
    await tables.deleteRow(dbId, badgesTable, row.$id);
    badges++;
  }

  console.log(`✓ Reset demo volunteer loop state (${claims} claims, ${badges} badges cleared)`);
}

async function seedDemoLoopFixtures(orgId: string): Promise<void> {
  if (!demoPassword) {
    console.log(
      '\n· Skipping demo-recording fixtures (SEED_DEMO_PASSWORD not set).\n' +
        '  Set it in .env to seed sign-in-able demo accounts for `bun run demo`.',
    );
    return;
  }
  console.log('\nDemo-recording fixtures:');
  await ensureDemoNgoPassword(orgId);
  const volunteerId = await ensureVolunteerUser();
  await ensureBadgeDefinition(orgId);
  await resetDemoLoopState(volunteerId);
}

async function main() {
  console.log(`Seeding ${endpoint} / ${projectId}\n`);
  const userId = await ensureDemoUser();
  await ensureUserPrefs(userId);
  await ensureNgoTeamMembership(userId);
  const stats = await ensureTasks(userId);
  await seedDemoLoopFixtures(userId);
  console.log(
    `\nDone. Demo NGO userId: ${userId}. Tasks created: ${stats.created}, refreshed: ${stats.refreshed}.`,
  );
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
