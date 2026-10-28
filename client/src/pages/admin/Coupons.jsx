import { useEffect, useState } from 'react';
import { Seo } from '../../components/ui';
import { Cell, Field, ListTable, MetaBox, Notice, RowActions, ScreenHeader } from '../../components/adminUi';
import { api } from '../../lib/api';
import { formatDate, inr } from '../../lib/format';
import { useToast } from '../../store/toast';

const BLANK = {
  code: '', kind: 'percent', value: 10, min_order: 999,
  max_discount: '', description: '', is_active: true, expires_at: '',
};

const COLUMNS = [
  { key: 'code', label: 'Code' },
  { key: 'type', label: 'Coupon type', className: 'hidden md:table-cell w-40' },
  { key: 'amount', label: 'Amount', className: 'w-28' },
  { key: 'spend', label: 'Minimum spend', className: 'hidden lg:table-cell w-36' },
  { key: 'expiry', label: 'Expiry date', className: 'w-32' },
];

export default function AdminCoupons() {
  const [rows, setRows] = useState(null);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);
  const { success, error: toastError } = useToast();

  const load = () => api.admin.coupons().then(setRows).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.admin.saveCoupon({
        ...form,
        max_discount: form.max_discount === '' ? null : form.max_discount,
        expires_at: form.expires_at || null,
      });
      setNotice({ tone: 'success', text: `Coupon ${form.code.toUpperCase()} saved.` });
      setForm(null);
      load();
    } catch (err) { toastError(err.message); }
    finally { setBusy(false); }
  };

  const remove = async (c) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Delete coupon ${c.code}? Customers can no longer use it.`)) return;
    try {
      await api.admin.deleteCoupon(c.id);
      success('Coupon deleted.');
      load();
    } catch (err) { toastError(err.message); }
  };

  const runBulk = async (action, ids) => {
    if (action !== 'delete') return;
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Delete ${ids.length} coupon(s)?`)) return;
    try {
      await Promise.all(ids.map((id) => api.admin.deleteCoupon(id)));
      setNotice({ tone: 'success', text: `${ids.length} coupons deleted.` });
      load();
    } catch (err) { toastError(err.message); }
  };

  if (error) return <Notice tone="error">{error}</Notice>;

  // The edit screen replaces the list, exactly as adding a coupon does in Woo.
  if (form) {
    return (
      <>
        <Seo title="Coupons" noindex />
        <ScreenHeader title={form.id ? `Edit coupon` : 'Add new coupon'} />

        <form onSubmit={save} className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-4">
            <div className="ad-card p-4">
              <label htmlFor="c-code" className="sr-only">Coupon code</label>
              <input
                id="c-code"
                value={form.code}
                onChange={set('code')}
                required
                placeholder="Coupon code"
                className="w-full border-0 px-0 py-1 font-display text-[20px] uppercase tracking-wider text-navy placeholder:text-slate-light focus:outline-none focus:ring-0"
              />
              <input
                value={form.description || ''}
                onChange={set('description')}
                placeholder="Description (optional) — only you see this"
                aria-label="Coupon description"
                className="mt-2 w-full border-0 px-0 py-1 text-[13px] text-adm-mute placeholder:text-slate-light focus:outline-none focus:ring-0"
              />
            </div>

            <MetaBox title="Coupon data">
              <div className="space-y-4">
                <Field label="Discount type" htmlFor="c-kind">
                  <select id="c-kind" value={form.kind} onChange={set('kind')} className="ad-select">
                    <option value="percent">Percentage discount</option>
                    <option value="flat">Fixed cart discount</option>
                  </select>
                </Field>
                <Field
                  label="Coupon amount"
                  htmlFor="c-value"
                  hint={form.kind === 'percent' ? 'A percentage of the cart subtotal.' : 'A flat rupee amount off the cart.'}
                >
                  <input id="c-value" type="number" min="0" step="1" value={form.value} onChange={set('value')} required className="ad-input sm:w-40" />
                </Field>
                <Field label="Minimum spend" htmlFor="c-min" hint="The cart subtotal must reach this before the coupon applies.">
                  <input id="c-min" type="number" min="0" step="1" value={form.min_order} onChange={set('min_order')} className="ad-input sm:w-40" />
                </Field>
                {form.kind === 'percent' && (
                  <Field label="Maximum discount" htmlFor="c-max" hint="Caps a percentage coupon. Leave blank for no cap.">
                    <input id="c-max" type="number" min="0" step="1" value={form.max_discount ?? ''} onChange={set('max_discount')} className="ad-input sm:w-40" />
                  </Field>
                )}
                <Field label="Expiry date" htmlFor="c-exp" hint="Leave blank and the coupon never expires.">
                  <input
                    id="c-exp"
                    type="date"
                    value={form.expires_at ? String(form.expires_at).slice(0, 10) : ''}
                    onChange={set('expires_at')}
                    className="ad-input sm:w-52"
                  />
                </Field>
              </div>
            </MetaBox>
          </div>

          <div className="space-y-4">
            <section className="ad-card">
              <header className="border-b border-adm-line px-4 py-2.5">
                <h2 className="text-[13px] font-semibold text-navy">Publish</h2>
              </header>
              <div className="border-b border-adm-line p-4">
                <label className="flex items-center gap-2 text-[12.5px] text-navy">
                  <input type="checkbox" checked={form.is_active !== false} onChange={set('is_active')} /> Active
                </label>
                <p className="mt-1.5 text-[11.5px] text-adm-mute">Inactive coupons are rejected at checkout.</p>
              </div>
              <footer className="flex items-center justify-between gap-3 bg-adm-soft px-4 py-3">
                <button type="button" onClick={() => setForm(null)} className="text-[12px] text-adm-mute transition hover:text-navy">
                  Cancel
                </button>
                <button type="submit" disabled={busy} className="ad-btn-primary">
                  {busy ? 'Saving…' : form.id ? 'Update' : 'Publish'}
                </button>
              </footer>
            </section>
          </div>
        </form>
      </>
    );
  }

  return (
    <>
      <Seo title="Coupons" noindex />
      <ScreenHeader title="Coupons" action="Add New" onAction={() => setForm(BLANK)}>
        {notice && <Notice tone={notice.tone} onDismiss={() => setNotice(null)}>{notice.text}</Notice>}
      </ScreenHeader>

      <ListTable
        columns={COLUMNS}
        rows={rows || []}
        loading={rows === null}
        bulkActions={[{ value: 'delete', label: 'Delete' }]}
        onBulkAction={runBulk}
        total={rows?.length}
        empty="No coupons yet."
        renderRow={(c) => (
          <>
            <Cell primary>
              <button type="button" onClick={() => setForm(c)} className="font-semibold uppercase tracking-wider text-navy hover:underline">
                {c.code}
              </button>
              {!c.is_active && <span className="ml-1.5 text-[12px] text-adm-mute">— Inactive</span>}
              <RowActions
                actions={[
                  { label: 'Edit', onClick: () => setForm(c) },
                  { label: 'Delete', onClick: () => remove(c), danger: true },
                ]}
              />
              {c.description && <span className="block text-[11.5px] text-adm-mute">{c.description}</span>}
            </Cell>
            <Cell className="hidden md:table-cell">
              {c.kind === 'percent' ? 'Percentage discount' : 'Fixed cart discount'}
            </Cell>
            <Cell>
              <span className="font-semibold text-navy">
                {c.kind === 'percent' ? `${Number(c.value)}%` : inr(c.value)}
              </span>
              {c.max_discount && <span className="block text-[11px] text-adm-mute">max {inr(c.max_discount)}</span>}
            </Cell>
            <Cell className="hidden lg:table-cell">{Number(c.min_order) ? inr(c.min_order) : '—'}</Cell>
            <Cell>{c.expires_at ? formatDate(c.expires_at) : '—'}</Cell>
          </>
        )}
      />
    </>
  );
}
