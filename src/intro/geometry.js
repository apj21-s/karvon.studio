// Thin two-sided paper pieces: a polygon extruded by `thickness`, with separate
// material groups for the front face (+z), back face (−z) and the edges.
import * as THREE from 'three';

/**
 * @param {Array<[number,number]>} pts  polygon in world units (any winding)
 * @param {number} thickness
 * @param {(x:number,y:number)=>number} gradFn  0..1 gradient position for a point
 */
export function prism(pts, thickness, gradFn = () => 0) {
  let contour = pts.map(([x, y]) => new THREE.Vector2(x, y));
  if (THREE.ShapeUtils.isClockWise(contour)) contour = contour.reverse();
  const tris = THREE.ShapeUtils.triangulateShape(contour, []);
  const hz = thickness / 2;
  const pos = [], nor = [], grad = [];
  const push = (x, y, z, nx, ny, nz) => { pos.push(x, y, z); nor.push(nx, ny, nz); grad.push(gradFn(x, y)); };

  // front (+z, CCW)
  for (const [a, b, c] of tris) for (const i of [a, b, c]) push(contour[i].x, contour[i].y, hz, 0, 0, 1);
  const frontCount = tris.length * 3;
  // back (−z, reversed)
  for (const [a, b, c] of tris) for (const i of [a, c, b]) push(contour[i].x, contour[i].y, -hz, 0, 0, -1);
  const backCount = tris.length * 3;
  // edges
  for (let i = 0; i < contour.length; i++) {
    const p = contour[i], q = contour[(i + 1) % contour.length];
    const ex = q.x - p.x, ey = q.y - p.y, len = Math.hypot(ex, ey) || 1;
    const nx = ey / len, ny = -ex / len; // outward for CCW
    push(p.x, p.y, hz, nx, ny, 0); push(p.x, p.y, -hz, nx, ny, 0); push(q.x, q.y, -hz, nx, ny, 0);
    push(p.x, p.y, hz, nx, ny, 0); push(q.x, q.y, -hz, nx, ny, 0); push(q.x, q.y, hz, nx, ny, 0);
  }
  const sideCount = contour.length * 6;

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aGrad', new THREE.Float32BufferAttribute(grad, 1));
  g.addGroup(0, frontCount, 0);
  g.addGroup(frontCount, backCount, 1);
  g.addGroup(frontCount + backCount, sideCount, 2);
  g.computeBoundingSphere();
  return g;
}

/** Matte material whose colour is a gradient between two animatable colours. */
export function gradMaterial(top, bottom = top, { roughness = 0.86 } = {}) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness, metalness: 0 });
  const uTop = { value: new THREE.Color(top) };
  const uBot = { value: new THREE.Color(bottom) };
  m.userData.uTop = uTop;
  m.userData.uBot = uBot;
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTop = uTop;
    sh.uniforms.uBot = uBot;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aGrad;\nvarying float vGrad;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGrad = aGrad;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uTop;\nuniform vec3 uBot;\nvarying float vGrad;')
      .replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( mix( uTop, uBot, clamp( vGrad, 0.0, 1.0 ) ) * diffuse, opacity );');
  };
  m.customProgramCacheKey = () => 'karvon-grad';
  return m;
}

/** Set a gradient material's colours (hex numbers or THREE.Color). */
export function setGrad(m, top, bottom) {
  m.userData.uTop.value.copy(top);
  m.userData.uBot.value.copy(bottom);
}
