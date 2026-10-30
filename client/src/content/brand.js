/**
 * Contact details, standing copy and the shipping rules.
 *
 * The shipping numbers here are also read by the server when it prices a cart,
 * so what is edited in the admin is what an order is actually charged — the
 * two can never drift.
 */
export const defaults = {
  name: 'VELVENT',
  tagline: 'Modern. Minimal. Timeless. Crafted for Confidence.',
  motto: 'Simple. Timeless. Premium.',

  phone: '+91 75738 11813',
  phoneRaw: '+917573811813',
  whatsapp: '917573811813',
  email: 'care@velvent.in',

  hoursShort: 'Every day, 9:00 AM – 9:00 PM',
  hoursDays: 'Monday to Sunday',
  hours: [
    { label: 'Every day', value: '9:00 AM – 9:00 PM' },
  ],

  /* A list rather than a fixed pair, so adding YouTube or Pinterest is a row
     in the admin instead of a release. Order here is the order in the footer. */
  social: [
    { platform: 'Instagram', url: 'https://instagram.com/' },
    { platform: 'Facebook', url: 'https://facebook.com/' },
  ],

  shipping: {
    freeAbove: 999,
    fee: 79,
    dispatchDays: '24–48 hours',
    deliveryDays: '3–6 business days',
    returnDays: 7,
  },
};

export const fields = [
  { name: 'name', label: 'Store name', type: 'text' },
  { name: 'tagline', label: 'Tagline', type: 'textarea', help: 'Shown under the logo in the footer and on the About hero.' },
  { name: 'motto', label: 'Motto', type: 'text', help: 'The short line in the footer bar and at the foot of the About page.' },

  { name: 'phone', label: 'Phone (as shown)', type: 'text' },
  { name: 'phoneRaw', label: 'Phone (for the dial link)', type: 'text', help: 'Digits and a + only — this is what a tap-to-call uses.' },
  { name: 'whatsapp', label: 'WhatsApp number', type: 'text', help: 'Country code and number, no + or spaces. e.g. 917573811813' },
  { name: 'email', label: 'Email', type: 'text' },

  { name: 'hoursShort', label: 'Opening hours (one line)', type: 'text' },
  { name: 'hoursDays', label: 'Days open', type: 'text' },
  {
    name: 'hours',
    label: 'Opening hours (footer rows)',
    type: 'list',
    itemLabel: 'Row',
    titleKey: 'label',
    fields: [
      { name: 'label', label: 'Days', type: 'text' },
      { name: 'value', label: 'Hours', type: 'text' },
    ],
  },

  {
    name: 'social',
    label: 'Social links',
    type: 'list',
    itemLabel: 'Link',
    titleKey: 'platform',
    help: 'Shown as icons in the footer, in this order. Add as many as you like — a platform with no icon of its own gets a globe.',
    fields: [
      {
        name: 'platform',
        label: 'Platform',
        type: 'select',
        options: ['Instagram', 'Facebook', 'YouTube', 'X', 'LinkedIn', 'Pinterest', 'Snapchat', 'Website'],
      },
      { name: 'url', label: 'Link', type: 'url', help: 'The full address, starting with https://' },
    ],
  },

  {
    name: 'shipping',
    label: 'Shipping & returns rules',
    type: 'group',
    help: 'These numbers price every cart, on the site and on the server. Changing them changes what customers are charged.',
    fields: [
      { name: 'freeAbove', label: 'Free shipping above (₹)', type: 'number' },
      { name: 'fee', label: 'Shipping fee (₹)', type: 'number' },
      { name: 'dispatchDays', label: 'Dispatch time', type: 'text' },
      { name: 'deliveryDays', label: 'Delivery time', type: 'text' },
      { name: 'returnDays', label: 'Return window (days)', type: 'number' },
    ],
  },
];
