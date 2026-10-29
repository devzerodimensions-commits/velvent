import { useEffect, useState } from 'react';
import { Seo } from '../../components/ui';
import { Cell, ListTable, Notice, RowActions, ScreenHeader } from '../../components/adminUi';
import { api } from '../../lib/api';
import { useToast } from '../../store/toast';

const BLANK = { name: '', slug: '', tagline: '', description: '', image_url: '', sort_order: 0, is_active: true, size_chart: null };

/* ------------------------------------------------------------ size guide -- */

const DEFAULT_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
const MEASURE_COLS = ['Chest', 'Length', 'Sleeve', 'Shoulder'];

const blankChart = () => ({
  note: '',
  rows: DEFAULT_SIZES.map((s) => [s, '', '', '', '']),
  howTo: MEASURE_COLS.map((l) => [l, '']),
});

/**
 * The size guide for one category, measured on the garment laid flat in inches.
 * Leaving every box empty stores nothing, and the storefront then falls back to
 * its built-in chart — so a half-filled form can never replace a working one
 * with blanks.
 */
function SizeChartFields({ value, onChange }) {
  const chart = value && value.rows?.length ? value : blankChart();

  const edit = (key, i, j) => (e) => onChange({
    ...chart,
    [key]: chart[key].map((entry, ei) => (ei === i ? entry.map((c, ci) => (ci === j ? e.target.value : c)) : entry)),
  });

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="cat-chart-note" className="mb-1 block text-[12.5px] font-semibold text-navy">Fit note</label>
        <input
          id="cat-chart-note"
          value={chart.note || ''}
          onChange={(e) => onChange({ ...chart, note: e.target.value })}
          placeholder="Regular fit with a set-in sleeve. Take your usual size."
          className="ad-input"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-[12.5px]">
          <thead>
            <tr>
              <th className="pb-1.5 pr-2 text-left text-[11px] font-semibold uppercase tracking-wider text-adm-mute">Size</th>
              {MEASURE_COLS.map((h) => (
                <th key={h} className="pb-1.5 pr-2 text-left text-[11px] font-semibold uppercase tracking-wider text-adm-mute">{h} (in)</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chart.rows.map((r, i) => (
              <tr key={i}>
                <td className="py-1 pr-2">
                  <input
                    value={r[0] ?? ''}
                    onChange={edit('rows', i, 0)}
                    aria-label={`Size name, row ${i + 1}`}
                    className="ad-input w-20"
                  />
                </td>
                {[1, 2, 3, 4].map((j) => (
                  <td key={j} className="py-1 pr-2">
                    <input
                      type="number"
                      step="0.5"
                      value={r[j] ?? ''}
                      onChange={edit('rows', i, j)}
                      aria-label={`${MEASURE_COLS[j - 1]} for ${r[0] || `row ${i + 1}`}`}
                      className="ad-input w-20"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <p className="mb-1.5 text-[12.5px] font-semibold text-navy">How to measure</p>
        <p className="mb-2.5 text-[11.5px] text-adm-mute">
          Shown beside this chart. Written per category, so a dropped shoulder can be explained
          differently from a set-in sleeve.
        </p>
        <div className="space-y-2">
          {chart.howTo.map((s, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={s[0] ?? ''}
                onChange={edit('howTo', i, 0)}
                aria-label={`Measurement name ${i + 1}`}
                className="ad-input w-28 shrink-0"
              />
              <input
                value={s[1] ?? ''}
                onChange={edit('howTo', i, 1)}
                placeholder="How to take this measurement"
                aria-label={`How to measure ${s[0] || i + 1}`}
                className="ad-input"
              />
            </div>
          ))}
        </div>
      </div>

      <button type="button" onClick={() => onChange(null)} className="ad-btn-ghost">
        Clear chart
      </button>
    </div>
  );
}

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

      {/* The add form sits on the left, the list on the right. */}
      <div className="grid items-start gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <form onSubmit={save} className="ad-card">
          <header className="border-b border-adm-line px-4 py-2.5">
            <h2 className="text-[13px] font-semibold text-navy">
              {form.id ? `Edit "${form.name}"` : 'Add new category'}
            </h2>
          </header>
          <div className="space-y-3 p-4">
            <div>
              <label htmlFor="cat-name" className="mb-1 block text-[12.5px] font-semibold text-navy">Name</label>
              <input id="cat-name" value={form.name} onChange={set('name')} required className="ad-input" />
              <p className="mt-1 text-[11.5px] text-adm-mute">The name as it appears on your site.</p>
            </div>
            <div>
              <label htmlFor="cat-slug" className="mb-1 block text-[12.5px] font-semibold text-navy">Slug</label>
              <input id="cat-slug" value={form.slug || ''} onChange={set('slug')} placeholder="auto from name" className="ad-input" />
              <p className="mt-1 text-[11.5px] text-adm-mute">The URL-friendly version. Lowercase, letters, numbers and hyphens.</p>
            </div>
            <div>
              <label htmlFor="cat-tagline" className="mb-1 block text-[12.5px] font-semibold text-navy">Tagline</label>
              <input id="cat-tagline" value={form.tagline || ''} onChange={set('tagline')} className="ad-input" />
            </div>
            <div>
              <label htmlFor="cat-desc" className="mb-1 block text-[12.5px] font-semibold text-navy">Description</label>
              <textarea id="cat-desc" rows={3} value={form.description || ''} onChange={set('description')} className="ad-textarea" />
            </div>
            <div>
              <label htmlFor="cat-image" className="mb-1 block text-[12.5px] font-semibold text-navy">Image URL</label>
              <input id="cat-image" value={form.image_url || ''} onChange={set('image_url')} className="ad-input" />
            </div>
            <div>
              <label htmlFor="cat-order" className="mb-1 block text-[12.5px] font-semibold text-navy">Order</label>
              <input id="cat-order" type="number" value={form.sort_order ?? 0} onChange={set('sort_order')} className="ad-input w-24" />
            </div>
            <label className="flex items-center gap-2 text-[12.5px] text-navy">
              <input type="checkbox" checked={form.is_active !== false} onChange={set('is_active')} /> Visible on the storefront
            </label>

            <details className="overflow-hidden rounded-lg border border-adm-line bg-adm-soft">
              <summary className="cursor-pointer px-3 py-2.5 text-[12.5px] font-semibold text-adm-ink">
                Size guide
                <span className="ml-2 font-normal text-adm-mute">
                  {form.size_chart?.rows?.length ? 'set for this category' : 'using the built-in chart'}
                </span>
              </summary>
              <div className="border-t border-adm-line p-3">
                <SizeChartFields
                  value={form.size_chart}
                  onChange={(v) => setForm((f) => ({ ...f, size_chart: v }))}
                />
              </div>
            </details>
          </div>
          <footer className="flex items-center gap-2 border-t border-adm-line bg-adm-soft px-4 py-3">
            <button type="submit" disabled={busy} className="ad-btn-primary">
              {busy ? 'Saving…' : form.id ? 'Update' : 'Add new category'}
            </button>
            {form.id && (
              <button type="button" onClick={() => setForm(BLANK)} className="ad-btn-ghost">Cancel</button>
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
                {!c.is_active && <span className="ml-1.5 text-[12px] text-adm-mute">— Hidden</span>}
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
