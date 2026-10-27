// Generates favicons, touch icons, the logo PNG and the social preview image
// from the traced mark (public/brand/karvon-mark.svg) and Montserrat.
// Usage: node tools/make-icons.mjs
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pub = (p) => resolve(root, 'public', p);
const markSvg = readFileSync(pub('brand/karvon-mark.svg'), 'utf8');
const [, vw, vh] = markSvg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/).map(Number);
const inner = markSvg.replace(/^[\s\S]*?<title>KARVON<\/title>/, '').replace(/<\/svg>\s*$/, '');
// Fonts are inlined as data URLs (file:// fonts are blocked from a setContent page).
const font = (w) => 'data:font/woff2;base64,' + readFileSync(resolve(root, `node_modules/@fontsource/montserrat/files/montserrat-latin-${w}-normal.woff2`)).toString('base64');

// favicon.svg: the mark on a softly rounded off-white tile
const pad = 0.16, side = Math.max(vw, vh) / (1 - 2 * pad);
const ox = (side - vw) / 2, oy = (side - vh) / 2;
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${side.toFixed(1)} ${side.toFixed(1)}">
  <rect width="${side.toFixed(1)}" height="${side.toFixed(1)}" rx="${(side * 0.18).toFixed(1)}" fill="#F7F5F0"/>
  <g transform="translate(${ox.toFixed(1)} ${oy.toFixed(1)})">${inner}</g>
</svg>
`;
writeFileSync(pub('favicon.svg'), favicon);

writeFileSync(pub('site.webmanifest'), JSON.stringify({
  name: 'KARVON.STUDIO',
  short_name: 'KARVON',
  start_url: './',
  display: 'standalone',
  background_color: '#F7F5F0',
  theme_color: '#F7F5F0',
  icons: [
    { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
}, null, 2) + '\n');
writeFileSync(pub('.nojekyll'), '');

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();

async function shot(html, w, h, path, transparent = false) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<!doctype html><html><head><style>
    @font-face { font-family: M; font-weight: 600; src: url(${font(600)}); }
    @font-face { font-family: M; font-weight: 400; src: url(${font(400)}); }
    html,body { margin:0; width:${w}px; height:${h}px; overflow:hidden; background:${transparent ? 'transparent' : '#F7F5F0'}; }
    svg { display:block; }
  </style></head><body>${html}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path, omitBackground: transparent });
}

for (const [size, name] of [[32, 'favicon-32.png'], [180, 'apple-touch-icon.png'], [192, 'icon-192.png'], [512, 'icon-512.png']]) {
  await shot(favicon.replace('<svg ', `<svg width="${size}" height="${size}" `), size, size, pub(name), true);
}
await shot(markSvg.replace('<svg ', `<svg width="512" height="${Math.round((512 * vh) / vw)}" `), 512, Math.round((512 * vh) / vw), pub('brand/karvon-mark.png'), true);

// Social preview: the intro's final composition on warm paper.
const og = `
<div style="position:relative;width:1200px;height:630px;background:#ebe7e0;overflow:hidden;font-family:M">
  <div style="position:absolute;inset:-200px;background:
    repeating-linear-gradient(-28deg, rgba(255,255,255,0.0) 0 120px, rgba(255,255,255,0.32) 150px 250px, rgba(255,255,255,0) 280px 330px);"></div>
  <div style="position:absolute;inset:0;background:radial-gradient(90% 80% at 40% 30%, rgba(255,255,255,0.35), transparent 70%)"></div>
  <div style="position:absolute;left:50%;top:92px;transform:translateX(-50%);width:208px">
    ${markSvg.replace('<svg ', '<svg width="208" ')}
  </div>
  <div style="position:absolute;left:0;right:0;top:350px;text-align:center;font-weight:600;font-size:80px;letter-spacing:0.075em;padding-left:0.075em;color:#2e3236;line-height:1">KARVON</div>
  <div style="position:absolute;left:0;right:0;top:446px;text-align:center;font-weight:400;font-size:28px;letter-spacing:0.36em;padding-left:0.36em;color:#2e3236;line-height:1">STUDIO</div>
  <div style="position:absolute;left:0;right:0;bottom:44px;text-align:center;font-weight:400;font-size:17px;letter-spacing:0.2em;color:#5E7285;text-transform:uppercase">Discover problems · Engineer solutions · Build products that matter</div>
</div>`;
await shot(og, 1200, 630, pub('og-image.png'));
await browser.close();
console.log('icons, manifest and og-image written to public/');
