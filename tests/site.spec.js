import { test, expect } from '@playwright/test';

const KEY = 'karvon:intro:v1';
const skipIntro = (ctx) => ctx.addInitScript((k) => sessionStorage.setItem(k, '1'), KEY);

function collectErrors(page) {
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

test.describe('layout', () => {
  for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920]) {
    test(`no horizontal overflow or console errors at ${width}px`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width, height: 900 } });
      await skipIntro(ctx);
      const page = await ctx.newPage();
      const errors = collectErrors(page);
      await page.goto('/');
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      await expect(page.locator('#intro')).toHaveCount(0);
      expect(errors).toEqual([]);
      await ctx.close();
    });
  }
});

test.describe('content and links', () => {
  test.beforeEach(async ({ context }) => skipIntro(context));

  test('every in-page link points at an element that exists', async ({ page }) => {
    await page.goto('/');
    const missing = await page.evaluate(() =>
      [...document.querySelectorAll('a[href^="#"]')]
        .map((a) => a.getAttribute('href'))
        .filter((h) => h.length > 1 && !document.querySelector(h)),
    );
    expect(missing).toEqual([]);
  });

  test('ACEIIIT links use the verified URLs and open safely', async ({ page }) => {
    await page.goto('/');
    const primary = page.getByRole('link', { name: /Visit ACEIIIT/ });
    await expect(primary).toHaveAttribute('href', 'https://aceiiit.in');
    await expect(primary).toHaveAttribute('rel', /noopener/);
    await expect(page.getByRole('link', { name: /Open the mock portal/ })).toHaveAttribute('href', 'https://mock.aceiiit.in');
  });

  test('product logo loads', async ({ page }) => {
    await page.goto('/');
    const img = page.locator('.product__logo img');
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate((i) => i.complete && i.naturalWidth > 0)).toBe(true);
  });

  test('no empty links and a single h1', async ({ page }) => {
    await page.goto('/');
    expect(await page.locator('h1').count()).toBe(1);
    const empty = await page.evaluate(() => [...document.querySelectorAll('a')].filter((a) => !a.getAttribute('href') || !a.textContent.trim() && !a.getAttribute('aria-label')).length);
    expect(empty).toBe(0);
  });

  test('sharing metadata is present', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /^https:\/\/.+og-image\.png$/);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveCount(1);
    for (const path of ['favicon.svg', 'favicon-32.png', 'apple-touch-icon.png', 'og-image.png', 'site.webmanifest']) {
      const res = await page.request.get(path);
      expect(res.status(), path).toBe(200);
    }
  });
});

test.describe('mobile navigation', () => {
  test('menu opens, traps focus, closes on Escape', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await skipIntro(ctx);
    const page = await ctx.newPage();
    await page.goto('/');
    const toggle = page.locator('.nav__toggle');
    await expect(toggle).toBeVisible();
    await expect(page.locator('.nav__menu')).toBeHidden();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const links = page.locator('.sheet__link');
    await expect(links.first()).toBeVisible();
    await links.last().focus();
    await page.keyboard.press('Tab');
    await expect(toggle).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#sheet')).toBeHidden();
    await expect(toggle).toBeFocused();
    // a link closes the sheet and navigates
    await toggle.click();
    await links.filter({ hasText: 'Products' }).click();
    await expect(page.locator('#sheet')).toBeHidden();
    await expect(page).toHaveURL(/#products$/);
    await ctx.close();
  });
});

test.describe('intro', () => {
  test('plays on first visit, releases the page, then is skipped on reload', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/');
    await expect(page.locator('#intro')).toBeVisible();
    expect(await page.locator('main').evaluate((m) => m.inert)).toBe(true);
    await expect(page.locator('#intro')).toHaveCount(0, { timeout: 20_000 });
    expect(await page.locator('main').evaluate((m) => m.inert)).toBe(false);
    expect(await page.evaluate((k) => sessionStorage.getItem(k), KEY)).toBe('1');
    await expect(page.getByRole('link', { name: 'See how we build' })).toBeVisible();

    await page.reload();
    await expect(page.locator('#intro')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('?intro=1 replays, Skip ends it immediately', async ({ page, context }) => {
    await skipIntro(context);
    await page.goto('/?intro=1');
    await expect(page.locator('#intro')).toBeVisible();
    await page.getByRole('button', { name: 'Skip intro' }).click();
    await expect(page.locator('#intro')).toHaveCount(0, { timeout: 2_000 });
    await expect(page.getByRole('link', { name: 'See how we build' })).toBeVisible();
  });

  test('Escape ends the intro', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#intro')).toBeVisible();
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await expect(page.locator('#intro')).toHaveCount(0, { timeout: 2_000 });
  });

  test('reduced motion shows the static lockup and never loads the 3D engine', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    const scripts = [];
    page.on('request', (r) => r.resourceType() === 'script' && scripts.push(r.url()));
    await page.goto('/');
    await expect(page.locator('.intro__markbox')).toHaveCSS('opacity', '1', { timeout: 3_000 });
    await expect(page.locator('#intro')).toHaveCount(0, { timeout: 6_000 });
    expect(scripts.some((u) => /scene-/.test(u))).toBe(false);
    await ctx.close();
  });

  test('without WebGL the 2D sequence runs and releases the page', async ({ browser }) => {
    const ctx = await browser.newContext();
    await ctx.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
        return /webgl/i.test(type) ? null : orig.call(this, type, ...rest);
      };
    });
    const page = await ctx.newPage();
    const errors = collectErrors(page);
    await page.goto('/');
    await expect(page.locator('.intro__markbox')).toHaveCSS('opacity', '1', { timeout: 4_000 });
    await expect(page.locator('#intro')).not.toHaveClass(/is-3d/);
    await expect(page.locator('#intro')).toHaveCount(0, { timeout: 10_000 });
    expect(await page.locator('main').evaluate((m) => m.inert)).toBe(false);
    expect(errors).toEqual([]);
    await ctx.close();
  });

  test('stops animating after release', async ({ browser }) => {
    const ctx = await browser.newContext();
    await ctx.addInitScript(() => {
      window.__raf = 0;
      const raf = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = (cb) => { window.__raf++; return raf(cb); };
    });
    const page = await ctx.newPage();
    await page.goto('/?intro=1');
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Skip intro' }).click();
    await expect(page.locator('#intro')).toHaveCount(0, { timeout: 2_000 });
    const before = await page.evaluate(() => window.__raf);
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => window.__raf)).toBe(before);
    expect(await page.locator('canvas').count()).toBe(0);
    await ctx.close();
  });
});
