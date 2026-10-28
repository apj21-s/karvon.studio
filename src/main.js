import '@fontsource/montserrat/latin-400.css';
import '@fontsource/montserrat/latin-500.css';
import '@fontsource/montserrat/latin-600.css';
import '@fontsource/montserrat/latin-700.css';
import '@fontsource-variable/inter/wght.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-500.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/sections.css';
import './styles/scenes.css';
import './styles/intro.css';

const root = document.documentElement;
root.classList.add('js');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const params = new URLSearchParams(location.search);

document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = String(new Date().getFullYear())));

/* ---------- Cinematic scroll ----------
   Motion allowed: switch every scene to its pinned layout now (so nothing shifts later) and load
   GSAP + Lenis while the loader shows. Reduced motion, or a failed load, keeps the static page. */
const scenes = [...document.querySelectorAll('[data-scene]')];
const live = scenes.length > 0 && !reduceMotion;
if (live) scenes.forEach((s) => s.classList.add('scene--live'));
const scenesModule = live ? import('./scenes/cinema.js') : null;
// The logo film does real work to set up (paper texture, shaders). Do it while the loader is
// showing — its animation runs on the compositor, so it can't stutter — never while scrolling.
const filmScreen = document.querySelector('.phone .film');
const filmReady = live && filmScreen && !params.has('t')
  ? import('./intro/player.js').then((m) => m.preloadFilm(filmScreen)).catch((err) => console.warn('[film] preload failed', err))
  : null;

function startScenes() {
  if (!scenesModule) return staticFilm();
  return scenesModule
    .then((m) => m.initScenes())
    .catch((err) => {
      console.error('[scenes] failed to start', err);
      scenes.forEach((s) => s.classList.remove('scene--live', 'scene--ready'));
      staticFilm();
    });
}

/** Without the scroll scenes, the phone simply shows the finished KARVON lockup. */
function staticFilm() {
  const screen = document.querySelector('.phone .film');
  if (!screen) return;
  import('./intro/player.js')
    .then(async ({ createPlayer }) => {
      const p = await createPlayer(screen, { mode: 'static' });
      p.renderNow(p.duration);
    })
    .catch((err) => console.warn('[film] static lockup unavailable', err));
}

/* ---------- Loader ----------
   Lifts once fonts and the scene code are ready, and not before the facets have snapped together
   (CSS, ~1.4s). The inline failsafe in index.html removes it after 6s whatever happens. */
function liftLoader() {
  if (!root.classList.contains('is-loading')) { startScenes(); return; }
  root.classList.add('is-leaving');
  root.classList.remove('is-loading');
  startScenes();
  setTimeout(() => {
    root.classList.remove('is-leaving');
    document.querySelector('.loader')?.remove();
  }, 1300);
}

const minShow = new Promise((r) => setTimeout(r, reduceMotion ? 300 : 1500));
const fonts = Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 3000))]);

if (import.meta.env.DEV && params.has('t')) {
  // Dev-only frame harness for tools/capture.mjs: the film full screen, frozen at ?t=.
  devHarness(parseFloat(params.get('t')));
} else {
  const filmOrTimeout = filmReady ? Promise.race([filmReady, new Promise((r) => setTimeout(r, 3500))]) : null;
  Promise.all([minShow, fonts, scenesModule?.catch(() => null), filmOrTimeout]).then(liftLoader);
}

async function devHarness(t) {
  root.classList.remove('is-loading');
  document.querySelector('.loader')?.remove();
  const film = document.querySelector('.phone .film').cloneNode(true);
  Object.assign(film.style, { position: 'fixed', inset: '0', zIndex: '500' });
  document.body.append(film);
  const { createPlayer } = await import('./intro/player.js');
  const p = await createPlayer(film, { allowSoftwareGL: params.has('forcegl') });
  p.renderNow(t);
  requestAnimationFrame(() => { p.renderNow(t); window.__introReady = true; window.__film = p; });
}
