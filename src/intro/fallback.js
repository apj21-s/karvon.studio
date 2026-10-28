// 2D engines for the intro (no WebGL, reduced motion, or a short repeat).
// They animate the same traced mark as SVG, on the gate's clock.
import { finalRect, R as LOCKUP } from './lockup.js';
import { span, ease, lerp, smooth } from './timeline.js';

// Arrival order mirrors the reference: stem, arm, leg, slate & wall, bottom, cube.
// [start, dx, dy, rotate°] — offsets in mark units (mark width = 1000).
export const ARRIVALS = {
  chimney:   [0.30, 0, -260, -8],
  stem:      [0.30, 0, 220, 6],
  arm:       [0.65, 260, -220, 18],
  leg:       [0.85, 240, 220, -16],
  slateTop:  [1.15, 60, -320, 30],
  wallSlate: [1.30, -320, -80, -24],
  wallFace:  [1.38, -320, 60, -18],
  slateBot:  [1.50, -40, 280, 20],
  charBot:   [1.56, 60, 300, -20],
  cubeTop:   [1.70, 340, -60, 40],
  cubeMid:   [1.78, 360, 60, -30],
  cubeRight: [1.84, 380, 120, 24],
};
const PIECE_DUR = 0.75;

export function createFallback({ lockup, mode, viewport }) {
  let vp = viewport;
  const polys = [...lockup.markbox.querySelectorAll('polygon')];

  if (mode === 'static') {
    // Reduced motion / repeat visit: the finished lockup fades in and holds.
    return {
      duration: 1.7,
      text: { word: 0.05, stagger: 0, letter: 0.35, studio: 0.05, studioDur: 0.35 },
      render(t) {
        lockup.showMark(ease.outCubic(span(t, 0, 0.35)));
        return finalRect(vp.w, vp.h);
      },
      resize(v) { vp = v; },
      dispose() {},
    };
  }

  const scale = smooth([[0, 1.22], [1.9, 1.2], [2.6, 1.04], [3.4, 1.0]]);
  const lift = smooth([[0, 1], [1.9, 1], [2.7, 0], [4.4, 0]]); // 1 = centred, 0 = final slot
  return {
    duration: 4.4,
    text: { word: 2.1, stagger: 0.1, letter: 0.45, studio: 2.9, studioDur: 0.45 },
    render(t) {
      lockup.showMark(1);
      for (const p of polys) {
        const a = ARRIVALS[p.dataset.piece];
        if (!a) continue;
        const k = span(t, a[0], a[0] + PIECE_DUR, ease.outQuart);
        p.style.opacity = String(ease.outCubic(span(t, a[0], a[0] + PIECE_DUR * 0.5)));
        // px inside SVG = mark user units (mark width 1000)
        p.style.transform = k >= 1 ? '' : `translate(${a[1] * (1 - k)}px, ${a[2] * (1 - k)}px) rotate(${a[3] * (1 - k)}deg)`;
      }
      const f = finalRect(vp.w, vp.h);
      const fit = Math.max(1, (0.88 * vp.w) / (LOCKUP.wordWidth * f.w)); // keep the wordmark on screen
      const s = Math.min(scale(t), fit), w = f.w * s, h = f.h * s;
      const yCentre = lerp(f.y + f.h / 2, 0.48 * vp.h, lift(t));
      return { x: vp.w / 2 - w / 2, y: yCentre - h / 2, w, h };
    },
    resize(v) { vp = v; },
    dispose() {},
  };
}
