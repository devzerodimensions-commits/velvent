/**
 * The homepage, section by section, in the order it is read.
 *
 * The opening stages, the anatomy hotspots and the two photo grids all live
 * here, so swapping the garment on show or re-shooting a detail crop is an
 * admin change rather than a deploy.
 */
export const defaults = {
  hero: {
    slug: 'rugby-stripe-knitted-polo',
    name: 'Rugby Stripe Knitted Polo',
    photo: '/products/rugby-stripe-polo-1.jpg',
    headline1: 'Crafted for',
    headline2: 'Confidence',
    captionLabel: 'Shown here',
    shopLabel: 'Shop the collection',
    side: 'Autumn knitwear — 01',
    note: 'Sizes S – 3XL',
  },

  statement: 'Velvent is knitted cotton for people who dress with intent.',
  statementEmphasis: 'knitted, cotton, intent.',
  statementImageA: '/products/anatomy-cable.jpg',
  statementImageB: '/products/anatomy-collar.jpg',

  railEyebrow: 'The range',
  railTitle: 'Made to be worn often',

  promises: [
    { icon: 'Truck', title: 'Free shipping', body: 'On prepaid orders above ₹999' },
    { icon: 'Refresh', title: '7-day returns', body: 'Free exchange on size and fit' },
    { icon: 'Rupee', title: 'Cash on delivery', body: 'Pay when the parcel reaches you' },
    { icon: 'Shield', title: 'Secure checkout', body: 'UPI, cards and net banking' },
  ],

  marquee: ['Simple', 'Timeless', 'Premium', 'Knitted Cotton'],

  anatomy: {
    eyebrow: 'Why it costs what it costs',
    headline1: 'Anatomy',
    headline2: 'of a polo',
    lead: 'Most of what you pay for is invisible from two metres away. Tap a point on the {garment} to see it from twenty centimetres.',
    ctaLabel: 'See the full piece',
    garment: {
      slug: 'cable-knit-contrast-polo',
      name: 'Cable Knit Contrast Polo',
      photo: '/products/cable-knit-polo-green-1.jpg',
    },
    points: [
      {
        x: 38.5,
        y: 30,
        crop: '/products/anatomy-collar.jpg',
        label: 'Collar',
        title: 'Knitted in, not stitched on',
        body: 'The contrast collar and its white tipping are knitted as part of the garment rather than sewn on afterwards, so the edge stays flat instead of curling away after a few washes.',
      },
      {
        x: 49.5,
        y: 40,
        crop: '/products/anatomy-placket.jpg',
        label: 'Placket',
        title: 'Three buttons, set to sit flat',
        body: 'A reinforced placket with the buttons spaced so the opening lies closed without pulling. It is the difference between a polo that hangs cleanly and one that gapes at the chest.',
      },
      {
        x: 36,
        y: 58.5,
        crop: '/products/anatomy-cable.jpg',
        label: 'Cable panel',
        title: 'Texture that catches the light',
        body: 'Vertical cables run the full length of the body. Slower on the machine and hungrier for yarn than a flat knit — which is precisely why it reads the way it does in daylight.',
      },
      {
        x: 47,
        y: 76.5,
        crop: '/products/anatomy-hem.jpg',
        label: 'Hem',
        title: 'Ribbed to hold its shape',
        body: 'A ribbed hem band grips lightly at the waist so the body keeps its line instead of flaring out. The same rib finishes both sleeve openings.',
      },
    ],
  },

  story: {
    eyebrow: 'The brand',
    headline1: 'Nothing loud.',
    headline2: 'Nothing disposable.',
    paragraphs: [
      'VELVENT is built on one fabric done properly: knitted cotton. Every polo, shirt and tee starts from the same question — will this still look right after fifty washes?',
      'Collars that hold their shape. Stripes that line up at the seam. Colour that settles instead of fading. Nothing loud, nothing disposable.',
    ],
    ctaLabel: 'Read our story',
    ctaTo: '/about',
    images: [
      '/products/cable-knit-polo-green-1.jpg',
      '/products/vertical-stripe-shirt-olive-1.jpg',
      '/products/coastal-stripe-polo-1.jpg',
      '/products/cable-knit-polo-burgundy-1.jpg',
    ],
  },

  faq: {
    eyebrow: 'Good to know',
    headline1: 'Before',
    headline2: 'you order',
    body: 'The five we get asked most. There are more on the FAQ page, and a real person on the phone during business hours.',
    items: [
      {
        title: 'How long will my order take?',
        body: 'We dispatch within {dispatchDays} and delivery usually takes {deliveryDays}, depending on your PIN code. You can follow it on the [Track Order](/track-order) page with just your order number and email.',
      },
      {
        title: 'What if the size is wrong?',
        body: 'Size exchanges are free within {returnDays} days of delivery, subject to stock. Call or message us and we will arrange the pickup and send the replacement.',
      },
      {
        title: 'Can I pay cash on delivery?',
        body: 'Yes, nationwide and at no extra charge. Prepaid orders above {freeAbove} also ship free.',
      },
      {
        title: 'Will knitted cotton shrink or lose shape?',
        body: 'Not meaningfully, if you wash cold and tumble dry low. Hot washes are what shrink cotton knits and stretch out collars — the care label is short for a reason.',
      },
      {
        title: 'Do you ship outside India?',
        body: 'Not yet. We ship across India only at the moment.',
      },
    ],
  },

  signup: {
    eyebrow: 'First access',
    headline1: 'Know before',
    headline2: 'it sells out',
    body: 'New colourways and restocks go to the list first. We make short runs, so the good sizes do not hang around.',
    note: 'No spam, unsubscribe any time.',
  },
};

const POINT_FIELDS = [
  { name: 'label', label: 'Tab label', type: 'text' },
  { name: 'title', label: 'Heading', type: 'text' },
  { name: 'body', label: 'Description', type: 'textarea' },
  { name: 'crop', label: 'Close-up image', type: 'image', help: 'The detail shot shown above, and magnified on hover.' },
  { name: 'x', label: 'Marker across (%)', type: 'number', help: '0 is the left edge of the photo, 100 the right.' },
  { name: 'y', label: 'Marker down (%)', type: 'number', help: '0 is the top of the photo, 100 the bottom.' },
];

export const fields = [
  {
    name: 'hero',
    label: 'Opening stage',
    type: 'group',
    fields: [
      { name: 'headline1', label: 'Headline, first line', type: 'text' },
      { name: 'headline2', label: 'Headline, second line', type: 'text' },
      { name: 'photo', label: 'Hero photograph', type: 'image' },
      { name: 'name', label: 'Garment name', type: 'text', help: 'Shown in the caption under the headline.' },
      { name: 'slug', label: 'Links to product', type: 'text', help: "The product's URL slug — clicking the hero opens it." },
      { name: 'captionLabel', label: 'Caption label', type: 'text' },
      { name: 'shopLabel', label: 'Shop link label', type: 'text' },
      { name: 'side', label: 'Side note', type: 'text', help: 'The small line down the left edge, on desktop.' },
      { name: 'note', label: 'Foot note', type: 'text', help: 'The small line at bottom right.' },
    ],
  },
  {
    name: 'statement',
    label: 'Statement line',
    type: 'textarea',
    help: 'The large sentence on the second dark stage.',
  },
  {
    name: 'statementEmphasis',
    label: 'Words to emphasise',
    type: 'text',
    help: 'Comma-separated. These words are picked out in the statement. Match them exactly, punctuation included.',
  },
  { name: 'statementImageA', label: 'Statement image, left', type: 'image' },
  { name: 'statementImageB', label: 'Statement image, right', type: 'image' },

  { name: 'railEyebrow', label: 'Range eyebrow', type: 'text' },
  { name: 'railTitle', label: 'Range heading', type: 'text' },

  {
    name: 'promises',
    label: 'Promise strip',
    type: 'list',
    itemLabel: 'Promise',
    titleKey: 'title',
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'body', label: 'Line underneath', type: 'text' },
      {
        name: 'icon',
        label: 'Icon',
        type: 'select',
        options: ['Truck', 'Refresh', 'Rupee', 'Shield', 'Box', 'Tag', 'Check', 'Heart'],
      },
    ],
  },

  { name: 'marquee', label: 'Scrolling words', type: 'strings', itemLabel: 'Word' },

  {
    name: 'anatomy',
    label: 'Anatomy section',
    type: 'group',
    fields: [
      { name: 'eyebrow', label: 'Eyebrow', type: 'text' },
      { name: 'headline1', label: 'Headline, first line', type: 'text' },
      { name: 'headline2', label: 'Headline, second line', type: 'text' },
      { name: 'lead', label: 'Intro', type: 'textarea', help: 'Write {garment} where the garment name should appear.' },
      { name: 'ctaLabel', label: 'Button label', type: 'text' },
      {
        name: 'garment',
        label: 'Garment on show',
        type: 'group',
        fields: [
          { name: 'name', label: 'Name', type: 'text' },
          { name: 'photo', label: 'Full photograph', type: 'image' },
          { name: 'slug', label: 'Links to product', type: 'text' },
        ],
      },
      { name: 'points', label: 'Detail points', type: 'list', itemLabel: 'Point', titleKey: 'label', fields: POINT_FIELDS },
    ],
  },

  {
    name: 'story',
    label: 'Brand band',
    type: 'group',
    fields: [
      { name: 'eyebrow', label: 'Eyebrow', type: 'text' },
      { name: 'headline1', label: 'Headline, first line', type: 'text' },
      { name: 'headline2', label: 'Headline, second line', type: 'text' },
      { name: 'paragraphs', label: 'Body', type: 'paragraphs' },
      { name: 'ctaLabel', label: 'Button label', type: 'text' },
      { name: 'ctaTo', label: 'Button links to', type: 'text' },
      { name: 'images', label: 'Photo grid', type: 'images', help: 'Four images read best here.' },
    ],
  },

  {
    name: 'faq',
    label: 'Homepage questions',
    type: 'group',
    fields: [
      { name: 'eyebrow', label: 'Eyebrow', type: 'text' },
      { name: 'headline1', label: 'Headline, first line', type: 'text' },
      { name: 'headline2', label: 'Headline, second line', type: 'text' },
      { name: 'body', label: 'Intro', type: 'textarea' },
      {
        name: 'items',
        label: 'Questions',
        type: 'list',
        itemLabel: 'Question',
        titleKey: 'title',
        fields: [
          { name: 'title', label: 'Question', type: 'text' },
          { name: 'body', label: 'Answer', type: 'rich' },
        ],
      },
    ],
  },

  {
    name: 'signup',
    label: 'Newsletter band',
    type: 'group',
    fields: [
      { name: 'eyebrow', label: 'Eyebrow', type: 'text' },
      { name: 'headline1', label: 'Headline, first line', type: 'text' },
      { name: 'headline2', label: 'Headline, second line', type: 'text' },
      { name: 'body', label: 'Body', type: 'textarea' },
      { name: 'note', label: 'Note under the field', type: 'text' },
    ],
  },
];
