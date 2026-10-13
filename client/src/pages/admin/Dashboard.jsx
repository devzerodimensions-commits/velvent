import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Seo, Spinner } from '../../components/ui';
import { MetaBox, Notice, ScreenHeader, StatusPill } from '../../components/wp';
import { api } from '../../lib/api';
import { formatDate, inr } from '../../lib/format';

/** WooCommerce's row of store-performance figures. */
function Tile({ label, value, sub, to }) {
  const body = (
    <>
      <p className="text-[11.5px] font-medium text-slate">{label}</p>
      <p className="mt-1.5 font-display text-[26px] font-semibold leading-none text-navy">{value}</p>
      {sub && <p className="mt-1.5 text-[11.5px] text-slate">{sub}</p>}
    </>
  );
  return to ? (
    <Link to={to} className="block border border-mist bg-white p-4 transition hover:border-navy">{body}</Link>
  ) : (
    <div className="border border-mist bg-white p-4">{body}</div>
  );
}

/** 14-day revenue bars — plain SVG-free markup, no chart dependency. */
function RevenueChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.revenue));
  return (
    <>
      <div className="flex h-44 items-end gap-1.5">
        {/* each column is h-full so a bar's percentage height has something to resolve against */}
        {data.map((d) => (
          <div key={d.day} className="group relative flex h-full flex-1 flex-col items-center justify-end">
            <span className="pointer-events-none absolute -top-7 z-10 whitespace-nowrap bg-navy px-2 py-1 text-[10px] text-cream opacity-0 transition group-hover:opacity-100">
              {inr(d.revenue)} · {d.orders} order{d.orders === 1 ? '' : 's'}
            </span>
            <div
              className="w-full bg-navy/80 transition group-hover:bg-navy"
              style={{ height: `${Math.max(2, (d.revenue / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex justify-between text-[10.5px] text-slate-light">
        <span>{data[0] && formatDate(data[0].day)}</span>
        <span>{data.at(-1) && formatDate(data.at(-1).day)}</span>
      </div>
    </>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { api.admin.stats().then(setStats).catch((e) => setError(e.message)); }, []);

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!stats) return <div className="py-20 text-center"><Spinner className="text-navy" /></div>;

  const outOfStock = stats.lowStock.filter((v) => v.stock === 0).length;

  return (
    <>
      <Seo title="Dashboard" noindex />
      <ScreenHeader title="Dashboard">
        {stats.orders.new_orders > 0 && (
          <Notice tone="warning">
            You have <strong>{stats.orders.new_orders}</strong> order
            {stats.orders.new_orders === 1 ? '' : 's'} waiting to be processed.{' '}
            <Link to="/admin/orders" className="font-semibold underline">Go to Orders</Link>
          </Notice>
        )}
      </ScreenHeader>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tile label="Net sales" value={inr(stats.revenue)} sub="Excludes cancelled, refunded and failed" />
        <Tile label="Orders" value={stats.orders.total} sub={`${stats.orders.week} in the last 7 days`} to="/admin/orders" />
        <Tile label="Awaiting action" value={stats.orders.new_orders} sub="Pending, processing or on hold" to="/admin/orders" />
        <Tile label="Products" value={stats.products.total} sub={`${stats.products.active} published`} to="/admin/products" />
      </div>

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <MetaBox title="Revenue — last 14 days">
            <RevenueChart data={stats.chart} />
          </MetaBox>

          <MetaBox title="Recent orders">
            {stats.recentOrders.length === 0 ? (
              <p className="text-[13px] text-slate">No orders yet.</p>
            ) : (
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-mist text-[12px] text-navy">
                    <th scope="col" className="py-2 font-semibold">Order</th>
                    <th scope="col" className="py-2 font-semibold">Status</th>
                    <th scope="col" className="py-2 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((o) => (
                    <tr key={o.id} className="border-b border-mist/60 last:border-0">
                      <td className="py-2">
                        <Link to="/admin/orders" className="font-medium text-navy hover:underline">{o.order_number}</Link>
                        <span className="block text-[11.5px] text-slate">{o.email}</span>
                      </td>
                      <td className="py-2"><StatusPill status={o.status} /></td>
                      <td className="py-2 text-right font-medium text-navy">{inr(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </MetaBox>
        </div>

        <div className="space-y-4">
          <MetaBox title="At a glance">
            <ul className="space-y-2 text-[13px] text-slate">
              <li><Link to="/admin/products" className="text-navy hover:underline">{stats.products.total} products</Link>, {stats.products.active} published</li>
              <li><Link to="/admin/orders" className="text-navy hover:underline">{stats.orders.total} orders</Link> all time</li>
              {outOfStock > 0 && <li className="text-sale">{outOfStock} variant{outOfStock === 1 ? '' : 's'} out of stock</li>}
            </ul>
          </MetaBox>

          <MetaBox title={`Low in stock (${stats.lowStock.length})`}>
            {stats.lowStock.length === 0 ? (
              <p className="text-[13px] text-slate">Nothing is running low.</p>
            ) : (
              <ul className="divide-y divide-mist/70 text-[12.5px]">
                {stats.lowStock.map((v) => (
                  <li key={v.sku} className="flex items-center justify-between gap-3 py-2">
                    <span className="min-w-0">
                      <span className="block truncate text-navy">{v.name}</span>
                      <span className="text-[11.5px] text-slate">{v.color} / {v.size}</span>
                    </span>
                    <span className={`shrink-0 font-semibold ${v.stock === 0 ? 'text-sale' : 'text-amber-700'}`}>
                      {v.stock === 0 ? 'Out' : `${v.stock} left`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </MetaBox>
        </div>
      </div>
    </>
  );
}
