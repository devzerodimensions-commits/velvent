import { useEffect, useState } from 'react';
import { Seo } from '../../components/ui';
import { Cell, ListTable, Notice, RowActions, ScreenHeader } from '../../components/wp';
import { api } from '../../lib/api';
import { useToast } from '../../store/toast';

const BLANK = { name: '', slug: '', tagline: '', description: '', image_url: '', sort_order: 0, is_active: true };

const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description', className: 'hidden lg:table-cell' },
  { key: 'slug', label: 'Slug', className: 'hidden md:table-cell w-44' },
  { key: 'count', label: 'Count', className: 'w-20' },
];

export default function AdminCategories() {
  const [rows, setRows] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);
  const { success, error: toastError } = useToast();

  const load = () => api.admin.categories().then(setRows).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (form.id) await api.admin.updateCategory(form.id, form);
      else await api.admin.createCategory(form);
      setNotice({ tone: 'success', text: `Category "${form.name}" saved.` });
      setForm(BLANK);
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
      if (form.id === c.id) setForm(BLANK);
      load();
    } catch (err) { toastError(err.message); }
  };

  const runBulk = async (action, ids) => {
    if (action !== 'delete') return;
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Delete ${ids.length} categor${ids.length === 1 ? 'y' : 'ies'}? Their products become uncategorised.`)) return;
    try {
      await Promise.all(ids.map((id) => api.admin.deleteCategory(id)));
      setNotice({ tone: 'success', text: `${ids.length} categories deleted.` });
      load();
    } catch (err) { toastError(err.message); }
  };

  if (error) return <Notice tone="error">{error}</Notice>;

  return (
    <>
      <Seo title="Categories" noindex />
      <ScreenHeader title="Product categories">
        {notice && <Notice tone={notice.tone} onDismiss={() => setNotice(null)}>{notice.text}</Notice>}
      </ScreenHeader>

      {/* WordPress puts the add form on the left and the list on the right. */}
      <div className="grid items-start gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <form onSubmit={save} className="border border-mist bg-white">
          <header className="border-b border-mist px-4 py-2.5">
            <h2 className="text-[13px] font-semibold text-navy">
              {form.id ? `Edit "${form.name}"` : 'Add new category'}
            </h2>
          </header>
          <div className="space-y-3 p-4">
            <div>
              <label htmlFor="cat-name" className="mb-1 block text-[12.5px] font-semibold text-navy">Name</label>
              <input id="cat-name" value={form.name} onChange={set('name')} required className="wp-input" />
              <p className="mt-1 text-[11.5px] text-slate">The name as it appears on your site.</p>
            </div>
            <div>
              <label htmlFor="cat-slug" className="mb-1 block text-[12.5px] font-semibold text-navy">Slug</label>
              <input id="cat-slug" value={form.slug || ''} onChange={set('slug')} placeholder="auto from name" className="wp-input" />
              <p className="mt-1 text-[11.5px] text-slate">The URL-friendly version. Lowercase, letters, numbers and hyphens.</p>
            </div>
            <div>
              <label htmlFor="cat-tagline" className="mb-1 block text-[12.5px] font-semibold text-navy">Tagline</label>
              <input id="cat-tagline" value={form.tagline || ''} onChange={set('tagline')} className="wp-input" />
            </div>
            <div>
              <label htmlFor="cat-desc" className="mb-1 block text-[12.5px] font-semibold text-navy">Description</label>
              <textarea id="cat-desc" rows={3} value={form.description || ''} onChange={set('description')} className="wp-textarea" />
            </div>
            <div>
              <label htmlFor="cat-image" className="mb-1 block text-[12.5px] font-semibold text-navy">Image URL</label>
              <input id="cat-image" value={form.image_url || ''} onChange={set('image_url')} className="wp-input" />
            </div>
            <div>
              <label htmlFor="cat-order" className="mb-1 block text-[12.5px] font-semibold text-navy">Order</label>
              <input id="cat-order" type="number" value={form.sort_order ?? 0} onChange={set('sort_order')} className="wp-input w-24" />
            </div>
            <label className="flex items-center gap-2 text-[12.5px] text-navy">
              <input type="checkbox" checked={form.is_active !== false} onChange={set('is_active')} /> Visible on the storefront
            </label>
          </div>
          <footer className="flex items-center gap-2 border-t border-mist bg-cream/40 px-4 py-3">
            <button type="submit" disabled={busy} className="wp-btn-primary">
              {busy ? 'Saving…' : form.id ? 'Update' : 'Add new category'}
            </button>
            {form.id && (
              <button type="button" onClick={() => setForm(BLANK)} className="wp-btn-secondary">Cancel</button>
            )}
          </footer>
        </form>

        <ListTable
          columns={COLUMNS}
          rows={rows || []}
          loading={rows === null}
          bulkActions={[{ value: 'delete', label: 'Delete' }]}
          onBulkAction={runBulk}
          total={rows?.length}
          empty="No categories yet."
          renderRow={(c) => (
            <>
              <Cell primary>
                <button type="button" onClick={() => setForm(c)} className="font-semibold text-navy hover:underline">
                  {c.name}
                </button>
                {!c.is_active && <span className="ml-1.5 text-[12px] text-slate">— Hidden</span>}
                <RowActions
                  actions={[
                    { label: 'Edit', onClick: () => setForm(c) },
                    { label: 'View', to: `/category/${c.slug}` },
                    { label: 'Delete', onClick: () => remove(c), danger: true },
                  ]}
                />
              </Cell>
              <Cell className="hidden lg:table-cell">
                <span className="line-clamp-2">{c.tagline || c.description || '—'}</span>
              </Cell>
              <Cell className="hidden md:table-cell">{c.slug}</Cell>
              <Cell>{c.product_count ?? '—'}</Cell>
            </>
          )}
        />
      </div>
    </>
  );
}
