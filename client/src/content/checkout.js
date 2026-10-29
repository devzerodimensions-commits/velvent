/**
 * Checkout, and the confirmation page that follows it — including the
 * membership offer a guest sees once their order has gone through.
 */
export const defaults = {
  title: 'Checkout',

  savedAddressesTitle: 'Saved addresses',
  addressTitle: 'Shipping address',
  notesLabel: 'Delivery notes (optional)',
  paymentTitle: 'Payment',
  placeOrderLabel: 'Place order',
  reassurance: 'Taxes included · {returnDays}-day returns',

  confirmed: {
    title: 'Thank you — your order is in',
    body: 'We have emailed a confirmation to {email}. Keep your order number handy to track it any time.',
    continueLabel: 'Continue shopping',
    ordersLabel: 'My orders',
    dispatchNote: 'Dispatched within {dispatchDays}; delivery usually takes {deliveryDays}. Questions? Call {phone}.',
  },

  /* Offered once, to a guest, just after payment goes through — the one moment
     they have already typed everything an account needs. */
  memberInvite: {
    enabled: true,
    eyebrow: 'One last thing',
    title: 'Become a member',
    body: 'Keep your orders and addresses in one place, save pieces to a wishlist, and get first access to drops and restocks. We will use {email} — you only need to pick a password.',
    acceptLabel: 'Create my account',
    skipLabel: 'Skip for now',
  },
};

export const fields = [
  { name: 'title', label: 'Page heading', type: 'text' },
  { name: 'savedAddressesTitle', label: 'Saved addresses heading', type: 'text' },
  { name: 'addressTitle', label: 'Address heading', type: 'text' },
  { name: 'notesLabel', label: 'Delivery notes label', type: 'text' },
  { name: 'paymentTitle', label: 'Payment heading', type: 'text' },
  { name: 'placeOrderLabel', label: 'Place order button', type: 'text' },
  { name: 'reassurance', label: 'Line under the button', type: 'text' },

  {
    name: 'confirmed',
    label: 'Order confirmed page',
    type: 'group',
    fields: [
      { name: 'title', label: 'Heading', type: 'text' },
      { name: 'body', label: 'Text', type: 'textarea', help: 'Write {email} where the customer’s email should appear.' },
      { name: 'dispatchNote', label: 'Dispatch note', type: 'textarea' },
      { name: 'continueLabel', label: 'Continue shopping button', type: 'text' },
      { name: 'ordersLabel', label: 'My orders button', type: 'text' },
    ],
  },

  {
    name: 'memberInvite',
    label: 'Membership offer',
    type: 'group',
    help: 'Shown once to a guest after a successful order. Skip and the close button both mean no, and it is not asked again for that order.',
    fields: [
      { name: 'enabled', label: 'Show it', type: 'toggle' },
      { name: 'eyebrow', label: 'Eyebrow', type: 'text' },
      { name: 'title', label: 'Heading', type: 'text' },
      { name: 'body', label: 'Text', type: 'textarea' },
      { name: 'acceptLabel', label: 'Accept button', type: 'text' },
      { name: 'skipLabel', label: 'Skip button', type: 'text' },
    ],
  },
];
