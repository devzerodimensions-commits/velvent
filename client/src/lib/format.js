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

export const STATUS_LABEL = {
  placed: 'Order placed',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const STATUS_TONE = {
  placed: 'bg-cream-deep text-navy',
  confirmed: 'bg-navy/10 text-navy',
  shipped: 'bg-blue-100 text-blue-900',
  delivered: 'bg-emerald-100 text-emerald-900',
  cancelled: 'bg-rose-100 text-rose-900',
};
