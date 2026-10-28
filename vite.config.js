import { defineConfig } from 'vite';
import * as R from './src/config/render.js';

// Fills the <!--@slot--> placeholders in index.html from src/config/site.js,
// so content, metadata and the intro gate config live in one place.
// The loader's facets start slightly apart and snap together (CSS only, while the page loads).
const LOADER_OFFSETS = {
  chimney: [0, -60], stem: [0, 60], slateTop: [40, -70], wallSlate: [-70, -30], wallFace: [-80, 20],
  arm: [60, -40], leg: [60, 50], slateBot: [-10, 80], charBot: [30, 90],
  cubeTop: [110, -50], cubeMid: [120, 0], cubeRight: [140, 30],
};

function siteHtml() {
  const slots = {
    head: R.headMeta,
    products: R.products,
    contact: R.contact,
    footerLinks: R.footerLinks,
    markFooter: () => R.markSVG({}),
    markLoader: () => R.markSVG({ className: 'loader__mark', offsets: LOADER_OFFSETS }),
    markPhone: () => R.markSVG({ className: 'intro__mark' }),
    markFinale: () => R.markSVG({ className: 'finale__svg' }),
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
