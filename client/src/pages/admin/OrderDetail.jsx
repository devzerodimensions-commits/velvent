import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EditLayout, MetaBox, Notice, ScreenHeader, StatusPill } from '../../components/adminUi';
import { Seo } from '../../components/ui';
import { Box, ChevronRight, Truck } from '../../components/Icons';
import ShipDialog from './ShipDialog';
import { api } from '../../lib/api';
import { ADMIN_STATUS_LABEL, formatDate, formatDateTime, inr, ORDER_STATUS_KEYS } from '../../lib/format';
import { useToast } from '../../store/toast';

/**
 * One order, in full.
 *
 * The list is for finding an order; this is for dealing with it. Everything
 * someone needs while a customer is on the phone sits on one screen: what they
 * bought, where it goes, what was paid, where the parcel is, what they have
 * ordered before, and whatever the shop has written to itself about it.
 */
export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [shipping, setShipping] = useState(false);
  const { success } = useToast();

  const load = () => api.admin.order(id)
    .then((o) => { setOrder(o); setNote(o.admin_note || ''); })
    .catch((err) => setError(err.message));

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  const setStatus = async (status) => {
    setError(null);
    try {
      await api.admin.setOrderStatus(order.id, { status });
      await load();
      success(`Order marked ${ADMIN_STATUS_LABEL[status]?.toLowerCase() || status}.`);
    } catch (err) {
      setError(err.message);
    }
  };

  const saveNote = async () => {
    setSavingNote(true);
    setError(null);
    try {
      await api.admin.setOrderNote(order.id, note);
      success('Note saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingNote(false);
    }
  };

  if (error && !order) {
    return (
      <>
        <ScreenHeader title="Order" action="All orders" actionTo="/admin/orders" />
        <Notice tone="error">{error}</Notice>
      </>
    );
  }

  if (!order) return <p className="py-16 text-center text-[13px] text-adm-mute">Loading…</p>;

  const a = order.shipping_address || {};
  const items = order.items || [];
  const paid = order.payment_status === 'paid';

  return (
    <>
      <Seo title={`Order ${order.order_number}`} noindex />

      <div className="mb-4 flex items-center gap-1.5 text-[12.5px] text-adm-mute">
        <Link to="/admin/orders" className="hover:text-navy hover:underline">Orders</Link>
        <ChevronRight size={14} />
        <span className="text-adm-ink">{order.order_number}</span>
      </div>

      <ScreenHeader title={order.order_number}>
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill status={order.status} />
          <span className="text-[12.5px] text-adm-mute">Placed {formatDateTime(order.created_at)}</span>
          <span className={`ad-chip ${paid ? 'bg-ok-soft text-ok' : 'bg-warn-soft text-warn'}`}>
            {order.payment_method === 'cod' ? 'Cash on delivery' : 'Online'} · {order.payment_status}
          </span>
        </div>
        {error && <div className="mt-3"><Notice tone="error" onDismiss={() => setError(null)}>{error}</Notice></div>}
      </ScreenHeader>

      <EditLayout
        main={(
          <>
            <MetaBox title={`Items (${items.length})`}>
              <ul className="divide-y divide-adm-line">
                {items.map((i) => (
                  <li key={i.id} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                    <img src={i.image_url} alt="" className="h-20 w-16 shrink-0 rounded-lg border border-adm-line bg-adm-soft object-cover" />
                    <div className="min-w-0 flex-1">
                      {i.slug
                        ? <Link to={`/product/${i.slug}`} target="_blank" rel="noreferrer" className="text-[13.5px] font-semibold text-adm-ink hover:underline">{i.name}</Link>
                        : <span className="text-[13.5px] font-semibold text-adm-ink">{i.name}</span>}
                      <p className="mt-1 text-[12px] text-adm-mute">{i.color} · Size {i.size}</p>
                      <p className="mt-0.5 text-[12px] text-adm-mute">{inr(i.unit_price)} × {i.quantity}</p>
                    </div>
                    <span className="text-[13.5px] font-semibold text-adm-ink">{inr(i.unit_price * i.quantity)}</span>
                  </li>
                ))}
              </ul>

              <dl className="mt-4 space-y-2 border-t border-adm-line pt-4 text-[13px]">
                <div className="flex justify-between"><dt className="text-adm-mute">Subtotal</dt><dd>{inr(order.subtotal)}</dd></div>
                {Number(order.discount) > 0 && (
                  <div className="flex justify-between text-ok">
                    <dt>Discount{order.coupon_code ? ` (${order.coupon_code})` : ''}</dt>
                    <dd>− {inr(order.discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-adm-mute">Shipping</dt>
                  <dd>{Number(order.shipping) === 0 ? 'Free' : inr(order.shipping)}</dd>
                </div>
                <div className="flex justify-between border-t border-adm-line pt-2 text-[15px] font-semibold text-adm-ink">
                  <dt>Total</dt><dd>{inr(order.total)}</dd>
                </div>
              </dl>
            </MetaBox>

            <MetaBox title="Internal note">
              <textarea
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Anything the shop needs to remember about this order. The customer never sees this."
                className="ad-textarea"
              />
              <button type="button" onClick={saveNote} disabled={savingNote} className="ad-btn-ghost mt-3">
                {savingNote ? 'Saving…' : 'Save note'}
              </button>
            </MetaBox>

            {order.customerHistory?.length > 0 && (
              <MetaBox title={`Earlier orders from ${order.email}`} defaultOpen={false}>
                <ul className="divide-y divide-adm-line">
                  {order.customerHistory.map((h) => (
                    <li key={h.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                      <Link to={`/admin/orders/${h.id}`} className="text-[13px] font-medium text-adm-ink hover:underline">
                        {h.order_number}
                      </Link>
                      <span className="flex items-center gap-3">
                        <span className="text-[12px] text-adm-mute">{formatDate(h.created_at)}</span>
                        <StatusPill status={h.status} />
                        <span className="text-[13px] font-semibold text-adm-ink">{inr(h.total)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </MetaBox>
            )}
          </>
        )}
        side={(
          <>
            <MetaBox title="Status">
              <label className="ad-label mb-1.5 block" htmlFor="od-status">Order status</label>
              <select
                id="od-status"
                value={order.status}
                onChange={(e) => setStatus(e.target.value)}
                className="ad-select w-full"
              >
                {ORDER_STATUS_KEYS.map((k) => <option key={k} value={k}>{ADMIN_STATUS_LABEL[k]}</option>)}
              </select>
              <p className="mt-2 text-[11.5px] leading-relaxed text-adm-mute">
                Cancelling or refunding returns the stock automatically.
              </p>
            </MetaBox>

            <MetaBox title="Shipping">
              {order.tracking_number ? (
                <>
                  <p className="text-[13px] font-semibold text-adm-ink">{order.carrier || 'Courier'}</p>
                  <p className="mt-1 break-all font-mono text-[12px] text-adm-mute">{order.tracking_number}</p>
                  {order.shipped_at && (
                    <p className="mt-1.5 text-[12px] text-adm-mute">Dispatched {formatDateTime(order.shipped_at)}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {order.tracking_url && (
                      <a href={order.tracking_url} target="_blank" rel="noreferrer" className="ad-btn-ghost ad-btn-sm">Track</a>
                    )}
                    <button type="button" onClick={() => setShipping(true)} className="ad-btn-ghost ad-btn-sm">Edit</button>
                  </div>
                </>
              ) : (
                <>
                  <p className="mb-3 text-[12.5px] leading-relaxed text-adm-mute">
                    Not dispatched yet.
                  </p>
                  <button type="button" onClick={() => setShipping(true)} className="ad-btn-primary">
                    <Truck size={15} /> Mark as shipped
                  </button>
                </>
              )}
            </MetaBox>

            <MetaBox title="Customer">
              <p className="text-[13px] font-semibold text-adm-ink">{a.full_name}</p>
              <p className="mt-1 break-all text-[12.5px] text-adm-mute">{order.email}</p>
              <p className="mt-0.5 text-[12.5px] text-adm-mute">{order.phone}</p>

              <h3 className="mt-4 text-[11px] font-bold uppercase tracking-[0.08em] text-adm-mute">Delivering to</h3>
              <address className="mt-1.5 text-[12.5px] not-italic leading-relaxed text-adm-ink">
                {a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />
                {a.city}, {a.state} {a.pincode}
              </address>

              {order.notes && (
                <>
                  <h3 className="mt-4 text-[11px] font-bold uppercase tracking-[0.08em] text-adm-mute">Their note</h3>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-adm-ink">{order.notes}</p>
                </>
              )}

              <Link to={`/admin/orders?q=${encodeURIComponent(order.email)}`} className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-navy hover:underline">
                <Box size={14} /> All orders from this email
              </Link>
            </MetaBox>
          </>
        )}
      />

      {shipping && (
        <ShipDialog
          order={order}
          onClose={() => setShipping(false)}
          onDone={() => { setShipping(false); load(); }}
        />
      )}
    </>
  );
}
