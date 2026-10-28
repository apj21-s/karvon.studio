// Approach: three chapters played like title cards. The rail fills between steps; each chapter's
// title rises out of its mask, its list cascades in, then it lifts away as the next one arrives.
// A large outlined numeral drifts behind each chapter.
import { gsap } from 'gsap';
import { sceneTimeline, arrive, maskWords } from './util.js';

export function approachScene(scene, small) {
  const q = gsap.utils.selector(scene);
  const stages = q('.stage');
  const steps = q('.rail__step');
  const [fill] = q('.rail__fill');

  const parts = stages.map((st) => {
    const title = st.querySelector('.stage__title');
    if (!title.dataset.split) { title.dataset.split = '1'; title.words = maskWords(title); }
    return {
      st,
      bg: st.querySelector('.stage__bg'),
      n: st.querySelector('.stage__n'),
      words: title.words,
      lead: st.querySelector('.stage__lead'),
      items: [...st.querySelectorAll('.stage__list li')],
      rule: st.querySelector('.stage__list'),
    };
  });

  arrive([q('.approach__title')[0], q('.rail')[0]], scene);

  // rail state follows the timeline: steps light up as the fill passes them
  const mark = (p) => {
    const at = p * (steps.length - 1);
    steps.forEach((s, i) => {
      s.classList.toggle('is-on', at >= i - 0.02);
      s.classList.toggle('is-current', Math.abs(at - i) < 0.5);
    });
  };

  // opening: chapter one is set; the others wait below their masks
  parts.forEach((p, i) => {
    gsap.set(p.st, { autoAlpha: i ? 0 : 1 });
    if (i) {
      gsap.set(p.words, { yPercent: 110 });
      gsap.set([p.n, p.lead], { autoAlpha: 0, y: 24 });
      gsap.set(p.items, { autoAlpha: 0, x: 40 });
      gsap.set(p.bg, { autoAlpha: 0, yPercent: -20 });
    }
  });

  // chapter one plays in as the scene arrives
  const first = parts[0];
  gsap.timeline({ scrollTrigger: { trigger: scene, start: 'top 70%', end: 'top top', scrub: 1.3 } })
    .fromTo(first.bg, { yPercent: 10, autoAlpha: 0 }, { yPercent: -50, autoAlpha: 1, ease: 'none', duration: 1 }, 0)
    .fromTo(first.words, { yPercent: 110 }, { yPercent: 0, ease: 'expo.out', duration: 0.6 }, 0.15)
    .fromTo([first.n, first.lead], { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.5, ease: 'power3.out' }, 0.25)
    .fromTo(first.rule, { scaleX: 0, transformOrigin: '0 50%' }, { scaleX: 1, duration: 0.6 }, 0.3)
    .fromTo(first.items, { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, stagger: 0.07, duration: 0.5, ease: 'power3.out' }, 0.4);

  const tl = sceneTimeline(scene, small ? 1.9 : 1.7, small);
  tl.eventCallback('onUpdate', () => mark(gsap.getProperty(fill, 'scaleX')));
  mark(0);

  const SEG = 1.1;
  for (let i = 1; i < parts.length; i++) {
    const prev = parts[i - 1], next = parts[i];
    const at = 0.35 + (i - 1) * SEG;
    tl.to(fill, { scaleX: i / (parts.length - 1), duration: 0.7, ease: 'power2.inOut' }, at)
      // out: the previous chapter lifts away
      .to(prev.words, { yPercent: -110, stagger: 0.04, duration: 0.45, ease: 'power3.in' }, at)
      .to([prev.n, prev.lead], { autoAlpha: 0, y: -20, duration: 0.35, ease: 'power2.in' }, at)
      .to(prev.items, { autoAlpha: 0, x: -30, stagger: 0.04, duration: 0.35, ease: 'power2.in' }, at)
      .to(prev.bg, { autoAlpha: 0, yPercent: -80, duration: 0.45, ease: 'power2.in' }, at)
      .set(prev.st, { autoAlpha: 0 }, at + 0.5)
      // in: the next chapter rises out of its masks
      .set(next.st, { autoAlpha: 1 }, at + 0.3)
      .to(next.bg, { autoAlpha: 1, yPercent: -50, duration: 0.7, ease: 'power2.out' }, at + 0.3)
      .to(next.words, { yPercent: 0, stagger: 0.05, duration: 0.6, ease: 'expo.out' }, at + 0.4)
      .to([next.n, next.lead], { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.5, ease: 'power3.out' }, at + 0.45)
      .to(next.items, { autoAlpha: 1, x: 0, stagger: 0.06, duration: 0.5, ease: 'power3.out' }, at + 0.55);
  }
  tl.to({}, { duration: 0.35 });

  return { handoverEls: [q('.approach__inner')[0]], cleanup() {} };
}
