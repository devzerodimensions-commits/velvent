/**
 * The size chart, in one place.
 *
 * The /size-guide page and the popup on the product page render the same
 * tables from the same numbers, so a measurement can never be right in one
 * and stale in the other.
 */
import { useEffect, useRef, useState } from 'react';
import { Close, Ruler } from './Icons';
import { api } from '../lib/api';
import { useContent } from '../store/content';

/*
 * The polo t-shirt and the polo shirt were one combined chart until the two
 * categories were split apart, and they are still cut to the same spec — so
 * both tables point at this one list rather than keeping two copies that could
 * drift. Give the polo shirt its own measurements here the moment it has any
 * of its own; nothing else needs to change.
 */
const POLO_ROWS = [
  ['S', 38, 27, 7.5, 17],
  ['M', 40, 28, 8, 17.5],
  ['L', 42, 29, 8.5, 18.5],
  ['XL', 44, 30, 9, 19.5],
  ['XXL', 46, 31, 9.5, 20.5],
  ['3XL', 48, 32, 10, 21.5],
];

/* Garment-flat measurements in inches. Body length is HPS (high point shoulder) to hem.
   One table per category: a shopper looking at a polo shirt is shown the polo
   shirt chart and nothing else. */
export const SIZE_TABLES = [
  {
    name: 'Polo T-Shirt',
    note: 'Regular fit with a set-in sleeve. Take your usual size.',
    /** Category slugs this table applies to, so a product page can show the right one. */
    slugs: ['polo-t-shirt'],
    rows: POLO_ROWS,
  },
  {
    name: 'Polo Shirt',
    note: 'Button-through with an open camp collar. Relaxed through the body.',
    slugs: ['polo-shirt'],
    rows: POLO_ROWS,
  },
  {
    name: 'Oversized T-Shirt',
    note: 'Cut deliberately boxy with a dropped shoulder. Size down for a closer fit.',
    slugs: ['oversized-t-shirt'],
    rows: [
      ['S', 42, 27, 8.5, 20],
      ['M', 44, 28, 9, 21],
      ['L', 46, 29, 9.5, 22],
      ['XL', 48, 30, 10, 23],
      ['XXL', 50, 31, 10.5, 24],
      ['3XL', 52, 32, 11, 25],
    ],
  },
];

export const SIZE_HEADS = ['Size', 'Chest (in)', 'Length (in)', 'Sleeve (in)', 'Shoulder (in)'];

/**
 * The charts to show: whatever the admin has saved against each category, with
 * the tables above standing in for any category that has no chart of its own
 * yet. A failed fetch is not worth surfacing — the built-ins are a complete
 * chart on their own, so the shopper still gets an answer.
 */
export function useSizeTables() {
  const [tables, setTables] = useState(SIZE_TABLES);

  useEffect(() => {
    let alive = true;
    api.categories()
      .then((cats) => {
        if (!alive || !Array.isArray(cats)) return;
        const saved = cats
          .filter((c) => c.size_chart?.rows?.length)
          .map((c) => ({
            name: c.name,
            note: c.size_chart.note || '',
            slugs: [c.slug],
            rows: c.size_chart.rows,
          }));
        if (!saved.length) return;
        const covered = new Set(saved.map((t) => t.slugs[0]));
        setTables([...saved, ...SIZE_TABLES.filter((t) => !t.slugs.some((s) => covered.has(s)))]);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  return tables;
}

/**
 * One chart. `highlightSize` marks the row the shopper has already picked, so
 * they can see their own measurements without hunting for the row.
 */
export function SizeTable({ table, highlightSize }) {
  return (
    <section>
      <h3 className="font-display text-base font-semibold uppercase tracking-wider2 text-navy">{table.name}</h3>
      <p className="mt-1.5 text-[13px] text-slate">{table.note}</p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[460px] border-collapse text-[13.5px]">
          <thead>
            <tr className="bg-navy text-cream">
              {SIZE_HEADS.map((h) => (
                <th key={h} scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((r, i) => {
              const picked = highlightSize && r[0] === highlightSize;
              return (
                <tr
                  key={r[0]}
                  className={picked ? 'bg-cream-deep' : i % 2 ? 'bg-cream/60' : 'bg-white'}
                >
                  <th scope="row" className="border-b border-mist px-4 py-3 text-left font-semibold text-navy">
                    {r[0]}
                    {picked && <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-slate">yours</span>}
                  </th>
                  {r.slice(1).map((v, j) => (
                    <td key={j} className={`border-b border-mist px-4 py-3 ${picked ? 'font-semibold text-navy' : 'text-slate'}`}>
                      {v}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/**
 * How to measure, shown rather than written: a picture of the front of a
 * garment with the shoulder, sleeve, chest and length marked on it, and one of
 * the back. The pictures are the shop's own, set in the admin under Size
 * guide, so they can be replaced without touching the code.
 *
 * Each sits on the cream of the site through a multiply blend, so a picture
 * drawn on white takes the tile's colour instead of showing a white box.
 */
export function HowToMeasure() {
  const c = useContent('sizeGuide');
  const images = (Array.isArray(c.measureImages) ? c.measureImages : []).filter(Boolean);
  if (!images.length) return null;
  const VIEW = ['front', 'back'];

  return (
    <section aria-labelledby="how-to-measure">
      <h3 id="how-to-measure" className="flex items-center gap-2.5 font-display text-base font-semibold uppercase tracking-wider2 text-navy">
        <Ruler size={19} /> {c.measureTitle || 'How to measure'}
      </h3>
      {/* Side by side from a small tablet up; stacked on a phone, where two
          across leaves the labels drawn into the pictures too small to read. */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {images.map((src, i) => (
          <figure key={src + i} className="m-0 flex aspect-[5/4] items-center justify-center bg-cream p-2 sm:aspect-square sm:p-5">
            <img
              src={src}
              alt={`How to measure — ${VIEW[i] || `view ${i + 1}`} of the garment`}
              loading="lazy"
              decoding="async"
              className="max-h-full w-full object-contain mix-blend-multiply"
            />
          </figure>
        ))}
      </div>
    </section>
  );
}

/**
 * The size chart as a popup, so a shopper never has to leave the product they
 * are about to buy. `categorySlug` puts that garment's own table first, and
 * `selectedSize` highlights the row they already chose.
 */
export function SizeGuideModal({ open, onClose, categorySlug, selectedSize }) {
  const panelRef = useRef(null);
  const allTables = useSizeTables();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Move focus into the dialog so the keyboard goes with it.
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  /* Only the chart for the garment on screen. Showing a polo shirt shopper the
     oversized tee's numbers as well is three columns of measurements they have
     to rule out before trusting the ones they came for. Opened with no category
     — from the homepage — it still shows everything. */
  const matched = categorySlug ? allTables.filter((t) => t.slugs.includes(categorySlug)) : [];
  const tables = matched.length ? matched : allTables;
  const single = tables.length === 1;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close the size guide"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-navy-deep/60 animate-fade-in"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="size-guide-title"
        tabIndex={-1}
        className="relative flex max-h-[88vh] w-full max-w-3xl flex-col bg-white shadow-2xl outline-none animate-fade-up sm:max-h-[86vh]"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-mist px-5 py-4 sm:px-7">
          <div>
            <h2 id="size-guide-title" className="font-display text-base font-semibold uppercase tracking-wider2 text-navy">
              {single ? `${tables[0].name} — Size Guide` : 'Size Guide'}
            </h2>
            <p className="mt-1 text-[12.5px] text-slate">
              Measured on the garment laid flat, in inches. Allow about half an inch either way for knitted cotton.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 shrink-0 p-1.5 text-slate transition hover:text-navy"
          >
            <Close size={20} />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-9 overflow-y-auto px-5 py-6 sm:px-7">
          {tables.map((t) => (
            <SizeTable
              key={t.name}
              table={t}
              highlightSize={single ? selectedSize : null}
            />
          ))}

          <div className="border-t border-mist pt-7">
            <HowToMeasure />
          </div>
        </div>
      </div>
    </div>
  );
}
