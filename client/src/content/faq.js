/**
 * The FAQ page.
 *
 * Answers are plain text. Two things are understood inside them: a link
 * written `[label](/path)`, and a token like `{freeAbove}` that is replaced
 * with the matching brand or shipping setting, so an answer quoting the
 * shipping fee stays right when that fee is edited.
 */
export const defaults = {
  title: 'Frequently Asked Questions',
  intro: 'Everything we get asked most. If your question is not here, [write to us](/contact) — we reply within a business day.',

  groups: [
    {
      heading: 'Orders & payment',
      items: [
        {
          title: 'What payment methods do you accept?',
          body: 'Cash on Delivery is available nationwide. Online payment — UPI, credit and debit cards, net banking and wallets — is handled through Razorpay once it is enabled on the store.',
        },
        {
          title: 'Can I change or cancel my order?',
          body: 'Yes, any time before the parcel ships. Open [My Account](/account) and cancel it there, or call us on {phone}. Once it is marked shipped we can no longer stop it, but you can still return it after delivery.',
        },
        {
          title: 'Do I need an account to order?',
          body: 'No. You can check out as a guest and track the order with your order number and email. An account just saves your address and keeps your history in one place.',
        },
        {
          title: 'Will I get an invoice?',
          body: 'Yes — a tax invoice is included in the parcel, and the order confirmation email carries the full breakdown.',
        },
      ],
    },
    {
      heading: 'Shipping & delivery',
      items: [
        {
          title: 'How much does shipping cost?',
          body: 'Free on all prepaid orders above {freeAbove}. Below that, a flat {fee} applies.',
        },
        {
          title: 'How long will my order take?',
          body: 'We dispatch within {dispatchDays} of the order being placed. Delivery then takes {deliveryDays} depending on your PIN code.',
        },
        {
          title: 'How do I track my parcel?',
          body: 'Use the [Track Order](/track-order) page with your order number and email. Signed-in customers can see live status under My Account.',
        },
        {
          title: 'Do you ship outside India?',
          body: 'Not yet. We ship across India only at the moment.',
        },
      ],
    },
    {
      heading: 'Sizing & fit',
      items: [
        {
          title: 'What sizes do you make?',
          body: 'Every style runs S, M, L, XL, XXL and 3XL. Full measurements are on the [size guide](/size-guide).',
        },
        {
          title: 'Which size should I pick?',
          body: 'Our polos and polo shirts are true to size — take your usual. Oversized tees are cut deliberately boxy; if you want a closer fit, size down one.',
        },
        {
          title: 'Will knitted cotton shrink?',
          body: 'Minimally. Wash cold and tumble dry low and you should see no meaningful change. Hot washes are what cause shrinkage in cotton knits.',
        },
      ],
    },
    {
      heading: 'Returns & care',
      items: [
        {
          title: 'What is your return window?',
          body: '{returnDays} days from delivery, on unworn pieces with tags attached. See the full [returns policy](/returns).',
        },
        {
          title: 'Can I exchange for a different size?',
          body: 'Yes — size exchanges are free within the return window, subject to stock. Write to us or call and we will arrange the pickup.',
        },
        {
          title: 'How should I wash these?',
          body: 'Machine wash cold with like colours, do not bleach, tumble dry low, warm iron on the reverse. That is it.',
        },
      ],
    },
  ],

  stuckTitle: 'Still stuck?',
  stuckBody: 'Call {phone} during {hoursShort}, or message us on WhatsApp.',
  stuckCtaLabel: 'Contact us',
};

export const fields = [
  { name: 'title', label: 'Page heading', type: 'text' },
  { name: 'intro', label: 'Intro', type: 'rich' },
  {
    name: 'groups',
    label: 'Question groups',
    type: 'list',
    itemLabel: 'Group',
    titleKey: 'heading',
    fields: [
      { name: 'heading', label: 'Group heading', type: 'text' },
      {
        name: 'items',
        label: 'Questions',
        type: 'list',
        itemLabel: 'Question',
        titleKey: 'title',
        fields: [
          { name: 'title', label: 'Question', type: 'text' },
          { name: 'body', label: 'Answer', type: 'rich' },
        ],
      },
    ],
  },
  { name: 'stuckTitle', label: 'Closing box heading', type: 'text' },
  { name: 'stuckBody', label: 'Closing box text', type: 'rich' },
  { name: 'stuckCtaLabel', label: 'Closing button label', type: 'text' },
];
