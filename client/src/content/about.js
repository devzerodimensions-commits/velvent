/** The About / Our Story page. */
export const defaults = {
  seoTitle: 'Our Story',
  seoDescription: 'VELVENT is a premium clothing label built on knitted cotton — modern, minimal and made to last.',

  heroImage: '/products/cable-knit-polo-green-1.jpg',
  heroTitle: 'Crafted for Confidence',

  storyEyebrow: 'The beginning',
  storyTitle: 'Why we started',
  storyParagraphs: [
    'VELVENT began with a simple frustration: the polo is the most-worn shirt in an Indian wardrobe, and almost nobody makes it well at a fair price. Collars go limp. Stripes drift out of line at the seam. Colour washes out by the third month.',
    'So we picked one fabric — knitted cotton — and stayed with it. Every piece we make starts from the same test: will this still look right after fifty washes? If the answer is no, it does not ship.',
    'What came out of that is a short, deliberate range. Knitted polos with collars that hold. Button-through shirts you can wear to dinner. Heavyweight oversized tees that keep their shape instead of growing a size every wash.',
  ],
  storyImages: [
    '/products/rugby-stripe-polo-1.jpg',
    '/products/coastal-stripe-polo-2.jpg',
    '/products/vertical-stripe-shirt-olive-1.jpg',
    '/products/cable-knit-polo-burgundy-1.jpg',
  ],

  valuesEyebrow: 'What we stand for',
  valuesTitle: 'Brand personality',
  values: [
    { title: 'Premium', body: 'One fabric, done properly. Knitted cotton that holds its shape, its colour and its collar.' },
    { title: 'Modern', body: 'Cuts drawn for how people actually dress now — relaxed where it should be, clean everywhere else.' },
    { title: 'Timeless', body: 'Nothing engineered to look dated in six months. Stripes, solids and texture that keep working.' },
    { title: 'Minimal', body: 'No loud logos. The mark sits quietly on the collar, the label and nowhere it is not wanted.' },
  ],

  closeEyebrow: 'The promise',
  closeBody: 'Three categories. Six sizes, S through 3XL. One standard of make.',
  ctaPrimaryLabel: 'Shop the collection',
  ctaPrimaryTo: '/shop',
  ctaSecondaryLabel: 'Talk to us',
  ctaSecondaryTo: '/contact',
};

export const fields = [
  { name: 'heroImage', label: 'Hero background', type: 'image' },
  { name: 'heroTitle', label: 'Hero heading', type: 'text' },

  { name: 'storyEyebrow', label: 'Story eyebrow', type: 'text' },
  { name: 'storyTitle', label: 'Story heading', type: 'text' },
  { name: 'storyParagraphs', label: 'Story text', type: 'paragraphs' },
  { name: 'storyImages', label: 'Story photo grid', type: 'images', help: 'Four images read best here.' },

  { name: 'valuesEyebrow', label: 'Values eyebrow', type: 'text' },
  { name: 'valuesTitle', label: 'Values heading', type: 'text' },
  {
    name: 'values',
    label: 'Values',
    type: 'list',
    itemLabel: 'Value',
    titleKey: 'title',
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'body', label: 'Body', type: 'textarea' },
    ],
  },

  { name: 'closeEyebrow', label: 'Closing eyebrow', type: 'text' },
  { name: 'closeBody', label: 'Closing line', type: 'textarea', help: 'The heading above it is the motto, edited under Brand & contact.' },
  { name: 'ctaPrimaryLabel', label: 'Primary button label', type: 'text' },
  { name: 'ctaPrimaryTo', label: 'Primary button links to', type: 'text' },
  { name: 'ctaSecondaryLabel', label: 'Second button label', type: 'text' },
  { name: 'ctaSecondaryTo', label: 'Second button links to', type: 'text' },

  { name: 'seoTitle', label: 'Browser tab title', type: 'text', group: 'seo' },
  { name: 'seoDescription', label: 'Search description', type: 'textarea', group: 'seo' },
];
