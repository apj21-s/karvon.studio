// Procedural textures for the intro: fibrous paper and the window-light gobo.
// Both are drawn once to canvas with a fixed seed, so every load looks the same.
import * as THREE from 'three';
import { rng } from './timeline.js';

/**
 * @param {object} o
 * @param {number} o.pw  plane width (world units)
 * @param {number} o.ph  plane height
 * @param {number} o.cx  plane centre x (world)
 * @param {number} o.cy  plane centre y
 * @param {number} o.res long-side resolution in px
 * @param {number[]} o.seams world x positions of vertical paper seams
 */
export function paperTexture({ pw, ph, cx, cy, res = 2048, seams = [] }) {
  const W = pw >= ph ? res : Math.round((res * pw) / ph);
  const H = pw >= ph ? Math.round((res * ph) / pw) : res;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const rand = rng(20261027);
  const pxPerUnit = W / pw;
  const toPx = (wx, wy) => [(wx - (cx - pw / 2)) * pxPerUnit, (cy + ph / 2 - wy) * pxPerUnit];

  // base tone
  g.fillStyle = '#efece6';
  g.fillRect(0, 0, W, H);

  // low-frequency tonal variation, then a finer mottle
  const blob = (n, rmin, rmax, aWarm, aCool) => {
    for (let i = 0; i < n; i++) {
      const x = rand() * W, y = rand() * H, r = (rmin + rand() * (rmax - rmin)) * Math.max(W, H);
      const warm = rand() < 0.5;
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, warm ? `rgba(196,188,176,${aWarm})` : `rgba(255,255,253,${aCool})`);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
  };
  blob(70, 0.08, 0.3, 0.05, 0.06);
  blob(500, 0.004, 0.016, 0.025, 0.035);

  // fibres: many short, nearly straight hairs in muted grey-brown, a few pale ones
  const fibreScale = pxPerUnit / 23; // tuned against the reference at final framing
  const count = Math.round((W * H) / (380 * fibreScale * fibreScale));
  g.lineCap = 'round';
  for (let i = 0; i < count; i++) {
    const x = rand() * W, y = rand() * H;
    const len = (2.5 + rand() * rand() * 11) * fibreScale;
    const a = rand() * Math.PI * 2;
    const bend = (rand() - 0.5) * len * 0.35;
    const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
    const mx = (x + ex) / 2 - Math.sin(a) * bend, my = (y + ey) / 2 + Math.cos(a) * bend;
    const pale = rand() < 0.22;
    const alpha = pale ? 0.25 + rand() * 0.25 : 0.08 + rand() * rand() * 0.42;
    const v = 92 + rand() * 30 | 0;
    g.strokeStyle = pale ? `rgba(255,254,250,${alpha})` : `rgba(${v},${v - 3},${v - 9},${alpha})`;
    g.lineWidth = (0.45 + rand() * 0.6) * fibreScale;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(mx, my, ex, ey); g.stroke();
  }

  // fine grain
  const img = g.getImageData(0, 0, W, H);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rand() - 0.5) * 2.5;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  g.putImageData(img, 0, 0);

  // paper seams: a faint ridge with a highlight beside it, slightly wavering
  for (const sx of seams) {
    const [x0] = toPx(sx, 0);
    for (const [off, col, w] of [[0, 'rgba(120,110,96,0.22)', 1.6], [2.2, 'rgba(255,255,250,0.35)', 1.4]]) {
      g.strokeStyle = col; g.lineWidth = w * fibreScale;
      g.beginPath();
      for (let y = 0; y <= H; y += 24) {
        const x = x0 + off * fibreScale + Math.sin(y * 0.011 + sx) * 1.5 + (rand() - 0.5) * 0.8;
        y === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
      }
      g.stroke();
    }
    // the sheet beyond the seam is a touch darker
    g.fillStyle = sx > 0 ? 'rgba(120,110,96,0.025)' : 'rgba(255,255,255,0.02)';
    sx > 0 ? g.fillRect(x0, 0, W - x0, H) : g.fillRect(0, 0, x0, H);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/** Window light pattern projected by the key light: panes, mullions and a transom. */
export function goboTexture(size = 512, angle = 90) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const s = size;
  const layer = document.createElement('canvas');
  layer.width = layer.height = s;
  const l = layer.getContext('2d');
  l.fillStyle = '#000';
  l.fillRect(0, 0, s, s);
  l.fillStyle = '#fff';
  // A tall window: narrow panes separated by mullions, with two transoms.
  // Vertical bars in the texture land on the paper as shafts running with the light.
  const cols = 6, period = 0.86 / cols, bar = period * 0.3;
  for (let i = 0; i < cols; i++) {
    const x = (0.07 + i * period + bar / 2) * s, w = (period - bar) * s;
    l.fillRect(x, 0.02 * s, w, 0.3 * s);
    l.fillRect(x, 0.35 * s, w, 0.33 * s);
    l.fillRect(x, 0.73 * s, w, 0.25 * s);
  }
  g.fillStyle = '#000';
  g.fillRect(0, 0, s, s);
  g.filter = `blur(${Math.round(s * 0.012)}px)`;
  g.translate(s / 2, s / 2);
  g.rotate((angle * Math.PI) / 180);
  g.scale(0.9, 0.9);
  g.drawImage(layer, -s / 2, -s / 2);
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.filter = 'none';
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
