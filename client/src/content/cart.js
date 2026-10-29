/** The bag, and the drawer that slides in when something is added to it. */
export const defaults = {
  title: 'Your Bag',

  emptyTitle: 'Your bag is empty',
  emptyBody: 'Nothing here yet. Browse knitted polos, button-through shirts and oversized tees.',
  emptyCtaLabel: 'Start shopping',

  summaryTitle: 'Order summary',
  checkoutLabel: 'Proceed to checkout',
  reassurance: 'Taxes included · Secure checkout',

  /* The nudge toward free shipping. {away} is how much more they need to
     spend, {freeAbove} the threshold itself. */
  freeShippingAway: 'Add {away} more for free shipping',
  freeShippingWon: 'Your order ships free',

  couponLabel: 'Have a coupon?',
  couponPlaceholder: 'Coupon code',
  couponApply: 'Apply',
};

export const fields = [
  { name: 'title', label: 'Page heading', type: 'text' },

  { name: 'emptyTitle', label: 'Empty bag heading', type: 'text' },
  { name: 'emptyBody', label: 'Empty bag text', type: 'textarea' },
  { name: 'emptyCtaLabel', label: 'Empty bag button', type: 'text' },

  { name: 'summaryTitle', label: 'Summary heading', type: 'text' },
  { name: 'checkoutLabel', label: 'Checkout button', type: 'text' },
  { name: 'reassurance', label: 'Line under the button', type: 'text' },

  { name: 'freeShippingAway', label: 'Free shipping nudge', type: 'text', help: 'Write {away} where the remaining amount should go.' },
  { name: 'freeShippingWon', label: 'Free shipping reached', type: 'text' },

  { name: 'couponLabel', label: 'Coupon heading', type: 'text' },
  { name: 'couponPlaceholder', label: 'Coupon placeholder', type: 'text' },
  { name: 'couponApply', label: 'Coupon button', type: 'text' },
];
