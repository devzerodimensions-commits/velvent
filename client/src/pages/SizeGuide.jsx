import { Link } from 'react-router-dom';
import { Breadcrumbs, Seo } from '../components/ui';
import { Ruler } from '../components/Icons';

/* Garment-flat measurements in inches. Body length is HPS (high point shoulder) to hem. */
const TABLES = [
  {
    name: 'Polo T-Shirt & Polo Shirt',
    note: 'Regular to relaxed fit. Take your usual size.',
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

const HEADS = ['Size', 'Chest (in)', 'Length (in)', 'Sleeve (in)', 'Shoulder (in)'];

export default function SizeGuide() {
  return (
    <>
      <Seo title="Size Guide" description="VELVENT size chart for polo t-shirts, polo shirts and oversized tees, S through 3XL." />
      <div className="shell py-8 sm:py-11">
        <Breadcrumbs items={[{ label: 'Size Guide' }]} />
        <h1 className="h-section mt-4">Size Guide</h1>
        <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-slate">
          All measurements are taken on the garment laid flat, in inches. Allow about half an inch
          either way for knitted cotton.
        </p>

        <div className="mt-10 space-y-12">
          {TABLES.map((t) => (
            <section key={t.name}>
              <h2 className="font-display text-base font-semibold uppercase tracking-wider2 text-navy">{t.name}</h2>
              <p className="mt-1.5 text-[13px] text-slate">{t.note}</p>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[520px] border-collapse text-[13.5px]">
                  <thead>
                    <tr className="bg-navy text-cream">
                      {HEADS.map((h) => (
                        <th key={h} scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider2">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {t.rows.map((r, i) => (
                      <tr key={r[0]} className={i % 2 ? 'bg-cream/60' : 'bg-white'}>
                        <th scope="row" className="border-b border-mist px-4 py-3 text-left font-semibold text-navy">{r[0]}</th>
                        {r.slice(1).map((v, j) => (
                          <td key={j} className="border-b border-mist px-4 py-3 text-slate">{v}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>

        <section className="mt-14 grid gap-6 border-t border-mist pt-10 lg:grid-cols-2">
          <div>
            <h2 className="flex items-center gap-2.5 font-display text-base font-semibold uppercase tracking-wider2 text-navy">
              <Ruler size={20} /> How to measure
            </h2>
            <dl className="mt-5 space-y-4 text-[13.5px] leading-relaxed">
              {[
                ['Chest', 'Lay the garment flat and measure across one inch below the armhole, then seam to seam.'],
                ['Length', 'From the highest point of the shoulder straight down to the hem.'],
                ['Sleeve', 'From the shoulder seam to the sleeve opening.'],
                ['Shoulder', 'Across the back, from one shoulder seam to the other.'],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider2 text-navy">{k}</dt>
                  <dd className="mt-1 text-slate">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="border border-mist bg-cream p-7">
            <h2 className="font-display text-base font-semibold uppercase tracking-wider2 text-navy">Between two sizes?</h2>
            <p className="mt-3 text-[13.5px] leading-relaxed text-slate">
              For polos and polo shirts, take the larger size — knitted cotton sits better with a
              little room. For oversized tees, take the smaller one unless you want it genuinely loose.
            </p>
            <p className="mt-3 text-[13.5px] leading-relaxed text-slate">
              Still unsure? Send us your chest measurement and we will tell you what to order.
            </p>
            <Link to="/contact" className="btn-primary mt-6">Ask us</Link>
          </div>
        </section>
      </div>
    </>
  );
}
