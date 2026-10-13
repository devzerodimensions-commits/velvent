export const inr = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(Number(n) || 0);

export const discountPct = (mrp, sale) => {
  const m = Number(mrp); const s = Number(sale);
  if (!m || s >= m) return 0;
  return Math.round(((m - s) / m) * 100);
};

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });

/** Rough promise date shown on the product page. */
export const deliveryEstimate = () => {
  const from = new Date(Date.now() + 3 * 864e5);
  const to = new Date(Date.now() + 6 * 864e5);
  const fmt = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return `${fmt(from)} – ${fmt(to)}`;
};

export const SIZE_ORDER = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
export const bySize = (a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b);

/*
 * Order statuses follow WooCommerce's seven, plus "shipped" — Woo has no such
 * status, but a clothing customer needs to know the parcel left, and adding one
 * is standard practice in Woo stores. Keep this in step with
 * server/src/lib/orderStatus.js.
 */

/** What the shop owner sees in the admin, in WooCommerce's own wording. */
export const ADMIN_STATUS_LABEL = {
  pending: 'Pending payment',
  processing: 'Processing',
  'on-hold': 'On hold',
  shipped: 'Shipped',
  completed: 'Completed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  failed: 'Failed',
};

/** What the customer sees. "Processing" means little to a shopper. */
export const STATUS_LABEL = {
  pending: 'Awaiting payment',
  processing: 'Confirmed',
  'on-hold': 'On hold',
  shipped: 'Shipped',
  completed: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  failed: 'Payment failed',
};

export const STATUS_TONE = {
  pending: 'bg-cream-deep text-slate',
  processing: 'bg-navy/10 text-navy',
  'on-hold': 'bg-amber-100 text-amber-900',
  shipped: 'bg-blue-100 text-blue-900',
  completed: 'bg-emerald-100 text-emerald-900',
  cancelled: 'bg-mist/60 text-slate',
  refunded: 'bg-slate/15 text-slate',
  failed: 'bg-rose-100 text-rose-900',
};

export const ORDER_STATUS_KEYS = Object.keys(ADMIN_STATUS_LABEL);

/** The happy path a parcel walks, for the customer's tracking timeline. */
export const TRACKING_STEPS = ['pending', 'processing', 'shipped', 'completed'];

/** Statuses a customer may still cancel from. Mirrors the server. */
export const CANCELLABLE = ['pending', 'processing', 'on-hold'];
