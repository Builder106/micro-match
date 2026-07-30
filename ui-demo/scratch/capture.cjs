const puppeteer = require('puppeteer');

const BASE = 'https://trymicromatch.vercel.app';
const OUT = __dirname + '/../public';

const VOLUNTEER = { email: 'jane@example.com', password: process.env.SEED_DEMO_PASSWORD };
const NGO = { email: 'demo@micromatch.app', password: process.env.SEED_DEMO_PASSWORD };

async function settle(page, ms = 3000) {
  await new Promise((r) => setTimeout(r, ms));
}

async function login(page, { email, password }) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2', timeout: 90000 });
  // dotlottie-player only renders after onMount resolves — presence proves hydration,
  // otherwise the submit does a native GET with the password in the URL.
  await page.waitForSelector('dotlottie-player', { timeout: 30000 }).catch(() => {});
  await settle(page, 1500);
  await page.type('input[name="email"]', email, { delay: 20 });
  await page.type('input[name="password"]', password, { delay: 20 });
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  await settle(page, 2000);
}

async function logout(page) {
  await page.goto(`${BASE}/api/auth/logout`, { waitUntil: 'networkidle2' }).catch(() => {});
  await page.deleteCookie(...(await page.cookies(BASE)));
}

async function shoot(page, path, out, ms = 3000) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle2', timeout: 90000 });
  await settle(page, ms);
  await page.screenshot({ path: `${OUT}/${out}` });
  console.log('captured', out, '←', path, page.url());
}

(async () => {
  if (!VOLUNTEER.password) throw new Error('SEED_DEMO_PASSWORD not set');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });

  // Public pages
  await shoot(page, '/', 'mm_home.png', 4000);
  await shoot(page, '/tasks', 'mm_tasks.png', 4000);

  // Volunteer pages
  await login(page, VOLUNTEER);
  await shoot(page, '/dashboard', 'mm_dashboard.png', 4000);
  await logout(page);

  // NGO pages
  await login(page, NGO);
  await shoot(page, '/org', 'mm_org.png', 4000);
  await shoot(page, '/badges/manage', 'mm_badges_manage.png', 4000);
  await shoot(page, '/badges/analytics', 'mm_badges_analytics.png', 4000);
  await shoot(page, '/admin/verifications', 'mm_admin_verifications.png', 4000);

  await browser.close();
})();
