/** The scrolling announcement bar and the main menu. */
export const defaults = {
  ticker: [
    'Free shipping on every prepaid order',
    'Flat 33% off — MRP ₹1,499 · Now ₹1,005',
    'Easy 7-day returns',
    'Cash on delivery available',
  ],
  nav: [
    { to: '/shop', label: 'Shop All' },
    { to: '/category/polo-t-shirt', label: 'Polo T-Shirt' },
    { to: '/category/polo-shirt', label: 'Polo Shirt' },
    { to: '/category/oversized-t-shirt', label: 'Oversized Tee' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ],
};

export const fields = [
  {
    name: 'ticker',
    label: 'Announcement bar',
    type: 'strings',
    itemLabel: 'Line',
    help: 'These scroll across the top of every page. Keep each one short.',
  },
  {
    name: 'nav',
    label: 'Main menu',
    type: 'list',
    itemLabel: 'Menu item',
    fields: [
      { name: 'label', label: 'Label', type: 'text' },
      { name: 'to', label: 'Links to', type: 'text', help: 'A path on this site, e.g. /shop or /category/polo-shirt' },
    ],
  },
];
