// The intro's pieces and their choreography, derived frame-by-frame from `karvon intro.mp4`.
// World units: mark width = 10, origin = mark centre, y up, z towards the camera.
// Every piece hangs from a pivot on its hinge, so it folds, flips and stands up like card.
import * as THREE from 'three';
import { PIECES, MARK_SIZE } from './mark-geometry.js';
import { track } from './timeline.js';
import { prism, gradMaterial, setGrad } from './geometry.js';

export const T = 0.12;               // piece thickness (1.2% of the mark width)
const BASE_Z = T / 2 + 0.004;        // resting on the paper

const S = 10 / MARK_SIZE.w;
const toWorld = ([u, v]) => [(u - MARK_SIZE.w / 2) * S, (MARK_SIZE.h / 2 - v) * S];
const POLY = Object.fromEntries(PIECES.map((p) => [p.id, p.points.map(toWorld)]));
const pt = (id, i) => POLY[id][i];
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const centroid = (pts) => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
const dir = (a, b) => { const x = b[0] - a[0], y = b[1] - a[1], l = Math.hypot(x, y); return [x / l, y / l, 0]; };
const bounds = (ids) => {
  const ps = ids.flatMap((id) => POLY[id]);
  return { x0: Math.min(...ps.map((p) => p[0])), x1: Math.max(...ps.map((p) => p[0])), y0: Math.min(...ps.map((p) => p[1])), y1: Math.max(...ps.map((p) => p[1])) };
};
const vgrad = (b) => (x, y) => (b.y1 - y) / (b.y1 - b.y0 || 1); // 0 at top → 1 at bottom

// ---------- colours (sRGB hex). [top, bottom] gradients per face. ----------
const FINAL = { charcoal: '#2b3034', slate: '#6c7f8b', slateDark: '#48545d' };
const flat = (c) => [c, c];

// Colour track: keys [[t, [topHex, botHex]], ...] → (t) => [Color, Color] in linear space.
function ctrack(keys) {
  const cols = keys.map(([t, [a, b]]) => [t, [...new THREE.Color(a).toArray(), ...new THREE.Color(b).toArray()]]);
  const tr = track(cols.map(([t, v]) => [t, v, 'inOutSine']));
  const top = new THREE.Color(), bot = new THREE.Color();
  return (t) => { const v = tr(t); top.setRGB(v[0], v[1], v[2]); bot.setRGB(v[3], v[4], v[5]); return [top, bot]; };
}

// ---------- node specs ----------
// hinge: { p:[x,y], axis:[x,y,z] }   fold: degrees about the hinge axis
// pos: [dx,dy,dz] offset of the pivot   spin: [rx,ry,rz] degrees (applied after fold)
// show: [tIn, tOut] visibility window   faces: { front, back, side } colour tracks
const stemB = bounds(['chimney', 'stem']);
const stemPivot = [(stemB.x0 + stemB.x1) / 2, (stemB.y0 + stemB.y1) / 2];
const CHIMNEY_DROP = -(pt('chimney', 3)[1] - pt('stem', 0)[1]); // closes the channel during the plain-K phase

const pale = flat('#eeeae2');

function logoSpecs() {
  const settle = (z, a = 4.6, b = 5.6) => [[a, [0, 0, z]], [b, [0, 0, 0], 'inOutCubic']];
  const resolve = (from, to, a = 5.6, b = 6.3) => ctrack([[a, from], [b, to]]);

  return [
    {
      id: 'stemGroup', hinge: { p: stemPivot, axis: [0, 1, 0] }, show: [1.0, 99],
      pos: track([[1.0, [0.8, 13, 1.0]], [1.55, [0, 0, 0.6], 'outCubic'], [1.82, [0, 0, 1.2], 'inOutSine'], [2.1, [0, 0, 0.36], 'inOutSine'], ...settle(0.34)]),
      fold: track([[1.6, 180], [2.08, 0, 'inOutCubic'], [3.8, 0], [4.35, -24, 'inOutSine'], [5.3, 0, 'inOutCubic']]),
      spin: track([[1.0, [0, 0, -9]], [1.55, [0, 0, 0], 'outCubic']]),
      children: [
        {
          id: 'chimney', mesh: 'chimney',
          pos: track([[3.6, [0, CHIMNEY_DROP, 0]], [4.15, [0, 0, 0.18], 'inOutCubic'], [4.6, [0, 0, 0]]]),
          faces: {
            front: resolve(['#625e58', '#30373d'], flat(FINAL.charcoal), 5.4, 6.2),
            back: ctrack([[0, pale]]), side: ctrack([[0, flat('#b9b4aa')], [5, flat('#b9b4aa')], [6, flat('#3b4045')]]),
          },
          grad: stemB,
        },
        {
          id: 'stem', mesh: 'stem',
          faces: {
            front: resolve(['#57544f', '#2e353b'], flat(FINAL.charcoal), 5.4, 6.2),
            back: ctrack([[0, pale]]), side: ctrack([[0, flat('#b9b4aa')], [5, flat('#b9b4aa')], [6, flat('#3b4045')]]),
          },
          grad: stemB,
        },
      ],
    },
    {
      id: 'arm', mesh: 'arm', hinge: { p: mid(pt('arm', 1), pt('arm', 2)), axis: [1, 0, 0] }, show: [2.36, 99],
      pos: track([[2.36, [1.0, 1.2, 1.5]], [2.8, [0, 0, 0.55], 'inOutCubic'], ...settle(0.5)]),
      fold: track([[2.36, -96], [2.8, 0, 'inOutCubic']]),
      faces: {
        front: resolve(['#8a6d55', '#3b3e41'], flat(FINAL.charcoal)),
        back: ctrack([[0, flat('#9c7a5c')]]), side: ctrack([[0, flat('#6e5a48')], [6, flat('#3b4045')]]),
      },
      grad: bounds(['arm']),
    },
    {
      id: 'leg', mesh: 'leg', hinge: { p: mid(pt('leg', 0), pt('leg', 1)), axis: dir(pt('leg', 0), pt('leg', 1)) }, show: [2.6, 99],
      pos: track([[2.6, [0, 0, 0.66]], [3.32, [0, 0, 0.44], 'inOutCubic'], ...settle(0.42)]),
      fold: track([[2.6, -176], [3.32, 0, 'inOutCubic']]),
      faces: {
        front: resolve(['#3a3d40', '#a27a58'], flat(FINAL.charcoal), 5.7, 6.3),
        back: ctrack([[0, ['#b98f68', '#a9825d']]]), side: ctrack([[0, flat('#8a6a4b')], [6, flat('#3b4045')]]),
      },
      grad: bounds(['leg']),
    },
    {
      id: 'slateTop', mesh: 'slateTop', hinge: { p: centroid(POLY.slateTop), axis: [1, 0, 0] }, show: [3.42, 99],
      pos: track([[3.42, [0.9, 8.5, 4.2]], [3.96, [0, 0, 0.46], 'outCubic'], ...settle(0.44)]),
      spin: track([[3.42, [70, 0, 24]], [3.96, [0, 0, 0], 'outCubic']]),
      faces: slateFaces('#7f8f9b', '#5f707c', FINAL.slate),
      grad: bounds(['slateTop']),
    },
    {
      id: 'wall', hinge: { p: [pt('wallSlate', 1)[0], 0], axis: [0, 1, 0] }, show: [3.72, 99],
      pos: track([[3.72, [-1.2, 0.4, 0.7]], [4.2, [-0.15, 0, 0.45], 'outCubic'], [4.8, [0, 0, 0.38]], ...settle(0.38, 4.8, 5.6)]),
      fold: track([[3.72, 110], [4.2, 58, 'outCubic'], [4.75, 40, 'inOutSine'], [5.35, 0, 'inOutCubic']]),
      children: [
        { id: 'wallSlate', mesh: 'wallSlate', faces: slateFaces('#7e8e9a', '#5c6d79', FINAL.slate), grad: bounds(['wallSlate']) },
        { id: 'wallFace', mesh: 'wallFace', faces: darkFaces('#4c5762', '#2b3237', FINAL.charcoal), grad: bounds(['wallFace']) },
      ],
    },
    {
      id: 'bottom', hinge: { p: [pt('charBot', 1)[0], pt('charBot', 0)[1]], axis: [1, 0, 0] }, show: [3.95, 99],
      pos: track([[3.95, [0.3, -1.2, 0.5]], [4.55, [0, 0, 0.3], 'outCubic'], ...settle(0.3)]),
      fold: track([[3.95, 125], [4.5, 35, 'outCubic'], [5.2, 0, 'inOutCubic']]),
      children: [
        { id: 'slateBot', mesh: 'slateBot', faces: slateFaces('#788894', '#5d6e7a', FINAL.slate), grad: bounds(['slateBot']) },
        { id: 'charBot', mesh: 'charBot', faces: darkFaces('#3d454c', '#2c3237', FINAL.charcoal), grad: bounds(['charBot']) },
      ],
    },
    {
      id: 'cube', hinge: { p: centroid([pt('cubeTop', 0), pt('cubeTop', 1), pt('cubeRight', 2)]), axis: [0, 0, 1] }, show: [4.2, 99],
      pos: track([[4.2, [7.6, -2.6, 3.4]], [5.25, [0, 0, 0.34], 'outCubic'], [5.6, [0, 0, 0], 'inOutCubic']]),
      spin: track([[4.2, [-38, 28, 85]], [5.25, [0, 0, 0], 'outCubic']]),
      children: [
        {
          id: 'cubeTop', mesh: 'cubeTop', hinge: { p: mid(pt('cubeTop', 2), pt('cubeTop', 1)), axis: dir(pt('cubeTop', 2), pt('cubeTop', 1)) },
          fold: track([[4.55, 150], [5.25, 0, 'inOutCubic']]),
          faces: slateFaces('#8293a0', '#6a7b87', FINAL.slate), grad: bounds(['cubeTop']),
        },
        { id: 'cubeMid', mesh: 'cubeMid', faces: slateFaces('#4f5c67', '#414d56', FINAL.slateDark), grad: bounds(['cubeMid']) },
        { id: 'cubeRight', mesh: 'cubeRight', faces: darkFaces('#353c42', '#272d31', FINAL.charcoal), grad: bounds(['cubeRight']) },
      ],
    },
  ];
}

function slateFaces(top, bot, final) {
  return {
    front: ctrack([[5.4, [top, bot]], [6.1, flat(final)]]),
    back: ctrack([[0, flat('#4e5b66')]]),
    side: ctrack([[0, flat('#93a2ad')], [6, flat('#7a8995')]]),
  };
}
function darkFaces(top, bot, final) {
  return {
    front: ctrack([[5.4, [top, bot]], [6.1, flat(final)]]),
    back: ctrack([[0, flat('#5a6570')]]),
    side: ctrack([[0, flat('#59636c')], [6, flat('#3b4045')]]),
  };
}

// ---------- extra paper: strips, sheets and ribbons that pass through ----------
const rect = (cx, cy, len, wid, deg) => {
  const a = (deg * Math.PI) / 180, ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux;
  const h = len / 2, w = wid / 2;
  return [[cx - ux * h - vx * w, cy - uy * h - vy * w], [cx + ux * h - vx * w, cy + uy * h - vy * w], [cx + ux * h + vx * w, cy + uy * h + vy * w], [cx - ux * h + vx * w, cy - uy * h + vy * w]];
};
const paperFaces = (c = '#efebe3') => ({ front: ctrack([[0, flat(c)]]), back: ctrack([[0, flat('#e6e1d8')]]), side: ctrack([[0, flat('#fbf9f4')]]) });

/** A ribbon: `n` hinged panels chained along +x from an anchor, then rotated to `deg`. */
function ribbon({ id, anchor, deg, n = 4, len = 3.6, wid = 3.2, show, pos, folds, colors }) {
  const a = (deg * Math.PI) / 180, ux = Math.cos(a), uy = Math.sin(a);
  const panels = [];
  let parent = null;
  for (let i = 0; i < n; i++) {
    const s = [anchor[0] + ux * len * i, anchor[1] + uy * len * i];
    const pts = rect(s[0] + ux * len / 2, s[1] + uy * len / 2, len, wid, deg);
    const g0 = i / n, g1 = (i + 1) / n;
    const node = {
      id: `${id}${i}`, poly: pts, hinge: { p: s, axis: [-uy, ux, 0] },
      fold: folds[i],
      faces: { front: ctrack([[0, colors]]), back: ctrack([[0, flat('#c9b49c')]]), side: ctrack([[0, flat('#d8ccbc')]]) },
      gradFn: (x, y) => g0 + (g1 - g0) * Math.min(1, Math.max(0, ((x - s[0]) * ux + (y - s[1]) * uy) / len)),
      children: [],
    };
    if (parent) parent.children.push(node); else panels.push(node);
    parent = node;
  }
  return { id, hinge: { p: anchor, axis: [0, 0, 1] }, show, pos, children: panels };
}

function extraSpecs() {
  const wob = (base, amp, f, ph) => (t) => base + amp * Math.sin(t * f + ph);
  return [
    { // thin pale strip on the left
      id: 'stripL', poly: rect(-10.4, 0.4, 15, 0.7, 58), hinge: { p: [-10.4, 0.4], axis: [0, 0, 1] }, show: [1.0, 2.3],
      pos: track([[1.0, [-8, -3, 0.6]], [1.48, [0, 0, 0.5], 'outCubic'], [1.75, [0, 0, 0.5]], [2.3, [-10, -2, 0.5], 'inCubic']]),
      faces: paperFaces(),
    },
    { // fine crease lines left behind, sliding out slowly
      id: 'creases', hinge: { p: [-9, -2], axis: [0, 0, 1] }, show: [1.0, 3.6],
      pos: track([[1.0, [-6, -2, 0]], [1.5, [0, 0, 0], 'outCubic'], [1.8, [0, 0, 0]], [3.6, [-9, -3, 0], 'inCubic']]),
      children: [
        { id: 'crease1', poly: rect(-11.2, -2.0, 11, 0.05, 60), faces: paperFaces('#fbfaf6') },
        { id: 'crease2', poly: rect(-8.6, -4.6, 7, 0.04, 62), faces: paperFaces('#fbfaf6') },
      ],
    },
    { // large folded sheet on the right
      id: 'sheetR', hinge: { p: [10.4, -4.2], axis: [0.97, 0.24, 0] }, show: [1.0, 2.35],
      pos: track([[1.0, [9, 2.5, 0.9]], [1.5, [0, 0, 0.9], 'outCubic'], [1.75, [0, 0, 0.9]], [2.35, [9, -7, 0.7], 'inCubic']]),
      fold: track([[1.0, 18], [1.75, 22], [2.3, 70, 'inCubic']]),
      children: [
        { id: 'sheetA', poly: [[6.6, -4.9], [15, -2.8], [15, 9], [7.0, 9]], faces: paperFaces() },
        {
          id: 'sheetFlap', poly: [[9.4, -5.15], [15, -3.75], [14, -7.2]], hinge: { p: [12.2, -4.45], axis: [0.97, 0.24, 0] },
          fold: track([[1.0, -55], [1.75, -60], [2.3, -120]]), faces: paperFaces('#f3efe8'),
        },
      ],
    },
    { // pale sheet curling up at the bottom right, just before the cube arrives
      id: 'curl', poly: rect(7.6, -5.4, 2.6, 2.4, 20), hinge: { p: [6.4, -5.6], axis: [0.34, 0.94, 0] }, show: [3.65, 4.75],
      pos: track([[3.65, [3, -2, 0.4]], [4.0, [0, 0, 0.4], 'outCubic'], [4.75, [5, -4, 0.6], 'inCubic']]),
      fold: track([[3.65, 0], [4.4, 110]]),
      faces: paperFaces(),
    },
    ribbon({ // ochre → slate ribbon at the top right
      id: 'ribbonTR', anchor: [6.9, -0.6], deg: 46, wid: 3.0, show: [3.7, 5.75],
      pos: track([[3.7, [9, 10, 0.9]], [4.15, [0, 0, 0.9], 'outCubic'], [4.9, [0.3, 0.3, 0.9]], [5.7, [9, 10, 1.0], 'inCubic']]),
      folds: [wob(-28, 6, 2.1, 0), wob(34, 8, 1.7, 1), wob(-18, 6, 2.4, 2), wob(12, 5, 1.9, 3)],
      colors: ['#a77f5e', '#4f5c68'],
    }),
    ribbon({ // ochre ribbon at the bottom left
      id: 'ribbonBL', anchor: [-5.6, -5.0], deg: 214, wid: 4.0, show: [3.95, 5.75],
      pos: track([[3.95, [-9, -6, 0.8]], [4.35, [0, 0, 0.8], 'outCubic'], [4.95, [-0.2, -0.2, 0.8]], [5.7, [-10, -7, 0.9], 'inCubic']]),
      folds: [wob(22, 6, 2.0, 0.5), wob(-30, 7, 1.8, 1.5), wob(16, 5, 2.2, 2.5), wob(-10, 4, 1.6, 3.5)],
      colors: ['#b0855f', '#9b7556'],
    }),
  ];
}

// ---------- build ----------
const q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion(), ax = new THREE.Vector3(), eul = new THREE.Euler();
const DEG = Math.PI / 180;

function buildNode(spec, out, depth) {
  const pivot = new THREE.Group();
  const inner = new THREE.Group();
  pivot.add(inner);
  const p = spec.hinge ? spec.hinge.p : [0, 0];
  inner.position.set(-p[0], -p[1], 0);
  const node = { spec, pivot, inner, p, depth, mats: null, children: [] };

  const poly = spec.poly || (spec.mesh && POLY[spec.mesh]);
  if (poly) {
    const gb = spec.grad || bounds([]);
    const gradFn = spec.gradFn || (spec.grad ? vgrad(gb) : () => 0);
    const geo = prism(poly, T, gradFn);
    const mats = [gradMaterial(0xffffff), gradMaterial(0xffffff), gradMaterial(0xffffff)];
    const mesh = new THREE.Mesh(geo, mats);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    inner.add(mesh);
    node.mats = mats;
  }
  for (const c of spec.children || []) {
    const child = buildNode(c, out, depth + 1);
    inner.add(child.pivot);
    node.children.push(child);
  }
  out.push(node);
  return node;
}

export function buildPieces() {
  const root = new THREE.Group();
  const nodes = [];
  for (const spec of [...logoSpecs(), ...extraSpecs()]) {
    const n = buildNode(spec, nodes, 0);
    root.add(n.pivot);
  }

  function update(t) {
    for (const n of nodes) {
      const s = n.spec;
      if (s.show) n.pivot.visible = t >= s.show[0] && t < s.show[1];
      if (!n.pivot.visible && n.depth === 0) continue;
      const pos = s.pos ? s.pos(t) : [0, 0, 0];
      n.pivot.position.set(n.p[0] + pos[0], n.p[1] + pos[1], pos[2] + (n.depth === 0 ? BASE_Z : 0));
      const fold = s.fold ? s.fold(t) : 0;
      const axis = s.hinge ? s.hinge.axis : [0, 0, 1];
      q1.setFromAxisAngle(ax.set(axis[0], axis[1], axis[2]).normalize(), fold * DEG);
      if (s.spin) {
        const sp = s.spin(t);
        q2.setFromEuler(eul.set(sp[0] * DEG, sp[1] * DEG, sp[2] * DEG));
        n.pivot.quaternion.multiplyQuaternions(q2, q1);
      } else {
        n.pivot.quaternion.copy(q1);
      }
      if (n.mats && s.faces) {
        const [ft, fb] = s.faces.front(t); setGrad(n.mats[0], ft, fb);
        const [bt, bb] = s.faces.back(t); setGrad(n.mats[1], bt, bb);
        const [st, sb] = s.faces.side(t); setGrad(n.mats[2], st, sb);
      }
    }
  }

  return { root, update, nodes };
}

/** Mark bounds in world units (for projecting the lockup rect). */
export const MARK_WORLD = { x0: -5, x1: 5, y0: -(MARK_SIZE.h / 2) * S, y1: (MARK_SIZE.h / 2) * S };
