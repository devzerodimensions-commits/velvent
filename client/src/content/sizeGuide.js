/**
 * The size guide page's own copy. The charts themselves are per category and
 * are edited under Products → Categories, so a new category brings its own
 * measurements rather than adding a field here.
 */
export const defaults = {
  title: 'Size Guide',
  intro: 'All measurements are taken on the garment laid flat, in inches. Allow about half an inch either way for knitted cotton.',

  helpTitle: 'Between two sizes?',
  helpParagraphs: [
    'For polos and polo shirts, take the larger size — knitted cotton sits better with a little room. For oversized tees, take the smaller one unless you want it genuinely loose.',
    'Still unsure? Send us your chest measurement and we will tell you what to order.',
  ],
  helpCtaLabel: 'Ask us',
  helpCtaTo: '/contact',

  seoDescription: 'VELVENT size chart for polo t-shirts, polo shirts and oversized tees, S through 3XL.',
};

export const fields = [
  { name: 'title', label: 'Page heading', type: 'text' },
  { name: 'intro', label: 'Intro', type: 'textarea' },

  { name: 'helpTitle', label: 'Help box heading', type: 'text' },
  { name: 'helpParagraphs', label: 'Help box text', type: 'paragraphs' },
  { name: 'helpCtaLabel', label: 'Help box button', type: 'text' },
  { name: 'helpCtaTo', label: 'Help box button links to', type: 'text' },

  { name: 'seoDescription', label: 'Search description', type: 'textarea' },
];
