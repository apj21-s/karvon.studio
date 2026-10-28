// Hero: the headline's cinematic entrance as the loader lifts, then on scroll the charcoal card
// rises and fills the screen, the phone flies in, and the KARVON logo film plays on its screen by
// itself, at normal speed, holding on the finished lockup. Scrolling back above the phone rewinds it.
import { gsap } from 'gsap';
import { sceneTimeline, cardScale } from './util.js';

export function heroScene(scene, small) {
  const q = gsap.utils.selector(scene);
  const [title] = q('.cine__title');
  const [grid] = q('.cine__grid');
  const [card] = q('.cine__card');
  const [shadow] = q('.cine__shadow');
  const [phoneWrap] = q('.phone-wrap');
  const [phone] = q('.phone');
  const [screen] = q('.film');
  const tags = q('.tag');
  const copy = q('.cine__copy');
  const brand = q('.cine__brand');

  // ---- the headline's entrance (plays as the loader lifts), as in the reference:
  // line one resolves out of a blur with a slight 3D tilt, line two is wiped in from the left ----
  gsap.timeline({ delay: 0.2 })
    .fromTo(grid, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.8, ease: 'power2.out' }, 0)
    .fromTo(q('.cine__l1'), { autoAlpha: 0, y: 60, scale: 0.85, filter: 'blur(20px)', rotationX: -20 },
      { autoAlpha: 1, y: 0, scale: 1, filter: 'blur(0px)', rotationX: 0, duration: 1.8, ease: 'expo.out', clearProps: 'filter' }, 0)
    .fromTo(q('.cine__l2'), { autoAlpha: 1, clipPath: 'inset(0 100% 0 0)' },
      { clipPath: 'inset(0 0% 0 0)', duration: 1.4, ease: 'power4.inOut', clearProps: 'clipPath' }, 0.8)
    .fromTo(q('.cine__eyebrow, .cine__hint'), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power2.out', stagger: 0.15 }, 1.2);

  // The phone always fits the screen height.
  // The phone always fits: by height (leaving room for the brand and line on small screens) and by width.
  const fit = () => {
    const byH = (innerHeight - (small ? 230 : 150)) / 580;
    const byW = (innerWidth * (small ? 0.62 : 0.3)) / 280;
    phone.style.setProperty('--s', String(Math.max(0.42, Math.min(1, byH, byW))));
  };
  fit();
  addEventListener('resize', fit);

  // ---- opening state for the scroll sequence ----
  gsap.set([card, shadow], { y: () => innerHeight * 1.05, ...cardScale(small), transformOrigin: '50% 50%' });
  gsap.set([copy, brand, phoneWrap, tags], { autoAlpha: 0 });

  // The film: created after the entrance (it does real work: textures, shaders), then autoplayed.
  const film = { player: null, loading: null, state: 'idle', raf: 0, t0: 0 };
  let disposed = false;
  const load = () => {
    if (film.loading || disposed) return film.loading;
    film.loading = import('../intro/player.js')
      .then(({ preloadFilm }) => preloadFilm(screen))
      .then((p) => {
        if (disposed) return;
        film.player = p;
        if (film.state === 'waiting') play();
      })
      .catch((err) => console.warn('[film] unavailable', err));
    return film.loading;
  };
  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));
  const loadTimer = setTimeout(() => idle(load, { timeout: 1500 }), 50);

  function play() {
    if (film.state === 'playing' || film.state === 'done') return;
    if (!film.player) { film.state = 'waiting'; load(); return; }
    film.state = 'playing';
    const p = film.player;
    film.t0 = performance.now();
    let last = -1;
    const tick = (now) => {
      const t = (now - film.t0) / 1000;
      // 30fps is plenty for a film made at 24fps, and halves the GPU work while the page scrolls
      if (t - last >= 1 / 30 || t >= p.duration) { last = t; p.seek(t); }
      if (t >= p.duration) { film.state = 'done'; return; } // hold on the finished lockup
      film.raf = requestAnimationFrame(tick);
    };
    film.raf = requestAnimationFrame(tick);
  }
  function rewind() {
    if (film.state === 'idle') return;
    cancelAnimationFrame(film.raf);
    film.state = 'idle';
    film.player?.seek(0);
  }
  // ---- scroll: short and continuous; the film takes the second half ----
  const tl = sceneTimeline(scene, 1.9, small);
  tl.eventCallback('onStart', load);
  // as in the reference: the headline swells, blurs and fades back while the card rises over it
  // (the blur is on the headline only — blurring the whole screen-sized layer every frame is costly)
  tl.to(q('.cine__h1'), { scale: 1.15, opacity: 0.15, ease: 'power2.inOut', duration: 1.3 }, 0)
    .to([q('.cine__eyebrow')[0], q('.cine__hint')[0]], { opacity: 0, y: -20, duration: 0.8 }, 0)
    .to(grid, { scale: 1.15, opacity: 0.15, ease: 'power2.inOut', duration: 1.3 }, 0)
    .to([card, shadow], { y: 0, duration: 1.2 }, 0)
    .to([card, shadow], { scaleX: 1, scaleY: 1, duration: 0.9 }, 1.0)
    .fromTo(phoneWrap,
      { y: 240, z: -380, rotationX: 46, rotationY: -24, autoAlpha: 0, scale: 0.72 },
      { y: 0, z: 0, rotationX: 0, rotationY: 0, autoAlpha: 1, scale: 1, ease: 'expo.out', duration: 1.4 }, 1.2)
    .fromTo(copy, { x: -40, autoAlpha: 0 }, { x: 0, autoAlpha: 1, ease: 'power4.out', duration: 1.0 }, 1.6)
    .fromTo(brand, { x: 40, autoAlpha: 0, scale: 0.92 }, { x: 0, autoAlpha: 1, scale: 1, ease: 'expo.out', duration: 1.0 }, 1.6)
    .fromTo(tags, { y: 50, z: 60, autoAlpha: 0, scale: 0.86 },
      { y: 0, z: 60, autoAlpha: 1, scale: 1, ease: 'back.out(1.4)', duration: 0.9 }, 2.2)
    .to({}, { duration: 0.4 });

  // Play once the phone has landed; rewind when the reader scrolls back above it.
  const landed = 1.9 / tl.duration(), before = 1.1 / tl.duration();
  tl.eventCallback('onUpdate', () => {
    const pr = tl.scrollTrigger ? tl.scrollTrigger.progress : tl.progress();
    if (pr >= landed) play();
    else if (pr < before) rewind();
  });

  // ---- pointer: the sheen follows the cursor, the phone tilts towards it ----
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const tiltX = gsap.quickTo(phone, 'rotationX', { duration: 1.1, ease: 'power3.out' });
  const tiltY = gsap.quickTo(phone, 'rotationY', { duration: 1.1, ease: 'power3.out' });
  let raf = 0;
  const onMove = (e) => {
    if (!fine.matches || !tl.scrollTrigger?.isActive) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
      tiltY((e.clientX / innerWidth - 0.5) * 14);
      tiltX(-(e.clientY / innerHeight - 0.5) * 14);
    });
  };
  addEventListener('mousemove', onMove, { passive: true });

  return {
    handoverEls: [scene.querySelector('.cine__stage')],
    cleanup() {
      disposed = true;
      clearTimeout(loadTimer);
      removeEventListener('mousemove', onMove);
      removeEventListener('resize', fit);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(film.raf);
      film.player?.seek(0); // the player is shared for the page's lifetime (see preloadFilm)
    },
  };
}
