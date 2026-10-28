import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Seo, Spinner } from '../../components/ui';
import { MetaBox, Notice, ScreenHeader, StatusPill } from '../../components/adminUi';
import { Box, Grid, Mail, Rupee, User } from '../../components/Icons';
import { api } from '../../lib/api';
import { formatDate, inr } from '../../lib/format';

/* A headline figure with its icon, sitting on its own card. */
function Tile({ label, value, sub, to, Icon, tone = 'navy' }) {
  const tones = {
    navy: 'bg-navy/10 text-navy',
    ok: 'bg-ok-soft text-ok',
    warn: 'bg-warn-soft text-warn',
    info: 'bg-info-soft text-info',
  };

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-medium text-adm-mute">{label}</p>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tones[tone]}`}>
          <Icon size={17} />
        </span>
      </div>
      <p className="mt-2 font-heading text-[28px] font-semibold leading-none text-adm-ink">{value}</p>
      {sub && <p className="mt-2 text-[11.5px] leading-relaxed text-adm-mute">{sub}</p>}
    </>
  );

  return to
    ? <Link to={to} className="ad-card block p-4 transition hover:border-slate-light hover:shadow-pop">{body}</Link>
    : <div className="ad-card p-4">{body}</div>;
}

/** 14 days of revenue as bars, with a gridline for scale. No chart library. */
function RevenueChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.revenue));
  const total = data.reduce((s, d) => s + Number(d.revenue), 0);

  return (
    <>
      <p className="mb-4 font-heading text-[22px] font-semibold leading-none text-adm-ink">
        {inr(total)}
        <span className="ml-2 text-[12px] font-medium text-adm-mute">in the last 14 days</span>
      </p>

      <div className="relative h-44">
        {/* three gridlines, so a bar's height can be read rather than guessed */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2].map((i) => <span key={i} className="border-t border-dashed border-adm-line" />)}
        </div>

        <div className="relative flex h-full items-end gap-1.5">
          {data.map((d) => (
            <div key={d.day} className="group relative flex h-full flex-1 flex-col items-center justify-end">
              <span className="pointer-events-none absolute -top-8 z-10 whitespace-nowrap rounded-lg bg-adm-ink px-2 py-1 text-[10.5px] text-white opacity-0 shadow-pop transition group-hover:opacity-100">
                {inr(d.revenue)} · {d.orders} order{d.orders === 1 ? '' : 's'}
              </span>
              <div
                className="w-full rounded-t-[3px] bg-navy/75 transition group-hover:bg-navy"
                style={{ height: `${Math.max(2, (d.revenue / max) * 100)}%` }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2.5 flex justify-between text-[11px] text-slate-light">
        <span>{data[0] && formatDate(data[0].day)}</span>
        <span>{data.at(-1) && formatDate(data.at(-1).day)}</span>
      </div>
    </>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [extra, setExtra] = useState({ customers: null, unread: null });
  const [error, setError] = useState(null);

  useEffect(() => {
    api.admin.stats().then(setStats).catch((e) => setError(e.message));

    /* Two counts the stats endpoint does not carry. They are decoration, so a
       failure here leaves the tile blank rather than breaking the page. */
    Promise.all([
      api.admin.customers().catch(() => null),
      api.admin.messages().catch(() => null),
    ]).then(([customers, messages]) => setExtra({
      customers: Array.isArray(customers) ? customers.length : null,
      unread: Array.isArray(messages) ? messages.filter((m) => !m.is_read).length : null,
    }));
  }, []);

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!stats) return <div className="py-24 text-center"><Spinner className="text-navy" /></div>;

  const outOfStock = stats.lowStock.filter((v) => v.stock === 0).length;

  return (
    <>
      <Seo title="Dashboard" noindex />
      <ScreenHeader title="Dashboard">
        {stats.orders.new_orders > 0 && (
          <Notice tone="warning">
            <strong>{stats.orders.new_orders}</strong> order{stats.orders.new_orders === 1 ? '' : 's'} waiting
            to be processed. <Link to="/admin/orders">Go to orders</Link>
          </Notice>
        )}
      </ScreenHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile
          label="Net sales"
          value={inr(stats.revenue)}
          sub="Excludes cancelled, refunded and failed"
          Icon={Rupee}
          tone="ok"
        />
        <Tile
          label="Orders"
          value={stats.orders.total}
          sub={`${stats.orders.week} in the last 7 days`}
          to="/admin/orders"
          Icon={Box}
        />
        <Tile
          label="Awaiting action"
          value={stats.orders.new_orders}
          sub="Pending, processing or on hold"
          to="/admin/orders"
          Icon={Box}
          tone={stats.orders.new_orders > 0 ? 'warn' : 'navy'}
        />
        <Tile
          label="Customers"
          value={extra.customers ?? '—'}
          sub="Registered accounts"
          to="/admin/customers"
          Icon={User}
          tone="info"
        />
      </div>

      <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <MetaBox title="Revenue">
            <RevenueChart data={stats.chart} />
          </MetaBox>

          <MetaBox
            title="Recent orders"
            actions={<Link to="/admin/orders" className="text-[12px] font-medium text-navy hover:underline">View all</Link>}
          >
            {stats.recentOrders.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-adm-mute">No orders yet.</p>
            ) : (
              <ul className="divide-y divide-adm-line">
                {stats.recentOrders.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="min-w-0">
                      <Link to="/admin/orders" className="text-[13px] font-semibold text-adm-ink hover:underline">
                        {o.order_number}
                      </Link>
                      <span className="mt-0.5 block truncate text-[11.5px] text-adm-mute">{o.email}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <StatusPill status={o.status} />
                      <span className="text-[13px] font-semibold text-adm-ink">{inr(o.total)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </MetaBox>
        </div>

        <div className="space-y-5">
          <MetaBox title="At a glance">
            <ul className="space-y-2.5 text-[13px]">
              <li className="flex items-center justify-between gap-3">
                <Link to="/admin/products" className="flex items-center gap-2 text-adm-mute hover:text-navy">
                  <Grid size={15} /> Products
                </Link>
                <span className="font-semibold text-adm-ink">{stats.products.total}</span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-adm-mute"><Grid size={15} /> Published</span>
                <span className="font-semibold text-adm-ink">{stats.products.active}</span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <Link to="/admin/inbox" className="flex items-center gap-2 text-adm-mute hover:text-navy">
                  <Mail size={15} /> Unread messages
                </Link>
                <span className={`font-semibold ${extra.unread ? 'text-sale' : 'text-adm-ink'}`}>
                  {extra.unread ?? '—'}
                </span>
              </li>
              {outOfStock > 0 && (
                <li className="flex items-center justify-between gap-3 border-t border-adm-line pt-2.5">
                  <span className="text-sale">Out of stock</span>
                  <span className="font-semibold text-sale">{outOfStock}</span>
                </li>
              )}
            </ul>
          </MetaBox>

          <MetaBox title={`Low in stock (${stats.lowStock.length})`}>
            {stats.lowStock.length === 0 ? (
              <p className="py-4 text-center text-[13px] text-adm-mute">Nothing is running low.</p>
            ) : (
              <ul className="divide-y divide-adm-line text-[12.5px]">
                {stats.lowStock.map((v) => (
                  <li key={v.sku} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className="min-w-0">
                      <span className="block truncate text-adm-ink">{v.name}</span>
                      <span className="text-[11.5px] text-adm-mute">{v.color} / {v.size}</span>
                    </span>
                    <span className={`ad-chip shrink-0 ${v.stock === 0 ? 'bg-rose-50 text-sale' : 'bg-warn-soft text-warn'}`}>
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
