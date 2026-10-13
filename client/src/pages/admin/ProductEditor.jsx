import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert, Seo, Spinner } from '../../components/ui';
import { Plus, Trash, Upload } from '../../components/Icons';
import { api } from '../../lib/api';
import { SIZE_ORDER } from '../../lib/format';
import { useToast } from '../../store/toast';

const BLANK = {
  name: '', category_id: '', short_desc: '', description: '',
  mrp: 1499, sale_price: 1005,
  fabric: 'Knitted Cotton',
  wash_care: 'Machine wash cold with like colours. Do not bleach. Tumble dry low. Warm iron on reverse.',
  fit: 'Regular Fit', sleeve: 'Half Sleeve', collar: '', weight_grams: 450,
  is_active: true, is_featured: false, is_new: true, sort_order: 0,
  images: [], variants: [],
};

export default function ProductEditor() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const fileRef = useRef(null);

  const [form, setForm] = useState(BLANK);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // Bulk variant builder
  const [bulk, setBulk] = useState({ color: '', hex: '#2C3544', stock: 25 });

  useEffect(() => { api.admin.categories().then(setCategories).catch(() => {}); }, []);

  useEffect(() => {
    if (isNew) return;
    api.admin.product(id)
      .then((p) => setForm({
        ...p,
        category_id: p.category_id ?? '',
        images: p.images || [],
        variants: p.variants || [],
      }))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };

  const upload = async (e) => {
    const files = [...(e.target.files || [])];
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const { url } = await api.admin.upload(file);
        setForm((f) => ({ ...f, images: [...f.images, { url, alt: f.name, color: '', sort_order: f.images.length }] }));
      }
      success(`${files.length} image${files.length === 1 ? '' : 's'} uploaded.`);
    } catch (err) {
      toastError(err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const addImageUrl = () => {
    // eslint-disable-next-line no-alert
    const url = window.prompt('Image URL (for example /products/my-photo.jpg)');
    if (url?.trim()) {
      setForm((f) => ({ ...f, images: [...f.images, { url: url.trim(), alt: f.name, color: '', sort_order: f.images.length }] }));
    }
  };

  const patchImage = (i, patch) =>
    setForm((f) => ({ ...f, images: f.images.map((img, n) => (n === i ? { ...img, ...patch } : img)) }));

  const removeImage = (i) =>
    setForm((f) => ({ ...f, images: f.images.filter((_, n) => n !== i) }));

  /** Adds S–3XL for one colour in a single click — the common case. */
  const addColourRun = () => {
    const color = bulk.color.trim();
    if (!color) { toastError('Enter a colour name first.'); return; }
    setForm((f) => {
      const existing = new Set(f.variants.map((v) => `${v.color}|${v.size}`));
      const added = SIZE_ORDER
        .filter((s) => !existing.has(`${color}|${s}`))
        .map((size) => ({ size, color, color_hex: bulk.hex, stock: Number(bulk.stock) || 0 }));
      return { ...f, variants: [...f.variants, ...added] };
    });
    setBulk((b) => ({ ...b, color: '' }));
  };

  const patchVariant = (i, patch) =>
    setForm((f) => ({ ...f, variants: f.variants.map((v, n) => (n === i ? { ...v, ...patch } : v)) }));

  const removeVariant = (i) =>
    setForm((f) => ({ ...f, variants: f.variants.filter((_, n) => n !== i) }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = { ...form, category_id: form.category_id || null };
    try {
      if (isNew) {
        const created = await api.admin.createProduct(payload);
        success(`${created.name} created.`);
        navigate(`/admin/products/${created.id}`, { replace: true });
      } else {
        await api.admin.updateProduct(id, payload);
        success('Product saved.');
      }
    } catch (err) {
      setError(err.message);
      toastError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-20 text-center"><Spinner className="text-navy" /></div>;

  const colours = [...new Set(form.variants.map((v) => v.color))];

  return (
    <>
      <Seo title={isNew ? 'Admin — New product' : `Admin — ${form.name}`} noindex />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/admin/products" className="text-[11px] font-semibold uppercase tracking-wider2 text-slate hover:text-navy">
            ← Products
          </Link>
          <h1 className="mt-2 font-display text-xl font-semibold uppercase tracking-wider2 text-navy">
            {isNew ? 'New product' : form.name}
          </h1>
        </div>
        {!isNew && form.slug && (
          <Link to={`/product/${form.slug}`} target="_blank" className="btn-ghost btn-sm">View on store ↗</Link>
        )}
      </div>

      {error && <div className="mt-6"><Alert>{error}</Alert></div>}

      <form onSubmit={save} className="mt-7 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <section className="border border-mist bg-white p-5 sm:p-6">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider2 text-slate">Basics</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label" htmlFor="p-name">Product name</label>
                <input id="p-name" required value={form.name} onChange={set('name')} className="field" />
              </div>
              <div>
                <label className="label" htmlFor="p-cat">Category</label>
                <select id="p-cat" value={form.category_id} onChange={set('category_id')} className="field">
                  <option value="">Uncategorised</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="p-sort">Sort order</label>
                <input id="p-sort" type="number" value={form.sort_order ?? 0} onChange={set('sort_order')} className="field" />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="p-short">Short description</label>
                <input id="p-short" value={form.short_desc || ''} onChange={set('short_desc')} className="field" />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="p-desc">Full description</label>
                <textarea id="p-desc" rows={6} value={form.description || ''} onChange={set('description')} className="field resize-y" />
              </div>
            </div>
          </section>

          <section className="border border-mist bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider2 text-slate">Images</h2>
              <div className="flex gap-2">
                <button type="button" onClick={addImageUrl} className="btn-ghost btn-sm">Add by URL</button>
                <label className="btn-outline btn-sm cursor-pointer">
                  <Upload size={15} /> {uploading ? 'Uploading…' : 'Upload'}
                  <input ref={fileRef} type="file" accept="image/*" multiple onChange={upload} className="hidden" disabled={uploading} />
                </label>
              </div>
            </div>

            {form.images.length === 0 ? (
              <p className="mt-5 text-[13px] text-slate">No images yet. Upload a photo or point at a file in /public/products.</p>
            ) : (
              <ul className="mt-5 space-y-3">
                {form.images.map((img, i) => (
                  <li key={`${img.url}-${i}`} className="flex gap-3 border border-mist p-3">
                    <img src={img.url} alt="" className="h-24 w-[72px] shrink-0 bg-cream object-cover" />
                    <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                      <input
                        value={img.url}
                        onChange={(e) => patchImage(i, { url: e.target.value })}
                        placeholder="Image URL"
                        className="field sm:col-span-2"
                      />
                      <input
                        value={img.alt || ''}
                        onChange={(e) => patchImage(i, { alt: e.target.value })}
                        placeholder="Alt text"
                        className="field"
                      />
                      <select
                        value={img.color || ''}
                        onChange={(e) => patchImage(i, { color: e.target.value })}
                        className="field"
                      >
                        <option value="">Shown for all colours</option>
                        {colours.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <button type="button" onClick={() => removeImage(i)} aria-label="Remove image" className="shrink-0 self-start text-slate hover:text-sale">
                      <Trash size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="border border-mist bg-white p-5 sm:p-6">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider2 text-slate">Colours, sizes & stock</h2>

            <div className="mt-5 flex flex-wrap items-end gap-3 border border-dashed border-mist p-4">
              <div className="min-w-[150px] flex-1">
                <label className="label" htmlFor="v-color">Colour name</label>
                <input
                  id="v-color"
                  value={bulk.color}
                  onChange={(e) => setBulk({ ...bulk, color: e.target.value })}
                  placeholder="Navy"
                  className="field"
                />
              </div>
              <div>
                <label className="label" htmlFor="v-hex">Swatch</label>
                <input
                  id="v-hex"
                  type="color"
                  value={bulk.hex}
                  onChange={(e) => setBulk({ ...bulk, hex: e.target.value })}
                  className="h-[46px] w-16 cursor-pointer border border-mist bg-white p-1"
                />
              </div>
              <div className="w-28">
                <label className="label" htmlFor="v-stock">Stock each</label>
                <input
                  id="v-stock"
                  type="number"
                  min={0}
                  value={bulk.stock}
                  onChange={(e) => setBulk({ ...bulk, stock: e.target.value })}
                  className="field"
                />
              </div>
              <button type="button" onClick={addColourRun} className="btn-primary btn-sm">
                <Plus size={15} /> Add S–3XL
              </button>
            </div>

            {form.variants.length === 0 ? (
              <p className="mt-5 text-[13px] text-slate">No variants yet. Add a colour above to create all six sizes at once.</p>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[520px] text-[13px]">
                  <thead className="bg-cream/60 text-[10.5px] uppercase tracking-wider2 text-slate">
                    <tr>
                      {['Colour', 'Swatch', 'Size', 'Stock', ''].map((h) => (
                        <th key={h} scope="col" className="px-3 py-2.5 text-left font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-mist">
                    {form.variants.map((v, i) => (
                      <tr key={v.id || `${v.color}-${v.size}`}>
                        <td className="px-3 py-2">
                          <input value={v.color} onChange={(e) => patchVariant(i, { color: e.target.value })} className="field py-2" />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="color"
                            value={v.color_hex || '#2C3544'}
                            onChange={(e) => patchVariant(i, { color_hex: e.target.value })}
                            className="h-9 w-12 cursor-pointer border border-mist bg-white p-0.5"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select value={v.size} onChange={(e) => patchVariant(i, { size: e.target.value })} className="field py-2">
                            {SIZE_ORDER.map((s) => <option key={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={0}
                            value={v.stock}
                            onChange={(e) => patchVariant(i, { stock: e.target.value })}
                            className="field w-24 py-2"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button type="button" onClick={() => removeVariant(i)} aria-label="Remove variant" className="text-slate hover:text-sale">
                            <Trash size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="border border-mist bg-white p-5">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider2 text-slate">Pricing</h2>
            <div className="mt-5 space-y-4">
              <div>
                <label className="label" htmlFor="p-mrp">MRP (₹)</label>
                <input id="p-mrp" type="number" min={0} step="0.01" required value={form.mrp} onChange={set('mrp')} className="field" />
              </div>
              <div>
                <label className="label" htmlFor="p-sale">Sale price (₹)</label>
                <input id="p-sale" type="number" min={0} step="0.01" required value={form.sale_price} onChange={set('sale_price')} className="field" />
              </div>
              {Number(form.mrp) > Number(form.sale_price) && (
                <p className="bg-cream px-3 py-2 text-[12px] text-navy">
                  {Math.round(((form.mrp - form.sale_price) / form.mrp) * 100)}% off shown to customers
                </p>
              )}
            </div>
          </section>

          <section className="border border-mist bg-white p-5">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider2 text-slate">Visibility</h2>
            <div className="mt-4 space-y-3">
              {[
                ['is_active', 'Live on the store'],
                ['is_featured', 'Show in Bestsellers'],
                ['is_new', 'Show the “New” badge'],
              ].map(([key, label]) => (
                <label key={key} className="flex cursor-pointer items-center gap-2.5 text-[13px] text-navy">
                  <input type="checkbox" checked={!!form[key]} onChange={set(key)} className="h-4 w-4 accent-navy" />
                  {label}
                </label>
              ))}
            </div>
          </section>

          <section className="border border-mist bg-white p-5">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider2 text-slate">Specification</h2>
            <div className="mt-4 space-y-4">
              {[
                ['fabric', 'Fabric'], ['fit', 'Fit'], ['sleeve', 'Sleeve'], ['collar', 'Collar'],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="label" htmlFor={`p-${key}`}>{label}</label>
                  <input id={`p-${key}`} value={form[key] || ''} onChange={set(key)} className="field" />
                </div>
              ))}
              <div>
                <label className="label" htmlFor="p-weight">Weight (grams)</label>
                <input id="p-weight" type="number" min={0} value={form.weight_grams || ''} onChange={set('weight_grams')} className="field" />
              </div>
              <div>
                <label className="label" htmlFor="p-wash">Wash care</label>
                <textarea id="p-wash" rows={4} value={form.wash_care || ''} onChange={set('wash_care')} className="field resize-y" />
              </div>
            </div>
          </section>

          <div className="sticky bottom-4">
            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving ? <><Spinner size={16} /> Saving…</> : isNew ? 'Create product' : 'Save changes'}
            </button>
          </div>
        </aside>
      </form>
    </>
  );
}
