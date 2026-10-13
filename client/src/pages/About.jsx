import { Link } from 'react-router-dom';
import { Breadcrumbs, Seo } from '../components/ui';
import { Mark } from '../components/Logo';
import { BRAND } from '../lib/brand';

const VALUES = [
  { title: 'Premium', body: 'One fabric, done properly. Knitted cotton that holds its shape, its colour and its collar.' },
  { title: 'Modern', body: 'Cuts drawn for how people actually dress now — relaxed where it should be, clean everywhere else.' },
  { title: 'Timeless', body: 'Nothing engineered to look dated in six months. Stripes, solids and texture that keep working.' },
  { title: 'Minimal', body: 'No loud logos. The mark sits quietly on the collar, the label and nowhere it is not wanted.' },
];

export default function About() {
  return (
    <>
      <Seo
        title="Our Story"
        description="VELVENT is a premium clothing label built on knitted cotton — modern, minimal and made to last."
      />

      <section className="relative isolate overflow-hidden bg-navy text-cream">
        <img
          src="/products/cable-knit-polo-green-1.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-top opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-deep/80 to-navy-deep/95" />
        <div className="shell relative flex flex-col items-center py-24 text-center sm:py-32">
          <Mark className="h-14 w-auto text-cream" />
          <h1 className="mt-9 font-display text-3xl font-semibold uppercase leading-tight tracking-wider2 sm:text-4xl">
            Crafted for Confidence
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-cream/75">{BRAND.tagline}</p>
        </div>
      </section>

      <div className="shell py-6">
        <Breadcrumbs items={[{ label: 'About' }]} />
      </div>

      <section className="shell grid gap-12 py-10 lg:grid-cols-2 lg:gap-20 lg:py-16">
        <div>
          <p className="eyebrow">The beginning</p>
          <h2 className="h-section mt-3">Why we started</h2>
          <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-slate">
            <p>
              VELVENT began with a simple frustration: the polo is the most-worn shirt in an Indian
              wardrobe, and almost nobody makes it well at a fair price. Collars go limp. Stripes
              drift out of line at the seam. Colour washes out by the third month.
            </p>
            <p>
              So we picked one fabric — knitted cotton — and stayed with it. Every piece we make
              starts from the same test: will this still look right after fifty washes? If the
              answer is no, it does not ship.
            </p>
            <p>
              What came out of that is a short, deliberate range. Knitted polos with collars that
              hold. Button-through shirts you can wear to dinner. Heavyweight oversized tees that
              keep their shape instead of growing a size every wash.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            '/products/rugby-stripe-polo-1.jpg',
            '/products/coastal-stripe-polo-2.jpg',
            '/products/vertical-stripe-shirt-olive-1.jpg',
            '/products/cable-knit-polo-burgundy-1.jpg',
          ].map((src, i) => (
            <img
              key={src}
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
          <p className="eyebrow">What we stand for</p>
          <h2 className="h-section mt-3">Brand personality</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v, i) => (
              <div key={v.title}>
                <span className="font-display text-[11px] font-bold tracking-brand text-slate-light">
                  0{i + 1}
                </span>
                <h3 className="mt-3 font-display text-base font-semibold uppercase tracking-wider2 text-navy">{v.title}</h3>
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-slate">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="shell py-16 text-center sm:py-20">
        <p className="eyebrow">The promise</p>
        <h2 className="mt-4 font-display text-2xl font-semibold uppercase tracking-brand text-navy sm:text-3xl">
          {BRAND.motto}
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-[14.5px] leading-relaxed text-slate">
          Three categories. Six sizes, S through 3XL. One standard of make.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link to="/shop" className="btn-primary">Shop the collection</Link>
          <Link to="/contact" className="btn-outline">Talk to us</Link>
        </div>
      </section>
    </>
  );
}
