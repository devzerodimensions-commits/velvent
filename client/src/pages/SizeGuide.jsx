import { Link } from 'react-router-dom';
import { Breadcrumbs, Seo } from '../components/ui';
import { HowToMeasure, SizeTable, useSizeTables } from '../components/SizeGuide';
import { useContent } from '../store/content';

/**
 * The full page. The product page shows the same charts in a popup instead, so
 * both read from SIZE_TABLES rather than keeping their own copy of the numbers.
 */
export default function SizeGuide() {
  const tables = useSizeTables();
  const c = useContent('sizeGuide');

  return (
    <>
      <Seo title={c.title} description={c.seoDescription} />
      <div className="shell py-8 sm:py-11">
        <Breadcrumbs items={[{ label: c.title }]} />
        <h1 className="h-section mt-4">{c.title}</h1>
        <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-slate">
          {c.intro}
        </p>

        {/* One chart per garment, then how to measure once for all of them —
            the pictures are the same for every chart, and showing them under
            each one would only repeat them. */}
        <div className="mt-10 space-y-14">
          {tables.map((t) => (
            <section key={t.name}>
              <SizeTable table={t} />
            </section>
          ))}
        </div>

        <div className="mt-14 border-t border-mist pt-10 lg:max-w-3xl">
          <HowToMeasure />
        </div>

        <section className="mt-14 border-t border-mist pt-10">
          <div className="border border-mist bg-cream p-7 lg:max-w-xl">
            <h2 className="font-display text-base font-semibold uppercase tracking-wider2 text-navy">{c.helpTitle}</h2>
            {(c.helpParagraphs || []).map((para, i) => (
              <p key={i} className="mt-3 text-[13.5px] leading-relaxed text-slate">{para}</p>
            ))}
            <Link to={c.helpCtaTo} className="btn-primary mt-6">{c.helpCtaLabel}</Link>
          </div>
        </section>
      </div>
    </>
  );
}
