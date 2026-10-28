/**
 * The size chart, in one place.
 *
 * The /size-guide page and the popup on the product page render the same
 * tables from the same numbers, so a measurement can never be right in one
 * and stale in the other.
 */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Close, Ruler } from './Icons';
import { api } from '../lib/api';

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
    collar: true,
    rows: POLO_ROWS,
    howTo: [
      ['Chest', 'Lay the polo flat and measure across one inch below the armhole, then seam to seam.'],
      ['Length', 'From the highest point of the shoulder straight down to the hem.'],
      ['Sleeve', 'From the shoulder seam to the sleeve opening.'],
      ['Shoulder', 'Across the back, from one shoulder seam to the other.'],
    ],
  },
  {
    name: 'Polo Shirt',
    note: 'Button-through with an open camp collar. Relaxed through the body.',
    slugs: ['polo-shirt'],
    collar: true,
    rows: POLO_ROWS,
    howTo: [
      ['Chest', 'Fasten the buttons first, then lay the shirt flat and measure one inch below the armhole, seam to seam.'],
      ['Length', 'From the highest point of the shoulder down to the hem, with the placket closed.'],
      ['Sleeve', 'From the shoulder seam to the sleeve opening.'],
      ['Shoulder', 'Across the back, from one shoulder seam to the other. The camp collar sits open, so this is measured at the seam rather than at the neck.'],
    ],
  },
  {
    name: 'Oversized T-Shirt',
    note: 'Cut deliberately boxy with a dropped shoulder. Size down for a closer fit.',
    slugs: ['oversized-t-shirt'],
    collar: false,
    rows: [
      ['S', 42, 27, 8.5, 20],
      ['M', 44, 28, 9, 21],
      ['L', 46, 29, 9.5, 22],
      ['XL', 48, 30, 10, 23],
      ['XXL', 50, 31, 10.5, 24],
      ['3XL', 52, 32, 11, 25],
    ],
    howTo: [
      ['Chest', 'Lay the tee flat and measure across one inch below the armhole, then seam to seam.'],
      ['Length', 'From the highest point of the shoulder straight down to the hem. These run longer than a regular tee.'],
      ['Sleeve', 'From the shoulder seam to the sleeve opening. The seam sits down the arm, so the sleeve wears shorter than the number reads.'],
      ['Shoulder', 'Across the back, seam to seam. On a dropped shoulder this is wider than your own shoulders by design — compare it with a tee you already wear loose rather than against your body.'],
    ],
  },
];

export const SIZE_HEADS = ['Size', 'Chest (in)', 'Length (in)', 'Sleeve (in)', 'Shoulder (in)'];

/** Used where no single garment is in view, such as the whole-chart popup. */
export const HOW_TO_MEASURE = [
  ['Chest', 'Lay the garment flat and measure across one inch below the armhole, then seam to seam.'],
  ['Length', 'From the highest point of the shoulder straight down to the hem.'],
  ['Sleeve', 'From the shoulder seam to the sleeve opening.'],
  ['Shoulder', 'Across the back, from one shoulder seam to the other.'],
];

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
            howTo: c.size_chart.howTo?.length ? c.size_chart.howTo : HOW_TO_MEASURE,
            // Which neckline the diagram draws is a property of the garment,
            // not of the numbers, so it stays with the built-in definition.
            collar: SIZE_TABLES.find((t) => t.slugs.includes(c.slug))?.collar !== false,
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
 * The four measurements drawn on a garment laid flat, so the words have
 * something to point at.
 *
 * Deliberately line art rather than a photograph: it stays sharp at any size,
 * the lines land exactly where the measurement is taken, and it does not depend
 * on photography we do not have. `collar` draws the polo placket; without it
 * the neckline is the plain crew of the oversized tee.
 */
export function MeasureDiagram({ collar = true, className = '' }) {
  return (
    <svg viewBox="0 0 320 300" className={className} role="img" aria-label="A garment laid flat, with the chest, length, sleeve and shoulder measurements marked">
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" className="text-navy">
        <path d="M140 62 Q160 82 180 62 L202 62 L238 84 L222 136 L198 124 L198 262 L122 262 L122 124 L98 136 L82 84 L118 62 Z" />
        {collar && (
          <>
            <path d="M140 62 L152 92 L160 84 L168 92 L180 62" strokeWidth="1.2" />
            <path d="M160 84 L160 120" strokeWidth="1.2" />
          </>
        )}
      </g>

      {/* the measurements themselves */}
      <g stroke="currentColor" strokeWidth="1.1" strokeDasharray="4 3" className="text-slate">
        <path d="M118 44 L202 44" />
        <path d="M118 44 L118 62 M202 44 L202 62" strokeDasharray="0" strokeWidth="0.9" />
        <path d="M122 156 L198 156" />
        <path d="M268 62 L268 262" />
        <path d="M206 58 L232 104" />
      </g>

      <g className="fill-navy text-[9px] font-semibold uppercase tracking-[0.18em]" style={{ fontSize: 9 }}>
        <text x="160" y="36" textAnchor="middle">Shoulder</text>
        <text x="160" y="148" textAnchor="middle" className="fill-navy">Chest</text>
        <text x="276" y="166" writingMode="tb" letterSpacing="2">Length</text>
        <text x="236" y="114">Sleeve</text>
      </g>

      {/* ticks closing the length line */}
      <g stroke="currentColor" strokeWidth="0.9" className="text-slate">
        <path d="M262 62 L274 62 M262 262 L274 262" />
        <path d="M122 150 L122 162 M198 150 L198 162" />
      </g>
    </svg>
  );
}

/**
 * `steps` lets each garment explain its own measurements — a dropped shoulder
 * is not measured with the same expectations as a set-in sleeve. Falls back to
 * the generic wording where no single garment is in view. `collar` picks which
 * neckline the diagram draws.
 */
export function HowToMeasure({ steps = HOW_TO_MEASURE, collar = true }) {
  return (
    <>
      <h3 className="flex items-center gap-2.5 font-display text-base font-semibold uppercase tracking-wider2 text-navy">
        <Ruler size={19} /> How to measure
      </h3>

      <MeasureDiagram collar={collar} className="mt-4 w-full max-w-[260px]" />

      <dl className="mt-4 space-y-3.5 text-[13.5px] leading-relaxed">
        {steps.map(([k, v]) => (
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

          <div className="grid gap-7 border-t border-mist pt-7 sm:grid-cols-2">
            <div>
              <HowToMeasure
                steps={single ? tables[0].howTo : HOW_TO_MEASURE}
                collar={single ? tables[0].collar !== false : true}
              />
            </div>
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
