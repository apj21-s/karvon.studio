// Capture intro frames at fixed times from the dev server (uses the dev-only ?t= hook).
// Usage: node tools/capture.mjs [baseUrl] [outDir] [w] [h] [times...]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const [base = 'http://127.0.0.1:5199/', out = 'reference/ours', w = '1280', h = '720', ...ts] = process.argv.slice(2);
const times = ts.length ? ts.map(Number) : [0.5, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.5, 9.5, 9.75];
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-angle=swiftshader'],
});
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.type(), m.text()); });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
for (const t of times) {
  await page.goto(`${base}?intro=1&forcegl=1&t=${t}`);
  await page.waitForFunction(() => window.__introReady === true, null, { timeout: 30000 });
  const name = `${out}/t${t.toFixed(2).padStart(5, '0')}.png`;
  await page.screenshot({ path: name });
  const is3d = await page.evaluate(() => document.getElementById('intro')?.classList.contains('is-3d'));
  console.log('captured', name, is3d ? '3D' : '2D');
}
await browser.close();
