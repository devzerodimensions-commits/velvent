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

  /* GST.

     Switched off until the shop fills in its GSTIN, because a half-filled tax
     setup produces invoices that are worse than none. Turning it on changes
     no price: every price on this store already includes the tax, so the
     figures below only decide how that price is split on a bill. */
  tax: {
    enabled: false,
    gstin: '',
    legalName: '',
    sellerState: 'Gujarat',
    invoicePrefix: 'VLV/',
    defaultHsn: '6105',
    pickup: { line1: '', line2: '', city: '', state: 'Gujarat', pincode: '' },
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
    name: 'tax',
    label: 'GST & invoicing',
    type: 'group',
    help: 'Your prices already include GST, so switching this on does not change what anyone pays. It decides how the tax is shown on a bill and what gets sent to the courier.',
    fields: [
      { name: 'enabled', label: 'Charge and show GST', type: 'toggle' },
      { name: 'gstin', label: 'GSTIN', type: 'text', help: 'Your 15-character GST number, e.g. 24ABCDE1234F1Z5.' },
      { name: 'legalName', label: 'Registered business name', type: 'text', help: 'The name on your GST certificate, if it differs from VELVENT.' },
      { name: 'sellerState', label: 'Your state', type: 'text', help: 'Orders inside this state are billed CGST + SGST. Everywhere else is IGST.' },
      { name: 'invoicePrefix', label: 'Invoice number prefix', type: 'text', help: 'Invoices read like VLV/2026-27/0001. The number restarts each April.' },
      { name: 'defaultHsn', label: 'Default HSN code', type: 'text', help: 'Used for any product without its own. 6105 is knitted shirts and polos.' },
      {
        name: 'pickup',
        label: 'Pickup address',
        type: 'group',
        help: 'Where parcels are collected from. Shiprocket and every other courier needs this before it will book a shipment.',
        fields: [
          { name: 'line1', label: 'Address line 1', type: 'text' },
          { name: 'line2', label: 'Address line 2', type: 'text' },
          { name: 'city', label: 'City', type: 'text' },
          { name: 'state', label: 'State', type: 'text' },
          { name: 'pincode', label: 'PIN code', type: 'text' },
        ],
      },
    ],
  },

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
