import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Alert, PageLoader, Seo } from '../components/ui';
import { Box, Check, Close, Truck } from '../components/Icons';
import { api } from '../lib/api';
import { formatDateTime, inr, STATUS_LABEL, STATUS_TONE, TRACKING_STEPS } from '../lib/format';
import { useContent } from '../store/content';
import { Rich } from '../components/RichText';
import { useAuth } from '../store/auth';

const STEPS = TRACKING_STEPS;

/**
 * Offered once, just after an order goes through, to a shopper who checked out
 * as a guest: the one moment they have already typed everything an account
 * needs. Skip and close both mean no, and the answer is remembered against the
 * order number so a refresh does not ask again.
 */
function MemberInvite({ email, copy, onClose }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-navy-deep/60 animate-fade-in"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-invite-title"
        tabIndex={-1}
        className="relative w-full max-w-md bg-white p-6 shadow-2xl outline-none animate-fade-up sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 p-1.5 text-slate transition hover:text-navy"
        >
          <Close size={19} />
        </button>

        <p className="eyebrow">{copy.eyebrow}</p>
        <h2 id="member-invite-title" className="mt-2 font-display text-lg font-semibold uppercase tracking-wider2 text-navy">
          {copy.title}
        </h2>
        <p className="mt-3 text-[13.5px] leading-relaxed text-slate">
          <Rich>{String(copy.body || '').replace('{email}', email)}</Rich>
        </p>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <Link to="/register" state={{ email }} onClick={onClose} className="btn-primary flex-1">
            {copy.acceptLabel}
          </Link>
          <button type="button" onClick={onClose} className="btn-ghost flex-1">
            {copy.skipLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function OrderDetail({ order }) {
  const BRAND = useContent('brand');
  const checkoutCopy = useContent('checkout');
  const c = checkoutCopy.confirmed;
  const member = checkoutCopy.memberInvite;
  const stepIndex = STEPS.indexOf(order.status);
  const address = order.shipping_address || {};

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-14">
      <div>
        {order.status !== 'cancelled' && (
          <ol className="mb-10 grid grid-cols-4 gap-2">
            {STEPS.map((s, i) => (
              <li key={s} className="text-center">
                <div className="relative flex items-center justify-center">
                  {i > 0 && <span className={`absolute right-1/2 h-0.5 w-full ${i <= stepIndex ? 'bg-navy' : 'bg-mist'}`} />}
                  <span className={`relative grid h-9 w-9 place-items-center rounded-full border-2 ${
                    i <= stepIndex ? 'border-navy bg-navy text-cream' : 'border-mist bg-white text-mist'
                  }`}
                  >
                    {i < stepIndex ? <Check size={16} /> : <span className="text-[12px] font-bold">{i + 1}</span>}
                  </span>
                </div>
                <p className={`mt-2.5 text-[10.5px] font-semibold uppercase tracking-wider ${i <= stepIndex ? 'text-navy' : 'text-slate-light'}`}>
                  {STATUS_LABEL[s]}
                </p>
              </li>
            ))}
          </ol>
        )}

        <h2 className="text-[12px] font-semibold uppercase tracking-wider2">Items</h2>
        <ul className="mt-4 divide-y divide-mist border-y border-mist">
          {(order.items || []).map((i) => (
            <li key={i.id || `${i.variantId}-${i.size}`} className="flex gap-4 py-4">
              <img src={i.image_url || i.imageUrl} alt="" className="h-24 w-[72px] shrink-0 bg-cream object-cover" loading="lazy" />
              <div className="min-w-0 flex-1">
                {i.slug
                  ? <Link to={`/product/${i.slug}`} className="text-[13.5px] font-medium text-navy hover:underline">{i.name}</Link>
                  : <p className="text-[13.5px] font-medium text-navy">{i.name}</p>}
                <p className="mt-1 text-[12px] text-slate">{i.color} · Size {i.size}</p>
                <p className="mt-1 text-[12px] text-slate">Qty {i.quantity}</p>
              </div>
              <span className="text-[13.5px] font-semibold">{inr((i.unit_price || i.unitPrice) * i.quantity)}</span>
            </li>
          ))}
        </ul>
      </div>

      <aside className="space-y-6">
        <div className="card-surface p-6">
          <h2 className="text-[12px] font-semibold uppercase tracking-wider2">Summary</h2>
          <dl className="mt-5 space-y-3 text-[13.5px]">
            <div className="flex justify-between"><dt className="text-slate">Subtotal</dt><dd>{inr(order.subtotal)}</dd></div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-emerald-700">
                <dt>Discount{order.coupon_code ? ` (${order.coupon_code})` : ''}</dt>
                <dd>− {inr(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-slate">Shipping</dt>
              <dd>{Number(order.shipping) === 0 ? <span className="text-emerald-700">Free</span> : inr(order.shipping)}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-mist pt-4">
              <dt className="text-[12px] font-semibold uppercase tracking-wider2">Total</dt>
              <dd className="text-lg font-semibold">{inr(order.total)}</dd>
            </div>
          </dl>
          <p className="mt-4 border-t border-mist pt-4 text-[12.5px] text-slate">
            Payment: <strong className="text-navy">{order.payment_method === 'cod' ? 'Cash on Delivery' : 'Paid online'}</strong>
            {' · '}{order.payment_status}
          </p>
        </div>

        <div className="card-surface p-6">
          <h2 className="text-[12px] font-semibold uppercase tracking-wider2">Delivering to</h2>
          <address className="mt-4 text-[13.5px] not-italic leading-relaxed text-slate">
            <strong className="block text-navy">{address.full_name}</strong>
            {address.line1}{address.line2 ? `, ${address.line2}` : ''}<br />
            {address.city}, {address.state} {address.pincode}<br />
            {order.phone}<br />
            {order.email}
          </address>
          {order.notes && <p className="mt-4 border-t border-mist pt-4 text-[12.5px] text-slate">Note: {order.notes}</p>}
        </div>

        {/* Once there is a tracking number, that is the thing the customer
            came back for — it takes the place of the dispatch estimate rather
            than sitting underneath it. */}
        {order.tracking_number ? (
          <div className="card-surface p-6">
            <div className="flex items-start gap-3">
              <Truck size={20} className="mt-0.5 shrink-0 text-navy" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider2 text-slate">On its way</p>
                <p className="mt-1.5 text-[13.5px] font-semibold text-navy">
                  {order.carrier || 'Courier'}
                </p>
                <p className="mt-0.5 break-all font-mono text-[12.5px] text-slate">{order.tracking_number}</p>
                {order.shipped_at && (
                  <p className="mt-1.5 text-[12px] text-slate">Dispatched {formatDateTime(order.shipped_at)}</p>
                )}
              </div>
            </div>
            {order.tracking_url && (
              <a
                href={order.tracking_url}
                target="_blank"
                rel="noreferrer noopener"
                className="btn-primary mt-5 w-full"
              >
                Track this parcel
              </a>
            )}
          </div>
        ) : (
          <div className="card-surface flex items-start gap-3 p-6">
            <Truck size={20} className="mt-0.5 shrink-0 text-navy" />
            <p className="text-[12.5px] leading-relaxed text-slate">
              <Rich>{c.dispatchNote}</Rich>
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

export default function OrderConfirmed() {
  const { orderNumber } = useParams();
  const { state } = useLocation();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invite, setInvite] = useState(false);

  useEffect(() => {
    api.order(orderNumber, state?.email)
      .then(setOrder)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [orderNumber, state?.email]);

  /* Only after a payment goes through, only for a guest, and only once per
     order — it waits a moment so the confirmation lands first rather than
     being covered the instant it appears. */
  const inviteKey = order ? `velvent:member-invite:${order.order_number}` : null;

  const dismissInvite = useCallback(() => {
    setInvite(false);
    try { if (inviteKey) sessionStorage.setItem(inviteKey, '1'); } catch { /* private mode */ }
  }, [inviteKey]);

  useEffect(() => {
    if (!state?.justPlaced || user || !order || !inviteKey) return undefined;
    if (member?.enabled === false) return undefined;
    try { if (sessionStorage.getItem(inviteKey)) return undefined; } catch { /* private mode */ }
    const t = setTimeout(() => setInvite(true), 1400);
    return () => clearTimeout(t);
  }, [state?.justPlaced, user, order, inviteKey, member?.enabled]);

  if (loading) return <PageLoader />;

  if (error) {
    return (
      <div className="shell py-20">
        <Alert>{error}</Alert>
        <div className="mt-6 flex gap-3">
          <Link to="/track-order" className="btn-primary">Track an order</Link>
          <Link to="/" className="btn-outline">Back home</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Seo title={`Order ${order.order_number}`} noindex />
      <div className="shell py-10 sm:py-14">
        {state?.justPlaced && (
          <div className="mb-10 flex flex-col items-center border border-emerald-300 bg-emerald-50 px-6 py-10 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-600 text-white">
              <Check size={28} />
            </span>
            <h1 className="mt-5 font-display text-xl font-semibold uppercase tracking-wider2 text-emerald-900">
              {c.title}
            </h1>
            <p className="mt-2.5 max-w-md text-[13.5px] leading-relaxed text-emerald-800">
              <Rich>{String(c.body || '').replace('{email}', order.email)}</Rich>
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-mist pb-6">
          <div>
            <p className="eyebrow">Order number</p>
            <h2 className="mt-1.5 font-display text-xl font-semibold tracking-wide text-navy">{order.order_number}</h2>
            <p className="mt-1.5 text-[12.5px] text-slate">Placed {formatDateTime(order.created_at)}</p>
          </div>
          <span className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider2 ${STATUS_TONE[order.status]}`}>
            {STATUS_LABEL[order.status]}
          </span>
        </div>

        <div className="pt-10"><OrderDetail order={order} /></div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link to="/shop" className="btn-primary">{c.continueLabel}</Link>
          {user && <Link to="/account" className="btn-outline"><Box size={17} /> {c.ordersLabel}</Link>}
        </div>
      </div>

      {invite && <MemberInvite email={order.email} copy={member} onClose={dismissInvite} />}
    </>
  );
}
