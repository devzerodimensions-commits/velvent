/**
 * The furniture around a product — everything on the page that is not the
 * product's own name, price, photographs or description. Those live on the
 * product itself, under Products.
 *
 * The shipping lines take the live settings through {dispatchDays},
 * {deliveryDays}, {freeAbove} and {returnDays}, so they cannot contradict what
 * checkout charges.
 */
export const defaults = {
  trust: [
    { icon: 'Truck', text: 'Delivery by {delivery}' },
    { icon: 'Refresh', text: '{returnDays}-day easy returns' },
    { icon: 'Shield', text: 'Secure payment & COD' },
  ],

  sizeGuideLabel: 'Size guide',
  addToBagLabel: 'Add to bag',
  soldOutLabel: 'Sold out',
  similarLabel: 'Find similar',
  shareLabel: 'Share',

  detailsTitle: 'Product details',
  washCareTitle: 'Wash care',

  shippingTitle: 'Shipping & returns',
  shippingLines: [
    'Dispatched within {dispatchDays}. Delivery typically takes {deliveryDays}.',
    'Free shipping on prepaid orders above {freeAbove}. Cash on delivery available nationwide.',
    'Return or exchange within {returnDays} days of delivery — see [our returns policy](/returns).',
  ],

  reviewsTitle: 'Reviews',
  reviewsEmpty: 'No reviews yet. If you have bought this piece, yours would be the first.',

  similarTitle: 'You may also like',
};

export const fields = [
  {
    name: 'trust',
    label: 'Reassurance strip',
    type: 'list',
    itemLabel: 'Line',
    titleKey: 'text',
    help: 'The three lines under the buy button. {delivery} fills in the estimated date.',
    fields: [
      { name: 'text', label: 'Text', type: 'text' },
      { name: 'icon', label: 'Icon', type: 'select', options: ['Truck', 'Refresh', 'Shield', 'Box', 'Rupee', 'Check', 'Tag'] },
    ],
  },

  { name: 'addToBagLabel', label: 'Add to bag button', type: 'text' },
  { name: 'soldOutLabel', label: 'Sold out label', type: 'text' },
  { name: 'sizeGuideLabel', label: 'Size guide link', type: 'text' },
  { name: 'similarLabel', label: 'Similar products tooltip', type: 'text' },
  { name: 'shareLabel', label: 'Share tooltip', type: 'text' },

  { name: 'detailsTitle', label: 'Details section heading', type: 'text' },
  { name: 'washCareTitle', label: 'Wash care heading', type: 'text' },

  { name: 'shippingTitle', label: 'Shipping section heading', type: 'text' },
  { name: 'shippingLines', label: 'Shipping section text', type: 'paragraphs', itemLabel: 'Line' },

  { name: 'reviewsTitle', label: 'Reviews heading', type: 'text', help: 'The count is added automatically.' },
  { name: 'reviewsEmpty', label: 'No reviews text', type: 'textarea' },

  { name: 'similarTitle', label: 'Related products heading', type: 'text' },
];
