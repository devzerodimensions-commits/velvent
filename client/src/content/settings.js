/**
 * Store settings — the switches and values that change how the shop behaves,
 * as opposed to the words it says. Those live in the other content sections.
 *
 * Kept in the same `site_content` table as everything else so a settings
 * change needs no migration and goes live the moment it is saved.
 */
export const defaults = {
  siteIcon: '/favicon.svg',
  titleSuffix: 'VELVENT',

  seoDescription: 'Premium knitted cotton polos, shirts and oversized tees. Modern, minimal, made to last.',
  seoImage: '/products/rugby-stripe-polo-1.jpg',

  notifyEmail: '',
  lowStockAt: 5,

  maintenance: {
    on: false,
    title: 'Back shortly',
    body: 'We are making a few changes to the store. Please check back in a little while.',
  },
};

export const fields = [
  { name: 'siteIcon', label: 'Site icon', type: 'image', help: 'The icon in a browser tab. A square image reads best — 512×512 or larger.' },
  { name: 'titleSuffix', label: 'Browser tab suffix', type: 'text', help: 'Appended to every page title, as in “Shop All | VELVENT”.' },

  { name: 'seoDescription', label: 'Default search description', type: 'textarea', help: 'Used for any page that does not set its own.' },
  { name: 'seoImage', label: 'Default share image', type: 'image', help: 'Shown when a link to the store is posted on social media.' },

  { name: 'notifyEmail', label: 'Order notification email', type: 'text', help: 'Where to send a note when an order comes in. Leave empty to use the store email.' },
  { name: 'lowStockAt', label: 'Low stock warning at', type: 'number', help: 'The dashboard flags a size once its stock reaches this number.' },

  {
    name: 'maintenance',
    label: 'Maintenance mode',
    type: 'group',
    help: 'Closes the storefront to shoppers. You stay signed in and can keep using this panel.',
    fields: [
      { name: 'on', label: 'Close the store', type: 'toggle' },
      { name: 'title', label: 'Heading', type: 'text' },
      { name: 'body', label: 'Message', type: 'textarea' },
    ],
  },
];
