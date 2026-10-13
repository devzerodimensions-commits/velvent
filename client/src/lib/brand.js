/** Single source of truth for the store's contact details and standing copy. */
export const BRAND = {
  name: 'VELVENT',
  tagline: 'Modern. Minimal. Timeless. Crafted for Confidence.',
  motto: 'Simple. Timeless. Premium.',

  phone: '+91 75738 11813',
  phoneRaw: '+917573811813',
  whatsapp: '917573811813',
  email: 'care@velvent.in',

  hoursShort: 'Mon–Sat, 9:00 AM – 7:30 PM',
  hours: [
    { label: 'Morning', value: '9:00 AM – 1:00 PM' },
    { label: 'Afternoon', value: '1:30 PM – 7:30 PM' },
  ],

  social: {
    instagram: 'https://instagram.com/',
    facebook: 'https://facebook.com/',
  },

  shipping: {
    freeAbove: 999,
    fee: 79,
    dispatchDays: '24–48 hours',
    deliveryDays: '3–6 business days',
    returnDays: 7,
  },
};

export const CATEGORY_ORDER = ['polo-t-shirt', 'polo-shirt', 'oversized-t-shirt'];
