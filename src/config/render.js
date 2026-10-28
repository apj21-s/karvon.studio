// Build-time HTML fragments generated from SITE (used by the Vite plugin in vite.config.js).
// Content is rendered into the static page so it is readable without JavaScript.
import { SITE } from './site.js';
import { PIECES, MARK_SIZE, TONES } from '../intro/mark-geometry.js';

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const isExternal = (href) => /^https?:\/\//.test(href);
const linkAttrs = (href) => (isExternal(href) ? ' target="_blank" rel="noopener noreferrer"' : '');

export function markSVG({ className = '', title = '', mono = false, offsets = null } = {}) {
  const polys = PIECES.map((p, i) => {
    const pts = p.points.map(([x, y]) => `${x},${y}`).join(' ');
    const fill = mono ? 'currentColor' : TONES[p.tone];
    const o = offsets && offsets[p.id];
    const st = o ? ` style="--o:translate(${o[0]}px,${o[1]}px);--i:${i}"` : '';
    return `<polygon data-piece="${p.id}" data-tone="${p.tone}" points="${pts}" fill="${fill}"${st}/>`;
  }).join('');
  const a11y = title ? `role="img" aria-label="${esc(title)}"` : 'aria-hidden="true" focusable="false"';
  return `<svg class="${className}" viewBox="0 0 ${MARK_SIZE.w} ${MARK_SIZE.h}" ${a11y}>${polys}</svg>`;
}

export function headMeta() {
  const u = SITE.url;
  const lines = [
    `<title>${esc(SITE.title)}</title>`,
    `<meta name="description" content="${esc(SITE.description)}">`,
    `<meta name="theme-color" content="${SITE.themeColor}">`,
    `<link rel="icon" href="favicon.svg" type="image/svg+xml">`,
    `<link rel="icon" href="favicon-32.png" sizes="32x32" type="image/png">`,
    `<link rel="apple-touch-icon" href="apple-touch-icon.png">`,
    `<link rel="manifest" href="site.webmanifest">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${esc(SITE.name)}">`,
    `<meta property="og:title" content="${esc(SITE.title)}">`,
    `<meta property="og:description" content="${esc(SITE.description)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(SITE.title)}">`,
    `<meta name="twitter:description" content="${esc(SITE.description)}">`,
  ];
  if (u) {
    const org = { '@context': 'https://schema.org', '@type': 'Organization', name: SITE.name, url: u, logo: u + 'brand/karvon-mark.png' };
    if (SITE.email) org.email = SITE.email;
    lines.push(
      `<link rel="canonical" href="${esc(u)}">`,
      `<meta property="og:url" content="${esc(u)}">`,
      `<meta property="og:image" content="${esc(u)}og-image.png">`,
      `<meta property="og:image:width" content="1200">`,
      `<meta property="og:image:height" content="630">`,
      `<meta property="og:image:alt" content="KARVON.STUDIO logo on warm paper">`,
      `<meta name="twitter:image" content="${esc(u)}og-image.png">`,
      `<script type="application/ld+json">${JSON.stringify(org)}</script>`,
    );
  }
  return lines.join('\n    ');
}


// ACEIIIT, presented in its own visual language: warm paper, deep ink, a gold accent, and the
// product's own method illustrations laid out like papers on a desk.
export function products() {
  return SITE.products.map((p) => {
    const primary = p.links.find((l) => l.primary) || p.links[0];
    const others = p.links.filter((l) => l !== primary);
    return `
          <article class="product" id="product-${p.id}" aria-labelledby="product-${p.id}-name">
            <div class="product__intro">
              <div class="product__brand">
                <div class="product__logo"><img src="${p.logo}" alt="${esc(p.name)} logo" width="160" height="160" decoding="async"></div>
                <p class="product__status"><span aria-hidden="true"></span>Live</p>
              </div>
              <h3 class="product__name" id="product-${p.id}-name">${esc(p.name)}</h3>
              <p class="product__summary">${esc(p.summary)}</p>
              <ol class="product__flow" aria-label="How an ${esc(p.name)} attempt flows">
                ${p.flow.map((f) => `<li>${esc(f)}</li>`).join('')}
              </ol>
              <div class="product__actions">
                <a class="product__btn" href="${esc(primary.href)}"${linkAttrs(primary.href)}>${esc(primary.label)}<span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a>
                ${others.map((l) => `<a class="product__link" href="${esc(l.href)}"${linkAttrs(l.href)}>${esc(l.label)}<span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a>`).join('')}
              </div>
            </div>
            <div class="product__desk">
              <div class="desk">
                ${(p.method || []).map((m, i) => `<figure class="sheet sheet--${i + 1}"><img src="${m.src}" alt="${esc(m.alt)}" width="${m.w}" height="${m.h}" decoding="async"></figure>`).join('')}
              </div>
              <ol class="desk__notes">
                ${(p.method || []).map((m, i) => `<li><span class="mono">${String(i + 1).padStart(2, '0')}</span><strong>${esc(m.label)}</strong><span class="desk__text">${esc(m.text)}</span></li>`).join('')}
              </ol>
            </div>
            <ul class="product__caps" aria-label="What it does">
              ${p.capabilities.map((c) => `<li><h4>${esc(c.title)}</h4><p>${esc(c.text)}</p></li>`).join('')}
            </ul>
          </article>`;
  }).join('');
}

export function contact() {
  return `<a class="btn-modern btn-modern--light" href="mailto:${esc(SITE.email)}"><span class="btn-modern__small">Write to us</span><span class="btn-modern__big">${esc(SITE.email)}</span></a>`;
}

export function footerLinks() {
  const p = SITE.products.map((x) => { const l = x.links.find((y) => y.primary) || x.links[0]; return `<a href="${esc(l.href)}"${linkAttrs(l.href)}>${esc(x.name)}<span class="sr-only"> (opens in a new tab)</span></a>`; });
  return [`<a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a>`, ...p, `<a href="#main">Top ↑</a>`].join('');
}




export const year = () => String(new Date().getFullYear());
