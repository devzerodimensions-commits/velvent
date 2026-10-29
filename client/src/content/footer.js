/** The footer's link columns, newsletter note and payment badges. */
export const defaults = {
  columns: [
    {
      title: 'Shop',
      links: [
        { to: '/shop', label: 'All Products' },
        { to: '/category/polo-t-shirt', label: 'Polo T-Shirt' },
        { to: '/category/polo-shirt', label: 'Polo Shirt' },
        { to: '/category/oversized-t-shirt', label: 'Oversized T-Shirt' },
        { to: '/shop?sort=newest', label: 'New Arrivals' },
      ],
    },
    {
      title: 'Help',
      links: [
        { to: '/track-order', label: 'Track Your Order' },
        { to: '/shipping', label: 'Shipping' },
        { to: '/returns', label: 'Returns & Exchange' },
        { to: '/faq', label: 'FAQs' },
        { to: '/contact', label: 'Contact Us' },
      ],
    },
    {
      title: 'Company',
      links: [
        { to: '/about', label: 'Our Story' },
        { to: '/size-guide', label: 'Size Guide' },
        { to: '/privacy', label: 'Privacy Policy' },
        { to: '/terms', label: 'Terms of Service' },
      ],
    },
  ],
  newsletterTitle: 'Newsletter',
  newsletterNote: 'First access to drops and restocks. No spam, unsubscribe any time.',
  payments: ['UPI', 'Cards', 'Net Banking', 'COD'],
};

export const fields = [
  {
    name: 'columns',
    label: 'Link columns',
    type: 'list',
    itemLabel: 'Column',
    titleKey: 'title',
    fields: [
      { name: 'title', label: 'Column heading', type: 'text' },
      {
        name: 'links',
        label: 'Links',
        type: 'list',
        itemLabel: 'Link',
        titleKey: 'label',
        fields: [
          { name: 'label', label: 'Label', type: 'text' },
          { name: 'to', label: 'Links to', type: 'text', help: 'A path on this site, e.g. /returns' },
        ],
      },
    ],
  },
  { name: 'newsletterTitle', label: 'Newsletter heading', type: 'text' },
  { name: 'newsletterNote', label: 'Newsletter note', type: 'textarea' },
  { name: 'payments', label: 'Payment badges', type: 'strings', itemLabel: 'Badge' },
];
