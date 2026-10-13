import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Seo, Spinner } from '../../components/ui';
import { Plus, Search, Trash } from '../../components/Icons';
import { api } from '../../lib/api';
import { inr } from '../../lib/format';
import { useToast } from '../../store/toast';

export default function AdminProducts() {
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState('');
  const [error, setError] = useState(null);
  const { success, error: toastError } = useToast();

  const load = (term = '') => api.admin.products(term).then(setRows).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const search = (e) => { e.preventDefault(); load(q.trim()); };

  const remove = async (p) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Delete "${p.name}"? This removes its images, variants and stock. Past orders keep their record.`)) return;
    try {
      await api.admin.deleteProduct(p.id);
      success(`${p.name} deleted.`);
      load(q.trim());
    } catch (err) { toastError(err.message); }
  };

  if (error) return <Alert>{error}</Alert>;

  return (
    <>
      <Seo title="Admin — Products" noindex />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-xl font-semibold uppercase tracking-wider2 text-navy">Products</h1>
        <Link to="/admin/products/new" className="btn-primary btn-sm"><Plus size={16} /> New product</Link>
      </div>

      <form onSubmit={search} className="mt-6 flex max-w-md">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products"
          className="field flex-1"
          aria-label="Search products"
        />
        <button type="submit" className="btn-outline px-5"><Search size={16} /></button>
      </form>

      {!rows ? (
        <div className="py-20 text-center"><Spinner className="text-navy" /></div>
      ) : rows.length === 0 ? (
        <p className="mt-10 text-[13.5px] text-slate">No products found.</p>
      ) : (
        <div className="mt-6 overflow-x-auto border border-mist bg-white">
          <table className="w-full min-w-[760px] text-[13px]">
            <thead className="bg-cream/60 text-[10.5px] uppercase tracking-wider2 text-slate">
              <tr>
                {['Product', 'Category', 'Price', 'Stock', 'Status', ''].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-mist">
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-cream/40">
                  <td className="px-4 py-3">
                    <Link to={`/admin/products/${p.id}`} className="flex items-center gap-3">
                      <img src={p.image_url} alt="" className="h-14 w-11 shrink-0 bg-cream object-cover" loading="lazy" />
                      <span>
                        <span className="block font-medium text-navy hover:underline">{p.name}</span>
                        <span className="text-[11px] text-slate">/{p.slug}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate">{p.category_name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-navy">{inr(p.sale_price)}</span>
                    <span className="ml-1.5 text-[11px] text-slate line-through">{inr(p.mrp)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${p.stock === 0 ? 'text-sale' : p.stock <= 10 ? 'text-amber-700' : 'text-navy'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex flex-wrap gap-1">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${p.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-mist text-slate'}`}>
                        {p.is_active ? 'Live' : 'Hidden'}
                      </span>
                      {p.is_featured && <span className="bg-navy/10 px-2 py-0.5 text-[10px] font-bold uppercase text-navy">Featured</span>}
                      {p.is_new && <span className="bg-cream-deep px-2 py-0.5 text-[10px] font-bold uppercase text-navy">New</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="flex items-center justify-end gap-2">
                      <Link to={`/admin/products/${p.id}`} className="text-[11px] font-semibold uppercase tracking-wider text-navy hover:underline">
                        Edit
                      </Link>
                      <button onClick={() => remove(p)} aria-label={`Delete ${p.name}`} className="text-slate transition hover:text-sale">
                        <Trash size={16} />
                      </button>
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
