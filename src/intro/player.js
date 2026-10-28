// Plays the KARVON logo film inside any box (the hero's phone screen). Every engine renders a
// pure function of time, so the film can be scrubbed by scroll like a video playhead: seek(t).
// Picks the 3D engine when WebGL is usable, otherwise the 2D SVG sequence; reduced motion gets
// the finished lockup. Renders only when the playhead moves.
import { createLockup, finalRect } from './lockup.js';

// Wordmark timings on the 3D clock (seconds), from the reference film.
const TEXT_3D = { word: 6.12, stagger: 0.12, letter: 0.55, studio: 7.25, studioDur: 0.7 };

function webglUsable(allowSoftware) {
  try {
    const c = document.createElement('canvas');
    const opts = { failIfMajorPerformanceCaveat: !allowSoftware };
    const gl = c.getContext('webgl2', opts) || c.getContext('webgl', opts);
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

const cache = new WeakMap();
/** One player per screen: the loader starts it early, the hero picks up the same instance. */
export function preloadFilm(screen, options) {
  if (!cache.has(screen)) cache.set(screen, createPlayer(screen, options));
  return cache.get(screen);
}

/**
 * @param {HTMLElement} screen  contains .intro__paper, canvas.intro__canvas and .intro__lockup
 * @param {{ mode?: 'film' | 'static', allowSoftwareGL?: boolean }} [o]
 */
export async function createPlayer(screen, { mode = 'film', allowSoftwareGL = false } = {}) {
  const canvas = screen.querySelector('.intro__canvas');
  const lockup = createLockup(screen);
  const size = () => ({ w: screen.clientWidth || 1, h: screen.clientHeight || 1 });

  // The wordmark is fitted to font metrics; don't wait long for the fonts.
  await Promise.race([
    Promise.all([document.fonts.load('600 64px Montserrat'), document.fonts.load('400 24px Montserrat')]),
    new Promise((r) => setTimeout(r, 1500)),
  ]).catch(() => {});

  let vp = size();
  lockup.layout(finalRect(vp.w, vp.h));

  let engine = null;
  let text = TEXT_3D;
  if (mode === 'film' && webglUsable(allowSoftwareGL)) {
    try {
      const { createScene } = await import('./scene.js');
      engine = await createScene({ canvas, viewport: vp, onFail: () => fallBack('context lost') });
      screen.classList.add('is-3d');
    } catch (err) {
      console.warn('[film] 3D unavailable, using the 2D sequence:', err.message || err);
      engine = null;
    }
  }
  const { createFallback } = await import('./fallback.js');
  function fallBack(reason) {
    if (reason) console.warn('[film] switching to 2D:', reason);
    try { engine?.dispose?.(); } catch { /* already gone */ }
    screen.classList.remove('is-3d');
    engine = createFallback({ lockup, mode: mode === 'film' ? 'motion' : 'static', viewport: vp });
    text = engine.text;
    draw(current);
  }
  if (!engine) fallBack();

  let current = 0;
  let raf = 0;
  function draw(t) {
    const rect = engine.render(t);
    lockup.follow(rect);
    lockup.text(t, text);
  }

  const ro = new ResizeObserver(() => {
    const v = size();
    if (v.w === vp.w && v.h === vp.h) return;
    vp = v;
    lockup.layout(finalRect(vp.w, vp.h));
    engine.resize?.(vp);
    draw(current);
  });
  ro.observe(screen);

  draw(0);

  return {
    get duration() { return engine.duration; },
    /** Move the playhead to `t` seconds (clamped); renders on the next frame. */
    seek(t) {
      const next = Math.min(Math.max(t, 0), engine.duration);
      if (next === current) return;
      current = next;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => draw(current));
    },
    /** Render immediately (for deterministic frame capture). */
    renderNow(t) { current = t; draw(t); },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      try { engine?.dispose?.(); } catch { /* ignore */ }
    },
  };
}
