// Three.js engine for the intro. render(t) is a pure function of time.
import * as THREE from 'three';
import { smooth, track, clamp01 } from './timeline.js';
import { finalRect, R as LOCKUP } from './lockup.js';
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
// Ambient level: the reference opens brighter and settles as the lockup forms (measured mean RGB).
const ambient = track([[0, 2.95], [3.5, 2.88], [5.0, 2.72, 'inOutSine'], [7.5, 2.6, 'inOutSine'], [10, 2.58]]);
const lightTarget = track([[0, [-5, 3.5, 0]], [10, [3.5, -1.5, 0], 'linear']]);

// Yield to the browser between heavy setup steps so scrolling never stalls while the film loads.
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));

export async function createScene({ canvas, viewport, onFail }) {
  let vp = { ...viewport };
  const lowMem = (navigator.deviceMemory || 8) <= 4;
  const small = Math.min(vp.w, vp.h) < 600;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  // HD: render at the screen's real density (up to 3×), supersample 1× screens at 1.5×,
  // and keep the total under a pixel budget so large desktops stay smooth.
  const dpr = devicePixelRatio || 1;
  const budget = Math.sqrt(6.5e6 / (vp.w * vp.h));
  // (a small screen, like the hero's phone, is sharp at 2×; 3× there only costs GPU time)
  renderer.setPixelRatio(Math.max(1, Math.min(Math.max(dpr, 1.5), lowMem || small ? 2 : 3, budget)));
  renderer.setSize(vp.w, vp.h, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true;
  // Small screens (the hero's phone) use PCF soft shadows: ~5× cheaper per frame than VSM's blur
  // passes, and at that size a slightly smaller shadow map gives the same soft look.
  renderer.shadowMap.type = small ? THREE.PCFSoftShadowMap : THREE.VSMShadowMap;
  renderer.setClearColor(0xe9e5df, 1);

  const onLost = (e) => { e.preventDefault(); console.warn('[intro] WebGL context lost; finishing early'); onFail?.(); };
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
  const paperRes = lowMem || small ? 2048 : 3072;
  const anisotropy = renderer.capabilities.getMaxAnisotropy();
  await nextFrame();
  const paperTex = paperTexture({ pw, ph, cx: 0, cy: paperCy, res: paperRes, seams, anisotropy });
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
  const gobo = goboTexture(1024, import.meta.env.DEV && new URLSearchParams(location.search).has('gobo') ? +new URLSearchParams(location.search).get('gobo') : 90);
  const key = new THREE.SpotLight(0xfff8ef, 2.0, 0, 0.62, 0, 0);
  key.map = gobo;
  key.castShadow = true;
  // The shadows are soft (blurred VSM), so a larger map adds GPU memory, not sharpness.
  key.shadow.mapSize.set(small ? 768 : 2048, small ? 768 : 2048);
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
  await nextFrame();
  const pieces = buildPieces();
  scene.add(pieces.root);
  await nextFrame();

  // Warm up shaders once so the first animated frame doesn't hitch.
  renderer.compile(scene, camera);

  const tmp = new THREE.Vector3();
  const up = new THREE.Vector3();

  function placeCamera(t) {
    const f = finalRect(vp.w, vp.h);
    const dFinal = (10 * vp.h) / (f.w * 2 * TAN);
    // On narrow screens keep the busy assembly inside the frame.
    const assembly = Math.max(1, (0.62 * vp.w) / f.w);
    // Once the wordmark arrives, the whole lockup (word = 1.77× the mark) must fit the width.
    const lockupFit = Math.max(1, (0.88 * vp.w) / (LOCKUP.wordWidth * f.w));
    const k = clamp01((t - 5.3) / 1.0), blend = k * k * (3 - 2 * k);
    const s = Math.min(zoom(t), assembly + (Math.min(assembly, lockupFit) - assembly) * blend);
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
    hemi.intensity = ambient(t);
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
