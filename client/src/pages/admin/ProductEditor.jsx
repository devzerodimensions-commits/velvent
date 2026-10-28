import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Seo, Spinner } from '../../components/ui';
import { Box, Grid, Plus, Ruler, Tag, Trash, Upload } from '../../components/Icons';
import {
  EditLayout, Field, MetaBox, Notice, PublishBox, ScreenHeader, TabbedMetaBox,
} from '../../components/adminUi';
import { api } from '../../lib/api';
import { bySize, inr, SIZE_ORDER } from '../../lib/format';
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

const TABS = [
  { key: 'general', label: 'General', Icon: Tag },
  { key: 'inventory', label: 'Inventory', Icon: Box },
  { key: 'shipping', label: 'Shipping', Icon: Box },
  { key: 'attributes', label: 'Attributes', Icon: Ruler },
  { key: 'variations', label: 'Variations', Icon: Grid },
];

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

  // The "add S–3XL for this colour" builder, which is how a run is really added.
  const [bulk, setBulk] = useState({ color: '', hex: '#2C3544', stock: 25 });

  useEffect(() => { api.admin.categories().then(setCategories).catch(() => {}); }, []);

  useEffect(() => {
    if (isNew) return;
    api.admin.product(id)
      .then((p) => setForm({ ...p, category_id: p.category_id ?? '', images: p.images || [], variants: p.variants || [] }))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  /* ------------------------------------------------------------- images */

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
    } catch (err) { toastError(err.message); }
    finally {
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

  const makePrimary = (i) =>
    setForm((f) => {
      const next = [...f.images];
      const [picked] = next.splice(i, 1);
      return { ...f, images: [picked, ...next].map((img, n) => ({ ...img, sort_order: n })) };
    });

  /* ----------------------------------------------------------- variants */

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

  const patchVariant = (key, patch) =>
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v) => (`${v.color}|${v.size}` === key ? { ...v, ...patch } : v)),
    }));

  const removeColour = (colour) =>
    setForm((f) => ({ ...f, variants: f.variants.filter((v) => v.color !== colour) }));

  /* --------------------------------------------------------------- save */

  const save = async () => {
    setSaving(true);
    setError(null);
    const payload = { ...form, category_id: form.category_id || null };
    try {
      if (isNew) {
        const created = await api.admin.createProduct(payload);
        success(`${created.name} published.`);
        navigate(`/admin/products/${created.id}`, { replace: true });
      } else {
        await api.admin.updateProduct(id, payload);
        success('Product updated.');
      }
    } catch (err) {
      setError(err.message);
      toastError(err.message);
    } finally { setSaving(false); }
  };

  const trash = async () => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Move "${form.name}" to Trash? Its images, variants and stock go with it.`)) return;
    try {
      await api.admin.deleteProduct(id);
      success('Product moved to Trash.');
      navigate('/admin/products');
    } catch (err) { toastError(err.message); }
  };

  if (loading) return <div className="py-20 text-center"><Spinner className="text-navy" /></div>;

  const colours = [...new Set(form.variants.map((v) => v.color))];
  const totalStock = form.variants.reduce((n, v) => n + (Number(v.stock) || 0), 0);

  return (
    <>
      <Seo title={isNew ? 'Add New Product' : form.name} noindex />
      <ScreenHeader
        title={isNew ? 'Add new product' : 'Edit product'}
        action={isNew ? undefined : 'Add New'}
        actionTo={isNew ? undefined : '/admin/products/new'}
      >
        {error && <Notice tone="error" onDismiss={() => setError(null)}>{error}</Notice>}
      </ScreenHeader>

      <EditLayout
        main={(
          <>
            {/* The WordPress title field and permalink line. */}
            <div className="ad-card p-4">
              <label htmlFor="p-name" className="sr-only">Product name</label>
              <input
                id="p-name"
                value={form.name}
                onChange={set('name')}
                placeholder="Product name"
                className="w-full border border-transparent px-0 py-1 font-display text-[21px] text-navy placeholder:text-slate-light focus:border-transparent focus:outline-none focus:ring-0"
              />
              {form.slug && (
                <p className="mt-1 text-[12px] text-adm-mute">
                  Permalink: <Link to={`/product/${form.slug}`} className="text-navy underline">/product/{form.slug}</Link>
                </p>
              )}
            </div>

            <MetaBox title="Description">
              <label htmlFor="p-desc" className="sr-only">Long description</label>
              <textarea
                id="p-desc"
                rows={7}
                value={form.description || ''}
                onChange={set('description')}
                placeholder="The full description shown on the product page."
                className="ad-textarea"
              />
            </MetaBox>

            <TabbedMetaBox title="Product data" tabs={TABS}>
              {(tab) => (
                <>
                  {tab === 'general' && (
                    <div className="space-y-4">
                      <Field label="Regular price" htmlFor="p-mrp" hint="The struck-through price. WooCommerce calls this the regular price; your brand sheet calls it MRP.">
                        <input id="p-mrp" type="number" min="0" step="1" value={form.mrp} onChange={set('mrp')} className="ad-input sm:w-44" />
                      </Field>
                      <Field label="Sale price" htmlFor="p-sale" hint="What the customer actually pays.">
                        <input id="p-sale" type="number" min="0" step="1" value={form.sale_price} onChange={set('sale_price')} className="ad-input sm:w-44" />
                      </Field>
                      {Number(form.sale_price) > 0 && Number(form.mrp) > Number(form.sale_price) && (
                        <p className="text-[12.5px] text-emerald-700">
                          {Math.round((1 - form.sale_price / form.mrp) * 100)}% off — saves {inr(form.mrp - form.sale_price)}
                        </p>
                      )}
                    </div>
                  )}

                  {tab === 'inventory' && (
                    <div className="space-y-4">
                      <Field label="Stock" hint="Stock is held per colour and size. Set the numbers on the Variations tab.">
                        <p className="pt-1.5 text-[13px] text-navy">
                          <span className="font-semibold">{totalStock}</span> across {form.variants.length} variation{form.variants.length === 1 ? '' : 's'}
                        </p>
                      </Field>
                      <Field label="Published" hint="Unpublished products disappear from the storefront but keep their orders.">
                        <label className="flex items-center gap-2 pt-1.5 text-[12.5px] text-navy">
                          <input type="checkbox" checked={form.is_active} onChange={set('is_active')} /> Visible in the shop
                        </label>
                      </Field>
                    </div>
                  )}

                  {tab === 'shipping' && (
                    <Field label="Weight (g)" htmlFor="p-weight" hint="Used on the product page's details list.">
                      <input id="p-weight" type="number" min="0" value={form.weight_grams || ''} onChange={set('weight_grams')} className="ad-input sm:w-40" />
                    </Field>
                  )}

                  {tab === 'attributes' && (
                    <div className="space-y-4">
                      <Field label="Fabric" htmlFor="p-fabric">
                        <input id="p-fabric" value={form.fabric || ''} onChange={set('fabric')} className="ad-input" />
                      </Field>
                      <Field label="Fit" htmlFor="p-fit">
                        <input id="p-fit" value={form.fit || ''} onChange={set('fit')} className="ad-input" />
                      </Field>
                      <Field label="Sleeve" htmlFor="p-sleeve">
                        <input id="p-sleeve" value={form.sleeve || ''} onChange={set('sleeve')} className="ad-input" />
                      </Field>
                      <Field label="Collar" htmlFor="p-collar">
                        <input id="p-collar" value={form.collar || ''} onChange={set('collar')} className="ad-input" />
                      </Field>
                      <Field label="Wash care" htmlFor="p-wash">
                        <textarea id="p-wash" rows={2} value={form.wash_care || ''} onChange={set('wash_care')} className="ad-textarea" />
                      </Field>
                    </div>
                  )}

                  {tab === 'variations' && (
                    <div className="space-y-5">
                      <div className="border border-adm-line bg-adm-soft p-3">
                        <p className="mb-2 text-[12.5px] font-semibold text-navy">Add all six sizes for a colour</p>
                        <div className="flex flex-wrap items-end gap-2">
                          <div>
                            <label htmlFor="b-colour" className="mb-1 block text-[11.5px] text-adm-mute">Colour name</label>
                            <input id="b-colour" value={bulk.color} onChange={(e) => setBulk((b) => ({ ...b, color: e.target.value }))} placeholder="Navy" className="ad-input w-36" />
                          </div>
                          <div>
                            <label htmlFor="b-hex" className="mb-1 block text-[11.5px] text-adm-mute">Swatch</label>
                            <input id="b-hex" type="color" value={bulk.hex} onChange={(e) => setBulk((b) => ({ ...b, hex: e.target.value }))} className="h-[38px] w-14 rounded-lg border border-adm-line bg-white p-1" />
                          </div>
                          <div>
                            <label htmlFor="b-stock" className="mb-1 block text-[11.5px] text-adm-mute">Stock each</label>
                            <input id="b-stock" type="number" min="0" value={bulk.stock} onChange={(e) => setBulk((b) => ({ ...b, stock: e.target.value }))} className="ad-input w-24" />
                          </div>
                          <button type="button" onClick={addColourRun} className="ad-btn-ghost"><Plus size={14} /> Add S–3XL</button>
                        </div>
                      </div>

                      {colours.length === 0 && (
                        <p className="text-[13px] text-adm-mute">No variations yet. Add a colour above and all six sizes appear.</p>
                      )}

                      {colours.map((colour) => {
                        const rows = form.variants.filter((v) => v.color === colour).sort((a, b) => bySize(a.size, b.size));
                        return (
                          <div key={colour} className="border border-adm-line">
                            <header className="flex items-center justify-between gap-3 border-b border-adm-line bg-adm-soft px-3 py-2">
                              <span className="flex items-center gap-2 text-[13px] font-semibold text-navy">
                                <span className="h-4 w-4 border border-adm-line" style={{ background: rows[0]?.color_hex || '#ccc' }} />
                                {colour}
                              </span>
                              <button type="button" onClick={() => removeColour(colour)} className="text-[12px] text-sale transition hover:underline">
                                Remove colour
                              </button>
                            </header>
                            <div className="grid grid-cols-2 gap-px bg-adm-line sm:grid-cols-3 lg:grid-cols-6">
                              {rows.map((v) => (
                                <label key={v.size} className="bg-white p-2.5">
                                  <span className="block text-[11.5px] font-semibold text-navy">{v.size}</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={v.stock}
                                    onChange={(e) => patchVariant(`${v.color}|${v.size}`, { stock: e.target.value })}
                                    aria-label={`Stock for ${colour} ${v.size}`}
                                    className="ad-input mt-1"
                                  />
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </TabbedMetaBox>

            <MetaBox title="Product short description">
              <label htmlFor="p-short" className="sr-only">Short description</label>
              <textarea
                id="p-short"
                rows={3}
                value={form.short_desc || ''}
                onChange={set('short_desc')}
                placeholder="One or two lines, used on cards and in search results."
                className="ad-textarea"
              />
            </MetaBox>
          </>
        )}

        side={(
          <>
            <PublishBox
              onSave={save}
              saving={saving}
              saveLabel={isNew ? 'Publish' : 'Update'}
              onDelete={isNew ? undefined : trash}
            >
              <label className="flex items-center gap-2 text-[12.5px] text-navy">
                <input type="checkbox" checked={form.is_active} onChange={set('is_active')} /> Published
              </label>
              <label className="flex items-center gap-2 text-[12.5px] text-navy">
                <input type="checkbox" checked={form.is_featured} onChange={set('is_featured')} /> Featured
              </label>
              <label className="flex items-center gap-2 text-[12.5px] text-navy">
                <input type="checkbox" checked={form.is_new} onChange={set('is_new')} /> Mark as new
              </label>
              <div>
                <label htmlFor="p-order" className="mb-1 block text-[12.5px] text-navy">Menu order</label>
                <input id="p-order" type="number" value={form.sort_order ?? 0} onChange={set('sort_order')} className="ad-input w-20" />
              </div>
            </PublishBox>

            <MetaBox title="Product categories">
              <label htmlFor="p-cat" className="sr-only">Category</label>
              <select id="p-cat" value={form.category_id} onChange={set('category_id')} className="ad-input">
                <option value="">Uncategorised</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <Link to="/admin/categories" className="mt-2 inline-block text-[12px] text-adm-mute transition hover:text-navy hover:underline">
                + Add new category
              </Link>
            </MetaBox>

            <MetaBox
              title="Product image"
              actions={(
                <span className="text-[11.5px] text-adm-mute">{form.images.length} total</span>
              )}
            >
              {form.images[0] ? (
                <div>
                  <img src={form.images[0].url} alt="" className="aspect-[3/4] w-full bg-adm-soft object-cover" />
                  <button type="button" onClick={() => removeImage(0)} className="mt-2 text-[12px] text-sale transition hover:underline">
                    Remove product image
                  </button>
                </div>
              ) : (
                <p className="text-[12.5px] text-adm-mute">No image set. Upload one below.</p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="ad-btn-ghost">
                  <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload'}
                </button>
                <button type="button" onClick={addImageUrl} className="ad-btn-ghost">Add by URL</button>
                <input ref={fileRef} type="file" accept="image/*" multiple onChange={upload} className="hidden" />
              </div>
              <p className="mt-2 text-[11.5px] text-adm-mute">
                JPG, PNG, WEBP or AVIF, up to 3&nbsp;MB. Uploads are stored in the database, so they survive a deploy.
              </p>
            </MetaBox>

            {form.images.length > 1 && (
              <MetaBox title="Product gallery">
                <ul className="space-y-2">
                  {form.images.slice(1).map((img, n) => {
                    const i = n + 1;
                    return (
                      <li key={`${img.url}-${i}`} className="flex gap-2.5 border border-adm-line p-2">
                        <img src={img.url} alt="" className="h-16 w-12 shrink-0 bg-adm-soft object-cover" />
                        <div className="min-w-0 flex-1">
                          <label className="sr-only" htmlFor={`img-colour-${i}`}>Colour for image {i + 1}</label>
                          <input
                            id={`img-colour-${i}`}
                            value={img.color || ''}
                            onChange={(e) => patchImage(i, { color: e.target.value })}
                            placeholder="Colour (optional)"
                            className="ad-input text-[12px]"
                          />
                          <div className="mt-1.5 flex gap-2 text-[11.5px]">
                            <button type="button" onClick={() => makePrimary(i)} className="text-adm-mute transition hover:text-navy hover:underline">
                              Make primary
                            </button>
                            <button type="button" onClick={() => removeImage(i)} className="text-sale transition hover:underline">
                              Remove
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-2 text-[11.5px] leading-relaxed text-adm-mute">
                  Tagging a gallery image with a colour makes the product page swap to it when a shopper picks that colour.
                </p>
              </MetaBox>
            )}
          </>
        )}
      />
    </>
  );
}
