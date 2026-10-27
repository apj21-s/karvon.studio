// Central site configuration. Everything content-, URL- or contact-related lives here.
// Read at build time by vite.config.js (metadata + static markup) and at runtime by src/.

export const SITE = {
  name: 'KARVON.STUDIO',
  shortName: 'KARVON',

  // Public URL of the deployed site (GitHub Pages project page).
  // Change this if a custom domain is added — canonical, og:url and og:image use it.
  url: 'https://apj21-s.github.io/karvon.studio/',

  // TODO: set the studio's contact address. While empty, the site shows no email link.
  email: '',

  title: 'KARVON.STUDIO — Discover problems. Engineer solutions. Build products that matter.',
  description:
    'KARVON.STUDIO is an independent product studio. We investigate meaningful problems, engineer useful solutions and turn them into independent products — starting with ACEIIIT.',
  themeColor: '#F7F5F0',

  nav: [
    { label: 'Studio', href: '#studio' },
    { label: 'Approach', href: '#approach' },
    { label: 'Products', href: '#products' },
    { label: 'Contact', href: '#contact' },
  ],

  // Products are rendered from this list. Add Product 002 here when it exists.
  products: [
    {
      id: 'aceiiit',
      index: '001',
      name: 'ACEIIIT',
      logo: 'products/aceiiit.svg',
      category: 'Exam preparation',
      summary:
        'A focused preparation platform for UGEE — the entrance exam for IIIT Hyderabad — built around realistic, timed mock tests and clear analysis of every attempt.',
      audience: 'Students preparing for UGEE (SUPR and REAP papers).',
      problem:
        'UGEE combines two papers with their own timing and an interview, yet most preparation material treats it like any other entrance exam. Students rarely get to rehearse the real format, and practice tests rarely say what to fix next.',
      capabilities: [
        { title: 'UGEE-pattern mock tests', text: 'SUPR then REAP, each with its own timer, enforced on the server and auto-submitted when time runs out.' },
        { title: 'Exam-style navigation', text: 'A question palette with answered, unanswered and marked-for-review states.' },
        { title: 'Rank and percentile', text: 'Every attempt is placed against other attempts on the same test.' },
        { title: 'Section and topic analysis', text: 'Accuracy and time spent per question, broken down by section and topic.' },
        { title: 'Weak-area identification', text: 'Patterns across attempts surface the topics that need work first.' },
        { title: 'Solutions and practice', text: 'Worked solutions in review, a practice mode and a study planner.' },
      ],
      flow: ['SUPR', 'REAP', 'Analysis', 'Weak areas'],
      links: [
        // URLs taken from the ACEIIIT codebase; confirm before launch.
        { label: 'Visit ACEIIIT', href: 'https://aceiiit.in', primary: true },
        { label: 'Open the mock portal', href: 'https://mock.aceiiit.in' },
      ],
    },
  ],

  intro: {
    enabled: true,
    // What happens on a repeat visit in the same browser session: 'skip' | 'short'
    repeat: 'skip',
    sessionKey: 'karvon:intro:v1',
    duration: 10, // seconds of the full sequence
    fadeOut: 0.8, // crossfade into the page
    hardTimeout: 14000, // ms — the page is always released by then
    loadTimeout: 4000, // ms — if the 3D engine isn't ready by then, use the 2D sequence
  },
};
