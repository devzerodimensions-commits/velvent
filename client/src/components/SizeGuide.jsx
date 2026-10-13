/**
 * The size chart, in one place.
 *
 * The /size-guide page and the popup on the product page render the same
 * tables from the same numbers, so a measurement can never be right in one
 * and stale in the other.
 */
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Close, Ruler } from './Icons';

/* Garment-flat measurements in inches. Body length is HPS (high point shoulder) to hem. */
export const SIZE_TABLES = [
  {
    name: 'Polo T-Shirt & Polo Shirt',
    note: 'Regular to relaxed fit. Take your usual size.',
    /** Category slugs this table applies to, so a product page can lead with the right one. */
    slugs: ['polo-t-shirt', 'polo-shirt'],
    rows: [
      ['S', 38, 27, 7.5, 17],
      ['M', 40, 28, 8, 17.5],
      ['L', 42, 29, 8.5, 18.5],
      ['XL', 44, 30, 9, 19.5],
      ['XXL', 46, 31, 9.5, 20.5],
      ['3XL', 48, 32, 10, 21.5],
    ],
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

export const HOW_TO_MEASURE = [
  ['Chest', 'Lay the garment flat and measure across one inch below the armhole, then seam to seam.'],
  ['Length', 'From the highest point of the shoulder straight down to the hem.'],
  ['Sleeve', 'From the shoulder seam to the sleeve opening.'],
  ['Shoulder', 'Across the back, from one shoulder seam to the other.'],
];

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

export function HowToMeasure() {
  return (
    <>
      <h3 className="flex items-center gap-2.5 font-display text-base font-semibold uppercase tracking-wider2 text-navy">
        <Ruler size={19} /> How to measure
      </h3>
      <dl className="mt-4 space-y-3.5 text-[13.5px] leading-relaxed">
        {HOW_TO_MEASURE.map(([k, v]) => (
          <div key={k}>
            <dt className="text-[11px] font-semibold uppercase tracking-wider2 text-navy">{k}</dt>
            <dd className="mt-1 text-slate">{v}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}

/**
 * The size chart as a popup, so a shopper never has to leave the product they
 * are about to buy. `categorySlug` puts that garment's own table first, and
 * `selectedSize` highlights the row they already chose.
 */
export function SizeGuideModal({ open, onClose, categorySlug, selectedSize }) {
  const panelRef = useRef(null);

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

  // Lead with the table for the garment being looked at.
  const tables = categorySlug
    ? [...SIZE_TABLES].sort((a, b) => Number(b.slugs.includes(categorySlug)) - Number(a.slugs.includes(categorySlug)))
    : SIZE_TABLES;
  const leadSlugMatches = categorySlug && tables[0]?.slugs.includes(categorySlug);

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
              Size Guide
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
          {tables.map((t, i) => (
            <SizeTable
              key={t.name}
              table={t}
              highlightSize={i === 0 && leadSlugMatches ? selectedSize : null}
            />
          ))}

          <div className="grid gap-7 border-t border-mist pt-7 sm:grid-cols-2">
            <div><HowToMeasure /></div>
            <div className="border border-mist bg-cream p-5">
              <h3 className="font-display text-base font-semibold uppercase tracking-wider2 text-navy">Between two sizes?</h3>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-slate">
                For polos and polo shirts, take the larger size — knitted cotton sits better with a
                little room. For oversized tees, take the smaller one unless you want it genuinely loose.
              </p>
              <Link to="/contact" onClick={onClose} className="btn-primary btn-sm mt-5">Ask us</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
