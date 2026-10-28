// Shared helpers for the scroll scenes.
import { gsap } from 'gsap';

/** Pinned, scrubbed timeline for a scene. `vh` = scroll length in viewport heights. */
export function sceneTimeline(scene, vh, small) {
  return gsap.timeline({
    defaults: { ease: 'power3.inOut' },
    scrollTrigger: {
      trigger: scene,
      start: 'top top',
      end: () => '+=' + Math.round(innerHeight * vh * (small ? 0.88 : 1)),
      pin: true,
      scrub: 1.3,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });
}

/**
 * Scene-to-scene handover, the reference's move: while `next` rises over `prev`, the previous
 * scene's content swells, blurs and fades back, like the hero headline as its card arrives.
 */
export function handover(prevEls, next) {
  // (no blur here: blurring a whole screen of cards and images every frame costs too much;
  // the headline and the arriving text carry the blur instead)
  gsap.fromTo(prevEls, { scale: 1, opacity: 1, y: 0 }, {
    scale: 1.1, opacity: 0.15, y: () => innerHeight * 0.18, ease: 'power2.inOut',
    immediateRender: false,
    scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top', scrub: 1.3, invalidateOnRefresh: true },
  });
}

/** Entrance during the handover: elements resolve out of a blur as their scene arrives (as the reference's title). */
export function arrive(els, next, from = { y: 60, autoAlpha: 0, scale: 0.9, filter: 'blur(12px)' }) {
  gsap.fromTo(els, { filter: 'blur(12px)', ...from }, {
    y: 0, autoAlpha: 1, scale: 1, filter: 'blur(0px)', ease: 'expo.out', stagger: 0.06,
    scrollTrigger: { trigger: next, start: 'top 85%', end: 'top 10%', scrub: 1.3, invalidateOnRefresh: true },
  });
}

/** Wrap each word of an element in <span class="w"> (keeps &nbsp; joins and screen-reader text). */
export function splitWords(el) {
  const text = el.textContent;
  el.setAttribute('aria-label', text.replace(/\u00a0/g, ' '));
  el.innerHTML = text
    .split(' ')
    .map((w) => `<span class="w" aria-hidden="true">${w}</span>`)
    .join(' ');
  return [...el.querySelectorAll('.w')];
}

/** Masked words for a cinematic title: each word rises out of its own clipping line. */
export function maskWords(el) {
  const text = el.textContent;
  el.innerHTML = text
    .split(' ')
    .map((w) => `<span class="wm"><span class="wi">${w}</span></span>`)
    .join(' ');
  return [...el.querySelectorAll('.wi')];
}

/** The charcoal card before it fills the screen (a GPU transform, no repaint while it grows). */
export const cardScale = (small) => (small ? { scaleX: 0.92, scaleY: 0.88 } : { scaleX: 0.86, scaleY: 0.84 });
