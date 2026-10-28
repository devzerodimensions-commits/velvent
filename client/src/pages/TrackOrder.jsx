import { useState } from 'react';
import { Alert, Breadcrumbs, Seo, Spinner } from '../components/ui';
import { Box } from '../components/Icons';
import { OrderDetail } from './OrderConfirmed';
import { api } from '../lib/api';
import { formatDateTime, STATUS_LABEL, STATUS_TONE } from '../lib/format';
import { useContent } from '../store/content';

export default function TrackOrder() {
  const BRAND = useContent('brand');
  const [form, setForm] = useState({ orderNumber: '', email: '' });
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOrder(null);
    try {
      setOrder(await api.order(form.orderNumber.trim().toUpperCase(), form.email.trim()));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Seo title="Track Your Order" description="Enter your VELVENT order number and email to see where your parcel is." />
      <div className="shell py-8 sm:py-11">
        <Breadcrumbs items={[{ label: 'Track Order' }]} />
        <h1 className="h-section mt-4">Track Your Order</h1>
        <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-slate">
          Enter the order number from your confirmation email, along with the email address
          you used at checkout.
        </p>

        <form onSubmit={submit} className="card-surface mt-8 max-w-xl p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="tr-num">Order number</label>
              <input
                id="tr-num"
                required
                placeholder="VLV-20261009-A1B2C"
                value={form.orderNumber}
                onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}
                className="field uppercase"
              />
            </div>
            <div>
              <label className="label" htmlFor="tr-email">Email address</label>
              <input
                id="tr-email"
                type="email"
                required
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="field"
              />
            </div>
          </div>
          <button type="submit" disabled={busy} className="btn-primary mt-5 w-full sm:w-auto">
            {busy ? <><Spinner size={16} /> Looking…</> : <><Box size={17} /> Find my order</>}
          </button>
        </form>

        {error && <div className="mt-6 max-w-xl"><Alert>{error}</Alert></div>}

        {order && (
          <div className="mt-12">
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
          </div>
        )}

        <p className="mt-10 text-[13px] text-slate">
          Cannot find your order? Call us on{' '}
          <a href={`tel:${BRAND.phoneRaw}`} className="font-semibold text-navy underline">{BRAND.phone}</a>{' '}
          during {BRAND.hoursShort}.
        </p>
      </div>
    </>
  );
}
