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

  // Products are rendered from this list, one pinned scene each, in this order.
  // Each product's look lives in src/styles/scenes.css under .products--<id>.
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
    {
      id: 'artora',
      index: '002',
      name: 'Artora',
      byline: 'by June',
      logo: 'products/artora.svg',
      category: 'Hand-painted totes',
      summary:
        'A storefront and commission studio for Artora by June: ready-made hand-painted totes, and one-of-one canvases painted from a memory the customer sends in a letter.',
      audience: 'People looking for a personal, hand-painted gift or keepsake, shipped pan-India.',
      problem:
        'A one-person craft studio usually runs on DMs and screenshots: quotes, sketches, deposits and shipping all get lost in chat. Customers cannot see where their piece is, and the studio cannot keep track.',
      capabilities: [
        { title: 'Shop with cart and checkout', text: 'Ready-made totes with coupons, gift wrap, a free-shipping threshold and notify-me for sold-out pieces.' },
        { title: 'A "Dear June" commission letter', text: 'Five gentle steps: the memory, a canvas, reference photos, details, and a note.' },
        { title: 'Quote, sketch, approve', text: 'June replies with a sketch and a quote; nothing is charged until the customer approves.' },
        { title: 'Deposit, then balance', text: 'Razorpay (UPI, cards, netbanking): 50% to start painting, the rest before it ships.' },
        { title: 'Gifts and store credit', text: 'Gift cards, bundles, saved totes and one gentle abandoned-cart reminder.' },
        { title: 'A studio admin', text: 'Orders, commissions, products, coupons, reviews and site copy, from a phone.' },
      ],
      flow: ['Letter', 'Sketch', 'Deposit', 'Painted', 'Shipped'],
      flowLabel: 'How an Artora commission flows',
      // Screens from the live Artora shop.
      method: [
        { label: 'Story', src: 'products/artora/store.webp', w: 1424, h: 900, text: 'A storefront that sells a memory, not a bag.', alt: 'The Artora by June home page: "Some moments deserve more than a photograph", beside a hand-painted tote' },
        { label: 'Shop', src: 'products/artora/shop.webp', w: 390, h: 844, text: 'Ready-made totes, painted and waiting.', alt: 'An Artora product page on a phone: the Sunday Sun tote with a hand-painted tag' },
        { label: 'Commission', src: 'products/artora/commission.webp', w: 390, h: 844, text: 'A letter to June, not a form.', alt: 'The Artora commission letter on a phone: "Dear June, what would you like June to paint?"' },
        { label: 'Keepsake', src: 'products/artora/keepsake.webp', w: 390, h: 844, text: 'One of one, painted by hand and shipped pan-India.', alt: 'The Artora home page on a phone: a one-of-one tote above the headline' },
      ],
      links: [
        { label: 'Visit Artora', href: 'https://artorabyjune.vercel.app', primary: true },
      ],
    },
  ],
};
