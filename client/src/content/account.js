/** Signing in, registering, the account area, the wishlist and order tracking. */
export const defaults = {
  login: {
    title: 'Sign in',
    body: 'Track orders, save addresses and keep a wishlist.',
    submitLabel: 'Sign in',
    registerPrompt: 'New here?',
    registerLabel: 'Create an account',
    guestPrompt: 'Just want to check an order?',
    guestLabel: 'Track it without signing in',
  },

  register: {
    title: 'Create account',
    body: 'Faster checkout, order history and a saved wishlist.',
    passwordHint: 'At least 6 characters.',
    submitLabel: 'Create account',
    loginPrompt: 'Already have an account?',
    loginLabel: 'Sign in',
  },

  account: {
    title: 'My Account',
    ordersTitle: 'Orders',
    ordersEmptyTitle: 'No orders yet',
    ordersEmptyBody: 'When you place an order it will show up here, with live status.',
    addressesTitle: 'Addresses',
    addressesEmptyTitle: 'No saved addresses',
    addressesEmptyBody: 'Save an address to skip typing it at checkout.',
    detailsTitle: 'Your details',
    passwordTitle: 'Change password',
  },

  wishlist: {
    title: 'Wishlist',
    emptyTitle: 'Nothing saved yet',
    emptyBody: 'Tap the heart on any product to keep it here for later.',
    emptyCtaLabel: 'Browse the collection',
  },

  track: {
    title: 'Track Your Order',
    intro: '',
    numberLabel: 'Order number',
    emailLabel: 'Email address',
    submitLabel: 'Track order',
    helpNote: 'Cannot find it? Call {phone} during {hoursShort}.',
    seoDescription: 'Enter your VELVENT order number and email to see where your parcel is.',
  },
};

export const fields = [
  {
    name: 'login',
    label: 'Sign in page',
    type: 'group',
    fields: [
      { name: 'title', label: 'Heading', type: 'text' },
      { name: 'body', label: 'Text under it', type: 'textarea' },
      { name: 'submitLabel', label: 'Submit button', type: 'text' },
      { name: 'registerPrompt', label: 'Register prompt', type: 'text' },
      { name: 'registerLabel', label: 'Register link', type: 'text' },
      { name: 'guestPrompt', label: 'Guest prompt', type: 'text' },
      { name: 'guestLabel', label: 'Guest link', type: 'text' },
    ],
  },
  {
    name: 'register',
    label: 'Create account page',
    type: 'group',
    fields: [
      { name: 'title', label: 'Heading', type: 'text' },
      { name: 'body', label: 'Text under it', type: 'textarea' },
      { name: 'passwordHint', label: 'Password hint', type: 'text' },
      { name: 'submitLabel', label: 'Submit button', type: 'text' },
      { name: 'loginPrompt', label: 'Sign-in prompt', type: 'text' },
      { name: 'loginLabel', label: 'Sign-in link', type: 'text' },
    ],
  },
  {
    name: 'account',
    label: 'Account area',
    type: 'group',
    fields: [
      { name: 'title', label: 'Heading', type: 'text' },
      { name: 'ordersTitle', label: 'Orders tab', type: 'text' },
      { name: 'ordersEmptyTitle', label: 'No orders heading', type: 'text' },
      { name: 'ordersEmptyBody', label: 'No orders text', type: 'textarea' },
      { name: 'addressesTitle', label: 'Addresses tab', type: 'text' },
      { name: 'addressesEmptyTitle', label: 'No addresses heading', type: 'text' },
      { name: 'addressesEmptyBody', label: 'No addresses text', type: 'textarea' },
      { name: 'detailsTitle', label: 'Details heading', type: 'text' },
      { name: 'passwordTitle', label: 'Password heading', type: 'text' },
    ],
  },
  {
    name: 'wishlist',
    label: 'Wishlist page',
    type: 'group',
    fields: [
      { name: 'title', label: 'Heading', type: 'text' },
      { name: 'emptyTitle', label: 'Empty heading', type: 'text' },
      { name: 'emptyBody', label: 'Empty text', type: 'textarea' },
      { name: 'emptyCtaLabel', label: 'Empty button', type: 'text' },
    ],
  },
  {
    name: 'track',
    label: 'Track order page',
    type: 'group',
    fields: [
      { name: 'title', label: 'Heading', type: 'text' },
      { name: 'intro', label: 'Intro', type: 'textarea', help: 'Optional.' },
      { name: 'numberLabel', label: 'Order number label', type: 'text' },
      { name: 'emailLabel', label: 'Email label', type: 'text' },
      { name: 'submitLabel', label: 'Submit button', type: 'text' },
      { name: 'helpNote', label: 'Help note', type: 'textarea' },
      { name: 'seoDescription', label: 'Search description', type: 'textarea' },
    ],
  },
];
