// Deterministic animation helpers. Every animated value is a pure function of time t (seconds).

export const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const lerp = (a, b, k) => a + (b - a) * k;

export const ease = {
  linear: (k) => k,
  inCubic: (k) => k * k * k,
  outCubic: (k) => 1 - Math.pow(1 - k, 3),
  outQuart: (k) => 1 - Math.pow(1 - k, 4),
  outQuint: (k) => 1 - Math.pow(1 - k, 5),
  outExpo: (k) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k)),
  inOutCubic: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
  inOutQuart: (k) => (k < 0.5 ? 8 * k * k * k * k : 1 - Math.pow(-2 * k + 2, 4) / 2),
  inOutSine: (k) => -(Math.cos(Math.PI * k) - 1) / 2,
};

/** Progress of t through [a, b], eased. */
export const span = (t, a, b, e = ease.linear) => e(clamp01((t - a) / (b - a)));

/**
 * Keyframe track. keys: [[t, value, easeName?], ...] — value is a number or array of numbers.
 * The ease on a key shapes the segment that *ends* at that key (default inOutCubic).
 * Values hold before the first key and after the last.
 */
export function track(keys) {
  const ks = keys.map(([t, v, e]) => ({ t, v, e: ease[e || 'inOutCubic'] }));
  return (t) => {
    if (t <= ks[0].t) return ks[0].v;
    const last = ks[ks.length - 1];
    if (t >= last.t) return last.v;
    let i = 1;
    while (ks[i].t < t) i++;
    const a = ks[i - 1], b = ks[i];
    const k = b.e((t - a.t) / (b.t - a.t));
    if (typeof a.v === 'number') return lerp(a.v, b.v, k);
    return a.v.map((x, j) => lerp(x, b.v[j], k));
  };
}

/**
 * Smooth curve through samples [[t, v], ...] with monotone cubic (Fritsch–Carlson)
 * interpolation: continuous velocity and no overshoot between samples.
 */
export function smooth(samples) {
  const n = samples.length;
  const xs = samples.map((s) => s[0]), ys = samples.map((s) => s[1]);
  const d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = 0; m[n - 1] = 0; // ease in and out at the ends
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b;
    if (h > 9) { const s = 3 / Math.sqrt(h); m[i] = s * a * d[i]; m[i + 1] = s * b * d[i]; }
  }
  return (t) => {
    if (t <= xs[0]) return ys[0];
    if (t >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (xs[i + 1] < t) i++;
    const h = xs[i + 1] - xs[i], k = (t - xs[i]) / h, k2 = k * k, k3 = k2 * k;
    return (2 * k3 - 3 * k2 + 1) * ys[i] + (k3 - 2 * k2 + k) * h * m[i] + (-2 * k3 + 3 * k2) * ys[i + 1] + (k3 - k2) * h * m[i + 1];
  };
}

/** A fixed-seed PRNG so procedural textures look identical on every load. */
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
