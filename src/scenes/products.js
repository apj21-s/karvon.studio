// Products: ACEIIIT in its own visual language. The introduction arrives with the scene, the
// product's method papers are dealt onto the desk, then each one lifts into the spotlight as its
// caption lights up; the capabilities settle in last. Phones play the papers as a stack.
import { gsap } from 'gsap';
import { sceneTimeline, arrive } from './util.js';

export function productsScene(scene, small) {
  const q = gsap.utils.selector(scene);
  const [inner] = q('.products__inner');
  const [intro] = q('.product__intro');
  const [deskWrap] = q('.product__desk');
  const sheets = q('.sheet');
  const notes = q('.desk__notes li');
  const caps = q('.product__caps li');
  const introParts = q('.product__brand, .product__name, .product__summary, .product__flow, .product__actions');

  arrive(introParts, scene, { y: 50, autoAlpha: 0 });
  gsap.set(sheets, { autoAlpha: 0 });
  gsap.set(caps, { autoAlpha: 0 });

  // which paper is in the spotlight: drives captions and stacking
  let active = -2;
  const [desk] = q('.desk');
  const setActive = (i) => {
    if (i === active) return;
    active = i;
    // spotlight: while one paper is up, the others blur and step back
    desk.classList.toggle('is-focus', i >= 0);
    sheets.forEach((s, j) => s.classList.toggle('is-active', j === i));
    notes.forEach((n, j) => n.classList.toggle('is-active', j === i || (!small && i === -1)));
    sheets.forEach((s, j) => (s.style.zIndex = j === i ? 10 : j + 1));
  };
  setActive(-1);

  const tl = sceneTimeline(scene, small ? 2.0 : 1.6, small);
  const SPOT = 0.42;

  if (!small) {
    tl.fromTo(sheets,
      { autoAlpha: 0, yPercent: 60, y: 60, rotation: (i) => [-18, 14, -12, 20][i] || 0, scale: 0.9 },
      { autoAlpha: 1, yPercent: 0, y: 0, rotation: 0, scale: 1, duration: 0.8, stagger: 0.12, ease: 'expo.out' }, 0);
    const start = 0.95;
    sheets.forEach((s, i) => {
      const at = start + i * SPOT;
      tl.to(s, { scale: 1.28, y: -24, duration: 0.2, ease: 'power2.out' }, at)
        .to(s, { scale: 1, y: 0, duration: 0.2, ease: 'power2.inOut' }, at + SPOT - 0.12);
    });
    tl.fromTo(caps, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, stagger: 0.06, ease: 'expo.out' }, start + 1.1);
    tl.eventCallback('onUpdate', () => {
      const t = tl.time();
      setActive(t < start ? -1 : t > start + sheets.length * SPOT ? -1 : Math.min(sheets.length - 1, Math.floor((t - start) / SPOT)));
    });
  } else {
    // phones: the introduction steps aside, then the papers play as a carousel — one centred and
    // sharp, its neighbours peeking in from the sides, blurred
    gsap.set(deskWrap, { autoAlpha: 0 });
    const gap = () => deskWrap.clientWidth * 0.66;
    gsap.set(sheets, { autoAlpha: 1, x: (j) => j * gap(), scale: (j) => (j ? 0.8 : 1) });
    tl.to(intro, { yPercent: -8, autoAlpha: 0, duration: 0.4 }, 0.5)
      .fromTo(deskWrap, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power3.out' }, 0.65);
    for (let k = 1; k < sheets.length; k++) {
      tl.to(sheets, { x: (j) => (j - k) * gap(), scale: (j) => (j === k ? 1 : 0.8), duration: 0.45, ease: 'power3.inOut' }, 1.0 + (k - 1) * 0.55);
    }
    tl.to({}, { duration: 0.25 });
    tl.eventCallback('onUpdate', () => {
      const t = tl.time();
      setActive(t < 0.7 ? -1 : t < 1.0 + 0.22 ? 0 : Math.min(sheets.length - 1, 1 + Math.floor((t - 1.0 - 0.22) / 0.55)));
    });
  }

  // pointer: the papers drift a little with the cursor, nearer ones more
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const drift = sheets.map((s) => gsap.quickTo(s, 'x', { duration: 1, ease: 'power3.out' }));
  const onMove = (e) => {
    if (small || !fine.matches || !tl.scrollTrigger?.isActive) return;
    const x = (e.clientX / innerWidth - 0.5) * 2;
    drift.forEach((d, i) => d(x * (6 + i * 4)));
  };
  addEventListener('mousemove', onMove, { passive: true });

  return { handoverEls: [inner], cleanup() { removeEventListener('mousemove', onMove); } };
}
