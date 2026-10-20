// Records the site footage that the README GIFs (docs/demos/), the social cut (ui-demo/) and
// the trailer (trailer/) are cut from.
//
// A screen recording drops frames, so the page runs on Playwright's fake clock instead: it
// owns requestAnimationFrame, timers and performance.now, and every frame is stepped and
// screenshotted. CSS animations run on the compositor's clock, so they are paused on sight
// and seeked to the same fake time. The result is a clean 30 fps take on any machine.
//
// The takes run against a local preview on the in-memory store (the same harness the browser
// suites use), seeded here with the eight demo tasks from scripts/seed.ts, five fictional
// nonprofits and a quilt of approved claims. Nothing touches Appwrite.
//
//   bun run build && node e2e/capture/footage.mjs [take ...] [--out dir] [--base url]
//
// With no takes named it records all of them. With no --base it starts the preview itself.

import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FPS = 30;
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');

const DEVICES = {
  desktop: { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 },
  // 360 by 640 at 3x is exactly 1080 by 1920, the social cut's frame.
  phone: { viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }
};

// ---------- seeding ----------

const NONPROFITS = [
  { ns: 'clinic', orgName: 'Riverside Community Clinic', patch: { label: 'Clinic helper', color: '#FF6B6B', icon: 'quilt:heart' } },
  { ns: 'archive', orgName: 'Town History Archive', patch: { label: 'Archive keeper', color: '#3B4A8C', icon: 'quilt:book' } },
  { ns: 'green', orgName: 'Green Streets Project', patch: { label: 'Street greener', color: '#8DAA8B', icon: 'quilt:leaf' } },
  { ns: 'literacy', orgName: 'Literacy Circle', patch: { label: 'Word weaver', color: '#F2B84B', icon: 'quilt:pencil' } },
  { ns: 'neighbors', orgName: 'New Neighbors Network', patch: { label: 'Good neighbor', color: '#7A4E7E', icon: 'quilt:house' } }
];

const TASKS = [
  { org: 0, title: 'Translate a medical flyer into Spanish', shortDescription: 'Help patients understand a one-page flyer about diabetes screenings.', description: 'Translate a single-page patient flyer (about 250 words) into clear, accessible Spanish. Keep medical terms accurate and the tone friendly.', estimatedMinutes: 15, tags: ['translation', 'spanish', 'health'] },
  { org: 1, title: 'Tag historical photos for an archive', shortDescription: 'Add searchable tags (year, place, subject) to a small batch of photos.', description: 'A community history archive needs tags on 20 scanned photos so they show up in search. We provide the photos and a tag list.', estimatedMinutes: 5, tags: ['data', 'history'] },
  { org: 2, title: 'Draft three social-post captions for an event', shortDescription: 'Write three short captions promoting a community clean-up day.', description: 'Three captions of about 50 words each. We provide the event details and tone notes.', estimatedMinutes: 10, tags: ['design'] },
  { org: 3, title: 'Audit alt-text on a learning resource', shortDescription: 'Review the alt-text for about 15 images on an open lesson page.', description: 'Check each image and confirm the alt-text is accurate, or suggest a better short description.', estimatedMinutes: 20, tags: ['design', 'data'] },
  { org: 1, title: 'Categorize community Q&A entries', shortDescription: 'Sort 30 forum questions into 6 topics.', description: 'For each question, pick the best topic. Edge cases get a short note.', estimatedMinutes: 15, tags: ['data'] },
  { org: 2, title: 'Proofread a plain-language climate explainer', shortDescription: 'Catch typos and awkward phrasing in a 600-word explainer.', description: 'A short explainer for high-school readers. Proofread for grammar, clarity and jargon.', estimatedMinutes: 25, tags: ['environment'] },
  { org: 4, title: 'Build a beginner Excel formula reference', shortDescription: 'Write one-line explanations for 10 common Excel formulas.', description: 'For a financial-literacy workshop. One short, plain explanation per formula.', estimatedMinutes: 20, tags: ['data', 'excel'] },
  { org: 0, title: 'Translate a volunteer welcome email to Spanish', shortDescription: 'Translate a 150-word welcome email into warm, casual Spanish.', description: 'Keep it warm, casual and inclusive. We provide the source and a glossary.', estimatedMinutes: 10, tags: ['translation', 'spanish'] }
];

async function session(base, role, namespace) {
  const res = await fetch(`${base}/api/test/a11y`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'session', role, namespace })
  });
  if (!res.ok) throw new Error(`session ${role}/${namespace}: ${res.status}`);
  const cookie = res.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
  return { cookie, userId: (await res.json()).userId, namespace, role };
}

async function call(base, s, method, path, body) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { cookie: s.cookie, 'content-type': 'application/json', origin: base },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${text}`);
  return text ? JSON.parse(text) : {};
}

/** Nonprofits, tasks, and eleven approved claims, so the quilt has patches before filming. */
async function seed(base) {
  const admin = await session(base, 'admin', 'film');
  const orgs = [];
  for (const np of NONPROFITS) {
    const s = await session(base, 'ngo', np.ns);
    await call(base, s, 'POST', '/api/verifications', { orgName: np.orgName, country: 'US', taxId: '00-0000000' });
    await call(base, admin, 'POST', `/api/verifications/${s.userId}/approve`);
    await call(base, s, 'POST', '/api/badges/manage', { ...np.patch, criteria: 'task-completion' });
    orgs.push(s);
  }
  const posted = [];
  for (const { org, ...body } of TASKS) posted.push((await call(base, orgs[org], 'POST', '/api/tasks', { ...body, language: 'English' })).id);
  const volunteers = [];
  for (const ns of ['ana', 'ben', 'chi', 'dev', 'eli', 'fay']) volunteers.push(await session(base, 'volunteer', ns));
  for (let i = 0; i < 11; i++) {
    const t = (i * 3 + 1) % posted.length;
    const claim = await call(base, volunteers[i % volunteers.length], 'POST', `/api/tasks/${posted[t]}/claim`, {
      proofUrl: `https://example.org/proof/${i + 1}`,
      notes: 'Finished and checked against the brief.'
    });
    await call(base, orgs[TASKS[t].org], 'POST', `/api/claims/${claim.id}/approve`);
  }
  return { flyer: posted[0] };
}

// ---------- the takes ----------

// Each take is a page load and a list of [seconds, action, ...args], timed from the load on
// the fake clock. `as` signs the take in as a harness person first.
const TAKES = {
  // A first visit: the quilt laid out, pinned and quilted, then a slow look around.
  entrance: {
    device: 'desktop', path: '/en', seconds: 13, fresh: true,
    actions: [[8.2, 'glide', 960, 620, 0.6], [8.9, 'drag', -520, -260, 2.6]]
  },

  // A block lifts off the quilt and unfolds into a panel, then folds back into its hole.
  unfold: {
    device: 'desktop', path: '/en', seconds: 12,
    actions: [
      [0.6, 'glideTo', '[data-block="how"] .sig__link', 1.0],
      [1.9, 'click'],
      [4.2, 'wheel', 0, 380, 1.4],
      [6.6, 'wheel', 0, 340, 1.2],
      [8.6, 'glideTo', '[data-fold]', 0.9],
      [9.8, 'click']
    ]
  },

  // A volunteer filters the feed to fifteen minutes, opens a task and pins their work to it.
  claim: {
    device: 'desktop', path: '/en/tasks', seconds: 27, as: ['volunteer', 'sam'],
    actions: [
      [0.8, 'glideTo', 'label:has(input[name="max"]):nth-of-type(2)', 0.9],
      [2.0, 'click'],
      [3.4, 'glideTo', 'a.swatch-card__link >> text=Translate a medical flyer into Spanish', 1.0],
      [4.7, 'click'],
      [7.6, 'glideTo', 'a.patch-btn >> text=Claim this task', 1.0],
      [8.9, 'click'],
      [10.6, 'glideTo', '#proof', 0.8],
      [11.5, 'click'],
      [11.8, 'type', 'https://docs.google.com/document/d/flyer-es', 1.8],
      [14.0, 'glideTo', '#notes', 0.7],
      [14.8, 'click'],
      [15.0, 'type', 'Kept the medical terms from the clinic glossary. Please check the dosage line.', 3.2],
      [18.8, 'glideTo', 'button[type="submit"]', 0.9],
      [20.0, 'click']
    ]
  },

  // The clinic reads the work and sews it in.
  approve: {
    device: 'desktop', path: '/en/dashboard', seconds: 10, as: ['ngo', 'clinic'],
    actions: [
      [1.0, 'glideTo', 'button >> text=Approve and sew in', 1.0],
      [2.4, 'click']
    ]
  },

  // The new patch on the quilt: the community block, a patch's label, and the whole quilt.
  sewn: {
    device: 'desktop', path: '/en', seconds: 14,
    actions: [
      [1.4, 'glideTo', '[data-block="community"] .quilt__patch >> nth=0', 1.2],
      [4.2, 'glideTo', '[data-block="community"] .quilt__patch >> nth=4', 0.9],
      [6.4, 'glideTo', '.community__link', 0.9],
      [7.6, 'click']
    ]
  },

  // The same quilt in Arabic, right to left, then by lamplight.
  languages: {
    device: 'desktop', path: '/en', seconds: 14,
    actions: [
      [0.3, 'glide', 1300, 760, 0.5],
      [0.9, 'dragTo', '[data-block="label"]', 1.1],
      [2.4, 'glideTo', '.langs summary', 0.9],
      [3.3, 'click'],
      [4.4, 'glideTo', '.langs a[hreflang="ar"]', 0.7],
      [5.3, 'click'],
      [8.0, 'glideTo', '.theme-toggle', 1.0],
      [9.3, 'click']
    ]
  },

  // The phone: the quilt read top to bottom, then a block opened as a sheet.
  'phone-path': {
    device: 'phone', path: '/en', seconds: 14, fresh: true,
    actions: [[7.5, 'swipe', -520, 1.6], [10.0, 'tap', '[data-block="tasks"] .sig__link']]
  },

  // The phone: a volunteer claims a task from the feed.
  'phone-claim': {
    device: 'phone', path: '/en/tasks', seconds: 20, as: ['volunteer', 'sam-phone'],
    actions: [
      [1.2, 'tap', 'a.swatch-card__link >> text=Translate a volunteer welcome email to Spanish'],
      [4.2, 'tap', 'a.patch-btn >> text=Claim this task'],
      [6.6, 'tap', '#proof'],
      [6.9, 'type', 'https://docs.google.com/document/d/welcome-es', 1.8],
      [9.2, 'tap', '#notes'],
      [9.4, 'type', 'Kept it casual, the way the glossary asks.', 2.0],
      [12.2, 'tap', 'button[type="submit"]']
    ]
  }
};

// ---------- recording ----------

// A visible cursor: the screenshots never show the real one.
function cursorScript() {
  const add = () => {
    const dot = document.createElement('div');
    dot.id = 'film-cursor';
    dot.style.cssText =
      'position:fixed;left:0;top:0;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;background:rgb(28 31 59 / 0.82);box-shadow:0 0 0 3px #fff,0 4px 12px rgb(0 0 0 / 0.3);z-index:2147483647;pointer-events:none;transform:translate(-100px,-100px)';
    document.documentElement.appendChild(dot);
    let x = -100;
    let y = -100;
    let down = false;
    const paint = () => (dot.style.transform = `translate(${x}px,${y}px) scale(${down ? 0.72 : 1})`);
    addEventListener('mousemove', (e) => ((x = e.clientX), (y = e.clientY), paint()), true);
    addEventListener('mousedown', () => ((down = true), paint()), true);
    addEventListener('mouseup', () => ((down = false), paint()), true);
  };
  new MutationObserver((_, watch) => {
    if (!document.documentElement) return;
    watch.disconnect();
    add();
  }).observe(document, { childList: true });
}

async function centre(page, selector) {
  const loc = page.locator(selector).first();
  await loc.scrollIntoViewIfNeeded().catch(() => {});
  const box = await loc.boundingBox();
  if (!box) throw new Error(`${selector} is not on screen`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

async function record(browser, base, name, take, outDir) {
  const context = await browser.newContext({ ...DEVICES[take.device], reducedMotion: 'no-preference' });
  if (take.as) {
    const res = await context.request.post(`${base}/api/test/a11y`, { data: { action: 'session', role: take.as[0], namespace: take.as[1] } });
    if (!res.ok()) throw new Error(`${name}: harness session ${res.status()}`);
  }
  const page = await context.newPage();
  page.on('pageerror', (e) => console.error(`${name}: pageerror ${e.message}`));
  await page.addInitScript((fresh) => {
    if (!fresh) sessionStorage.setItem('mm-entered', '1');
    const css = document.createElement('style');
    css.textContent = '*, *::before, *::after { animation-play-state: paused !important; }';
    new MutationObserver((_, watch) => {
      if (!document.documentElement) return;
      watch.disconnect();
      document.documentElement.appendChild(css);
    }).observe(document, { childList: true });
    const seen = new WeakMap();
    window.__seekCss = (ms) => {
      for (const a of document.getAnimations()) {
        let at = seen.get(a);
        if (!at) {
          a.pause();
          at = { since: ms, from: Number(a.currentTime) || 0 };
          seen.set(a, at);
        }
        a.currentTime = at.from + (ms - at.since);
      }
    };
  }, !!take.fresh);
  if (take.device === 'desktop') await page.addInitScript(cursorScript);
  await page.clock.install({ time: new Date('2026-10-19T15:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-19T15:00:01Z'));
  await page.goto(base + take.path, { waitUntil: 'load' });

  const out = resolve(outDir, `${name}.mp4`);
  const ffmpeg = spawn(
    'ffmpeg',
    ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out],
    { stdio: ['pipe', 'inherit', 'inherit'] }
  );
  const done = new Promise((ok, fail) => ffmpeg.on('close', (code) => (code === 0 ? ok() : fail(new Error(`ffmpeg exited ${code}`)))));

  const mouse = { x: DEVICES[take.device].viewport.width * 0.62, y: DEVICES[take.device].viewport.height * 0.7 };
  if (take.device === 'desktop') await page.mouse.move(mouse.x, mouse.y);
  // Moves that play out over several frames: glides, drags, wheels, swipes and typing.
  let running = [];
  const start = async (t, [, kind, ...args]) => {
    if (kind === 'click') return page.mouse.click(mouse.x, mouse.y);
    if (kind === 'tap') {
      const { x, y } = await centre(page, args[0]);
      return page.touchscreen.tap(x, y);
    }
    if (kind === 'dragTo') {
      // Drag the quilt until the block is in the middle of the window.
      const box = await page.locator(args[0]).first().boundingBox();
      const { width, height } = DEVICES[take.device].viewport;
      const dx = width / 2 - (box.x + box.width / 2);
      const dy = height / 2 - (box.y + box.height / 2);
      return start(t, [t, 'drag', dx, dy, args[1]]);
    }
    if (kind === 'glide' || kind === 'glideTo') {
      const to = kind === 'glide' ? { x: args[0], y: args[1] } : await centre(page, args[0]);
      const from = { ...mouse };
      const secs = kind === 'glide' ? args[2] : args[1];
      running.push({ t, secs, step: (k) => ((mouse.x = from.x + (to.x - from.x) * ease(k)), (mouse.y = from.y + (to.y - from.y) * ease(k)), page.mouse.move(mouse.x, mouse.y)) });
      return;
    }
    if (kind === 'drag') {
      const from = { ...mouse };
      await page.mouse.down();
      running.push({
        t, secs: args[2],
        step: async (k) => {
          mouse.x = from.x + args[0] * ease(k);
          mouse.y = from.y + args[1] * ease(k);
          await page.mouse.move(mouse.x, mouse.y);
          if (k >= 1) await page.mouse.up();
        }
      });
      return;
    }
    if (kind === 'wheel') {
      let sent = 0;
      running.push({ t, secs: args[2], step: async (k) => { const want = args[1] * ease(k); await page.mouse.wheel(0, want - sent); sent = want; } });
      return;
    }
    if (kind === 'swipe') {
      let sent = 0;
      running.push({ t, secs: args[1], step: async (k) => { const want = -args[0] * ease(k); await page.evaluate((d) => window.scrollBy(0, d), want - sent); sent = want; } });
      return;
    }
    if (kind === 'type') {
      let typed = 0;
      running.push({ t, secs: args[1], step: async (k) => { const want = Math.round(args[0].length * k); if (want > typed) await page.keyboard.type(args[0].slice(typed, want)); typed = want; } });
      return;
    }
    throw new Error(`unknown action ${kind}`);
  };

  const queue = [...take.actions].sort((a, b) => a[0] - b[0]);
  const frames = Math.round(take.seconds * FPS);
  let elapsed = 0;
  for (let i = 0; i < frames; i++) {
    const t = i / FPS;
    while (queue.length && queue[0][0] <= t) await start(t, queue.shift());
    for (const r of running) await r.step(Math.min(1, (t - r.t) / r.secs));
    running = running.filter((r) => t - r.t < r.secs);
    const target = Math.round(((i + 1) * 1000) / FPS);
    await page.clock.runFor(target - elapsed);
    elapsed = target;
    await page.evaluate((ms) => window.__seekCss(ms), 1000 + elapsed);
    const png = await page.screenshot({ type: 'png', animations: 'allow', caret: 'initial' });
    if (!ffmpeg.stdin.write(png)) await new Promise((r) => ffmpeg.stdin.once('drain', r));
    if (i % (FPS * 5) === 0) console.log(`${name}: ${t.toFixed(0)} s of ${take.seconds}`);
  }
  ffmpeg.stdin.end();
  await done;
  await context.close();
  console.log(`${name}: wrote ${out}`);
}

// ---------- main ----------

const argv = process.argv.slice(2);
const flag = (f) => (argv.includes(f) ? argv.splice(argv.indexOf(f), 2)[1] : undefined);
const outDir = resolve(flag('--out') ?? resolve(ROOT, 'e2e/recordings/footage'));
let base = flag('--base');
const names = argv.length ? argv : Object.keys(TAKES);
mkdirSync(outDir, { recursive: true });

let server;
if (!base) {
  const port = 4610;
  base = `http://127.0.0.1:${port}`;
  server = spawn('bun', ['run', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
    cwd: ROOT,
    stdio: 'ignore',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      PLAYWRIGHT_A11Y_HARNESS: '1',
      APPWRITE_ENDPOINT: '',
      APPWRITE_PROJECT_ID: '',
      APPWRITE_API_KEY: '',
      PLUNK_SECRET_KEY: '',
      PUBLIC_APPWRITE_ENDPOINT: 'https://appwrite.test',
      PUBLIC_APPWRITE_PROJECT_ID: 'film'
    }
  });
  for (let i = 0; ; i++) {
    try {
      if ((await fetch(`${base}/en`)).ok) break;
    } catch {}
    if (i > 120) throw new Error('preview did not start');
    await new Promise((r) => setTimeout(r, 500));
  }
}

try {
  await seed(base);
  const browser = await chromium.launch();
  for (const name of names) {
    if (!TAKES[name]) throw new Error(`no take called ${name}`);
    await record(browser, base, name, TAKES[name], outDir);
  }
  await browser.close();
} finally {
  server?.kill();
}
