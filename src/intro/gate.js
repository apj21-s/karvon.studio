// Runs the intro overlay: picks an engine (3D, 2D fallback or static), drives one clock,
// and always releases the page — on completion, Skip/Esc, failure or a hard timeout.
import { SITE } from '../config/site.js';
import { createLockup, finalRect } from './lockup.js';

const CFG = SITE.intro;

// Wordmark timings per engine (seconds on that engine's clock).
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

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const withTimeout = (p, ms) => Promise.race([p, wait(ms).then(() => { throw new Error('timeout'); })]);

export async function runIntro({ onRelease }) {
  const root = document.documentElement;
  const el = document.getElementById('intro');
  const skip = el.querySelector('.intro__skip');
  const params = new URLSearchParams(location.search);
  const dev = import.meta.env.DEV;
  const freezeAt = dev && params.has('t') ? parseFloat(params.get('t')) : null;

  let engine = null;
  let released = false;
  let raf = 0;
  let hard = 0;

  const lockup = createLockup(el);

  function release() {
    if (released) return;
    released = true;
    cancelAnimationFrame(raf);
    clearTimeout(hard);
    removeEventListener('keydown', onKey);
    removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVisibility);
    try { sessionStorage.setItem(CFG.sessionKey, '1'); } catch { /* storage unavailable */ }
    const hadFocus = el.contains(document.activeElement);
    root.classList.remove('intro-on', 'intro-full', 'intro-reduced', 'intro-short');
    root.classList.add('intro-leaving');
    el.classList.add('is-leaving');
    onRelease();
    if (hadFocus) document.getElementById('main')?.focus({ preventScroll: true });
    setTimeout(() => {
      try { engine?.dispose(); } catch (e) { console.warn('[intro] dispose', e); }
      engine = null;
      el.remove();
      root.classList.remove('intro-leaving');
    }, CFG.fadeOut * 1000 + 60);
  }

  // Release on the next tick so the click/key event finishes before the overlay goes inert.
  const releaseSoon = () => setTimeout(release, 0);
  function onKey(e) { if (e.key === 'Escape') releaseSoon(); }
  skip.addEventListener('click', releaseSoon);
  addEventListener('keydown', onKey);
  if (freezeAt === null) hard = setTimeout(release, CFG.hardTimeout);

  // Fonts are needed to fit the wordmark; don't wait long for them.
  await Promise.race([
    Promise.all([document.fonts.load('600 64px Montserrat'), document.fonts.load('400 24px Montserrat')]),
    wait(1500),
  ]).catch(() => {});
  if (released) return;

  const vp = () => ({ w: innerWidth, h: innerHeight });
  lockup.layout(finalRect(vp().w, vp().h));

  // ---- choose the engine ----
  const mode = root.classList.contains('intro-full') ? 'full' : 'static';
  let text = TEXT_3D;
  try {
    if (mode === 'full' && webglUsable(dev && params.has('forcegl'))) {
      const { createScene } = await withTimeout(import('./scene.js'), CFG.loadTimeout);
      if (released) return;
      engine = await createScene({ el, canvas: el.querySelector('.intro__canvas'), viewport: vp(), onFail: release });
      el.classList.add('is-3d');
    }
  } catch (err) {
    console.warn('[intro] 3D unavailable, using 2D sequence:', err.message || err);
    engine?.dispose?.();
    engine = null;
  }
  if (released) { engine?.dispose(); return; }
  if (!engine) {
    const { createFallback } = await import('./fallback.js');
    engine = createFallback({ el, lockup, mode: mode === 'full' ? 'motion' : 'static', viewport: vp() });
  }
  if (engine.text) text = engine.text;
  const duration = engine.duration;

  // ---- one clock for everything ----
  function frame(t) {
    const rect = engine.render(t);
    lockup.follow(rect);
    lockup.text(t, text);
  }

  function onResize() {
    const v = vp();
    lockup.layout(finalRect(v.w, v.h));
    engine.resize?.(v);
  }
  addEventListener('resize', onResize);

  if (freezeAt !== null) { // dev-only deterministic frame capture
    frame(freezeAt);
    requestAnimationFrame(() => { frame(freezeAt); window.__introReady = true; });
    return;
  }

  // Re-arm the safety net now that the sequence actually starts.
  clearTimeout(hard);
  hard = setTimeout(release, Math.max(CFG.hardTimeout - 4000, duration * 1000 + 3000));

  let t0 = performance.now();
  let hiddenAt = 0;
  function onVisibility() {
    if (document.hidden) hiddenAt = performance.now();
    else if (hiddenAt) { t0 += performance.now() - hiddenAt; hiddenAt = 0; }
  }
  document.addEventListener('visibilitychange', onVisibility);

  const tick = (now) => {
    if (released) return;
    const t = (now - t0) / 1000;
    try {
      frame(Math.min(t, duration));
    } catch (err) {
      console.error('[intro] frame error', err);
      release();
      return;
    }
    if (t >= duration) { release(); return; }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame((now) => { t0 = now; tick(now); });
}
