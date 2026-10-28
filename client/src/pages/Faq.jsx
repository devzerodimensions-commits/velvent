import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Accordion, Breadcrumbs, Seo } from '../components/ui';
import { Rich } from '../components/RichText';
import { useContent } from '../store/content';

export default function Faq() {
  const { title, intro, groups = [], stuckTitle, stuckBody, stuckCtaLabel } = useContent('faq');

  /* The accordion takes rendered bodies, so each answer is wrapped once here
     rather than on every open and close. */
  const rendered = useMemo(
    () => groups.map((g) => ({
      heading: g.heading,
      items: (g.items || []).map((item) => ({
        title: item.title,
        body: <p><Rich>{item.body}</Rich></p>,
      })),
    })),
    [groups],
  );

  return (
    <>
      <Seo title="FAQs" description="Answers on VELVENT shipping, returns, sizing, payment and fabric care." />
      <div className="shell py-8 sm:py-11">
        <Breadcrumbs items={[{ label: 'FAQs' }]} />
        <h1 className="h-section mt-4">{title}</h1>
        <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-slate">
          <Rich className="font-semibold text-navy underline">{intro}</Rich>
        </p>

        <div className="mt-12 max-w-3xl space-y-12">
          {rendered.map((g, i) => (
            <section key={g.heading || i}>
              <h2 className="eyebrow mb-4">{g.heading}</h2>
              <Accordion items={g.items} defaultOpen={-1} />
            </section>
          ))}
        </div>

        <div className="mt-14 max-w-3xl border border-mist bg-cream p-8 text-center">
          <h2 className="font-display text-lg font-semibold uppercase tracking-wider2 text-navy">{stuckTitle}</h2>
          <p className="mt-2.5 text-[13.5px] text-slate"><Rich>{stuckBody}</Rich></p>
          <Link to="/contact" className="btn-primary mt-6">{stuckCtaLabel}</Link>
        </div>
      </div>
    </>
  );
}
