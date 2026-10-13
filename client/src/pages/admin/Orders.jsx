import { useEffect, useState } from 'react';
import { Alert, Seo, Spinner } from '../../components/ui';
import { ChevronDown } from '../../components/Icons';
import { api } from '../../lib/api';
import { formatDateTime, inr, STATUS_LABEL, STATUS_TONE } from '../../lib/format';
import { useToast } from '../../store/toast';

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'placed', label: 'New' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const NEXT = { placed: 'confirmed', confirmed: 'shipped', shipped: 'delivered' };

function Row({ order, onChange }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { success, error } = useToast();
  const a = order.shipping_address || {};

  const update = async (patch) => {
    setBusy(true);
    try {
      await api.admin.setOrderStatus(order.id, patch);
      success('Order updated.');
      onChange();
    } catch (err) { error(err.message); }
    finally { setBusy(false); }
  };

  return (
    <>
      <tr className="cursor-pointer hover:bg-cream/40" onClick={() => setOpen((v) => !v)}>
        <td className="px-4 py-3">
          <span className="flex items-center gap-2">
            <ChevronDown size={15} className={`text-slate transition-transform ${open ? 'rotate-180' : ''}`} />
            <span className="font-medium text-navy">{order.order_number}</span>
          </span>
        </td>
        <td className="px-4 py-3">
          <span className="block text-navy">{a.full_name}</span>
          <span className="text-[11px] text-slate">{order.email}</span>
        </td>
        <td className="px-4 py-3 text-slate">{order.items?.length || 0}</td>
        <td className="px-4 py-3 font-semibold text-navy">{inr(order.total)}</td>
        <td className="px-4 py-3 text-slate">
          {order.payment_method === 'cod' ? 'COD' : 'Online'}
          <span className={`ml-1.5 text-[11px] ${order.payment_status === 'paid' ? 'text-emerald-700' : 'text-slate'}`}>
            {order.payment_status}
          </span>
        </td>
        <td className="px-4 py-3">
          <span className={`px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider ${STATUS_TONE[order.status]}`}>
            {STATUS_LABEL[order.status]}
          </span>
        </td>
        <td className="px-4 py-3 text-[11.5px] text-slate">{formatDateTime(order.created_at)}</td>
      </tr>

      {open && (
        <tr>
          <td colSpan={7} className="bg-cream/40 px-4 py-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
              <div>
                <h3 className="text-[10.5px] font-semibold uppercase tracking-wider2 text-slate">Items</h3>
                <ul className="mt-3 divide-y divide-mist border-y border-mist bg-white">
                  {(order.items || []).map((i) => (
                    <li key={i.id} className="flex items-center gap-3 px-3 py-2.5">
                      <img src={i.image_url} alt="" className="h-14 w-11 shrink-0 bg-cream object-cover" loading="lazy" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-medium text-navy">{i.name}</span>
                        <span className="text-[11px] text-slate">{i.color} · {i.size} · Qty {i.quantity}</span>
                      </span>
                      <span className="text-[12.5px] font-semibold">{inr(i.unit_price * i.quantity)}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex flex-wrap gap-2">
                  {NEXT[order.status] && (
                    <button disabled={busy} onClick={() => update({ status: NEXT[order.status] })} className="btn-primary btn-sm">
                      Mark {STATUS_LABEL[NEXT[order.status]].toLowerCase()}
                    </button>
                  )}
                  {order.payment_status !== 'paid' && order.status !== 'cancelled' && (
                    <button disabled={busy} onClick={() => update({ payment_status: 'paid' })} className="btn-outline btn-sm">
                      Mark payment received
                    </button>
                  )}
                  {order.status !== 'cancelled' && order.status !== 'delivered' && (
                    <button disabled={busy} onClick={() => update({ status: 'cancelled' })} className="btn-sm btn border border-mist text-sale hover:border-sale">
                      Cancel order
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white p-4">
                <h3 className="text-[10.5px] font-semibold uppercase tracking-wider2 text-slate">Ship to</h3>
                <address className="mt-2.5 text-[12.5px] not-italic leading-relaxed text-slate">
                  <strong className="block text-navy">{a.full_name}</strong>
                  {a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />
                  {a.city}, {a.state} {a.pincode}<br />
                  {order.phone}
                </address>
                {order.notes && (
                  <p className="mt-3 border-t border-mist pt-3 text-[12px] text-slate">Note: {order.notes}</p>
                )}
                <dl className="mt-3 space-y-1 border-t border-mist pt-3 text-[12px]">
                  <div className="flex justify-between"><dt className="text-slate">Subtotal</dt><dd>{inr(order.subtotal)}</dd></div>
                  {Number(order.discount) > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <dt>Discount {order.coupon_code}</dt><dd>− {inr(order.discount)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between"><dt className="text-slate">Shipping</dt><dd>{inr(order.shipping)}</dd></div>
                  <div className="flex justify-between font-semibold text-navy"><dt>Total</dt><dd>{inr(order.total)}</dd></div>
                </dl>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);

  const load = (s = status) => api.admin.orders(s || undefined).then(setOrders).catch((e) => setError(e.message));
  useEffect(() => { load(status); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [status]);

  if (error) return <Alert>{error}</Alert>;

  return (
    <>
      <Seo title="Admin — Orders" noindex />
      <h1 className="font-display text-xl font-semibold uppercase tracking-wider2 text-navy">Orders</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
            aria-pressed={status === f.value}
            className={`border px-4 py-2 text-[11.5px] font-semibold uppercase tracking-wider transition ${
              status === f.value ? 'border-navy bg-navy text-cream' : 'border-mist bg-white text-navy hover:border-navy'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!orders ? (
        <div className="py-20 text-center"><Spinner className="text-navy" /></div>
      ) : orders.length === 0 ? (
        <p className="mt-10 text-[13.5px] text-slate">No orders in this view.</p>
      ) : (
        <div className="mt-6 overflow-x-auto border border-mist bg-white">
          <table className="w-full min-w-[860px] text-[13px]">
            <thead className="bg-cream/60 text-[10.5px] uppercase tracking-wider2 text-slate">
              <tr>
                {['Order', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Placed'].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-mist">
              {orders.map((o) => <Row key={o.id} order={o} onChange={() => load(status)} />)}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
