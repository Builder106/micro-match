import { mkdirSync, writeFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { seedNonprofit, signInAs, type Seeded } from './harness';

// The WCAG 2.2 AA gate (docs/WCAG-2.2-AA-AUDIT-GUIDE.md): axe on every surface in every
// locale and both themes, plus the checks axe cannot make: keyboard paths, focus visibility
// and obstruction, target size, reflow, text spacing, page language and forced colors.
// Each axe result is written to test-results/a11y/ as evidence for the matrix.
//
// Axe reports text over the quilt's pieced fabric as `incomplete` for color-contrast: it
// cannot read a background made of SVG pieces. Those nodes are measured here instead, from
// the rendered pixels: the text is hidden, the area behind it is screenshotted, and the
// worst-case ratio between the text color and those pixels must meet AA.

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const LOCALES = ['en', 'es', 'fr', 'de', 'pt', 'zh', 'ar'] as const;
const PUBLIC = [
  '/', '/how-it-works', '/for-volunteers', '/for-nonprofits', '/impact', '/about', '/contact', '/help', '/docs', '/docs/api',
  '/privacy', '/terms', '/cookies', '/contents', '/not-a-block', '/tasks', '/login', '/signup', '/forgot-password', '/reset-password'
];
const at = (locale: string, path: string) => `/${locale}${path === '/' ? '' : path}`;

let seeded: Seeded;

test.beforeAll(async ({ browser }) => {
  seeded = await seedNonprofit(browser, 'a11y', [
    { title: 'Check alt text on a donation page', minutes: 10, tags: ['accessibility'] },
    { title: 'Translate a clinic sign-up form', minutes: 20, tags: ['translation'] }
  ]);
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('mm-still', '1');
    sessionStorage.setItem('mm-entered', '1');
  });
});

async function axe(page: Page, label: string) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  mkdirSync('test-results/a11y', { recursive: true });
  const file = `test-results/a11y/${label.replace(/[^a-z0-9]+/gi, '_')}.json`;
  writeFileSync(file, JSON.stringify({ url: page.url(), violations: results.violations, incomplete: results.incomplete, passes: results.passes.length }, null, 2));
  const brief = (items: typeof results.violations) =>
    items.map((v) => `${v.id}: ${v.nodes.slice(0, 4).map((n) => n.target.join(' ')).join(' | ')}`).join('\n');
  expect(results.violations, `${label} violations\n${brief(results.violations)}`).toEqual([]);
  const measured: { target: string; ratio: number | null; needed: number | null }[] = [];
  const left = [];
  for (const item of results.incomplete) {
    if (item.id !== 'color-contrast') {
      left.push(item);
      continue;
    }
    for (const node of item.nodes) {
      const target = node.target.join(' ');
      const m = await measureContrast(page, target);
      measured.push(m ? { target, ...m } : { target, ratio: null, needed: null });
    }
  }
  writeFileSync(file.replace('.json', '.contrast.json'), JSON.stringify(measured, null, 2));
  // A null ratio is text that is inert, covered or hidden, which is recorded but not measured.
  const low = measured.filter((m) => m.ratio !== null && m.needed !== null && m.ratio < m.needed);
  expect(low, `${label} measured contrast below AA`).toEqual([]);
  expect(left, `${label} needs review\n${brief(left)}`).toEqual([]);
}

/** The worst-case contrast between an element's text and the rendered pixels behind it. */
async function measureContrast(page: Page, selector: string) {
  const el = page.locator(selector).first();
  if (!(await el.isVisible())) return null;
  // Text below the fold of a panel is read where a person would read it: scrolled into view.
  await el.scrollIntoViewIfNeeded().catch(() => {});
  const info = await el.evaluate((node) => {
    const s = getComputedStyle(node);
    const size = parseFloat(s.fontSize);
    const bold = Number(s.fontWeight) >= 700;
    const large = size >= 24 || (bold && size >= 18.66);
    // Text nodes exclude inline logos from the contrast sample.
    const range = document.createRange();
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    const rects: DOMRect[] = [];
    while (walker.nextNode()) {
      const text = walker.currentNode;
      if (!text.textContent?.trim()) continue;
      range.selectNodeContents(text);
      rects.push(...[...range.getClientRects()].filter((r) => r.width > 1 && r.height > 1));
    }
    if (!rects.length) return null;
    const box = {
      x: Math.max(0, Math.min(...rects.map((r) => r.left))),
      y: Math.max(0, Math.min(...rects.map((r) => r.top))),
      right: Math.min(innerWidth, Math.max(...rects.map((r) => r.right))),
      bottom: Math.min(innerHeight, Math.max(...rects.map((r) => r.bottom)))
    };
    // Inert or covered text is not presented to anyone, so it has no contrast to meet.
    const mid = document.elementFromPoint((box.x + box.right) / 2, (box.y + box.bottom) / 2);
    if (node.closest('[inert]') || !mid || !(node.contains(mid) || mid.contains(node))) return null;
    const color = s.color;
    // Hide every glyph on the page, not just this element's, so a tightly leaded neighbor
    // line does not read as background.
    const hide = document.createElement('style');
    hide.id = 'measure-hide-text';
    hide.textContent = '* { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; }';
    document.head.appendChild(hide);
    return { color, needed: large ? 3 : 4.5, clip: { x: box.x, y: box.y, width: box.right - box.x, height: box.bottom - box.y } };
  });
  if (!info) return null;
  const shot = info.clip.width > 0 && info.clip.height > 0 ? await page.screenshot({ clip: info.clip, animations: 'disabled' }) : null;
  await page.evaluate(() => {
    document.getElementById('measure-hide-text')?.remove();
  });
  if (!shot) return null;
  const ratio = await page.evaluate(
    async ({ png, color }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${png}`;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const g = c.getContext('2d')!;
      g.drawImage(img, 0, 0);
      const px = g.getImageData(0, 0, c.width, c.height).data;
      const lin = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      const lum = (r: number, gg: number, b: number) => 0.2126 * lin(r) + 0.7152 * lin(gg) + 0.0722 * lin(b);
      const [r, gg, b] = color.match(/[\d.]+/g)!.map(Number);
      const text = lum(r, gg, b);
      const ratios: number[] = [];
      for (let i = 0; i < px.length; i += 4) {
        const bg = lum(px[i], px[i + 1], px[i + 2]);
        ratios.push((Math.max(bg, text) + 0.05) / (Math.min(bg, text) + 0.05));
      }
      ratios.sort((a, b) => a - b);
      // The 2nd percentile: the worst background the text sits on, ignoring stray antialiased pixels.
      return ratios[Math.floor(ratios.length * 0.02)];
    },
    { png: shot.toString('base64'), color: info.color }
  );
  return { ratio: Math.round(ratio * 100) / 100, needed: info.needed };
}

async function dark(page: Page) {
  await page.emulateMedia({ colorScheme: 'dark' });
}

test.describe('axe, public surfaces', () => {
  for (const locale of LOCALES) {
    for (const path of PUBLIC) {
      test(`${at(locale, path)} light`, async ({ page }) => {
        await page.goto(at(locale, path));
        await axe(page, `${locale}${path}-light`);
      });
    }
  }
  for (const path of PUBLIC) {
    test(`${at('en', path)} dark`, async ({ page }) => {
      await dark(page);
      await page.goto(at('en', path));
      await axe(page, `en${path}-dark`);
    });
  }
  for (const width of [390]) {
    for (const path of ['/', '/tasks', '/help', '/login']) {
      test(`${at('en', path)} phone`, async ({ page }) => {
        await page.setViewportSize({ width, height: 844 });
        await page.goto(at('en', path));
        await axe(page, `en${path}-phone`);
      });
    }
  }
});

test.describe('axe, signed-in surfaces and states', () => {
  const surfaces: { name: string; role: 'volunteer' | 'ngo' | 'admin'; path: () => string }[] = [
    { name: 'volunteer dashboard', role: 'volunteer', path: () => '/dashboard' },
    { name: 'volunteer profile', role: 'volunteer', path: () => '/profile' },
    { name: 'task as volunteer', role: 'volunteer', path: () => `/task/${seeded.taskIds[0]}` },
    { name: 'claim form', role: 'volunteer', path: () => `/task/${seeded.taskIds[0]}/claim` },
    { name: 'nonprofit dashboard', role: 'ngo', path: () => '/dashboard' },
    { name: 'post a task', role: 'ngo', path: () => '/org' },
    { name: 'design a patch', role: 'ngo', path: () => '/badges/manage' },
    { name: 'patch stats', role: 'ngo', path: () => '/badges/analytics' },
    { name: 'nonprofit profile', role: 'ngo', path: () => '/profile' },
    { name: 'verification queue', role: 'admin', path: () => '/admin/verifications' }
  ];
  for (const scheme of ['light', 'dark'] as const) {
    for (const locale of ['en', 'ar'] as const) {
      for (const s of surfaces) {
        test(`${s.name}, ${locale}, ${scheme}`, async ({ page, context }) => {
          if (scheme === 'dark') await dark(page);
          await signInAs(context, s.role, `a11y-${s.role}`);
          await page.goto(at(locale, s.path()));
          await axe(page, `${s.name}-${locale}-${scheme}`);
        });
      }
    }
  }

  test('anonymous task page', async ({ page }) => {
    await page.goto(at('en', `/task/${seeded.taskIds[0]}`));
    await axe(page, 'task-anonymous');
  });

  test('sign-up form after picking a role', async ({ page }) => {
    await page.goto('/en/signup?role=ngo');
    await axe(page, 'signup-ngo-form');
  });

  test('claim form with an invalid link', async ({ page, context }) => {
    await signInAs(context, 'volunteer', 'a11y-claim-invalid');
    await page.goto(at('en', `/task/${seeded.taskIds[1]}/claim`));
    await page.getByLabel('Link to your work').fill('not a link');
    await page.getByRole('button', { name: 'Pin it for review' }).click();
    await expect(page.getByLabel('Link to your work')).toHaveAttribute('aria-invalid', 'true');
    await axe(page, 'claim-invalid');
  });

  test('feed filtered to nothing', async ({ page }) => {
    await page.goto('/en/tasks');
    await page.getByRole('searchbox').fill('zzzz nothing matches');
    await expect(page.getByRole('heading', { name: 'Nothing fits those filters' })).toBeVisible();
    await axe(page, 'tasks-empty-filter');
  });

  test('profile switch dialog', async ({ page, context }) => {
    await signInAs(context, 'ngo', 'a11y-switch');
    await page.goto('/en/profile');
    await page.locator('label.role', { has: page.locator('input[value="volunteer"]') }).click();
    await page.getByRole('button', { name: 'Save profile' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await axe(page, 'profile-switch-dialog');
  });

  test('language list open', async ({ page }) => {
    await page.goto('/en');
    await page.locator('.langs summary').click();
    await page.waitForTimeout(1500); // focus pans the camera to the label; measure once it rests
    await axe(page, 'language-list-open');
  });
});

test.describe('keyboard', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('the skip link comes first and lands on the main region', async ({ page }) => {
    await page.goto('/en/help');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();
  });

  test('a block opens from the keyboard, Escape folds it back and focus returns', async ({ page }) => {
    await page.goto('/en');
    const help = page.getByRole('link', { name: 'Help', exact: true });
    await help.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/en\/help$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Help' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(/\/en$/);
    await expect(help).toBeFocused();
  });

  test('Tab walks the whole page without a trap, and every stop shows focus', async ({ page }) => {
    for (const path of ['/en', '/en/tasks', '/en/help', '/en/signup?role=volunteer']) {
      await page.goto(path);
      const seen: string[] = [];
      for (let i = 0; i < 120; i++) {
        await page.keyboard.press('Tab');
        const stop = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          if (!el || el === document.body) return null;
          const style = (e: Element, pseudo?: string) => getComputedStyle(e, pseudo);
          const ring = (e: Element) => {
            const s = style(e);
            return (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || s.boxShadow !== 'none';
          };
          // A focus style may sit on the element, a pseudo-element, or a card around it.
          const shown =
            ring(el) ||
            ['::before', '::after'].some((p) => {
              const s = style(el, p);
              return (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || (s.content !== 'none' && s.clipPath === 'none');
            }) ||
            !!el.closest('.swatch-card, .block, .seg label, .swatch, .icon-pick')?.matches(':has(:focus-visible)') ||
            el.matches('.patch-btn, .panel__close, .link, .tag__link, .theme-toggle, summary');
          return { key: `${el.tagName}#${el.id}.${el.className}:${el.textContent?.trim().slice(0, 30)}`, shown };
        });
        if (!stop) break;
        expect(stop.shown, `no visible focus on ${stop.key} (${path})`).toBe(true);
        if (seen.includes(stop.key) && seen.length > 3) break;
        seen.push(stop.key);
      }
      expect(seen.length, `${path} has focus stops`).toBeGreaterThan(3);
    }
  });

  test('arrow keys move the quilt', async ({ page }) => {
    await page.goto('/en');
    const read = () => page.locator('.quilt-world').evaluate((el) => getComputedStyle(el).transform);
    const before = await read();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await expect.poll(read).not.toBe(before);
  });

  test('the profile dialog keeps focus inside and Escape closes it', async ({ page, context }) => {
    await signInAs(context, 'ngo', 'a11y-dialog-keys');
    await page.goto('/en/profile');
    await page.locator('label.role', { has: page.locator('input[value="volunteer"]') }).click();
    await page.getByRole('button', { name: 'Save profile' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // A modal dialog keeps focus off the page behind it; Tab may leave for the browser's own UI.
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      expect(await dialog.evaluate((d) => d.contains(document.activeElement) || document.activeElement === document.body)).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
});

test.describe('focus not obscured', () => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    test(`panel controls stay visible when focused at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      const found: string[] = [];
      for (const path of ['/en/help', '/en/tasks', '/en/signup?role=volunteer', '/en/contents']) {
        await page.goto(path);
        const hidden = await page.evaluate(async () => {
          const out: string[] = [];
          const els = [...document.querySelectorAll<HTMLElement>('[data-panel] a, [data-panel] button, [data-panel] input, [data-panel] select, [data-panel] textarea, [data-panel] summary')];
          for (const el of els) {
            if (el.closest('details:not([open])') && !el.matches('summary')) continue;
            el.focus();
            await new Promise((r) => setTimeout(r, 30));
            const r = el.getBoundingClientRect();
            if (!r.width || !r.height) continue;
            const pts = [
              [r.left + r.width / 2, r.top + r.height / 2],
              [r.left + 2, r.top + 2],
              [r.right - 2, r.bottom - 2]
            ];
            const visible = pts.some(([x, y]) => {
              const top = document.elementFromPoint(x, y);
              return !!top && (el.contains(top) || top.contains(el));
            });
            if (!visible) out.push(`${el.tagName} ${el.textContent?.trim().slice(0, 30)}`);
          }
          return out;
        });
        found.push(...hidden.map((h) => `${path}: ${h}`));
      }
      expect(found, `at ${viewport.width}px`).toEqual([]);
    });
  }
});

test.describe('target size', () => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    test(`controls are at least 24 by 24 px at ${viewport.width}px`, async ({ page, context }) => {
      await page.setViewportSize(viewport);
      await signInAs(context, 'ngo', `a11y-target-${viewport.width}`);
      const found: string[] = [];
      for (const path of ['/en', '/en/tasks', '/en/help', '/en/contents', '/en/badges/manage', '/en/org', '/en/dashboard']) {
        await page.goto(path);
        const small = await page.evaluate(() => {
          const out: string[] = [];
          const els = document.querySelectorAll<HTMLElement>('a, button, input:not([type=hidden]), select, textarea, summary, [role=button], label:has(> input[type=radio])');
          for (const el of els) {
            const s = getComputedStyle(el);
            if (s.visibility === 'hidden' || s.display === 'none' || el.closest('[aria-hidden=true], .sr-only')) continue;
            if (el.matches('input[type=radio], input[type=checkbox], input[type=file]') && el.closest('label')) continue;
            if (el.classList.contains('sr-only')) continue;
            // Inline links in a sentence are exempt (WCAG 2.5.8 inline exception).
            if (s.display === 'inline' && el.closest('p, li, dd, span') && el.parentElement?.textContent?.trim() !== el.textContent?.trim()) continue;
            // A title link may stretch its hit area over its card or block with a pseudo-element.
            const stretch = ['::before', '::after'].some((p) => {
              const ps = getComputedStyle(el, p);
              return ps.content !== 'none' && ps.position === 'absolute';
            });
            const r = (stretch && el.offsetParent ? el.offsetParent : el).getBoundingClientRect();
            if (!r.width || !r.height) continue;
            if (r.width < 24 || r.height < 24) out.push(`${el.tagName}.${el.className} "${el.textContent?.trim().slice(0, 24)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
          }
          return out;
        });
        found.push(...small.map((h) => `${path}: ${h}`));
      }
      expect([...new Set(found)], `at ${viewport.width}px`).toEqual([]);
    });
  }
});

test.describe('reflow, zoom and text spacing', () => {
  const SPACING = '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }';

  async function clipped(page: Page) {
    return page.evaluate(() => {
      const out: string[] = [];
      const over = document.documentElement.scrollWidth - window.innerWidth;
      if (over > 0) out.push(`page overflows by ${over}px`);
      const scroller = document.querySelector('.panel__scroll');
      if (scroller && scroller.scrollWidth > scroller.clientWidth + 1) out.push('panel overflows sideways');
      for (const el of document.querySelectorAll<HTMLElement>('[data-panel] *, .tags *, .label__tag *')) {
        const s = getComputedStyle(el);
        if (!/hidden|clip/.test(s.overflowX + s.overflowY) || !el.textContent?.trim() || el.closest('.intro-line, .sr-only')) continue;
        if (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2) out.push(`clipped: ${el.className} "${el.textContent.trim().slice(0, 30)}"`);
      }
      return out;
    });
  }

  for (const [label, viewport] of [['320px reflow', { width: 320, height: 640 }], ['200% zoom', { width: 720, height: 450 }], ['400% zoom', { width: 360, height: 225 }]] as const) {
    test(`${label}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      for (const path of ['/en/help', '/en/tasks', '/en/signup?role=ngo', '/de/for-nonprofits', '/ar/docs']) {
        await page.goto(path);
        expect(await clipped(page), `${path}`).toEqual([]);
      }
    });
  }

  test('text spacing overrides keep everything readable', async ({ page }) => {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      for (const path of ['/en', '/en/help', '/en/tasks', '/en/login', '/de/contents']) {
        await page.goto(path);
        await page.addStyleTag({ content: SPACING });
        await page.waitForTimeout(200);
        expect(await clipped(page), `${path} at ${viewport.width}px`).toEqual([]);
      }
    }
  });

  test('a phone held sideways still reads', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    for (const path of ['/en', '/en/help', '/en/login']) {
      await page.goto(path);
      expect(await clipped(page), path).toEqual([]);
      await expect(page.locator('h1').first()).toBeVisible();
    }
  });
});

test.describe('language and titles', () => {
  for (const locale of LOCALES) {
    test(`every ${locale} page has its own title and the right language and direction`, async ({ page }) => {
      const titles = new Set<string>();
      for (const path of PUBLIC.filter((p) => p !== '/not-a-block')) {
        await page.goto(at(locale, path));
        await expect(page.locator('html')).toHaveAttribute('lang', locale);
        await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
        const title = await page.title();
        expect(title.trim(), `${at(locale, path)} title`).not.toBe('');
        titles.add(title);
      }
      expect(titles.size, `${locale} titles are distinct`).toBe(PUBLIC.length - 1);
    });
  }

  test('English-only legal text is marked as English inside other locales', async ({ page }) => {
    for (const path of ['/privacy', '/terms', '/cookies']) {
      await page.goto(at('fr', path));
      await expect(page.locator('article.legal')).toHaveAttribute('lang', 'en');
      await expect(page.getByText('publiée qu’en anglais')).toBeVisible();
    }
  });

  test('each language in the list is named in its own language', async ({ page }) => {
    // The contents page lists every language; the quilt label is inert behind an open panel.
    await page.goto('/en/contents');
    const links = page.locator('.langs-list a');
    await expect(links).toHaveCount(LOCALES.length);
    for (const locale of LOCALES) await expect(page.locator(`.langs-list a[hreflang="${locale}"]`)).toHaveAttribute('lang', locale);
    await page.locator('.langs-list a[hreflang="es"]').click();
    await expect(page).toHaveURL(/\/es\/contents$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Índice' })).toBeVisible();
  });
});

test.describe('content on hover', () => {
  test('a patch label stays while hovered and Escape dismisses it', async ({ page, browser }) => {
    // One approved claim, so the community quilt has a patch to hover.
    const volunteer = await browser.newContext({ baseURL: test.info().project.use.baseURL });
    await signInAs(volunteer, 'volunteer', 'a11y-hover');
    const claim = await (await volunteer.request.post(`/api/tasks/${seeded.taskIds[0]}/claim`, { data: { proofUrl: 'https://example.org/proof', notes: 'Done.' } })).json();
    const ngo = await browser.newContext({ baseURL: test.info().project.use.baseURL });
    await signInAs(ngo, 'ngo', 'a11y');
    expect((await ngo.request.post(`/api/claims/${claim.id}/approve`)).ok()).toBe(true);
    await volunteer.close();
    await ngo.close();

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/impact');
    const tag = page.locator('[data-panel] .quilt__tag');
    await page.locator('[data-panel] .quilt__patch').first().hover();
    await expect(tag).toBeVisible();
    const box = (await tag.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 6 });
    await page.waitForTimeout(500);
    await expect(tag).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(tag).toBeHidden();
    await expect(page).toHaveURL(/\/en\/impact$/);
  });
});

test.describe('non-text contrast', () => {
  // The input edge is half-strength indigo, so it is composited over the input's own fill
  // before it is compared with the surface around the input.
  async function edges(page: Page) {
    return page.locator('.input').first().evaluate((el) => {
      // Any CSS color syntax (rgb, color(), oklab) comes back as RGBA through a canvas.
      const g = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
      const parse = (c: string): [number, number, number, number] => {
        g.clearRect(0, 0, 1, 1);
        g.fillStyle = c;
        g.fillRect(0, 0, 1, 1);
        const [r, gg, b, a] = g.getImageData(0, 0, 1, 1).data;
        return [r, gg, b, a / 255];
      };
      const over = (top: number[], under: number[]) => top.slice(0, 3).map((v, i) => v * top[3] + under[i] * (1 - top[3]));
      const lin = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      const lum = (c: number[]) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
      const ratio = (a: number[], b: number[]) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
      let around: Element | null = el.parentElement;
      while (around && parse(getComputedStyle(around).backgroundColor)[3] === 0) around = around.parentElement;
      const outside = parse(getComputedStyle(around ?? document.body).backgroundColor);
      const fill = over(parse(getComputedStyle(el).backgroundColor), outside);
      const edge = over(parse(getComputedStyle(el).borderTopColor), [...fill, 1]);
      return Math.min(ratio(edge, outside), ratio(edge, fill));
    });
  }

  for (const scheme of ['light', 'dark'] as const) {
    test(`control edges meet 3:1 at rest and when focused (${scheme})`, async ({ page, context }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await signInAs(context, 'ngo', `a11y-edges-${scheme}`);
      const found: string[] = [];
      for (const path of ['/en/login', '/en/org', '/en/tasks']) {
        await page.goto(path);
        const rest = await edges(page);
        await page.locator('.input').first().focus();
        await page.waitForTimeout(400); // the border color eases in over 0.2s
        const focused = await edges(page);
        if (rest < 3) found.push(`${path} input edge at rest ${rest.toFixed(2)}`);
        if (focused < 3) found.push(`${path} focused input edge ${focused.toFixed(2)}`);
      }
      expect(found).toEqual([]);
    });
  }
});

test.describe('forced colors', () => {
  test('focus stays visible with forced colors', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await page.goto('/en/login');
    for (const target of [page.getByLabel('Email'), page.getByRole('button', { name: 'Sign in', exact: true }), page.getByRole('link', { name: 'Forgot your password?' })]) {
      await target.focus();
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Tab');
      const ring = await target.evaluate((el) => {
        const s = getComputedStyle(el);
        return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0;
      });
      expect(ring).toBe(true);
    }
  });
});
