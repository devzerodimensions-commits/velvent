import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, Notice, ScreenHeader } from '../../components/adminUi';
import { Seo } from '../../components/ui';
import { Search } from '../../components/Icons';
import { api } from '../../lib/api';
import { useToast } from '../../store/toast';

/**
 * Every size of every product, in one editable grid.
 *
 * Stock can already be edited inside a product, which is right when a delivery
 * arrives for one style. It is the wrong shape for a stock-take, which goes
 * shelf by shelf across the whole range — so this is a single screen where
 * numbers are typed down a column and saved together.
 *
 * Nothing saves as you type. A stock-take is a sweep, and a half-applied one
 * leaves the shelf and the shop disagreeing with no way to tell where it
 * stopped; the whole screenful goes in one transaction instead.
 */
export default function Stock() {
  const [rows, setRows] = useState(null);
  const [edits, setEdits] = useState({});
  const [term, setTerm] = useState('');
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const { success } = useToast();
  const firstInput = useRef(null);

  const load = (q = query) => api.admin.stock(q)
    .then((r) => { setRows(r); setEdits({}); })
    .catch((err) => setError(err.message));

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [query]);

  const setStock = (id, value) => {
    setEdits((prev) => {
      const next = { ...prev };
      const original = rows.find((r) => r.id === id)?.stock;
      // Typing a value back to what it was is not a change.
      if (value === '' || Number(value) === Number(original)) delete next[id];
      else next[id] = value;
      return next;
    });
  };

  const changed = Object.keys(edits).length;

  const invalid = useMemo(
    () => Object.values(edits).some((v) => !/^\d+$/.test(String(v))),
    [edits],
  );

  const save = async () => {
    if (invalid) {
      setError('Stock must be a whole number, zero or more.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updates = Object.entries(edits).map(([id, stock]) => ({ id: Number(id), stock: Number(stock) }));
      const res = await api.admin.saveStock(updates);
      await load();
      success(res.saved === 1 ? 'One size updated.' : `${res.saved} sizes updated.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  /* Products are the unit someone thinks in, so the flat list from the server
     is folded back into them for display. */
  const grouped = useMemo(() => {
    const map = new Map();
    for (const r of rows || []) {
      if (!map.has(r.product_id)) map.set(r.product_id, { id: r.product_id, name: r.product_name, slug: r.slug, isActive: r.is_active, variants: [] });
      map.get(r.product_id).variants.push(r);
    }
    return [...map.values()];
  }, [rows]);

  const totals = useMemo(() => ({
    units: (rows || []).reduce((s, r) => s + Number(r.stock), 0),
    out: (rows || []).filter((r) => Number(r.stock) === 0).length,
  }), [rows]);

  return (
    <>
      <Seo title="Stock" noindex />

      <ScreenHeader title="Stock" count={rows?.length}>
        <div className="flex flex-wrap items-center gap-3">
          <form
            onSubmit={(e) => { e.preventDefault(); setQuery(term); }}
            className="flex gap-2"
          >
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-light" />
              <input
                ref={firstInput}
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search product, colour or SKU"
                className="ad-input w-full pl-9 sm:w-64"
              />
            </div>
            <button type="submit" className="ad-btn-ghost">Search</button>
          </form>

          {rows && (
            <p className="text-[12.5px] text-adm-mute">
              {totals.units} units in stock
              {totals.out > 0 && <span className="text-sale"> · {totals.out} sold out</span>}
            </p>
          )}
        </div>
      </ScreenHeader>

      {error && <div className="mb-4"><Notice tone="error" onDismiss={() => setError(null)}>{error}</Notice></div>}

      {rows === null && <p className="py-16 text-center text-[13px] text-adm-mute">Loading…</p>}

      {rows && rows.length === 0 && (
        <EmptyState title="Nothing matches" body="Try a different product name, colour or SKU." />
      )}

      {grouped.length > 0 && (
        <div className="space-y-4 pb-24">
          {grouped.map((p) => (
            <section key={p.id} className="ad-card overflow-hidden">
              <header className="flex flex-wrap items-center justify-between gap-2 border-b border-adm-line bg-adm-soft px-4 py-2.5">
                <h2 className="text-[13.5px] font-semibold text-adm-ink">
                  {p.name}
                  {!p.isActive && <span className="ml-2 ad-chip bg-adm-line text-adm-mute">Draft</span>}
                </h2>
                <Link to={`/admin/products/${p.id}`} className="text-[12px] font-medium text-navy hover:underline">
                  Edit product
                </Link>
              </header>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-adm-line">
                      {['Colour', 'Size', 'SKU', 'In stock'].map((h) => (
                        <th key={h} className="px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-adm-mute">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-adm-line">
                    {p.variants.map((v) => {
                      const value = edits[v.id] ?? v.stock;
                      const dirty = edits[v.id] !== undefined;
                      return (
                        <tr key={v.id} className={dirty ? 'bg-warn-soft/50' : ''}>
                          <td className="px-4 py-2 text-[13px] text-adm-ink">{v.color}</td>
                          <td className="px-4 py-2 text-[13px] text-adm-ink">{v.size}</td>
                          <td className="px-4 py-2 font-mono text-[12px] text-adm-mute">{v.sku}</td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={value}
                              onChange={(e) => setStock(v.id, e.target.value)}
                              aria-label={`Stock for ${p.name} ${v.color} ${v.size}`}
                              className={`ad-input w-24 ${Number(value) === 0 ? 'text-sale' : ''}`}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}

      {/* The save bar follows you down what is often a very long page. */}
      {changed > 0 && (
        <div className="sticky bottom-4 z-40">
          <div className="flex flex-wrap items-center gap-3 rounded-xl bg-navy px-4 py-3 text-white shadow-pop">
            <span className="text-[12.5px]">
              {changed === 1 ? 'One size changed' : `${changed} sizes changed`}
              {invalid && <span className="ml-2 text-rose-200">— check the highlighted numbers</span>}
            </span>
            <button type="button" onClick={() => setEdits({})} className="ml-auto text-[12.5px] text-white/70 hover:text-white">
              Discard
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || invalid}
              className="rounded-lg bg-white px-3.5 py-2 text-[12.5px] font-semibold text-navy disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
