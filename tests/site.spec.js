import { test, expect } from '@playwright/test';

function collectErrors(page) {
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

/** Wait for the loader to lift and the scroll scenes to be ready. */
async function ready(page) {
  await expect(page.locator('.loader')).toHaveCount(0, { timeout: 8_000 });
  await expect(page.locator('[data-scene="hero"]')).toHaveClass(/scene--ready/);
}

test.describe('layout', () => {
  for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920]) {
    test(`no horizontal overflow or console errors at ${width}px`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await ctx.newPage();
      const errors = collectErrors(page);
      await page.goto('/');
      await ready(page);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
      await ctx.close();
    });
  }
});

test.describe('loader', () => {
  test('shows the KARVON lockup, then lifts into the headline', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/is-loading|is-leaving/);
    await expect(page.locator('.loader__word')).toHaveText('KARVON.STUDIO');
    await ready(page);
    await expect(page.locator('html')).not.toHaveClass(/is-loading/);
    await expect(page.locator('#hero-title')).toBeVisible();
    await expect(page.locator('.cine__l1')).toHaveCSS('opacity', '1', { timeout: 4_000 });
  });
});

test.describe('content and links', () => {
  test('no navigation bar, no section labels, no placeholders', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header.nav, .nav__list, .section__index')).toHaveCount(0);
    const text = await page.locator('body').innerText();
    expect(text).not.toMatch(/coming soon|placeholder|lorem|TODO/i);
  });

  test('every in-page link points at an element that exists', async ({ page }) => {
    await page.goto('/');
    const missing = await page.evaluate(() =>
      [...document.querySelectorAll('a[href^="#"]')]
        .map((a) => a.getAttribute('href'))
        .filter((h) => h.length > 1 && !document.querySelector(h)),
    );
    expect(missing).toEqual([]);
  });

  test('contact email is live', async ({ page }) => {
    await page.goto('/');
    const mail = page.locator('.contact__actions a[href^="mailto:"]');
    await expect(mail).toContainText('karvon.studio@gmail.com');
    await expect(mail).toHaveAttribute('href', 'mailto:karvon.studio@gmail.com');
    await expect(page.locator('.footer a[href="mailto:karvon.studio@gmail.com"]')).toHaveCount(1);
  });

  test('ACEIIIT links use the verified URLs and open safely', async ({ page }) => {
    await page.goto('/');
    // includeHidden: in the cinematic scroll these links fade in only when their scene plays
    const primary = page.getByRole('link', { name: /Visit ACEIIIT/, includeHidden: true });
    await expect(primary).toHaveAttribute('href', 'https://aceiiit.in');
    await expect(primary).toHaveAttribute('rel', /noopener/);
    await expect(page.getByRole('link', { name: /Open the mock portal/, includeHidden: true })).toHaveAttribute('href', 'https://mock.aceiiit.in');
  });

  test('product logo loads', async ({ page }) => {
    await page.goto('/');
    const img = page.locator('.product__logo img');
    await expect.poll(() => img.evaluate((i) => i.complete && i.naturalWidth > 0), { timeout: 8_000 }).toBe(true);
  });

  test('a single h1 and no empty links', async ({ page }) => {
    await page.goto('/');
    expect(await page.locator('h1').count()).toBe(1);
    const empty = await page.evaluate(() => [...document.querySelectorAll('a')].filter((a) => !a.getAttribute('href') || (!a.textContent.trim() && !a.getAttribute('aria-label'))).length);
    expect(empty).toBe(0);
  });

  test('the footer is a single thin line', async ({ page }) => {
    await page.goto('/');
    const h = await page.locator('.footer').evaluate((f) => f.getBoundingClientRect().height);
    expect(h).toBeLessThan(90);
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

test.describe('cinematic scroll', () => {
  test('pins every scene, plays the film in the phone, ends on the call to action', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/');
    await ready(page);
    await expect(page.locator('.pin-spacer')).toHaveCount(4);
    // the phone lands and the film plays by itself through to the finished lockup
    await page.evaluate(() => window.scrollTo(0, innerHeight * 1.8));
    await expect(page.locator('.phone-wrap')).toHaveCSS('opacity', '1', { timeout: 5_000 });
    await expect(page.locator('.phone .intro__word span').first()).toHaveCSS('opacity', '1', { timeout: 16_000 });
    await expect(page.locator('.phone .intro__studio')).toHaveCSS('opacity', /^(1|0\.99\d*)$/, { timeout: 4_000 });
    // the very end: the call to action is visible and usable
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(page.locator('.contact__cta')).toHaveCSS('opacity', '1', { timeout: 5_000 });
    await expect(page.locator('.contact__card')).not.toBeInViewport({ timeout: 5_000 });
    await expect(page.locator('.contact__actions a[href^="mailto:"]')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('in-page links fly to their scene', async ({ page }) => {
    await page.goto('/');
    await ready(page);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.getByRole('link', { name: /See\s*The work/ }).click();
    await expect(page).toHaveURL(/#products$/);
    await expect.poll(async () => page.evaluate(() => Math.abs(document.getElementById('products').getBoundingClientRect().top)), { timeout: 6_000 }).toBeLessThan(4);
  });

  test('reduced motion keeps a static page with everything visible', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    const scripts = [];
    page.on('request', (r) => r.resourceType() === 'script' && scripts.push(r.url()));
    await page.goto('/');
    await expect(page.locator('.loader')).toHaveCount(0, { timeout: 5_000 });
    await expect(page.locator('[data-scene]').first()).not.toHaveClass(/scene--live/);
    await expect(page.locator('.pin-spacer')).toHaveCount(0);
    await expect(page.locator('.phone .intro__studio')).toHaveCSS('opacity', '1', { timeout: 5_000 });
    await expect(page.getByRole('link', { name: /See\s*The work/ })).toBeVisible();
    expect(scripts.some((u) => /cinema-|scene-/.test(u))).toBe(false);
    await ctx.close();
  });
});
