// Full-page screenshots of the site (intro skipped) at several widths.
// Usage: node tools/screens.mjs [baseUrl] [outDir] [widths...]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const [base = 'http://127.0.0.1:5199/', out = 'reference/screens', ...ws] = process.argv.slice(2);
const widths = ws.length ? ws.map(Number) : [1440, 390];
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
for (const w of widths) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 700 ? 844 : 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await ctx.addInitScript(() => sessionStorage.setItem('karvon:intro:v1', '1'));
  const page = await ctx.newPage();
  page.on('console', (m) => m.type() === 'error' && console.log(`[${w}] console error:`, m.text()));
  await page.goto(base);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  await page.screenshot({ path: `${out}/page-${w}.png`, fullPage: true });
  console.log(`page-${w}.png  horizontal overflow: ${overflow}px`);
  await ctx.close();
}
await browser.close();
