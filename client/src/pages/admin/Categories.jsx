import { useEffect, useState } from 'react';
import { Alert, Seo, Spinner } from '../../components/ui';
import { Plus, Trash } from '../../components/Icons';
import { api } from '../../lib/api';
import { useToast } from '../../store/toast';

const BLANK = { name: '', slug: '', tagline: '', description: '', image_url: '', sort_order: 0, is_active: true };

export default function AdminCategories() {
  const [rows, setRows] = useState(null);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const { success, error: toastError } = useToast();

  const load = () => api.admin.categories().then(setRows).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (editing.id) await api.admin.updateCategory(editing.id, editing);
      else await api.admin.createCategory(editing);
      success('Category saved.');
      setEditing(null);
      load();
    } catch (err) { toastError(err.message); }
    finally { setBusy(false); }
  };

  const remove = async (c) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Delete "${c.name}"? Products in it become uncategorised — they are not deleted.`)) return;
    try {
      await api.admin.deleteCategory(c.id);
      success('Category deleted.');
      load();
    } catch (err) { toastError(err.message); }
  };

  if (error) return <Alert>{error}</Alert>;

  return (
    <>
      <Seo title="Admin — Categories" noindex />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-xl font-semibold uppercase tracking-wider2 text-navy">Categories</h1>
        <button onClick={() => setEditing({ ...BLANK })} className="btn-primary btn-sm"><Plus size={16} /> New category</button>
      </div>

      {editing && (
        <form onSubmit={save} className="mt-6 border border-mist bg-white p-5 sm:p-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider2 text-slate">
            {editing.id ? `Edit ${editing.name}` : 'New category'}
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="c-name">Name</label>
              <input id="c-name" required value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="field" />
            </div>
            <div>
              <label className="label" htmlFor="c-tagline">Tagline</label>
              <input id="c-tagline" value={editing.tagline || ''} onChange={(e) => setEditing({ ...editing, tagline: e.target.value })} className="field" />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="c-img">Tile image URL</label>
              <input id="c-img" value={editing.image_url || ''} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} placeholder="/products/…" className="field" />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="c-desc">Description</label>
              <textarea id="c-desc" rows={3} value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="field resize-y" />
            </div>
            <div>
              <label className="label" htmlFor="c-sort">Sort order</label>
              <input id="c-sort" type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: e.target.value })} className="field" />
            </div>
            <label className="flex items-end gap-2.5 pb-3 text-[13px] text-navy">
              <input
                type="checkbox"
                checked={editing.is_active !== false}
                onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                className="h-4 w-4 accent-navy"
              />
              Visible on the store
            </label>
          </div>
          <div className="mt-6 flex gap-3">
            <button type="submit" disabled={busy} className="btn-primary">{busy ? 'Saving…' : 'Save'}</button>
            <button type="button" onClick={() => setEditing(null)} className="btn-ghost">Cancel</button>
          </div>
        </form>
      )}

      {!rows ? (
        <div className="py-20 text-center"><Spinner className="text-navy" /></div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((c) => (
            <div key={c.id} className="border border-mist bg-white">
              {c.image_url && <img src={c.image_url} alt="" className="aspect-[5/3] w-full bg-cream object-cover" loading="lazy" />}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-[15px] font-semibold uppercase tracking-wider2 text-navy">{c.name}</h2>
                    <p className="mt-1 text-[11px] text-slate">/{c.slug}</p>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase ${c.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-mist text-slate'}`}>
                    {c.is_active ? 'Live' : 'Hidden'}
                  </span>
                </div>
                {c.tagline && <p className="mt-2.5 text-[12.5px] text-slate">{c.tagline}</p>}
                <div className="mt-4 flex gap-2">
                  <button onClick={() => setEditing(c)} className="btn-ghost btn-sm">Edit</button>
                  <button onClick={() => remove(c)} aria-label={`Delete ${c.name}`} className="btn-sm btn border border-mist text-sale hover:border-sale">
                    <Trash size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
