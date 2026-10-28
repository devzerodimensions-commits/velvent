import { Link } from 'react-router-dom';
import { Breadcrumbs, Seo } from '../components/ui';
import { Mark } from '../components/Logo';
import { Rich } from '../components/RichText';
import { useContent } from '../store/content';

export default function About() {
  const brand = useContent('brand');
  const c = useContent('about');

  return (
    <>
      <Seo title={c.seoTitle} description={c.seoDescription} />

      <section className="relative isolate overflow-hidden bg-navy text-cream">
        <img
          src={c.heroImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-top opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-deep/80 to-navy-deep/95" />
        <div className="shell relative flex flex-col items-center py-24 text-center sm:py-32">
          <Mark className="h-14 w-auto text-cream" />
          <h1 className="mt-9 font-display text-3xl font-semibold uppercase leading-tight tracking-wider2 sm:text-4xl">
            {c.heroTitle}
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-cream/75">{brand.tagline}</p>
        </div>
      </section>

      <div className="shell py-6">
        <Breadcrumbs items={[{ label: 'About' }]} />
      </div>

      <section className="shell grid gap-12 py-10 lg:grid-cols-2 lg:gap-20 lg:py-16">
        <div>
          <p className="eyebrow">{c.storyEyebrow}</p>
          <h2 className="h-section mt-3">{c.storyTitle}</h2>
          <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-slate">
            {(c.storyParagraphs || []).map((p, i) => <p key={i}><Rich>{p}</Rich></p>)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {(c.storyImages || []).map((src, i) => (
            <img
              key={src + i}
              src={src}
              alt=""
              loading="lazy"
              className={`w-full bg-cream object-cover ${i % 3 === 0 ? 'aspect-[3/4]' : 'aspect-square'}`}
            />
          ))}
        </div>
      </section>

      <section className="bg-cream">
        <div className="shell py-16 sm:py-20">
          <p className="eyebrow">{c.valuesEyebrow}</p>
          <h2 className="h-section mt-3">{c.valuesTitle}</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {(c.values || []).map((v, i) => (
              <div key={v.title || i}>
                <span className="font-display text-[11px] font-bold tracking-brand text-slate-light">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-3 font-display text-base font-semibold uppercase tracking-wider2 text-navy">{v.title}</h3>
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-slate">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="shell py-16 text-center sm:py-20">
        <p className="eyebrow">{c.closeEyebrow}</p>
        <h2 className="mt-4 font-display text-2xl font-semibold uppercase tracking-brand text-navy sm:text-3xl">
          {brand.motto}
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-[14.5px] leading-relaxed text-slate">
          <Rich>{c.closeBody}</Rich>
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link to={c.ctaPrimaryTo} className="btn-primary">{c.ctaPrimaryLabel}</Link>
          <Link to={c.ctaSecondaryTo} className="btn-outline">{c.ctaSecondaryLabel}</Link>
        </div>
      </section>
    </>
  );
}
