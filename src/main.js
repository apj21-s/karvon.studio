import '@fontsource/montserrat/latin-400.css';
import '@fontsource/montserrat/latin-500.css';
import '@fontsource/montserrat/latin-600.css';
import '@fontsource/montserrat/latin-700.css';
import '@fontsource-variable/inter/wght.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-500.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/sections.css';
import './styles/intro.css';

const root = document.documentElement;
root.classList.add('js');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

/* ---------- Footer year ---------- */
document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = String(new Date().getFullYear())));

/* ---------- Navigation ---------- */
const nav = document.querySelector('.nav');
const toggle = document.querySelector('.nav__toggle');
const sheet = document.getElementById('sheet');

const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

function focusables() {
  return [toggle, ...sheet.querySelectorAll('a[href]')];
}
function openSheet() {
  sheet.hidden = false;
  toggle.setAttribute('aria-expanded', 'true');
  toggle.querySelector('.nav__toggle-label').textContent = 'Close';
  nav.classList.add('is-open');
  root.classList.add('menu-open');
  requestAnimationFrame(() => sheet.classList.add('is-open'));
  document.addEventListener('keydown', onSheetKey);
}
function closeSheet({ restoreFocus = true } = {}) {
  if (sheet.hidden) return;
  toggle.setAttribute('aria-expanded', 'false');
  toggle.querySelector('.nav__toggle-label').textContent = 'Menu';
  nav.classList.remove('is-open');
  root.classList.remove('menu-open');
  sheet.classList.remove('is-open');
  document.removeEventListener('keydown', onSheetKey);
  const hide = () => { if (!sheet.classList.contains('is-open')) sheet.hidden = true; };
  if (reduceMotion.matches) hide(); else setTimeout(hide, 320);
  if (restoreFocus) toggle.focus();
}
function onSheetKey(e) {
  if (e.key === 'Escape') { e.preventDefault(); closeSheet(); return; }
  if (e.key !== 'Tab') return;
  const f = focusables(), first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}
toggle.addEventListener('click', () => (sheet.hidden ? openSheet() : closeSheet()));
sheet.addEventListener('click', (e) => { if (e.target.closest('a')) closeSheet({ restoreFocus: false }); });
matchMedia('(min-width: 821px)').addEventListener('change', (e) => e.matches && closeSheet({ restoreFocus: false }));

/* Highlight the nav item for the section in view. */
const navLinks = [...document.querySelectorAll('.nav__link')];
const sections = navLinks.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
if ('IntersectionObserver' in window && sections.length) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        navLinks.forEach((a) => {
          if (a.getAttribute('href') === '#' + en.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  sections.forEach((s) => io.observe(s));
}

/* ---------- Scroll reveals (start once the page is visible) ---------- */
function startReveals() {
  const items = [...document.querySelectorAll('.reveal')];
  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }
  // Stagger siblings that enter together within the same section.
  const io = new IntersectionObserver(
    (entries) => {
      const entering = entries.filter((e) => e.isIntersecting).map((e) => e.target);
      entering.forEach((el, i) => {
        el.style.setProperty('--d', `${Math.min(i, 6) * 60}ms`);
        el.classList.add('is-in');
        io.unobserve(el);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  items.forEach((el) => io.observe(el));
}

/* ---------- Intro ---------- */
if (root.classList.contains('intro-on')) {
  const page = [document.querySelector('main'), nav, document.querySelector('.footer'), document.querySelector('.skip-link')];
  page.forEach((el) => el && (el.inert = true));
  const release = () => {
    page.forEach((el) => el && (el.inert = false));
    startReveals();
  };
  import('./intro/gate.js')
    .then((m) => m.runIntro({ onRelease: release }))
    .catch((err) => {
      console.error('[intro] failed to start', err);
      root.classList.remove('intro-on');
      document.getElementById('intro')?.remove();
      release();
    });
} else {
  document.getElementById('intro')?.remove();
  startReveals();
}
