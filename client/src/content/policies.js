/**
 * The four policy pages. Each is a title, an intro and a list of sections,
 * every section a heading over bullet points.
 *
 * Points understand the same two things FAQ answers do: `[label](/path)` for a
 * link, and `{freeAbove}`, `{fee}`, `{returnDays}`, `{phone}` and the rest for
 * the live brand and shipping settings — so the shipping policy keeps quoting
 * the right fee after someone edits it.
 */

const sectionFields = [
  { name: 'heading', label: 'Section heading', type: 'text' },
  { name: 'points', label: 'Points', type: 'paragraphs', itemLabel: 'Point' },
];

const pageFields = [
  { name: 'title', label: 'Page heading', type: 'text' },
  { name: 'intro', label: 'Intro', type: 'textarea' },
  {
    name: 'sections',
    label: 'Sections',
    type: 'list',
    itemLabel: 'Section',
    titleKey: 'heading',
    fields: sectionFields,
  },
  {
    name: 'related',
    label: 'Related links',
    type: 'list',
    itemLabel: 'Link',
    titleKey: 'label',
    fields: [
      { name: 'label', label: 'Label', type: 'text' },
      { name: 'to', label: 'Links to', type: 'text' },
    ],
  },
];

export const shipping = {
  defaults: {
    title: 'Shipping Policy',
    intro: 'How and when your VELVENT order reaches you.',
    sections: [
      {
        heading: 'Where we ship',
        points: ['We ship across India. We do not ship internationally at the moment.'],
      },
      {
        heading: 'Charges',
        points: [
          'Shipping is free on all prepaid orders above {freeAbove}.',
          'Orders below that carry a flat {fee} shipping fee, shown before you pay.',
          'Cash on Delivery is available nationwide at no extra charge.',
        ],
      },
      {
        heading: 'Dispatch and delivery',
        points: [
          'Orders are packed and handed to the courier within {dispatchDays} of being placed, on working days.',
          'Delivery then usually takes {deliveryDays}, depending on your PIN code.',
          'Orders placed on Sunday or a public holiday are dispatched the next working day.',
        ],
      },
      {
        heading: 'Tracking',
        points: [
          'You will get the order number by email as soon as the order is placed, and tracking details once it ships.',
          'Track any order from the [Track Order](/track-order) page using your order number and email.',
        ],
      },
      {
        heading: 'Failed delivery',
        points: [
          'Our courier attempts delivery up to three times. If all attempts fail, the parcel comes back to us and we will contact you to re-ship or refund.',
          'Please make sure the mobile number on the order is reachable.',
        ],
      },
    ],
    related: [
      { to: '/returns', label: 'Returns & Exchange' },
      { to: '/track-order', label: 'Track your order' },
      { to: '/faq', label: 'FAQs' },
    ],
  },
  fields: pageFields,
};

export const returns = {
  defaults: {
    title: 'Returns & Exchange',
    intro: 'Not right? You have {returnDays} days.',
    sections: [
      {
        heading: 'The window',
        points: [
          'You can return or exchange any piece within {returnDays} days of delivery.',
          'The item must be unworn and unwashed, with all original tags still attached.',
        ],
      },
      {
        heading: 'Size exchanges',
        points: [
          'Free, within the return window and subject to stock in the size you want.',
          'Message or call us and we will arrange a pickup and send the replacement.',
        ],
      },
      {
        heading: 'Refunds',
        points: [
          'Prepaid orders are refunded to the original payment method within 5–7 working days of us receiving the item back.',
          'Cash-on-delivery orders are refunded by bank transfer — we will ask for your account details once the return is received.',
          'Shipping charges, where they were paid, are not refunded unless the item arrived damaged or we sent the wrong piece.',
        ],
      },
      {
        heading: 'What we cannot take back',
        points: [
          'Items that have been worn, washed, altered or damaged after delivery.',
          'Items returned without their original tags.',
          'Anything returned after the return window has closed.',
        ],
      },
      {
        heading: 'Damaged or wrong item',
        points: [
          'If a parcel arrives damaged or contains the wrong piece, tell us within 48 hours of delivery with a photo and we will replace it at our cost.',
        ],
      },
      {
        heading: 'How to start a return',
        points: [
          'Call {phone} during {hoursShort}, message us on WhatsApp, or email {email} with your order number.',
        ],
      },
    ],
    related: [
      { to: '/shipping', label: 'Shipping Policy' },
      { to: '/size-guide', label: 'Size Guide' },
      { to: '/contact', label: 'Contact us' },
    ],
  },
  fields: pageFields,
};

export const privacy = {
  defaults: {
    title: 'Privacy Policy',
    intro: 'What we collect, why, and what we never do with it.',
    sections: [
      {
        heading: 'What we collect',
        points: [
          'Your name, email, mobile number and shipping address — the details needed to deliver an order.',
          'Your order history and, if you create an account, your saved addresses and wishlist.',
          'Basic technical data such as browser and device type, used only to keep the site working.',
        ],
      },
      {
        heading: 'What we do not collect',
        points: [
          'We never see or store your full card number, UPI PIN or bank credentials. Online payments are handled entirely by our payment provider.',
        ],
      },
      {
        heading: 'How we use it',
        points: [
          'To process, pack, ship and support your orders.',
          'To send order updates, and marketing email only if you opted in to the newsletter.',
          'To improve the store — what sells, what does not, which sizes run out.',
        ],
      },
      {
        heading: 'Who we share it with',
        points: [
          'Our courier partner, so they can deliver the parcel.',
          'Our payment provider, so they can process the payment.',
          'Nobody else. We do not sell, rent or trade customer data.',
        ],
      },
      {
        heading: 'Your choices',
        points: [
          'Unsubscribe from marketing email at any time using the link in the footer of those emails.',
          'Ask us to show, correct or delete the data we hold on you by writing to {email}.',
        ],
      },
      {
        heading: 'Cookies',
        points: [
          'We use the minimum needed: one to keep you signed in, and one to remember your bag between visits. No third-party advertising trackers.',
        ],
      },
    ],
    related: [
      { to: '/terms', label: 'Terms of Service' },
      { to: '/contact', label: 'Contact us' },
    ],
  },
  fields: pageFields,
};

export const terms = {
  defaults: {
    title: 'Terms of Service',
    intro: 'The ground rules for buying from VELVENT.',
    sections: [
      {
        heading: 'Using this store',
        points: [
          'By placing an order you confirm you are at least 18, or shopping with the consent of a parent or guardian.',
          'You agree the details you give us — name, address, phone, email — are accurate and yours to use.',
        ],
      },
      {
        heading: 'Products and pricing',
        points: [
          'All prices are in Indian Rupees and include applicable taxes.',
          'We photograph every product as accurately as we can. Screens differ, so slight colour variation is possible.',
          'We may change prices or discontinue a style at any time. Orders already placed are honoured at the price you paid.',
        ],
      },
      {
        heading: 'Order acceptance',
        points: [
          'Your order is an offer to buy. We may decline it — and will refund you in full — if the item is out of stock, the price was listed in error, or we cannot deliver to your address.',
        ],
      },
      {
        heading: 'Stock',
        points: [
          'Stock is shown live and reserved only once an order is placed. Occasionally an item sells out between you adding it and paying; if that happens we will contact you and refund that line.',
        ],
      },
      {
        heading: 'Intellectual property',
        points: [
          'The VELVENT name, the V monogram, product photography and site copy belong to VELVENT and may not be reused without written permission.',
        ],
      },
      {
        heading: 'Liability',
        points: ['Our liability for any order is limited to the amount you paid for it.'],
      },
      {
        heading: 'Governing law',
        points: [
          'These terms are governed by Indian law, and disputes fall under the jurisdiction of the courts where the business is registered.',
        ],
      },
      {
        heading: 'Contact',
        points: ['Questions about these terms: {email} or {phone}.'],
      },
    ],
    related: [
      { to: '/privacy', label: 'Privacy Policy' },
      { to: '/shipping', label: 'Shipping Policy' },
    ],
  },
  fields: pageFields,
};
