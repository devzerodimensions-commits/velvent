import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Cell, EditLayout, Field, ListTable, MetaBox, Notice, PublishBox, ScreenHeader, StatusPill } from '../../components/adminUi';
import { Seo } from '../../components/ui';
import { api } from '../../lib/api';
import { formatDate, formatDateTime, inr } from '../../lib/format';
import { useToast } from '../../store/toast';
import { downloadCsv, stampedName } from '../../lib/csv';

const COLUMNS = [
  { key: 'name', label: 'Customer' },
  { key: 'phone', label: 'Phone', className: 'hidden md:table-cell w-40' },
  { key: 'orders', label: 'Orders', className: 'w-20' },
  { key: 'spent', label: 'Spent', className: 'w-28' },
  { key: 'last', label: 'Last order', className: 'hidden lg:table-cell w-36' },
  { key: 'joined', label: 'Joined', className: 'hidden sm:table-cell w-32' },
];

/* --------------------------------------------------------------- the list */

export function CustomersList() {
  const [rows, setRows] = useState(null);

  const exportCsv = () => downloadCsv(stampedName('velvent-customers'), rows || [], [
    ['Name', (c) => c.name],
    ['Email', (c) => c.email],
    ['Phone', (c) => c.phone || ''],
    ['Orders', (c) => c.orders],
    ['Lifetime value', (c) => Number(c.spent)],
    ['Last order', (c) => (c.last_order_at ? formatDate(c.last_order_at) : '')],
    ['Joined', (c) => formatDate(c.created_at)],
  ]);
  const [term, setTerm] = useState('');

  useEffect(() => {
    let alive = true;
    api.admin.customers(term)
      .then((r) => { if (alive) setRows(r); })
      .catch(() => { if (alive) setRows([]); });
    return () => { alive = false; };
  }, [term]);

  return (
    <>
      <Seo title="Customers" noindex />
      <ScreenHeader title="Customers" count={rows?.length} action="Export CSV" onAction={exportCsv} />

      <ListTable
        columns={COLUMNS}
        rows={rows || []}
        loading={rows === null}
        search={term}
        onSearch={setTerm}
        searchPlaceholder="Search name, email or phone"
        total={rows?.length}
        empty="Nobody has registered an account yet."
        renderRow={(c) => (
          <>
            <Cell primary>
              <Link to={`/admin/customers/${c.id}`} className="font-semibold text-navy hover:underline">
                {c.name}
              </Link>
              <span className="block text-[11.5px] text-adm-mute">{c.email}</span>
            </Cell>
            <Cell className="hidden md:table-cell">{c.phone || '—'}</Cell>
            <Cell>{c.orders}</Cell>
            <Cell><span className="font-semibold text-navy">{inr(c.spent)}</span></Cell>
            <Cell className="hidden lg:table-cell">{c.last_order_at ? formatDate(c.last_order_at) : '—'}</Cell>
            <Cell className="hidden sm:table-cell">{formatDate(c.created_at)}</Cell>
          </>
        )}
      />
    </>
  );
}

/* ------------------------------------------------------------ one customer */

export default function CustomerDetail() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const { success } = useToast();

  useEffect(() => {
    let alive = true;
    api.admin.customer(id)
      .then((c) => {
        if (!alive) return;
        setCustomer(c);
        setForm({ name: c.name || '', phone: c.phone || '' });
      })
      .catch((err) => { if (alive) setError(err.message); });
    return () => { alive = false; };
  }, [id]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await api.admin.updateCustomer(id, form);
      setCustomer((c) => ({ ...c, ...updated }));
      success('Customer updated.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (error && !customer) {
    return (
      <div>
        <ScreenHeader title="Customer" action="All customers" actionTo="/admin/customers" />
        <Notice tone="error">{error}</Notice>
      </div>
    );
  }

  if (!customer) return <p className="py-10 text-center text-[13px] text-adm-mute">Loading…</p>;

  const spent = customer.orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <>
      <Seo title={customer.name} noindex />
      <ScreenHeader title={customer.name} action="All customers" actionTo="/admin/customers" />

      {error && <div className="mb-4"><Notice tone="error" onDismiss={() => setError(null)}>{error}</Notice></div>}

      <EditLayout
        main={(
          <>
            <MetaBox title="Profile">
              <div className="space-y-4">
                <Field label="Name" htmlFor="cu-name" required>
                  <input id="cu-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="ad-input" />
                </Field>
                <Field label="Phone" htmlFor="cu-phone">
                  <input id="cu-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="ad-input" />
                </Field>
                <Field label="Email">
                  <p className="pt-2 text-[13px] text-adm-mute">
                    {customer.email}
                    <span className="mt-1 block text-[11.5px]">
                      The email is how the customer signs in, so it is not editable here.
                    </span>
                  </p>
                </Field>
              </div>
            </MetaBox>

            <MetaBox title={`Orders (${customer.orders.length})`}>
              {customer.orders.length === 0 ? (
                <p className="py-4 text-center text-[12.5px] text-adm-mute">No orders yet.</p>
              ) : (
                <ul className="divide-y divide-adm-line">
                  {customer.orders.map((o) => (
                    <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                      <span className="min-w-0">
                        <Link to={`/admin/orders?q=${o.order_number}`} className="text-[13px] font-semibold text-navy hover:underline">
                          {o.order_number}
                        </Link>
                        <span className="mt-0.5 block text-[11.5px] text-adm-mute">
                          {formatDateTime(o.created_at)} · {o.payment_method === 'cod' ? 'Cash on delivery' : 'Paid online'}
                        </span>
                      </span>
                      <span className="flex items-center gap-3">
                        <StatusPill status={o.status} />
                        <span className="text-[13px] font-semibold text-navy">{inr(o.total)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </MetaBox>

            {customer.addresses.length > 0 && (
              <MetaBox title={`Addresses (${customer.addresses.length})`}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {customer.addresses.map((a) => (
                    <address key={a.id} className="border border-adm-line bg-adm-soft p-3 text-[12.5px] not-italic leading-relaxed text-adm-mute">
                      <strong className="block text-navy">{a.full_name}</strong>
                      {a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />
                      {a.city}, {a.state} {a.pincode}<br />
                      {a.phone}
                    </address>
                  ))}
                </div>
              </MetaBox>
            )}

            {customer.wishlist.length > 0 && (
              <MetaBox title={`Wishlist (${customer.wishlist.length})`} defaultOpen={false}>
                <ul className="space-y-1.5">
                  {customer.wishlist.map((p) => (
                    <li key={p.id}>
                      <Link to={`/product/${p.slug}`} className="text-[12.5px] text-navy hover:underline">{p.name}</Link>
                    </li>
                  ))}
                </ul>
              </MetaBox>
            )}
          </>
        )}
        side={(
          <>
            <PublishBox onSave={save} saving={saving} saveLabel="Save changes">
              <p>Customer since {formatDate(customer.created_at)}.</p>
            </PublishBox>

            <MetaBox title="At a glance">
              <dl className="space-y-2 text-[12.5px]">
                <div className="flex justify-between gap-3">
                  <dt className="text-adm-mute">Orders</dt>
                  <dd className="font-semibold text-navy">{customer.orders.length}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-adm-mute">Lifetime value</dt>
                  <dd className="font-semibold text-navy">{inr(spent)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-adm-mute">Addresses</dt>
                  <dd className="font-semibold text-navy">{customer.addresses.length}</dd>
                </div>
              </dl>
            </MetaBox>
          </>
        )}
      />
    </>
  );
}
