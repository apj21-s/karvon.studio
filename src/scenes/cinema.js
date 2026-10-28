// The whole page as one cinematic scroll. Lenis smooths the input (wheel/trackpad glide,
// touch stays native); GSAP ScrollTrigger pins each scene and scrubs its timeline.
// Scenes are built in page order (ScrollTrigger needs that) with a handover between each pair.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { handover } from './util.js';
import { heroScene } from './hero.js';
import { approachScene } from './approach.js';
import { productsScene } from './products.js';
import { contactScene } from './contact.js';

gsap.registerPlugin(ScrollTrigger);

const BUILDERS = { hero: heroScene, approach: approachScene, products: productsScene, contact: contactScene };
const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

export function initScenes() {
  const scenes = [...document.querySelectorAll('[data-scene]')];
  // The last scene shares the screen with the thin footer; keep its height in sync.
  const footer = document.querySelector('.footer');
  const syncFooter = () => footer && document.documentElement.style.setProperty('--footer-h', `${footer.offsetHeight}px`);
  syncFooter();
  ScrollTrigger.addEventListener('refreshInit', syncFooter);

  // ---- smooth scrolling, driven by GSAP's clock so scroll and animation share one frame ----
  const lenis = new Lenis({ lerp: 0.085, smoothWheel: true, syncTouch: false, wheelMultiplier: 1, anchors: false });
  lenis.on('scroll', ScrollTrigger.update);
  const raf = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);

  // In-page links fly to their scene instead of jumping. If the layout is recalculated mid-flight
  // (fonts arriving, a resize), the flight is re-aimed at the scene's new position.
  let flight = null;
  const fly = (target) => {
    flight = target;
    lenis.scrollTo(target, { duration: 1.6, easing: easeOutExpo, onComplete: () => (flight = null) });
  };
  ScrollTrigger.addEventListener('refresh', () => flight !== null && fly(flight));
  const onClick = (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const target = id === '#top' ? 0 : document.querySelector(id);
    if (target === null) return;
    e.preventDefault();
    history.pushState(null, '', id);
    fly(target);
    if (id === '#main') document.getElementById('main')?.focus({ preventScroll: true });
  };
  document.addEventListener('click', onClick);

  // ---- scenes, in page order, each with a handover into the next ----
  const mm = gsap.matchMedia();
  mm.add({ small: '(max-width: 1023px)', large: '(min-width: 1024px)' }, (ctx) => {
    const { small } = ctx.conditions;
    const built = [];
    scenes.forEach((scene, i) => {
      const s = BUILDERS[scene.dataset.scene]?.(scene, small);
      if (!s) return;
      built.push(s);
      const next = scenes[i + 1];
      if (next && s.handoverEls.length) handover(s.handoverEls, next);
    });
    scenes.forEach((s) => s.classList.add('scene--ready'));
    return () => built.forEach((s) => s.cleanup());
  });

  // Fonts change text metrics; recompute pins once they are in. Honour a #hash on load.
  const settle = () => {
    ScrollTrigger.refresh();
    const target = location.hash.length > 1 && document.querySelector(location.hash);
    if (target) lenis.scrollTo(target, { immediate: true });
  };
  (document.fonts?.ready || Promise.resolve()).then(settle);
  setTimeout(() => ScrollTrigger.refresh(), 1200);

  return () => {
    document.removeEventListener('click', onClick);
    gsap.ticker.remove(raf);
    mm.revert();
    lenis.destroy();
  };
}

