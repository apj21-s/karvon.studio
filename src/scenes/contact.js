// Contact: the outro, played as in the reference. The K assembles on a full-screen charcoal card
// (same arrival order as the 2D intro), KARVON / STUDIO settle, then the lockup recedes, the card
// pulls back to a framed card while the call to action behind it comes into focus, and the card
// flies up and away.
import { gsap } from 'gsap';
import { sceneTimeline, cardScale } from './util.js';
import { ARRIVALS } from '../intro/fallback.js';

export function contactScene(scene, small) {
  const q = gsap.utils.selector(scene);
  const [finale] = q('.finale');
  const [card] = q('.contact__card');
  const [shadow] = q('.contact__shadow');
  const [cta] = q('.contact__cta');
  const polys = q('.finale__svg polygon');
  const letters = q('.finale__word span');
  const [studio] = q('.finale__studio');
  const spread = small ? 1.6 : 2.4;

  gsap.set(polys, { transformOrigin: '50% 50%' });
  polys.forEach((p) => {
    const a = ARRIVALS[p.dataset.piece] || [0, 0, 0, 0];
    gsap.set(p, { x: a[1] * spread, y: a[2] * spread, rotation: a[3] * 2, autoAlpha: 0 });
  });
  gsap.set([...letters, studio], { autoAlpha: 0 });
  gsap.set(cta, { autoAlpha: 0, scale: 0.8, filter: 'blur(24px)' });
  gsap.set([card, shadow], { transformOrigin: '50% 50%' });

  // the pieces fly into view while the card slides up, so the outro never opens on an empty card
  gsap.fromTo(polys, { autoAlpha: 0, scale: 0.6 }, {
    autoAlpha: 0.9, scale: 1, ease: 'power2.out', stagger: 0.03,
    scrollTrigger: { trigger: scene, start: 'top 80%', end: 'top 5%', scrub: 1.3 },
  });

  const tl = sceneTimeline(scene, small ? 2.2 : 2.4, small);
  polys.forEach((p) => {
    const a = ARRIVALS[p.dataset.piece] || [0];
    tl.to(p, { x: 0, y: 0, rotation: 0, autoAlpha: 1, duration: 0.7, ease: 'power3.out' }, a[0] * 0.4);
  });
  tl.to(letters, { autoAlpha: 1, duration: 0.3, stagger: 0.05, ease: 'power2.out' }, 1.0)
    .to(studio, { autoAlpha: 1, duration: 0.35 }, 1.25)
    .to({}, { duration: 0.4 })
    .set(cta, { autoAlpha: 1 })
    // the lockup recedes into the card
    .to(finale, { scale: 0.9, y: -40, z: -200, autoAlpha: 0, ease: 'power3.in', duration: 0.9 })
    // the card pulls back to a framed card while the call to action sharpens behind it
    .to([card, shadow], { ...cardScale(small), borderRadius: small ? 32 : 40, ease: 'expo.inOut', duration: 1.4 }, 'pullback')
    .to(cta, { scale: 1, filter: 'blur(0px)', ease: 'expo.inOut', duration: 1.4 }, 'pullback')
    // and flies up and away
    .to([card, shadow], { y: () => -innerHeight - 300, ease: 'power3.in', duration: 1.1 });

  return { handoverEls: [], cleanup() {} };
}
