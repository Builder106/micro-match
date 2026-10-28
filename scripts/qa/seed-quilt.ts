/**
 * Local QA data for the community quilt. Runs only against a local preview started with
 * NODE_ENV=development PLAYWRIGHT_A11Y_HARNESS=1 and empty Appwrite variables, so every
 * write lands in the in-memory store. It never touches staging or production.
 *
 *   BASE_URL=http://127.0.0.1:4173 bun run scripts/qa/seed-quilt.ts [--approve 11]
 *
 * It signs in harness nonprofits, submits and approves their verification, designs their
 * patches, posts the eight demo tasks from scripts/seed.ts, and has harness volunteers claim
 * tasks. Each nonprofit then approves some of the claims, so the quilt has real patches.
 */

export {};

const base = process.env.BASE_URL ?? 'http://127.0.0.1:4173';
if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(base)) {
  console.error(`Refusing to seed ${base}: QA data only goes to a local preview.`);
  process.exit(1);
}
const approveArg = process.argv.indexOf('--approve');
const approveCount = approveArg > -1 ? Number(process.argv[approveArg + 1]) : 11;

type Session = { cookie: string; userId: string };

async function session(role: 'ngo' | 'volunteer' | 'admin', namespace: string): Promise<Session> {
  const res = await fetch(`${base}/api/test/a11y`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'session', role, namespace }),
  });
  if (!res.ok)
    throw new Error(
      `session ${role}/${namespace}: ${res.status} (is PLAYWRIGHT_A11Y_HARNESS=1 set?)`,
    );
  const cookie = res.headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
    .join('; ');
  const body = (await res.json()) as { userId: string };
  return { cookie, userId: body.userId };
}

async function call<T>(s: Session, method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { cookie: s.cookie, 'content-type': 'application/json', origin: base },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${text}`);
  return (text ? JSON.parse(text) : {}) as T;
}

const nonprofits = [
  {
    ns: 'clinic',
    orgName: 'Riverside community clinic (QA fixture)',
    patch: { label: 'Clinic helper', color: '#FF6B6B', icon: 'quilt:heart' },
  },
  {
    ns: 'archive',
    orgName: 'Town history archive (QA fixture)',
    patch: { label: 'Archive keeper', color: '#3B4A8C', icon: 'quilt:book' },
  },
  {
    ns: 'green',
    orgName: 'Green streets project (QA fixture)',
    patch: { label: 'Street greener', color: '#8DAA8B', icon: 'quilt:leaf' },
  },
  {
    ns: 'literacy',
    orgName: 'Literacy circle (QA fixture)',
    patch: { label: 'Word weaver', color: '#F2B84B', icon: 'quilt:pencil' },
  },
  { ns: 'plain', orgName: 'New neighbors network (QA fixture)', patch: null },
];

// The eight evergreen demo tasks from scripts/seed.ts, spread across the nonprofits.
const tasks = [
  {
    org: 0,
    title: 'Translate a medical flyer into Spanish',
    shortDescription: 'Help patients understand a one-page flyer about diabetes screenings.',
    description:
      'Translate a single-page patient flyer (~250 words) into clear, accessible Spanish. The original is a plain-language English version we use at clinic intake. Keep medical terms accurate and tone friendly.',
    estimatedMinutes: 15,
    tags: ['translation', 'spanish', 'health'],
  },
  {
    org: 1,
    title: 'Tag historical photos for an archive',
    shortDescription: 'Add searchable tags (year, location, subject) to a small batch of photos.',
    description:
      'A community history archive needs tags on 20 scanned photos so they show up in search. We provide the photo set and a tag taxonomy; you fill in best-guess metadata.',
    estimatedMinutes: 5,
    tags: ['data', 'history'],
  },
  {
    org: 2,
    title: 'Draft three social-post captions for an event',
    shortDescription: 'Write three short captions promoting a community clean-up day.',
    description:
      'Three captions, ~50 words each, suitable for Instagram, LinkedIn, and X. We provide the event details and tone notes; you write the variations.',
    estimatedMinutes: 10,
    tags: ['design'],
  },
  {
    org: 3,
    title: 'Audit alt-text on a learning resource',
    shortDescription: 'Review alt-text for ~15 images on an open-access lesson page.',
    description:
      'Open the linked page, check each image, and either confirm the alt-text is accurate or suggest a better short description. Output is a simple table you fill in.',
    estimatedMinutes: 20,
    tags: ['design', 'data'],
  },
  {
    org: 1,
    title: 'Categorize community Q&A entries',
    shortDescription: 'Sort 30 forum questions into 6 topic buckets.',
    description:
      'We have 30 community questions and a 6-topic taxonomy. For each question, pick the best topic. Edge cases get a short note explaining your choice.',
    estimatedMinutes: 15,
    tags: ['data'],
  },
  {
    org: 2,
    title: 'Proofread a plain-language climate explainer',
    shortDescription: 'Catch typos and awkward phrasing in a 600-word explainer.',
    description:
      'A short explainer aimed at high-school readers. We need a careful proofread for grammar, clarity, and any jargon that should be replaced with plainer language.',
    estimatedMinutes: 25,
    tags: ['environment'],
  },
  {
    org: 4,
    title: 'Build a beginner Excel formula reference',
    shortDescription: 'Write one-line explanations for 10 common Excel formulas.',
    description:
      'For a financial-literacy workshop. We give you the list of formulas; you write one short, plain-English explanation per formula. No screenshots needed.',
    estimatedMinutes: 20,
    tags: ['data', 'excel'],
  },
  {
    org: 0,
    title: 'Translate a volunteer welcome email to Spanish',
    shortDescription: 'Translate a 150-word onboarding email into warm, casual Spanish.',
    description:
      'New-volunteer welcome email. Keep it warm, casual, and inclusive. We provide the English source and a glossary of names/places not to translate.',
    estimatedMinutes: 10,
    tags: ['translation', 'spanish'],
  },
];

const admin = await session('admin', 'qa');
const orgs: Session[] = [];
for (const np of nonprofits) {
  const s = await session('ngo', np.ns);
  await call(s, 'POST', '/api/verifications', {
    orgName: np.orgName,
    country: 'US',
    taxId: '00-0000000',
  });
  await call(admin, 'POST', `/api/verifications/${s.userId}/approve`);
  if (np.patch)
    await call(s, 'POST', '/api/badges/manage', { ...np.patch, criteria: 'task-completion' });
  orgs.push(s);
}

const posted: { id: string; org: number }[] = [];
for (const t of tasks) {
  const { org, ...body } = t;
  const created = await call<{ id: string }>(orgs[org], 'POST', '/api/tasks', {
    ...body,
    language: 'English',
  });
  posted.push({ id: created.id, org });
}

// Volunteers claim tasks round-robin; nonprofits approve the first `approveCount` claims.
const volunteers = await Promise.all(
  ['ana', 'ben', 'chi', 'dev', 'eli', 'fay'].map((ns) => session('volunteer', ns)),
);
const claims: { id: string; org: number }[] = [];
for (let i = 0; i < 16; i++) {
  const task = posted[(i * 3) % posted.length];
  const v = volunteers[i % volunteers.length];
  const claim = await call<{ id: string }>(v, 'POST', `/api/tasks/${task.id}/claim`, {
    proofUrl: `https://example.org/proof/${i + 1}`,
    notes: 'Finished and double-checked against the brief.',
  });
  claims.push({ id: claim.id, org: task.org });
}
for (const c of claims.slice(0, approveCount)) {
  await call(orgs[c.org], 'POST', `/api/claims/${c.id}/approve`);
}

console.log(
  `Seeded ${posted.length} tasks, ${claims.length} claims, ${Math.min(approveCount, claims.length)} approved.`,
);
