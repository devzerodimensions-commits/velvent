/**
 * The size guide page's own copy. The charts themselves are per category and
 * are edited under Products → Categories, so a new category brings its own
 * measurements rather than adding a field here.
 */
export const defaults = {
  title: 'Size Guide',
  intro: 'All measurements are taken on the garment laid flat, in inches. Allow about half an inch either way for knitted cotton.',

  /* How to measure is shown as pictures: the front of a garment with the
     shoulder, sleeve, chest and length marked, and the back with the mid arm. */
  measureTitle: 'How to measure',
  measureImages: ['/size-guide/measure-front.webp', '/size-guide/measure-back.webp'],

  seoDescription: 'VELVENT size chart for polo t-shirts, polo shirts and oversized tees, S through 3XL.',
};

export const fields = [
  { name: 'title', label: 'Page heading', type: 'text' },
  { name: 'intro', label: 'Intro', type: 'textarea' },

  { name: 'measureTitle', label: 'How to measure heading', type: 'text' },
  {
    name: 'measureImages',
    label: 'How to measure pictures',
    type: 'images',
    help: 'Shown in the size guide popup and on the size guide page, side by side — the front first, then the back. A drawing on a white background works best; the white takes the colour of the tile.',
  },

  { name: 'seoDescription', label: 'Search description', type: 'textarea' },
];
