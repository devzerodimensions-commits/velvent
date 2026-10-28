import { Link } from 'react-router-dom';
import { Breadcrumbs, Seo } from '../components/ui';
import { HowToMeasure, SizeTable, useSizeTables } from '../components/SizeGuide';

/**
 * The full page. The product page shows the same charts in a popup instead, so
 * both read from SIZE_TABLES rather than keeping their own copy of the numbers.
 */
export default function SizeGuide() {
  const tables = useSizeTables();

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

        {/* Each garment carries its own chart and its own measuring notes —
            a dropped shoulder is not measured the way a set-in sleeve is. */}
        <div className="mt-10 space-y-14">
          {tables.map((t) => (
            <section key={t.name}>
              <SizeTable table={t} />
              <div className="mt-7 border-t border-mist pt-6">
                <HowToMeasure steps={t.howTo} collar={t.collar !== false} />
              </div>
            </section>
          ))}
        </div>

        <section className="mt-14 border-t border-mist pt-10">
          <div className="border border-mist bg-cream p-7 lg:max-w-xl">
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
