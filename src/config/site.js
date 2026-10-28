// Central site configuration. Everything content-, URL- or contact-related lives here.
// Read at build time by vite.config.js (metadata + static markup) and at runtime by src/.

export const SITE = {
  name: 'KARVON.STUDIO',
  shortName: 'KARVON',

  // Public URL of the deployed site (GitHub Pages project page).
  // Change this if a custom domain is added — canonical, og:url and og:image use it.
  url: 'https://apj21-s.github.io/karvon.studio/',

  email: 'hello.karvon.studio@gmail.com',

  title: 'KARVON.STUDIO',
  description:
    'KARVON.STUDIO is an independent product studio. We investigate meaningful problems, engineer useful solutions and turn them into independent products — starting with ACEIIIT.',
  themeColor: '#F7F5F0',

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
      // ACEIIIT's own method illustrations (from the ACEIIIT design assets).
      method: [
        { label: 'Learn', src: 'products/aceiiit/learn.webp', w: 1400, h: 933, text: 'Notes built around the reasoning UGEE actually tests.', alt: 'ACEIIIT preparation notes: spatial reasoning and logical structure, worked through by hand' },
        { label: 'Practice', src: 'products/aceiiit/practice.webp', w: 590, h: 870, text: 'Mock tests in the real format: SUPR, then REAP, timed like the day.', alt: 'The ACEIIIT mock portal: a UGEE 2026 mock test ready to start' },
        { label: 'Analyse', src: 'products/aceiiit/analyse.webp', w: 620, h: 872, text: 'A diagnostic after every attempt: percentile, sections, weak areas.', alt: 'An ACEIIIT performance diagnostic: 99.2 percentile with section-wise results' },
        { label: 'Interview', src: 'products/aceiiit/interview.webp', w: 594, h: 866, text: 'Ready for the interview round, not just the paper.', alt: 'An ACEIIIT interview brief: how to think, communicate and go beyond' },
      ],
      links: [
        // URLs taken from the ACEIIIT codebase; confirm before launch.
        { label: 'Visit ACEIIIT', href: 'https://aceiiit.in', primary: true },
        { label: 'Open the mock portal', href: 'https://mock.aceiiit.in' },
      ],
    },
  ],
};
