/** Single source of truth for the store's contact details and standing copy. */
export const BRAND = {
  name: 'VELVENT',
  tagline: 'Modern. Minimal. Timeless. Crafted for Confidence.',
  motto: 'Simple. Timeless. Premium.',

  phone: '+91 75738 11813',
  phoneRaw: '+917573811813',
  whatsapp: '917573811813',
  email: 'care@velvent.in',

  /* One straight shift now, seven days a week — no midday break to split. The
     day range lives here too so the footer and the contact page stop writing
     it out by hand and falling out of step with these hours. */
  hoursShort: 'Every day, 9:00 AM – 9:00 PM',
  hoursDays: 'Monday to Sunday',
  hours: [
    { label: 'Every day', value: '9:00 AM – 9:00 PM' },
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
