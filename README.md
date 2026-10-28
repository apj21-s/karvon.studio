# karvon.studio
KARVON.STUDIO is an independent product studio focused on turning ideas into thoughtfully engineered digital products. We build, launch, and scale technology-driven platforms that solve real-world problems, with ACEIIIT as our first venture. One studio. Multiple ideas. Built to make an impact.

## Running locally

```bash
npm install
npm run dev            # http://127.0.0.1:5173
npm run build          # production build in dist/
npm run preview        # serve dist/ locally
npm test               # Playwright smoke tests (uses your installed Google Chrome)
```

The page opens on a short KARVON loader, then the headline. The logo film (the K assembling, then
KARVON / STUDIO) plays inside the hero's phone, scrubbed by scroll. In dev, `?t=4.5` shows any film frame
full screen (add `&forcegl=1` in headless/software-GL browsers); `tools/capture.mjs` uses this.

## Where things live

| What | Where |
|---|---|
| All content, links, contact email, products | `src/config/site.js` |
| Page markup (static, filled from the config at build time) | `index.html`, `src/config/render.js`, `vite.config.js` |
| Styles (brand tokens first) | `src/styles/` |
| Loader, boot (`src/main.js`); loader and footer styles | `src/main.js`, `src/styles/base.css` |
| The cinematic scroll: four pinned scenes, Lenis smooth scroll (static page without motion) | `src/scenes/` (`cinema.js` conducts), `src/styles/scenes.css` |
| Logo film: player (seekable), 3D scene, choreography, 2D fallback | `src/intro/` (`player.js`) |
| Traced KARVON mark (polygon data, single source for SVG/3D/icons) | `src/intro/mark-geometry.js`, `public/brand/` |

## Before launch

- **Contact email:** `hello.karvon.studio@gmail.com`, set in `SITE.email` (`src/config/site.js`).
- **Domain:** `SITE.url` is the GitHub Pages URL. Change it if a custom domain is added.
- **ACEIIIT links** (`https://aceiiit.in`, `https://mock.aceiiit.in`) were taken from the ACEIIIT code; confirm them.
- **Brand approval:** the K is a traced vector derived from the brand-kit PNG (silhouette IoU 0.99), and the
  wordmark is set in Montserrat as the closest match to the reference. Neither is an official source file.

## Deploying (GitHub Pages)

`.github/workflows/pages.yml` builds and publishes `dist/` on every push to `main`.
One-time setup: repository **Settings → Pages → Source: GitHub Actions**.

## Tools

```bash
python3 tools/trace-mark.py           # re-trace the mark → src/intro/mark-geometry.js + public/brand/*.svg
node tools/make-icons.mjs             # favicons, touch icons, og-image.png, manifest
node tools/capture.mjs                # film frames from a dev server started with `npx vite --port 5199` → reference/ours
python3 tools/compare.py              # side-by-side sheet vs `karvon intro.mp4` → reference/compare.png
node tools/screens.mjs                # full-page screenshots → reference/screens
```

`reference/` and the video are git-ignored.
