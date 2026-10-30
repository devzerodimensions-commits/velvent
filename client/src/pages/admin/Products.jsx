import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Seo } from '../../components/ui';
import { Star } from '../../components/Icons';
import {
  Cell, Field, ListTable, Notice, RowActions, ScreenHeader, SubsubsubNav,
} from '../../components/adminUi';
import { api } from '../../lib/api';
import { formatDate, inr } from '../../lib/format';
import { useToast } from '../../store/toast';
import Reorder from './Reorder';

const COLUMNS = [
  { key: 'image', label: '', className: 'w-16' },
  { key: 'name', label: 'Name' },
  { key: 'sku', label: 'SKU', className: 'hidden md:table-cell' },
  { key: 'stock', label: 'Stock', className: 'w-28' },
  { key: 'price', label: 'Price', className: 'w-32' },
  { key: 'categories', label: 'Categories', className: 'hidden lg:table-cell' },
  { key: 'featured', label: <Star size={14} />, className: 'w-10' },
  { key: 'date', label: 'Date', className: 'hidden xl:table-cell w-28' },
];

const BULK = [
  { value: 'publish', label: 'Publish' },
  { value: 'draft', label: 'Switch to draft' },
  { value: 'feature', label: 'Mark featured' },
  { value: 'unfeature', label: 'Remove featured' },
  { value: 'trash', label: 'Delete' },
];

/** The inline editor, opened from a row's "Quick Edit" link. */
function QuickEdit({ product, onCancel, onSaved }) {
  const [form, setForm] = useState({
    name: product.name,
    mrp: product.mrp,
    sale_price: product.sale_price,
    is_active: product.is_active,
    is_featured: product.is_featured,
  });
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      await api.admin.patchProduct(product.id, form);
      success(`${form.name} updated.`);
      onSaved();
    } catch (err) { error(err.message); setSaving(false); }
  };

  return (
    <tr className="border-b border-adm-line bg-adm-soft">
      <td colSpan={COLUMNS.length + 1} className="p-4">
        <p className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-adm-mute">Quick Edit</p>
        <div className="grid gap-3 lg:max-w-2xl">
          <Field label="Name" htmlFor={`qe-name-${product.id}`}>
            <input id={`qe-name-${product.id}`} value={form.name} onChange={set('name')} className="ad-input" />
          </Field>
          <Field label="Regular price" htmlFor={`qe-mrp-${product.id}`}>
            <input id={`qe-mrp-${product.id}`} type="number" min="0" step="1" value={form.mrp} onChange={set('mrp')} className="ad-input sm:w-40" />
          </Field>
          <Field label="Sale price" htmlFor={`qe-sale-${product.id}`}>
            <input id={`qe-sale-${product.id}`} type="number" min="0" step="1" value={form.sale_price} onChange={set('sale_price')} className="ad-input sm:w-40" />
          </Field>
          <Field label="Status">
            <div className="flex flex-wrap gap-4 pt-1.5">
              <label className="flex items-center gap-2 text-[12.5px] text-navy">
                <input type="checkbox" checked={form.is_active} onChange={set('is_active')} /> Published
              </label>
              <label className="flex items-center gap-2 text-[12.5px] text-navy">
                <input type="checkbox" checked={form.is_featured} onChange={set('is_featured')} /> Featured
              </label>
            </div>
          </Field>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button type="button" onClick={save} disabled={saving} className="ad-btn-primary">
            {saving ? 'Updating…' : 'Update'}
          </button>
          <button type="button" onClick={onCancel} className="ad-btn-ghost">Cancel</button>
        </div>
      </td>
    </tr>
  );
}

export default function AdminProducts() {
  const navigate = useNavigate();
  const [rows, setRows] = useState(null);
  const [categories, setCategories] = useState([]);
  const [view, setView] = useState('all');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [quickEdit, setQuickEdit] = useState(null);
  const [reordering, setReordering] = useState(false);

  /* The copy lands as a draft, so it is safe to open and edit before anyone
     can see it. Going straight there is what someone duplicating a product
     wants next anyway. */
  const duplicate = async (product) => {
    try {
      const copy = await api.admin.duplicateProduct(product.id);
      setNotice({ tone: "success", text: `Copied as a draft. Its stock starts at zero.` });
      navigate(`/admin/products/${copy.id}`);
    } catch (err) {
      setNotice({ tone: "error", text: err.message });
    }
  };
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);
  const { success, error: toastError } = useToast();

  const load = () => api.admin.products(search).then(setRows).catch((e) => setError(e.message));

  useEffect(() => { load(); }, [search]);
  useEffect(() => { api.admin.categories().then(setCategories).catch(() => {}); }, []);

  const all = rows || [];
  const counts = useMemo(() => ({
    all: all.length,
    publish: all.filter((p) => p.is_active).length,
    draft: all.filter((p) => !p.is_active).length,
  }), [all]);

  const visible = useMemo(() => all.filter((p) => {
    if (view === 'publish' && !p.is_active) return false;
    if (view === 'draft' && p.is_active) return false;
    if (category && String(p.category_id) !== String(category)) return false;
    return true;
  }), [all, view, category]);

  const remove = async (p) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Move "${p.name}" to Trash? This removes its images, variants and stock. Past orders keep their own record of what was bought.`)) return;
    try {
      await api.admin.deleteProduct(p.id);
      setNotice({ tone: 'success', text: `"${p.name}" moved to the Trash.` });
      load();
    } catch (err) { toastError(err.message); }
  };

  const runBulk = async (action, ids) => {
    const chosen = all.filter((p) => ids.includes(p.id));
    try {
      if (action === 'trash') {
        // eslint-disable-next-line no-alert
        if (!window.confirm(`Move ${ids.length} product(s) to Trash? Their images, variants and stock go too.`)) return;
        await Promise.all(ids.map((id) => api.admin.deleteProduct(id)));
      } else {
        const body = {
          publish: { is_active: true },
          draft: { is_active: false },
          feature: { is_featured: true },
          unfeature: { is_featured: false },
        }[action];
        await Promise.all(ids.map((id) => api.admin.patchProduct(id, body)));
      }
      setNotice({ tone: 'success', text: `${chosen.length} product${chosen.length === 1 ? '' : 's'} updated.` });
      load();
    } catch (err) { toastError(err.message); }
  };

  const toggleFeatured = async (p) => {
    try {
      await api.admin.patchProduct(p.id, { is_featured: !p.is_featured });
      setRows((prev) => prev.map((r) => (r.id === p.id ? { ...r, is_featured: !r.is_featured } : r)));
    } catch (err) { toastError(err.message); }
  };

  if (error) return <Notice tone="error">{error}</Notice>;

  return (
    <>
      <Seo title="Products" noindex />
      <ScreenHeader title="Products" action="Add New" actionTo="/admin/products/new">
        <button type="button" onClick={() => setReordering(true)} className="ad-btn-ghost">Reorder</button>
        {notice && (
          <Notice tone={notice.tone} onDismiss={() => setNotice(null)}>{notice.text}</Notice>
        )}
      </ScreenHeader>

      <SubsubsubNav
        current={view}
        onChange={setView}
        views={[
          { value: 'all', label: 'All', count: counts.all },
          { value: 'publish', label: 'Published', count: counts.publish },
          { value: 'draft', label: 'Draft', count: counts.draft },
        ]}
      />

      <ListTable
        columns={COLUMNS}
        rows={visible}
        loading={rows === null}
        bulkActions={BULK}
        onBulkAction={runBulk}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search products"
        total={visible.length}
        empty="No products found."
        filters={(
          <>
            <label className="sr-only" htmlFor="cat-filter">Filter by category</label>
            <select
              id="cat-filter"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="ad-select"
            >
              <option value="">All categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </>
        )}
        renderRow={(p) => (
          <>
            <Cell>
              <img
                src={p.image_url}
                alt=""
                className="h-11 w-9 bg-adm-soft object-cover"
                loading="lazy"
              />
            </Cell>
            <Cell primary>
              <Link to={`/admin/products/${p.id}`} className="font-semibold text-navy hover:underline">
                {p.name}
              </Link>
              {!p.is_active && <span className="ml-1.5 text-[12px] font-semibold text-adm-mute">— Draft</span>}
              <RowActions
                actions={[
                  { label: `ID: ${p.id}`, onClick: () => {} },
                  { label: 'Edit', to: `/admin/products/${p.id}` },
                  { label: 'Quick Edit', onClick: () => setQuickEdit(quickEdit === p.id ? null : p.id) },
                  { label: 'Duplicate', onClick: () => duplicate(p) },
                  { label: 'View', to: `/product/${p.slug}` },
                  { label: 'Delete', onClick: () => remove(p), danger: true },
                ]}
              />
            </Cell>
            <Cell className="hidden md:table-cell">
              <span className="text-[12px]">{p.slug}</span>
            </Cell>
            <Cell>
              {p.stock === 0 ? (
                <span className="font-semibold text-sale">Out of stock</span>
              ) : (
                <>
                  <span className={p.stock <= 10 ? 'font-semibold text-amber-700' : 'text-emerald-700'}>In stock</span>
                  <span className="block text-[11.5px] text-adm-mute">{p.stock} total</span>
                </>
              )}
            </Cell>
            <Cell>
              <span className="text-adm-mute line-through">{inr(p.mrp)}</span>{' '}
              <span className="font-semibold text-navy">{inr(p.sale_price)}</span>
            </Cell>
            <Cell className="hidden lg:table-cell">{p.category_name || '—'}</Cell>
            <Cell>
              <button
                type="button"
                onClick={() => toggleFeatured(p)}
                aria-label={p.is_featured ? `Remove ${p.name} from featured` : `Mark ${p.name} featured`}
                aria-pressed={p.is_featured}
                className={`transition ${p.is_featured ? 'text-navy' : 'text-mist hover:text-adm-mute'}`}
              >
                <Star size={15} filled={p.is_featured} />
              </button>
            </Cell>
            <Cell className="hidden xl:table-cell">
              <span className="text-[12px]">{p.created_at ? formatDate(p.created_at) : '—'}</span>
            </Cell>
          </>
        )}
      />

      {/* Quick Edit renders as a full-width row under the table it belongs to. */}
      {quickEdit && (
        <table className="w-full border border-t-0 border-adm-line">
          <tbody>
            <QuickEdit
              product={all.find((p) => p.id === quickEdit)}
              onCancel={() => setQuickEdit(null)}
              onSaved={() => { setQuickEdit(null); load(); }}
            />
          </tbody>
        </table>
      )}

      {reordering && (
        <Reorder
          items={(rows || []).map((p) => ({ id: p.id, name: p.name, image: p.image_url }))}
          label="products"
          onSave={(order) => api.admin.reorderProducts(order)}
          onClose={(saved) => { setReordering(false); if (saved) load(); }}
        />
      )}
    </>
  );
}
