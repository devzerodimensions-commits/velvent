import { useEffect, useMemo, useState } from 'react';
import { Seo } from '../../components/ui';
import { Close, Search } from '../../components/Icons';
import {
  Cell, ListTable, Notice, RowActions, ScreenHeader, SubsubsubNav,
} from '../../components/adminUi';
import { api } from '../../lib/api';
import { ADMIN_STATUS_LABEL, formatDate, formatDateTime, inr, ORDER_STATUS_KEYS } from '../../lib/format';
import { useToast } from '../../store/toast';

const COLUMNS = [
  { key: 'order', label: 'Order' },
  { key: 'date', label: 'Date', className: 'hidden md:table-cell w-36' },
  { key: 'status', label: 'Status', className: 'w-36' },
  { key: 'ship', label: 'Ship to', className: 'hidden lg:table-cell' },
  { key: 'total', label: 'Total', className: 'w-36' },
  { key: 'actions', label: 'Actions', className: 'w-28' },
];

const BULK = ORDER_STATUS_KEYS.map((s) => ({
  value: s,
  label: `Change status to ${ADMIN_STATUS_LABEL[s].toLowerCase()}`,
}));

/** WooCommerce's order preview — the modal behind the eye icon. */
function Preview({ order, onClose }) {
  const a = order.shipping_address || {};
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy-deep/50 p-4 sm:p-8">
      <button className="fixed inset-0 cursor-default" aria-label="Close preview" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={`Order ${order.order_number}`} className="relative w-full max-w-2xl ad-card">
        <header className="flex items-center justify-between border-b border-adm-line px-5 py-3">
          <h2 className="text-[14px] font-semibold text-navy">Order {order.order_number}</h2>
          <button onClick={onClose} aria-label="Close" className="p-1 text-adm-mute transition hover:text-navy">
            <Close size={18} />
          </button>
        </header>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-adm-mute">Billing</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-navy">
                {a.full_name}<br />{order.email}<br />{order.phone}
              </p>
              <p className="mt-2 text-[12px] text-adm-mute">
                Payment: {order.payment_method === 'cod' ? 'Cash on delivery' : 'Online'} · {order.payment_status}
              </p>
            </div>
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-adm-mute">Ship to</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-navy">
                {a.full_name}<br />{a.line1}{a.line2 ? <>, {a.line2}</> : null}<br />
                {a.city}, {a.state} {a.pincode}
              </p>
            </div>
          </div>

          {order.notes && (
            <p className="mt-4 border-l-2 border-adm-line bg-adm-soft px-3 py-2 text-[12.5px] text-adm-mute">
              <span className="font-semibold text-navy">Customer note:</span> {order.notes}
            </p>
          )}

          <table className="mt-5 w-full border border-adm-line text-left text-[13px]">
            <thead>
              <tr className="border-b border-adm-line bg-adm-soft text-[12px] text-navy">
                <th scope="col" className="px-3 py-2 font-semibold">Item</th>
                <th scope="col" className="px-3 py-2 font-semibold">Qty</th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((i) => (
                <tr key={i.id} className="border-b border-adm-line last:border-0">
                  <td className="px-3 py-2">
                    <span className="font-medium text-navy">{i.name}</span>
                    <span className="block text-[11.5px] text-adm-mute">{i.color} / {i.size}</span>
                  </td>
                  <td className="px-3 py-2 text-adm-mute">× {i.quantity}</td>
                  <td className="px-3 py-2 text-right font-medium text-navy">{inr(i.unit_price * i.quantity)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-adm-line bg-adm-soft text-[12.5px]">
              <tr><td className="px-3 py-1.5 text-adm-mute" colSpan={2}>Subtotal</td><td className="px-3 py-1.5 text-right">{inr(order.subtotal)}</td></tr>
              {Number(order.discount) > 0 && (
                <tr><td className="px-3 py-1.5 text-adm-mute" colSpan={2}>Discount {order.coupon_code && `(${order.coupon_code})`}</td><td className="px-3 py-1.5 text-right text-sale">−{inr(order.discount)}</td></tr>
              )}
              <tr><td className="px-3 py-1.5 text-adm-mute" colSpan={2}>Shipping</td><td className="px-3 py-1.5 text-right">{Number(order.shipping) === 0 ? 'Free' : inr(order.shipping)}</td></tr>
              <tr className="font-semibold text-navy"><td className="px-3 py-2" colSpan={2}>Total</td><td className="px-3 py-2 text-right">{inr(order.total)}</td></tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrders() {
  const [rows, setRows] = useState(null);
  const [view, setView] = useState('');
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState(null);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);
  const { success, error: toastError } = useToast();

  const load = () => api.admin.orders().then(setRows).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const all = rows || [];

  const counts = useMemo(() => {
    const c = { '': all.length };
    for (const s of ORDER_STATUS_KEYS) c[s] = all.filter((o) => o.status === s).length;
    return c;
  }, [all]);

  const visible = useMemo(() => all.filter((o) => {
    if (view && o.status !== view) return false;
    if (search) {
      const hay = `${o.order_number} ${o.email} ${o.phone} ${o.shipping_address?.full_name || ''}`.toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    return true;
  }), [all, view, search]);

  const setStatus = async (order, status) => {
    try {
      await api.admin.setOrderStatus(order.id, { status });
      success(`${order.order_number} → ${ADMIN_STATUS_LABEL[status]}.`);
      load();
    } catch (err) { toastError(err.message); }
  };

  const runBulk = async (status, ids) => {
    try {
      await Promise.all(ids.map((id) => api.admin.setOrderStatus(id, { status })));
      setNotice({ tone: 'success', text: `${ids.length} order${ids.length === 1 ? '' : 's'} moved to ${ADMIN_STATUS_LABEL[status]}.` });
      load();
    } catch (err) { toastError(err.message); }
  };

  if (error) return <Notice tone="error">{error}</Notice>;

  // Only the statuses worth showing as tabs — an empty bucket is noise.
  const views = [
    { value: '', label: 'All', count: counts[''] },
    ...ORDER_STATUS_KEYS.filter((s) => counts[s] > 0 || s === view)
      .map((s) => ({ value: s, label: ADMIN_STATUS_LABEL[s], count: counts[s] })),
  ];

  return (
    <>
      <Seo title="Orders" noindex />
      <ScreenHeader title="Orders">
        {notice && <Notice tone={notice.tone} onDismiss={() => setNotice(null)}>{notice.text}</Notice>}
      </ScreenHeader>

      <SubsubsubNav views={views} current={view} onChange={setView} />

      <ListTable
        columns={COLUMNS}
        rows={visible}
        loading={rows === null}
        bulkActions={BULK}
        onBulkAction={runBulk}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search orders"
        total={visible.length}
        empty="No orders found."
        renderRow={(o) => (
          <>
            <Cell primary>
              <button
                type="button"
                onClick={() => setPreview(o)}
                className="font-semibold text-navy hover:underline"
              >
                {o.order_number}
              </button>
              <span className="text-adm-mute"> — {o.shipping_address?.full_name || o.email}</span>
              <RowActions
                actions={[
                  { label: 'Preview', onClick: () => setPreview(o) },
                  o.status !== 'completed' && { label: 'Mark completed', onClick: () => setStatus(o, 'completed') },
                  o.status !== 'cancelled' && { label: 'Cancel', onClick: () => setStatus(o, 'cancelled'), danger: true },
                ]}
              />
            </Cell>
            <Cell className="hidden md:table-cell">
              <span title={formatDateTime(o.created_at)}>{formatDate(o.created_at)}</span>
            </Cell>
            <Cell>
              <label className="sr-only" htmlFor={`st-${o.id}`}>Status for {o.order_number}</label>
              <select
                id={`st-${o.id}`}
                value={o.status}
                onChange={(e) => setStatus(o, e.target.value)}
                className="ad-select w-full text-[12px]"
              >
                {ORDER_STATUS_KEYS.map((s) => (
                  <option key={s} value={s}>{ADMIN_STATUS_LABEL[s]}</option>
                ))}
              </select>
            </Cell>
            <Cell className="hidden lg:table-cell">
              <span className="text-[12.5px]">
                {o.shipping_address?.city}, {o.shipping_address?.state} {o.shipping_address?.pincode}
              </span>
            </Cell>
            <Cell>
              <span className="font-semibold text-navy">{inr(o.total)}</span>
              <span className="block text-[11.5px] text-adm-mute">
                {o.payment_method === 'cod' ? 'COD' : 'Online'} · {o.payment_status}
              </span>
            </Cell>
            <Cell>
              <button
                type="button"
                onClick={() => setPreview(o)}
                aria-label={`Preview ${o.order_number}`}
                className="ad-page-btn"
              >
                <Search size={14} />
              </button>
            </Cell>
          </>
        )}
      />

      {preview && <Preview order={preview} onClose={() => setPreview(null)} />}
    </>
  );
}
