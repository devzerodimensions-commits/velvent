import { Link } from 'react-router-dom';
import { Breadcrumbs, Seo } from '../components/ui';
import { BRAND } from '../lib/brand';
import { inr } from '../lib/format';

const { shipping: S, phone, email, hoursShort } = BRAND;

const CONTENT = {
  shipping: {
    title: 'Shipping Policy',
    intro: 'How and when your VELVENT order reaches you.',
    sections: [
      ['Where we ship', [`We ship across India. We do not ship internationally at the moment.`]],
      ['Charges', [
        `Shipping is free on all prepaid orders above ${inr(S.freeAbove)}.`,
        `Orders below that carry a flat ${inr(S.fee)} shipping fee, shown before you pay.`,
        'Cash on Delivery is available nationwide at no extra charge.',
      ]],
      ['Dispatch and delivery', [
        `Orders are packed and handed to the courier within ${S.dispatchDays} of being placed, on working days.`,
        `Delivery then usually takes ${S.deliveryDays}, depending on your PIN code.`,
        'Orders placed on Sunday or a public holiday are dispatched the next working day.',
      ]],
      ['Tracking', [
        'You will get the order number by email as soon as the order is placed, and tracking details once it ships.',
        'Track any order from the Track Order page using your order number and email.',
      ]],
      ['Failed delivery', [
        'Our courier attempts delivery up to three times. If all attempts fail, the parcel comes back to us and we will contact you to re-ship or refund.',
        'Please make sure the mobile number on the order is reachable.',
      ]],
    ],
  },

  returns: {
    title: 'Returns & Exchange',
    intro: `Not right? You have ${S.returnDays} days.`,
    sections: [
      ['The window', [
        `You can return or exchange any piece within ${S.returnDays} days of delivery.`,
        'The item must be unworn and unwashed, with all original tags still attached.',
      ]],
      ['Size exchanges', [
        'Free, within the return window and subject to stock in the size you want.',
        'Message or call us and we will arrange a pickup and send the replacement.',
      ]],
      ['Refunds', [
        'Prepaid orders are refunded to the original payment method within 5–7 working days of us receiving the item back.',
        'Cash-on-delivery orders are refunded by bank transfer — we will ask for your account details once the return is received.',
        'Shipping charges, where they were paid, are not refunded unless the item arrived damaged or we sent the wrong piece.',
      ]],
      ['What we cannot take back', [
        'Items that have been worn, washed, altered or damaged after delivery.',
        'Items returned without their original tags.',
        'Anything returned after the return window has closed.',
      ]],
      ['Damaged or wrong item', [
        'If a parcel arrives damaged or contains the wrong piece, tell us within 48 hours of delivery with a photo and we will replace it at our cost.',
      ]],
      ['How to start a return', [
        `Call ${phone} during ${hoursShort}, message us on WhatsApp, or email ${email} with your order number.`,
      ]],
    ],
  },

  privacy: {
    title: 'Privacy Policy',
    intro: 'What we collect, why, and what we never do with it.',
    sections: [
      ['What we collect', [
        'Your name, email, mobile number and shipping address — the details needed to deliver an order.',
        'Your order history and, if you create an account, your saved addresses and wishlist.',
        'Basic technical data such as browser and device type, used only to keep the site working.',
      ]],
      ['What we do not collect', [
        'We never see or store your full card number, UPI PIN or bank credentials. Online payments are handled entirely by our payment provider.',
      ]],
      ['How we use it', [
        'To process, pack, ship and support your orders.',
        'To send order updates, and marketing email only if you opted in to the newsletter.',
        'To improve the store — what sells, what does not, which sizes run out.',
      ]],
      ['Who we share it with', [
        'Our courier partner, so they can deliver the parcel.',
        'Our payment provider, so they can process the payment.',
        'Nobody else. We do not sell, rent or trade customer data.',
      ]],
      ['Your choices', [
        'Unsubscribe from marketing email at any time using the link in the footer of those emails.',
        `Ask us to show, correct or delete the data we hold on you by writing to ${email}.`,
      ]],
      ['Cookies', [
        'We use the minimum needed: one to keep you signed in, and one to remember your bag between visits. No third-party advertising trackers.',
      ]],
    ],
  },

  terms: {
    title: 'Terms of Service',
    intro: 'The ground rules for buying from VELVENT.',
    sections: [
      ['Using this store', [
        'By placing an order you confirm you are at least 18, or shopping with the consent of a parent or guardian.',
        'You agree the details you give us — name, address, phone, email — are accurate and yours to use.',
      ]],
      ['Products and pricing', [
        'All prices are in Indian Rupees and include applicable taxes.',
        'We photograph every product as accurately as we can. Screens differ, so slight colour variation is possible.',
        'We may change prices or discontinue a style at any time. Orders already placed are honoured at the price you paid.',
      ]],
      ['Order acceptance', [
        'Your order is an offer to buy. We may decline it — and will refund you in full — if the item is out of stock, the price was listed in error, or we cannot deliver to your address.',
      ]],
      ['Stock', [
        'Stock is shown live and reserved only once an order is placed. Occasionally an item sells out between you adding it and paying; if that happens we will contact you and refund that line.',
      ]],
      ['Intellectual property', [
        'The VELVENT name, the V monogram, product photography and site copy belong to VELVENT and may not be reused without written permission.',
      ]],
      ['Liability', [
        'Our liability for any order is limited to the amount you paid for it.',
      ]],
      ['Governing law', [
        'These terms are governed by Indian law, and disputes fall under the jurisdiction of the courts where the business is registered.',
      ]],
      ['Contact', [`Questions about these terms: ${email} or ${phone}.`]],
    ],
  },
};

const RELATED = {
  shipping: [['/returns', 'Returns & Exchange'], ['/track-order', 'Track your order'], ['/faq', 'FAQs']],
  returns: [['/shipping', 'Shipping Policy'], ['/size-guide', 'Size Guide'], ['/contact', 'Contact us']],
  privacy: [['/terms', 'Terms of Service'], ['/contact', 'Contact us']],
  terms: [['/privacy', 'Privacy Policy'], ['/shipping', 'Shipping Policy']],
};

export default function Policy({ kind }) {
  const page = CONTENT[kind];
  if (!page) return null;

  return (
    <>
      <Seo title={page.title} description={page.intro} />
      <div className="shell py-8 sm:py-11">
        <Breadcrumbs items={[{ label: page.title }]} />
        <h1 className="h-section mt-4">{page.title}</h1>
        <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-slate">{page.intro}</p>

        <div className="mt-11 max-w-3xl space-y-10">
          {page.sections.map(([heading, points]) => (
            <section key={heading}>
              <h2 className="font-display text-[15px] font-semibold uppercase tracking-wider2 text-navy">{heading}</h2>
              <ul className="mt-4 space-y-2.5">
                {points.map((p) => (
                  <li key={p} className="flex gap-3 text-[14px] leading-relaxed text-slate">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-navy" />
                    {p}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-14 max-w-3xl border-t border-mist pt-8">
          <h2 className="eyebrow">Related</h2>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {RELATED[kind].map(([to, label]) => (
              <Link key={to} to={to} className="btn-ghost btn-sm">{label}</Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
