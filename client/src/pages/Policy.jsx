import { Link } from 'react-router-dom';
import { Breadcrumbs, Seo } from '../components/ui';
import { Rich } from '../components/RichText';
import { useContent } from '../store/content';

/**
 * The four policy pages, all from the same shape: a title, an intro and a run
 * of sections, each a heading over bullet points. Everything is editable in
 * the admin, and points may quote live settings — `{fee}`, `{returnDays}` —
 * so a policy cannot quietly contradict what the checkout actually charges.
 */
export default function Policy({ kind }) {
  const page = useContent(kind);
  if (!page) return null;

  const { title, intro, sections = [], related = [] } = page;

  return (
    <>
      <Seo title={title} description={intro} />
      <div className="shell py-8 sm:py-11">
        <Breadcrumbs items={[{ label: title }]} />
        <h1 className="h-section mt-4">{title}</h1>
        <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-slate"><Rich>{intro}</Rich></p>

        <div className="mt-11 max-w-3xl space-y-10">
          {sections.map((section, i) => (
            <section key={section.heading || i}>
              <h2 className="font-display text-[15px] font-semibold uppercase tracking-wider2 text-navy">
                {section.heading}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {(section.points || []).map((p, j) => (
                  <li key={j} className="flex gap-3 text-[14px] leading-relaxed text-slate">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-navy" />
                    <span><Rich>{p}</Rich></span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {related.length > 0 && (
          <div className="mt-14 max-w-3xl border-t border-mist pt-8">
            <h2 className="eyebrow">Related</h2>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {related.map((r) => (
                <Link key={r.to} to={r.to} className="btn-ghost btn-sm">{r.label}</Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
