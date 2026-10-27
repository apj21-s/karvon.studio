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

export function navLinks(cls = 'nav__link') {
  return SITE.nav.map((n) => `<li><a class="${cls}" href="${n.href}">${esc(n.label)}</a></li>`).join('');
}

export function products() {
  return SITE.products.map((p) => `
      <article class="product" id="product-${p.id}" aria-labelledby="product-${p.id}-name">
        <header class="product__head reveal">
          <p class="product__index mono">Product ${esc(p.index)} <span aria-hidden="true">/</span> ${esc(p.category)}</p>
          <h3 class="product__name" id="product-${p.id}-name">${esc(p.name)}</h3>
          <div class="product__logo"><img src="${p.logo}" alt="${esc(p.name)} logo" width="160" height="160" loading="lazy" decoding="async"></div>
        </header>
        <div class="product__body">
          <p class="product__summary reveal">${esc(p.summary)}</p>
          <dl class="product__facts reveal">
            <div><dt class="mono">Who it serves</dt><dd>${esc(p.audience)}</dd></div>
            <div><dt class="mono">The problem</dt><dd>${esc(p.problem)}</dd></div>
          </dl>
          <ol class="product__flow reveal" aria-label="How an ACEIIIT attempt flows">
            ${p.flow.map((f, i) => `<li><span class="mono">${String(i + 1).padStart(2, '0')}</span>${esc(f)}</li>`).join('')}
          </ol>
          <ul class="product__caps" aria-label="Capabilities">
            ${p.capabilities.map((c) => `<li class="reveal"><h4>${esc(c.title)}</h4><p>${esc(c.text)}</p></li>`).join('')}
          </ul>
          <p class="product__fit reveal">${esc(p.name)} is how KARVON works in practice: a narrow, well-understood problem, a product built to solve it properly, and continuous improvement from how students actually use it.</p>
          <div class="product__actions reveal">
            ${p.links.map((l) => `<a class="btn ${l.primary ? 'btn--primary' : 'btn--ghost-light'}" href="${esc(l.href)}"${linkAttrs(l.href)}>${esc(l.label)}<span class="btn__arrow" aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a>`).join('')}
          </div>
        </div>
      </article>`).join('');
}

export function contact() {
  if (SITE.email) {
    return `<a class="btn btn--primary btn--large" href="mailto:${esc(SITE.email)}">${esc(SITE.email)}<span class="btn__arrow" aria-hidden="true">→</span></a>`;
  }
  return `<p class="contact__pending mono">A direct contact address will be published here shortly.</p>`;
}

export function footerContact() {
  return SITE.email ? `<li><a class="footer__link" href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a></li>` : '';
}

export function footerProducts() {
  return SITE.products
    .map((p) => { const l = p.links.find((x) => x.primary) || p.links[0]; return `<li><a class="footer__link" href="${esc(l.href)}"${linkAttrs(l.href)}>${esc(p.name)}<span class="sr-only"> (opens in a new tab)</span></a></li>`; })
    .join('');
}

export function introConfigScript() {
  // Pre-paint gate: decides before first paint whether the intro overlay is shown.
  const c = SITE.intro;
  return `(function(){var d=document.documentElement,c=${JSON.stringify({ k: c.sessionKey, r: c.repeat, e: c.enabled })};try{var q=location.search,force=/[?&]intro=1(&|$)/.test(q),seen=sessionStorage.getItem(c.k)==='1',rm=matchMedia('(prefers-reduced-motion: reduce)').matches;if(!c.e&&!force)return;if(force||!seen){d.classList.add('intro-on',rm?'intro-reduced':'intro-full')}else if(c.r==='short'){d.classList.add('intro-on','intro-short')}}catch(e){}})();`;
}

export const year = () => String(new Date().getFullYear());
