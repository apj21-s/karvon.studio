// Three.js engine for the intro. render(t) is a pure function of time.
import * as THREE from 'three';
import { smooth, track, clamp01 } from './timeline.js';
import { finalRect } from './lockup.js';
import { buildPieces, MARK_WORLD } from './pieces.js';
import { paperTexture, goboTexture } from './paper.js';

const DEG = Math.PI / 180;
const FOV = 28;
const TAN = Math.tan((FOV / 2) * DEG);

// Mark size on screen relative to the final frame (measured from the reference).
const zoom = smooth([[0, 2.0], [4.6, 2.0], [5.0, 1.9], [5.5, 1.7], [5.75, 1.52], [6.0, 1.38], [6.5, 1.26], [7.0, 1.17], [7.5, 1.1], [8.0, 1.055], [8.5, 1.03], [9.0, 1.013], [10, 1.0]]);
// Vertical position of the mark centre (fraction of viewport height, from the top).
const markY = smooth([[0, 0.47], [5.5, 0.46], [6.0, 0.442], [6.5, 0.444], [7.0, 0.425], [7.25, 0.386], [7.5, 0.376], [8.0, 0.377], [9.0, 0.381], [10, 0.3826]]);
const REF_FINAL_Y = 0.3826;
const pitch = track([[0, 10], [3.4, 12], [4.3, 17, 'inOutSine'], [4.8, 17], [5.4, 7, 'inOutSine'], [6.0, 0, 'inOutSine']]);
const roll = track([[0, 9], [4.6, 9], [5.25, 4, 'inOutSine'], [6.0, 0, 'inOutSine']]);
const panX = track([[0, 0.45], [4.6, 0.45], [6.0, 0, 'inOutSine']]);
// Key light: comes from the left and slightly above, low enough to stretch the window into shafts.
const lightTarget = track([[0, [-5, 3.5, 0]], [10, [3.5, -1.5, 0], 'linear']]);

export async function createScene({ canvas, viewport, onFail }) {
  let vp = { ...viewport };
  const lowMem = (navigator.deviceMemory || 8) <= 4;
  const small = Math.min(vp.w, vp.h) < 600;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, lowMem ? 1.5 : 1.75));
  renderer.setSize(vp.w, vp.h, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.setClearColor(0xe9e5df, 1);

  const onLost = (e) => { e.preventDefault(); onFail?.(); };
  canvas.addEventListener('webglcontextlost', onLost);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, vp.w / vp.h, 0.5, 400);

  // ---- paper ----
  const fr0 = finalRect(vp.w, vp.h);
  const pxu = fr0.w / 10; // px per world unit in the final frame
  const viewW = vp.w / pxu, viewH = vp.h / pxu;
  const pw = Math.max(viewW * 1.3, 46), ph = Math.max(viewH * 1.7, 34);
  const paperCy = -((fr0.y + fr0.h / 2) - vp.h / 2) / pxu;
  // Seams sit where the reference shows them (x≈1060 and x≈200 of 1280 in the final frame).
  const seams = [(1060 - 640) / 23.4, (200 - 640) / 23.4];
  const paperTex = paperTexture({ pw, ph, cx: 0, cy: paperCy, res: small || lowMem ? 1536 : 2048, seams });
  const paper = new THREE.Mesh(
    new THREE.PlaneGeometry(pw, ph),
    new THREE.MeshStandardMaterial({ map: paperTex, roughness: 0.95, metalness: 0 }),
  );
  paper.position.set(0, paperCy, 0);
  paper.receiveShadow = true;
  scene.add(paper);

  // ---- light ----
  const hemi = new THREE.HemisphereLight(0xfffdf9, 0xe4dfd6, 2.55);
  scene.add(hemi);
  const gobo = goboTexture(512, import.meta.env.DEV && new URLSearchParams(location.search).has('gobo') ? +new URLSearchParams(location.search).get('gobo') : 90);
  const key = new THREE.SpotLight(0xfff8ef, 2.0, 0, 0.62, 0, 0);
  key.map = gobo;
  key.castShadow = true;
  key.shadow.mapSize.set(small || lowMem ? 1024 : 2048, small || lowMem ? 1024 : 2048);
  key.shadow.radius = 9;
  key.shadow.blurSamples = 16;
  key.shadow.bias = -0.0002;
  key.shadow.normalBias = 0.015;
  key.shadow.camera.near = 20;
  key.shadow.camera.far = 140;
  scene.add(key, key.target);
  const elev = 34 * DEG, AZIM = 150 * DEG; // from upper-left
  const KEY_DIST = 70;

  // ---- pieces ----
  const pieces = buildPieces();
  scene.add(pieces.root);

  // Warm up shaders once so the first animated frame doesn't hitch.
  renderer.compile(scene, camera);

  const tmp = new THREE.Vector3();
  const up = new THREE.Vector3();

  function placeCamera(t) {
    const f = finalRect(vp.w, vp.h);
    const dFinal = (10 * vp.h) / (f.w * 2 * TAN);
    // On narrow screens keep the busy assembly inside the frame.
    const s = Math.min(zoom(t), Math.max(1, (0.7 * vp.w) / f.w));
    const d = dFinal / s;
    const px = vp.h / (2 * d * TAN); // px per unit on the paper
    // converge on this viewport's final slot (the reference's samples are for 16:9)
    const fy = (f.y + f.h / 2) / vp.h;
    const yFrac = markY(t) + (fy - REF_FINAL_Y) * clamp01((t - 5.5) / 2.5);
    const ty = (yFrac * vp.h - vp.h / 2) / px;
    const tx = panX(t);
    const ph = pitch(t) * DEG, rl = roll(t) * DEG;
    camera.position.set(tx, ty - d * Math.sin(ph), d * Math.cos(ph));
    up.set(Math.sin(rl), Math.cos(rl), 0);
    camera.up.copy(up);
    camera.lookAt(tx, ty, 0);
    camera.aspect = vp.w / vp.h;
    camera.updateProjectionMatrix();
  }

  function placeLight(t) {
    const tg = lightTarget(t);
    const azim = AZIM - roll(t) * DEG; // keep the shafts' on-screen angle while the camera rolls
    key.target.position.set(tg[0], tg[1], 0);
    key.position.set(
      tg[0] + KEY_DIST * Math.cos(elev) * Math.cos(azim),
      tg[1] + KEY_DIST * Math.cos(elev) * Math.sin(azim),
      KEY_DIST * Math.sin(elev),
    );
  }

  function markRect() {
    const pts = [[MARK_WORLD.x0, MARK_WORLD.y1], [MARK_WORLD.x1, MARK_WORLD.y0]].map(([x, y]) => {
      tmp.set(x, y, 0).project(camera);
      return [(tmp.x * 0.5 + 0.5) * vp.w, (-tmp.y * 0.5 + 0.5) * vp.h];
    });
    const w = pts[1][0] - pts[0][0];
    return { x: pts[0][0], y: pts[0][1], w, h: pts[1][1] - pts[0][1] };
  }

  function render(t) {
    placeCamera(t);
    placeLight(t);
    pieces.update(t);
    renderer.render(scene, camera);
    return markRect();
  }

  function resize(v) {
    vp = { ...v };
    renderer.setSize(vp.w, vp.h, false);
  }

  function dispose() {
    canvas.removeEventListener('webglcontextlost', onLost);
    scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { m.map?.dispose(); m.dispose(); });
    });
    paperTex.dispose();
    gobo.dispose();
    key.shadow.map?.dispose();
    key.dispose();
    renderer.renderLists.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  }

  return { duration: 10, render, resize, dispose };
}
