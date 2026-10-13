import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Seo, Spinner } from '../../components/ui';
import { api } from '../../lib/api';
import { formatDate, inr, STATUS_LABEL, STATUS_TONE } from '../../lib/format';

function Stat({ label, value, sub }) {
  return (
    <div className="border border-mist bg-white p-5">
      <p className="text-[10.5px] font-semibold uppercase tracking-wider2 text-slate">{label}</p>
      <p className="mt-2.5 font-display text-2xl font-semibold text-navy">{value}</p>
      {sub && <p className="mt-1 text-[11.5px] text-slate">{sub}</p>}
    </div>
  );
}

/** 14-day revenue bars — plain SVG, no chart dependency. */
function RevenueChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.revenue));
  return (
    <div className="border border-mist bg-white p-5">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider2 text-slate">Revenue, last 14 days</h2>
      <div className="mt-6 flex h-40 items-end gap-1.5">
        {/* each column is h-full so the bar's percentage height has something to resolve against */}
        {data.map((d) => (
          <div key={d.day} className="group relative flex h-full flex-1 flex-col items-center justify-end">
            <span className="pointer-events-none absolute -top-7 whitespace-nowrap bg-navy px-2 py-1 text-[10px] text-cream opacity-0 transition group-hover:opacity-100">
              {inr(d.revenue)} · {d.orders} order{d.orders === 1 ? '' : 's'}
            </span>
            <div
              className="w-full bg-navy/80 transition group-hover:bg-navy"
              style={{ height: `${Math.max(2, (d.revenue / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex justify-between text-[10px] text-slate-light">
        <span>{data[0] && formatDate(data[0].day)}</span>
        <span>{data.at(-1) && formatDate(data.at(-1).day)}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.admin.stats().then(setStats).catch((e) => setError(e.message));
  }, []);

  if (error) return <Alert>{error}</Alert>;
  if (!stats) return <div className="py-20 text-center"><Spinner className="text-navy" /></div>;

  return (
    <>
      <Seo title="Admin — Dashboard" noindex />
      <h1 className="font-display text-xl font-semibold uppercase tracking-wider2 text-navy">Dashboard</h1>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Revenue" value={inr(stats.revenue)} sub="Excluding cancelled orders" />
        <Stat label="Orders" value={stats.orders.total} sub={`${stats.orders.week} in the last 7 days`} />
        <Stat label="Awaiting action" value={stats.orders.new_orders} sub="Newly placed, not yet confirmed" />
        <Stat label="Products" value={stats.products.active} sub={`${stats.products.total} total in catalog`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <RevenueChart data={stats.chart} />

        <div className="border border-mist bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider2 text-slate">Low stock</h2>
            <Link to="/admin/products" className="text-[11px] font-semibold text-navy hover:underline">Manage</Link>
          </div>
          {stats.lowStock.length === 0 ? (
            <p className="mt-6 text-[13px] text-slate">Everything is comfortably in stock.</p>
          ) : (
            <ul className="mt-4 divide-y divide-mist">
              {stats.lowStock.slice(0, 8).map((v) => (
                <li key={v.sku} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-[12.5px] font-medium text-navy">{v.name}</span>
                    <span className="text-[11px] text-slate">{v.color} · {v.size}</span>
                  </span>
                  <span className={`shrink-0 px-2 py-0.5 text-[11px] font-bold ${v.stock === 0 ? 'bg-sale/15 text-sale' : 'bg-amber-100 text-amber-800'}`}>
                    {v.stock}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 border border-mist bg-white">
        <div className="flex items-center justify-between border-b border-mist px-5 py-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider2 text-slate">Recent orders</h2>
          <Link to="/admin/orders" className="text-[11px] font-semibold text-navy hover:underline">View all</Link>
        </div>

        {stats.recentOrders.length === 0 ? (
          <p className="px-5 py-10 text-center text-[13px] text-slate">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-[13px]">
              <thead className="bg-cream/60 text-[10.5px] uppercase tracking-wider2 text-slate">
                <tr>
                  {['Order', 'Customer', 'Payment', 'Status', 'Total', 'Date'].map((h) => (
                    <th key={h} scope="col" className="px-5 py-3 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-mist">
                {stats.recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-cream/40">
                    <td className="px-5 py-3 font-medium text-navy">{o.order_number}</td>
                    <td className="px-5 py-3 text-slate">{o.email}</td>
                    <td className="px-5 py-3 text-slate">
                      {o.payment_method === 'cod' ? 'COD' : 'Online'} · {o.payment_status}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider ${STATUS_TONE[o.status]}`}>
                        {STATUS_LABEL[o.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-navy">{inr(o.total)}</td>
                    <td className="px-5 py-3 text-slate">{formatDate(o.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
