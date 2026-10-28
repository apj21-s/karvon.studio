// Live-text wordmark that sits under the mark. Laid out once at the final composition,
// then moved each frame with a single transform so it tracks the mark without re-layout.
import { MARK_SIZE } from './mark-geometry.js';
import { clamp01, lerp, ease } from './timeline.js';

export const MARK_ASPECT = MARK_SIZE.h / MARK_SIZE.w;

// Proportions measured from the reference's final frame (mark 234×255 px at 1280×720).
export const R = {
  gapWord: 44 / 255,   // mark bottom → KARVON cap top, in mark heights
  capWord: 64 / 255,   // KARVON cap height
  gapStudio: 28 / 255, // KARVON baseline → STUDIO cap top
  capStudio: 23 / 255, // STUDIO cap height
  wordWidth: 413 / 234,   // KARVON ink width, in mark widths
  studioWidth: 187 / 234, // STUDIO ink width
  stackHeight: 414 / 255, // mark top → STUDIO baseline
  centerY: 355 / 720,     // vertical centre of the whole lockup
};

/** Where the mark sits in the final frame for a given viewport (CSS px). */
export function finalRect(vw, vh) {
  // 16:9 reproduces the reference. Portrait phones get as large a lockup as the KARVON
  // wordmark allows (its ink is 1.77× the mark width; keep it within 86% of the screen),
  // sitting a little above centre where the eye lands on a tall screen.
  const portrait = vh > vw * 1.15;
  const w = portrait ? Math.min(0.325 * vh, (0.86 / R.wordWidth) * vw) : Math.min(0.325 * vh, 0.44 * vw);
  const h = w * MARK_ASPECT;
  const top = (portrait ? 0.465 : R.centerY) * vh - (h * R.stackHeight) / 2;
  return { x: vw / 2 - w / 2, y: top, w, h };
}

function textMetrics(font, text) {
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.font = font;
  const m = ctx.measureText(text);
  const size = parseFloat(font.match(/(\d+(?:\.\d+)?)px/)[1]);
  return {
    ink: (m.actualBoundingBoxLeft || 0) + (m.actualBoundingBoxRight || m.width),
    cap: m.actualBoundingBoxAscent || size * 0.7,
    fAscent: m.fontBoundingBoxAscent || size * 0.968,
    fDescent: m.fontBoundingBoxDescent || size * 0.251,
    size,
  };
}

const C0 = [184, 180, 173]; // letters arrive light grey…
const C1 = [46, 50, 54];    // …and settle to charcoal
const mixColor = (k) => `rgb(${C0.map((c, i) => Math.round(lerp(c, C1[i], k))).join(',')})`;

export function createLockup(root) {
  const box = root.querySelector('.intro__lockup');
  const word = root.querySelector('.intro__word');
  const letters = [...word.querySelectorAll('span')];
  const studio = root.querySelector('.intro__studio');
  const markbox = root.querySelector('.intro__markbox');
  let base = null;

  function layout(rect) {
    base = rect;
    const { x, y, w, h } = rect;
    const s = box.style;
    s.transformOrigin = '0 0';
    s.setProperty('--mx', `${x}px`);
    s.setProperty('--my', `${y}px`);
    s.setProperty('--mw', `${w}px`);
    s.setProperty('--cx', `${x + w / 2}px`);

    // KARVON: size from cap height, tracking fitted to the measured ink width.
    const k = textMetrics('600 100px Montserrat', 'KARVON');
    const wf = (R.capWord * h) / (k.cap / 100);
    const wl = (R.wordWidth * w - (k.ink * wf) / 100) / 5;
    const capTopW = y + h + R.gapWord * h;
    const capOffW = ((wf - (k.fAscent + k.fDescent) * wf / 100) / 2 + (k.fAscent * wf) / 100) - (k.cap * wf) / 100;
    s.setProperty('--wf', `${wf}px`);
    s.setProperty('--wl', `${wl}px`);
    s.setProperty('--wy', `${capTopW - capOffW}px`);
    word.style.paddingLeft = `${wl}px`; // balance the trailing letter-space so the ink is centred

    // STUDIO
    const st = textMetrics('400 100px Montserrat', 'STUDIO');
    const sf = (R.capStudio * h) / (st.cap / 100);
    const sl = (R.studioWidth * w - (st.ink * sf) / 100) / 5;
    const capTopS = capTopW + R.capWord * h + R.gapStudio * h;
    const capOffS = ((sf - (st.fAscent + st.fDescent) * sf / 100) / 2 + (st.fAscent * sf) / 100) - (st.cap * sf) / 100;
    s.setProperty('--sf', `${sf}px`);
    s.setProperty('--sl', `${sl}px`);
    s.setProperty('--sy', `${capTopS - capOffS}px`);
    studio.style.paddingLeft = `${sl}px`;
  }

  /** Move the whole lockup so the mark box matches `rect` (same aspect as base). */
  function follow(rect) {
    if (!base || !rect) return;
    const k = rect.w / base.w;
    box.style.transform = `translate(${rect.x - base.x * k}px, ${rect.y - base.y * k}px) scale(${k})`;
  }

  /** Wordmark reveal at time t. */
  function text(t, T) {
    letters.forEach((el, i) => {
      const k = clamp01((t - (T.word + i * T.stagger)) / T.letter);
      el.style.opacity = String(ease.outCubic(clamp01(k / 0.6)));
      el.style.color = mixColor(ease.inOutSine(k));
    });
    studio.style.opacity = String(ease.inOutSine(clamp01((t - T.studio) / T.studioDur)));
  }

  function showMark(opacity) {
    markbox.style.opacity = String(opacity);
  }

  return { layout, follow, text, showMark, markbox };
}
