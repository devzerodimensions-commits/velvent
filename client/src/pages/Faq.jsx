import { Link } from 'react-router-dom';
import { Accordion, Breadcrumbs, Seo } from '../components/ui';
import { BRAND } from '../lib/brand';
import { inr } from '../lib/format';

const GROUPS = [
  {
    heading: 'Orders & payment',
    items: [
      {
        title: 'What payment methods do you accept?',
        body: (
          <p>
            Cash on Delivery is available nationwide. Online payment — UPI, credit and debit cards,
            net banking and wallets — is handled through Razorpay once it is enabled on the store.
          </p>
        ),
      },
      {
        title: 'Can I change or cancel my order?',
        body: (
          <p>
            Yes, any time before the parcel ships. Open{' '}
            <Link to="/account" className="underline">My Account</Link> and cancel it there, or call us
            on {BRAND.phone}. Once it is marked shipped we can no longer stop it, but you can still
            return it after delivery.
          </p>
        ),
      },
      {
        title: 'Do I need an account to order?',
        body: <p>No. You can check out as a guest and track the order with your order number and email. An account just saves your address and keeps your history in one place.</p>,
      },
      {
        title: 'Will I get an invoice?',
        body: <p>Yes — a tax invoice is included in the parcel, and the order confirmation email carries the full breakdown.</p>,
      },
    ],
  },
  {
    heading: 'Shipping & delivery',
    items: [
      {
        title: 'How much does shipping cost?',
        body: <p>Free on all prepaid orders above {inr(BRAND.shipping.freeAbove)}. Below that, a flat {inr(BRAND.shipping.fee)} applies.</p>,
      },
      {
        title: 'How long will my order take?',
        body: <p>We dispatch within {BRAND.shipping.dispatchDays} of the order being placed. Delivery then takes {BRAND.shipping.deliveryDays} depending on your PIN code.</p>,
      },
      {
        title: 'How do I track my parcel?',
        body: (
          <p>
            Use the <Link to="/track-order" className="underline">Track Order</Link> page with your order
            number and email. Signed-in customers can see live status under My Account.
          </p>
        ),
      },
      { title: 'Do you ship outside India?', body: <p>Not yet. We ship across India only at the moment.</p> },
    ],
  },
  {
    heading: 'Sizing & fit',
    items: [
      {
        title: 'What sizes do you make?',
        body: <p>Every style runs S, M, L, XL, XXL and 3XL. Full measurements are on the <Link to="/size-guide" className="underline">size guide</Link>.</p>,
      },
      {
        title: 'Which size should I pick?',
        body: <p>Our polos and polo shirts are true to size — take your usual. Oversized tees are cut deliberately boxy; if you want a closer fit, size down one.</p>,
      },
      {
        title: 'Will knitted cotton shrink?',
        body: <p>Minimally. Wash cold and tumble dry low and you should see no meaningful change. Hot washes are what cause shrinkage in cotton knits.</p>,
      },
    ],
  },
  {
    heading: 'Returns & care',
    items: [
      {
        title: 'What is your return window?',
        body: <p>{BRAND.shipping.returnDays} days from delivery, on unworn pieces with tags attached. See the full <Link to="/returns" className="underline">returns policy</Link>.</p>,
      },
      {
        title: 'Can I exchange for a different size?',
        body: <p>Yes — size exchanges are free within the return window, subject to stock. Write to us or call and we will arrange the pickup.</p>,
      },
      {
        title: 'How should I wash these?',
        body: <p>Machine wash cold with like colours, do not bleach, tumble dry low, warm iron on the reverse. That is it.</p>,
      },
    ],
  },
];

export default function Faq() {
  return (
    <>
      <Seo title="FAQs" description="Answers on VELVENT shipping, returns, sizing, payment and fabric care." />
      <div className="shell py-8 sm:py-11">
        <Breadcrumbs items={[{ label: 'FAQs' }]} />
        <h1 className="h-section mt-4">Frequently Asked Questions</h1>
        <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-slate">
          Everything we get asked most. If your question is not here,{' '}
          <Link to="/contact" className="font-semibold text-navy underline">write to us</Link> — we reply within a business day.
        </p>

        <div className="mt-12 max-w-3xl space-y-12">
          {GROUPS.map((g) => (
            <section key={g.heading}>
              <h2 className="eyebrow mb-4">{g.heading}</h2>
              <Accordion items={g.items} defaultOpen={-1} />
            </section>
          ))}
        </div>

        <div className="mt-14 max-w-3xl border border-mist bg-cream p-8 text-center">
          <h2 className="font-display text-lg font-semibold uppercase tracking-wider2 text-navy">Still stuck?</h2>
          <p className="mt-2.5 text-[13.5px] text-slate">
            Call {BRAND.phone} during {BRAND.hoursShort}, or message us on WhatsApp.
          </p>
          <Link to="/contact" className="btn-primary mt-6">Contact us</Link>
        </div>
      </div>
    </>
  );
}
