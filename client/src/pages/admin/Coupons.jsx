import { useEffect, useState } from 'react';
import { Alert, Seo, Spinner } from '../../components/ui';
import { Plus, Trash } from '../../components/Icons';
import { api } from '../../lib/api';
import { formatDate, inr } from '../../lib/format';
import { useToast } from '../../store/toast';

const BLANK = {
  code: '', kind: 'percent', value: 10, min_order: 999,
  max_discount: '', description: '', is_active: true, expires_at: '',
};

export default function AdminCoupons() {
  const [rows, setRows] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const { success, error: toastError } = useToast();

  const load = () => api.admin.coupons().then(setRows).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.admin.saveCoupon({
        ...form,
        max_discount: form.max_discount === '' ? null : form.max_discount,
        expires_at: form.expires_at || null,
      });
      success(`Coupon ${form.code.toUpperCase()} saved.`);
      setForm(null);
      load();
    } catch (err) { toastError(err.message); }
    finally { setBusy(false); }
  };

  const remove = async (c) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Delete coupon ${c.code}?`)) return;
    await api.admin.deleteCoupon(c.id);
    success('Coupon deleted.');
    load();
  };

  if (error) return <Alert>{error}</Alert>;

  return (
    <>
      <Seo title="Admin — Coupons" noindex />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-xl font-semibold uppercase tracking-wider2 text-navy">Coupons</h1>
        <button onClick={() => setForm({ ...BLANK })} className="btn-primary btn-sm"><Plus size={16} /> New coupon</button>
      </div>

      {form && (
        <form onSubmit={save} className="mt-6 border border-mist bg-white p-5 sm:p-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider2 text-slate">
            {form.id ? `Edit ${form.code}` : 'New coupon'}
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="cp-code">Code</label>
              <input
                id="cp-code" required value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="field uppercase" placeholder="VELVENT10"
              />
            </div>
            <div>
              <label className="label" htmlFor="cp-kind">Type</label>
              <select id="cp-kind" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} className="field">
                <option value="percent">Percent off</option>
                <option value="flat">Flat amount off</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="cp-value">{form.kind === 'percent' ? 'Percent (%)' : 'Amount (₹)'}</label>
              <input id="cp-value" type="number" min={0} required value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="field" />
            </div>
            <div>
              <label className="label" htmlFor="cp-min">Minimum order (₹)</label>
              <input id="cp-min" type="number" min={0} value={form.min_order} onChange={(e) => setForm({ ...form, min_order: e.target.value })} className="field" />
            </div>
            <div>
              <label className="label" htmlFor="cp-max">Max discount (₹, optional)</label>
              <input id="cp-max" type="number" min={0} value={form.max_discount ?? ''} onChange={(e) => setForm({ ...form, max_discount: e.target.value })} className="field" />
            </div>
            <div>
              <label className="label" htmlFor="cp-exp">Expires (optional)</label>
              <input id="cp-exp" type="date" value={form.expires_at ? String(form.expires_at).slice(0, 10) : ''} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="field" />
            </div>
            <div className="sm:col-span-3">
              <label className="label" htmlFor="cp-desc">Description shown on the cart</label>
              <input id="cp-desc" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} className="field" placeholder="10% off orders above ₹999" />
            </div>
          </div>

          <label className="mt-4 flex items-center gap-2.5 text-[13px] text-navy">
            <input type="checkbox" checked={form.is_active !== false} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4 accent-navy" />
            Active
          </label>

          <div className="mt-6 flex gap-3">
            <button type="submit" disabled={busy} className="btn-primary">{busy ? 'Saving…' : 'Save coupon'}</button>
            <button type="button" onClick={() => setForm(null)} className="btn-ghost">Cancel</button>
          </div>
        </form>
      )}

      {!rows ? (
        <div className="py-20 text-center"><Spinner className="text-navy" /></div>
      ) : rows.length === 0 ? (
        <p className="mt-10 text-[13.5px] text-slate">No coupons yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto border border-mist bg-white">
          <table className="w-full min-w-[700px] text-[13px]">
            <thead className="bg-cream/60 text-[10.5px] uppercase tracking-wider2 text-slate">
              <tr>
                {['Code', 'Discount', 'Min order', 'Cap', 'Expires', 'Status', ''].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-mist">
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-cream/40">
                  <td className="px-4 py-3">
                    <span className="block font-semibold tracking-wide text-navy">{c.code}</span>
                    {c.description && <span className="text-[11px] text-slate">{c.description}</span>}
                  </td>
                  <td className="px-4 py-3 text-slate">
                    {c.kind === 'percent' ? `${Number(c.value)}%` : inr(c.value)}
                  </td>
                  <td className="px-4 py-3 text-slate">{inr(c.min_order)}</td>
                  <td className="px-4 py-3 text-slate">{c.max_discount ? inr(c.max_discount) : '—'}</td>
                  <td className="px-4 py-3 text-slate">{c.expires_at ? formatDate(c.expires_at) : 'Never'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${c.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-mist text-slate'}`}>
                      {c.is_active ? 'Active' : 'Off'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="flex items-center justify-end gap-2">
                      <button onClick={() => setForm(c)} className="text-[11px] font-semibold uppercase tracking-wider text-navy hover:underline">Edit</button>
                      <button onClick={() => remove(c)} aria-label={`Delete ${c.code}`} className="text-slate hover:text-sale"><Trash size={15} /></button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
