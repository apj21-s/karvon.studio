import { defineConfig } from 'vite';
import * as R from './src/config/render.js';

// Fills the <!--@slot--> placeholders in index.html from src/config/site.js,
// so content, metadata and the intro gate config live in one place.
function siteHtml() {
  const slots = {
    head: R.headMeta,
    introGate: R.introConfigScript,
    nav: () => R.navLinks('nav__link'),
    navSheet: () => R.navLinks('sheet__link'),
    footerNav: () => R.navLinks('footer__link'),
    products: R.products,
    contact: R.contact,
    footerContact: R.footerContact,
    footerProducts: R.footerProducts,
    markNav: () => R.markSVG({ className: 'brand__mark' }),
    markFooter: () => R.markSVG({ className: 'brand__mark' }),
    markIntro: () => R.markSVG({ className: 'intro__mark' }),
    markHero: () =>
      R.markSVG({
        className: 'hero__mark',
        // A slightly exploded arrangement: the mark mid-assembly.
        offsets: {
          chimney: [0, -40], slateTop: [26, -58], wallSlate: [-58, -30], wallFace: [-70, 14],
          arm: [34, -26], leg: [44, 30], slateBot: [-6, 70], charBot: [20, 84],
          cubeTop: [96, -40], cubeMid: [104, 0], cubeRight: [126, 18],
        },
      }),
    year: R.year,
  };
  return {
    name: 'karvon-site-html',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html.replace(/<!--@(\w+)-->/g, (m, key) => {
          if (!slots[key]) throw new Error(`Unknown slot ${key}`);
          return slots[key]();
        });
      },
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [siteHtml()],
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 800,
  },
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1' },
});
