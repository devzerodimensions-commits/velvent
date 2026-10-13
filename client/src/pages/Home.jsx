import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard';
import Newsletter from '../components/Newsletter';
import { Mark } from '../components/Logo';
import { Accordion, SectionHead, Seo } from '../components/ui';
import { Bag, ChevronDown, Refresh, Ruler, Rupee, Shield, Truck } from '../components/Icons';
import { api } from '../lib/api';
import { BRAND } from '../lib/brand';
import { SIZE_ORDER, inr } from '../lib/format';

const PROMISES = [
  { Icon: Truck, title: 'Free shipping', body: `On prepaid orders above ₹${BRAND.shipping.freeAbove}` },
  { Icon: Refresh, title: `${BRAND.shipping.returnDays}-day returns`, body: 'Free exchange on size and fit' },
  { Icon: Rupee, title: 'Cash on delivery', body: 'Pay when the parcel reaches you' },
  { Icon: Shield, title: 'Secure checkout', body: 'UPI, cards and net banking' },
];

/* --------------------------------------------------------------------- hero */

function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-navy">
      <img
        src="/products/rugby-stripe-polo-1.jpg"
        alt="Model wearing the VELVENT Rugby Stripe Knitted Polo"
        className="absolute inset-0 h-full w-full object-cover object-[center_26%] opacity-[0.62]"
        fetchpriority="high"
      />
      {/* narrow screens wrap the copy across the full width, so they need a flat scrim too —
          the left-to-right gradient alone only protects contrast on wide layouts */}
      <div className="absolute inset-0 bg-navy-deep/55 lg:hidden" />
      <div className="absolute inset-0 bg-gradient-to-r from-navy-deep/92 via-navy-deep/55 to-navy-deep/10" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-navy-deep/70 to-transparent" />

      <div className="pointer-events-none absolute left-4 top-0 hidden h-full flex-col items-center gap-5 pt-24 lg:flex">
        <span className="h-20 w-px bg-cream/30" />
        <span className="text-[10px] font-semibold uppercase tracking-brand text-cream/50 [writing-mode:vertical-rl]">
          Autumn Knitwear — 01
        </span>
      </div>

      <div className="shell relative flex min-h-[86vh] items-center py-24">
        <div className="max-w-xl animate-fade-up text-cream">
          <p className="eyebrow text-cream/70">Knitted cotton, done properly</p>
          <h1 className="mt-6 font-display text-[2.6rem] font-semibold uppercase leading-[1.04] tracking-wide text-balance sm:text-6xl lg:text-[4.25rem]">
            Crafted for<br />Confidence
          </h1>
          <p className="mt-7 max-w-md text-[15px] leading-relaxed text-cream/80">
            Polos, button-through shirts and heavyweight oversized tees — built from one fabric
            we actually understand, and cut to sit right.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to="/shop" className="btn-cream">Shop the collection</Link>
            <Link to="/category/polo-t-shirt" className="btn border border-cream/50 text-cream hover:bg-cream hover:text-navy">
              Polo T-Shirts
            </Link>
          </div>
          <p className="mt-10 text-[11px] font-semibold uppercase tracking-brand text-cream/55">
            Flat 33% off · ₹1,499 <span className="mx-1.5">→</span> ₹1,005
          </p>
        </div>
      </div>

      <Link
        to="/product/rugby-stripe-knitted-polo"
        className="group absolute bottom-6 right-4 hidden items-center gap-3 border border-cream/25 bg-navy-deep/55 px-4 py-3 backdrop-blur transition hover:border-cream/60 sm:flex lg:right-8"
      >
        <img src="/products/rugby-stripe-polo-1.jpg" alt="" className="h-12 w-9 object-cover" />
        <span className="text-cream">
          <span className="block text-[9.5px] font-semibold uppercase tracking-brand text-cream/55">Shown here</span>
          <span className="mt-1 block text-[12px] font-medium">Rugby Stripe Knitted Polo</span>
          <span className="text-[11px] text-cream/70">{inr(1005)}</span>
        </span>
        <ChevronDown size={16} className="-rotate-90 text-cream/50 transition group-hover:translate-x-0.5 group-hover:text-cream" />
      </Link>
    </section>
  );
}

function Promises() {
  return (
    <section className="border-b border-mist bg-cream">
      <div className="shell grid grid-cols-2 gap-x-6 gap-y-7 py-9 lg:grid-cols-4">
        {PROMISES.map(({ Icon, title, body }) => (
          <div key={title} className="flex items-start gap-3.5">
            <Icon size={24} className="mt-0.5 shrink-0 text-navy" />
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-wider2 text-navy">{title}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-slate">{body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Categories({ categories, loading }) {
  return (
    <section className="shell py-16 sm:py-20">
      <SectionHead eyebrow="Three ways to wear it" title="Shop by Category" action="View all" actionTo="/shop" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? [0, 1, 2].map((i) => <div key={i} className="skeleton aspect-[4/5]" />)
          : categories.map((c, i) => (
            <Link key={c.id} to={`/category/${c.slug}`} className="group relative isolate block overflow-hidden bg-cream">
              <div className="aspect-[4/5] w-full overflow-hidden">
                <img
                  src={c.image_url}
                  alt={c.name}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/85 via-navy-deep/15 to-transparent" />
              <span className="absolute left-5 top-5 font-display text-[11px] font-bold tracking-brand text-cream/60">
                0{i + 1}
              </span>
              <div className="absolute inset-x-0 bottom-0 p-6 text-cream">
                <p className="text-[10px] font-medium uppercase tracking-brand text-cream/65">{c.tagline}</p>
                <h3 className="mt-2 font-display text-xl font-semibold uppercase tracking-wider2">{c.name}</h3>
                <p className="mt-2.5 text-[11px] uppercase tracking-wider2 text-cream/75">
                  {c.product_count} {Number(c.product_count) === 1 ? 'style' : 'styles'}
                  <span className="ml-2.5 inline-block transition-transform duration-300 group-hover:translate-x-1.5">→</span>
                </p>
              </div>
            </Link>
          ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- marquee band */

const MARQUEE_WORDS = ['Simple', 'Timeless', 'Premium', 'Knitted Cotton', 'Sizes S–3XL'];

function Marquee() {
  const strip = (
    <div className="flex shrink-0 items-center" aria-hidden>
      {MARQUEE_WORDS.map((word) => (
        <span key={word} className="flex items-center">
          <span className="whitespace-nowrap px-7 font-display text-base font-medium uppercase tracking-brand text-navy sm:px-9 sm:text-lg lg:text-xl">
            {word}
          </span>
          <Mark className="h-4 w-auto shrink-0 text-navy/30 sm:h-[18px]" />
        </span>
      ))}
    </div>
  );
  return (
    <section className="overflow-hidden border-y border-mist bg-cream py-5 sm:py-6">
      <h2 className="sr-only">{MARQUEE_WORDS.join('. ')}.</h2>
      {/* shorter words than before, so the shared 28s keyframe would crawl — pace it here */}
      <div
        className="flex w-max animate-marquee pause-hover"
        style={{ animationDuration: '24s' }}
      >
        {strip}{strip}
      </div>
    </section>
  );
}

/* --------------------------------------------------------- the anatomy ---- */

/* Every marker below sits on one real garment — the Cable Knit Contrast Polo — and each
   close-up is cropped from that same photograph, so a marker always points at the thing
   it describes. x/y are percentages of the photo. */
const GARMENT = {
  slug: 'cable-knit-contrast-polo',
  name: 'Cable Knit Contrast Polo',
  photo: '/products/cable-knit-polo-green-1.jpg',
};

const POINTS = [
  {
    x: 38.5,
    y: 30,
    crop: '/products/anatomy-collar.jpg',
    label: 'Collar',
    title: 'Knitted in, not stitched on',
    body: 'The contrast collar and its white tipping are knitted as part of the garment rather than sewn on afterwards, so the edge stays flat instead of curling away after a few washes.',
  },
  {
    x: 49.5,
    y: 40,
    crop: '/products/anatomy-placket.jpg',
    label: 'Placket',
    title: 'Three buttons, set to sit flat',
    body: 'A reinforced placket with the buttons spaced so the opening lies closed without pulling. It is the difference between a polo that hangs cleanly and one that gapes at the chest.',
  },
  {
    x: 36,
    y: 58.5,
    crop: '/products/anatomy-cable.jpg',
    label: 'Cable panel',
    title: 'Texture that catches the light',
    body: 'Vertical cables run the full length of the body. Slower on the machine and hungrier for yarn than a flat knit — which is precisely why it reads the way it does in daylight.',
  },
  {
    x: 47,
    y: 76.5,
    crop: '/products/anatomy-hem.jpg',
    label: 'Hem',
    title: 'Ribbed to hold its shape',
    body: 'A ribbed hem band grips lightly at the waist so the body keeps its line instead of flaring out. The same rib finishes both sleeve openings.',
  },
];

function Anatomy() {
  const [active, setActive] = useState(0);
  const point = POINTS[active];

  return (
    <section className="border-y border-mist bg-cream">
      <div className="shell py-16 sm:py-20">
        <div className="max-w-2xl">
          <p className="eyebrow">Why it costs what it costs</p>
          <h2 className="mt-3 font-display text-3xl font-semibold uppercase leading-[1.08] tracking-wider2 text-navy sm:text-[2.5rem]">
            Anatomy of a polo
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-slate">
            Most of what you pay for is invisible from two metres away. Tap a point on the{' '}
            {GARMENT.name} to see it from twenty centimetres.
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] lg:gap-16">
          {/* the garment, with the markers laid over it */}
          <div className="relative mx-auto w-full max-w-sm overflow-hidden bg-white lg:max-w-none">
            <img src={GARMENT.photo} alt={GARMENT.name} loading="lazy" className="w-full object-cover" />

            {POINTS.map((pt, i) => {
              const on = i === active;
              return (
                <button
                  key={pt.label}
                  type="button"
                  onClick={() => setActive(i)}
                  onMouseEnter={() => setActive(i)}
                  aria-label={`${pt.label}: ${pt.title}`}
                  aria-pressed={on}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                >
                  <span className="relative grid h-9 w-9 place-items-center">
                    {on && <span className="absolute inset-0 animate-ping rounded-full bg-cream/70" />}
                    <span
                      className={`relative grid h-7 w-7 place-items-center rounded-full font-display text-[11px] font-bold shadow-md ring-2 transition sm:h-8 sm:w-8 sm:text-[12px] ${
                        on ? 'bg-navy text-cream ring-cream' : 'bg-cream/90 text-navy ring-navy/20 hover:bg-white'
                      }`}
                    >
                      {i + 1}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* the close-up and copy for whichever point is active */}
          <div className="flex flex-col">
            <div className="flex gap-5">
              <img
                key={point.crop}
                src={point.crop}
                alt={point.title}
                loading="lazy"
                className="h-28 w-28 shrink-0 animate-fade-in border border-mist object-cover sm:h-36 sm:w-36"
              />
              <div className="min-w-0 pt-1">
                <p className="text-[10px] font-semibold uppercase tracking-brand text-slate-light">
                  {String(active + 1).padStart(2, '0')} — {point.label}
                </p>
                <h3 className="mt-2.5 font-display text-lg font-semibold leading-snug text-navy sm:text-xl">
                  {point.title}
                </h3>
              </div>
            </div>

            <p className="mt-6 text-[14.5px] leading-relaxed text-slate">{point.body}</p>

            {/* the same four points as a list, so this works without hunting for markers */}
            <ul className="mt-8 grid grid-cols-2 gap-2.5 border-t border-mist pt-7 sm:grid-cols-4">
              {POINTS.map((pt, i) => (
                <li key={pt.label}>
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    aria-pressed={i === active}
                    className={`w-full border px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider transition ${
                      i === active ? 'border-navy bg-navy text-cream' : 'border-mist bg-white text-navy hover:border-navy'
                    }`}
                  >
                    <span className="opacity-55">{String(i + 1).padStart(2, '0')}</span>
                    <span className="mt-1 block">{pt.label}</span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to={`/product/${GARMENT.slug}`} className="btn-primary">
                <Bag size={17} /> Shop this polo
              </Link>
              <Link to="/shop" className="btn-outline">See the range</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ fit guide ---- */

const FITS = [
  {
    slug: 'polo-t-shirt',
    name: 'Polo T-Shirt',
    fit: 'Regular',
    collar: 'Ribbed polo collar',
    best: 'Office, dinner, every day',
    note: 'True to size. Take your usual.',
    img: '/products/coastal-stripe-polo-1.jpg',
  },
  {
    slug: 'polo-shirt',
    name: 'Polo Shirt',
    fit: 'Relaxed',
    collar: 'Open camp collar, full placket',
    best: 'Evenings, travel, dressed-up days',
    note: 'Sits loose through the chest. Straight hem — wear it untucked.',
    img: '/products/vertical-stripe-shirt-olive-1.jpg',
  },
  {
    slug: 'oversized-t-shirt',
    name: 'Oversized T-Shirt',
    fit: 'Oversized',
    collar: 'Ribbed crew neck',
    best: 'Weekends, layering, doing nothing',
    note: 'Deliberately boxy with a dropped shoulder. Size down for a closer fit.',
    img: '/products/essential-oversized-tee-navy.svg',
  },
];

function FitGuide() {
  return (
    <section className="bg-navy text-cream">
      <div className="shell py-20 sm:py-24">
        <div className="max-w-2xl">
          <p className="eyebrow text-cream/55">Before you pick a size</p>
          <h2 className="mt-3 font-display text-3xl font-semibold uppercase leading-[1.08] tracking-wider2 sm:text-[2.5rem]">
            Which fit is for you?
          </h2>
          <p className="mt-6 text-[15px] leading-relaxed text-cream/70">
            Three cuts, three different jobs. Every one of them is made in all six sizes — not just
            the safe middle three.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {FITS.map((f) => (
            <Link
              key={f.slug}
              to={`/category/${f.slug}`}
              className="group flex flex-col border border-cream/15 bg-cream/[0.04] transition hover:border-cream/45 hover:bg-cream/[0.08]"
            >
              <div className="aspect-[5/4] overflow-hidden bg-navy-deep/40">
                <img
                  src={f.img}
                  alt={f.name}
                  loading="lazy"
                  className="h-full w-full object-cover object-top transition-transform duration-[900ms] group-hover:scale-105"
                />
              </div>

              <div className="flex flex-1 flex-col p-6">
                <h3 className="font-display text-lg font-semibold uppercase tracking-wider2">{f.name}</h3>

                <dl className="mt-5 space-y-3 border-t border-cream/15 pt-5 text-[13px]">
                  {[['Fit', f.fit], ['Collar', f.collar], ['Best for', f.best]].map(([k, v]) => (
                    <div key={k} className="flex gap-4">
                      <dt className="w-[72px] shrink-0 text-[10px] font-semibold uppercase tracking-wider2 text-cream/45">{k}</dt>
                      <dd className="text-cream/85">{v}</dd>
                    </div>
                  ))}
                </dl>

                <p className="mt-5 text-[13px] leading-relaxed text-cream/60">{f.note}</p>

                <span className="mt-6 inline-flex items-center gap-2 pt-1 text-[11px] font-semibold uppercase tracking-wider2 text-cream">
                  Shop {f.name}
                  <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-7 border-t border-cream/15 pt-10 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold uppercase tracking-wider2">Every style, S through 3XL</h3>
            <p className="mt-2 text-[13.5px] text-cream/65">Pick a size to see everything in stock.</p>
          </div>

          <ul className="grid grid-cols-6 gap-2.5 lg:w-[460px]">
            {SIZE_ORDER.map((s) => (
              <li key={s}>
                <Link
                  to={`/shop?size=${s}`}
                  className="flex aspect-square items-center justify-center border border-cream/25 font-display text-[13px] font-semibold tracking-wider text-cream/85 transition hover:border-cream hover:bg-cream hover:text-navy sm:text-base"
                >
                  {s}
                </Link>
              </li>
            ))}
          </ul>

          <Link to="/size-guide" className="btn-cream shrink-0"><Ruler size={17} /> Size guide</Link>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- rails etc. */

function Rail({ eyebrow, title, products, loading, action, actionTo }) {
  if (!loading && !products.length) return null;
  return (
    <section className="shell py-16 sm:py-20">
      <SectionHead eyebrow={eyebrow} title={title} action={action} actionTo={actionTo} />
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
        {loading
          ? [0, 1, 2, 3].map((i) => <ProductCardSkeleton key={i} />)
          : products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}

function StoryBand() {
  return (
    <section className="border-y border-mist bg-cream">
      <div className="grid lg:grid-cols-2">
        <div className="order-2 flex items-center px-6 py-16 sm:px-12 lg:order-1 lg:py-24 lg:pl-[max(2.5rem,calc((100vw-1440px)/2+2.5rem))]">
          <div className="max-w-md">
            <Mark className="h-11 w-auto text-navy" />
            <p className="eyebrow mt-7">The brand</p>
            <h2 className="mt-3 font-display text-2xl font-semibold uppercase leading-snug tracking-wider2 text-navy sm:text-3xl">
              Simple. Timeless.<br />Premium.
            </h2>
            <p className="mt-6 text-[15px] leading-relaxed text-slate">
              VELVENT is built on one fabric done properly: knitted cotton. Every polo, shirt
              and tee starts from the same question — will this still look right after fifty washes?
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-slate">
              Collars that hold their shape. Stripes that line up at the seam. Colour that settles
              instead of fading. Nothing loud, nothing disposable.
            </p>
            <Link to="/about" className="btn-primary mt-9">Read our story</Link>
          </div>
        </div>

        <div className="order-1 grid grid-cols-2 gap-px bg-mist lg:order-2">
          {[
            '/products/cable-knit-polo-green-1.jpg',
            '/products/vertical-stripe-shirt-olive-1.jpg',
            '/products/coastal-stripe-polo-1.jpg',
            '/products/cable-knit-polo-burgundy-1.jpg',
          ].map((src) => (
            <img key={src} src={src} alt="" loading="lazy" className="aspect-square w-full object-cover" />
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------- faq */

const HOME_FAQ = [
  {
    title: 'How long will my order take?',
    body: (
      <p>
        We dispatch within {BRAND.shipping.dispatchDays} and delivery usually takes{' '}
        {BRAND.shipping.deliveryDays}, depending on your PIN code. You can follow it on the{' '}
        <Link to="/track-order" className="underline">Track Order</Link> page with just your order
        number and email.
      </p>
    ),
  },
  {
    title: 'What if the size is wrong?',
    body: (
      <p>
        Size exchanges are free within {BRAND.shipping.returnDays} days of delivery, subject to
        stock. Call or message us and we will arrange the pickup and send the replacement.
      </p>
    ),
  },
  {
    title: 'Can I pay cash on delivery?',
    body: <p>Yes, nationwide and at no extra charge. Prepaid orders above {inr(BRAND.shipping.freeAbove)} also ship free.</p>,
  },
  {
    title: 'Will knitted cotton shrink or lose shape?',
    body: (
      <p>
        Not meaningfully, if you wash cold and tumble dry low. Hot washes are what shrink cotton
        knits and stretch out collars — the care label is short for a reason.
      </p>
    ),
  },
  {
    title: 'Do you ship outside India?',
    body: <p>Not yet. We ship across India only at the moment.</p>,
  },
];

function Faqs() {
  return (
    <section className="shell py-16 sm:py-20">
      <div className="grid gap-10 lg:grid-cols-[320px_1fr] lg:gap-20">
        <div>
          <p className="eyebrow">Good to know</p>
          <h2 className="h-section mt-3">Questions,<br />answered</h2>
          <p className="mt-5 text-[14px] leading-relaxed text-slate">
            The five we get asked most. There are more on the FAQ page, and a real person on the
            phone during business hours.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/faq" className="btn-outline btn-sm">All FAQs</Link>
            <Link to="/contact" className="btn-ghost btn-sm">Contact us</Link>
          </div>
        </div>

        <Accordion items={HOME_FAQ} defaultOpen={0} />
      </div>
    </section>
  );
}

function SignupBand() {
  return (
    <section data-flush className="bg-navy-deep text-cream">
      <div className="shell flex flex-col items-center gap-8 py-16 text-center sm:py-20">
        <Mark className="h-10 w-auto text-cream/80" />
        <div>
          <p className="eyebrow text-cream/55">First access</p>
          <h2 className="mt-3 font-display text-2xl font-semibold uppercase tracking-wider2 sm:text-3xl">
            Know before it sells out
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[14.5px] leading-relaxed text-cream/70">
            New colourways and restocks go to the list first. We make short runs, so the good sizes
            do not hang around.
          </p>
        </div>
        <div className="w-full max-w-md">
          <Newsletter id="home-newsletter" label={null} note="No spam, unsubscribe any time." />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------- page */

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [newest, setNewest] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([
      api.categories(),
      api.products({ featured: 'true', limit: 8 }),
      api.products({ sort: 'newest', limit: 4 }),
    ])
      .then(([cats, feat, fresh]) => {
        if (!alive) return;
        setCategories(cats);
        setFeatured(feat.products);
        setNewest(fresh.products);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  return (
    <>
      <Seo
        title="Premium Knitted Polos, Shirts & Oversized Tees"
        description="VELVENT — modern, minimal, timeless knitted cotton. Shop polo t-shirts, polo shirts and oversized tees in sizes S to 3XL, with free shipping and easy returns."
      />
      <Hero />
      <Promises />
      <Categories categories={categories} loading={loading} />
      <Marquee />
      <Rail
        eyebrow="Just landed"
        title="New Arrivals"
        products={newest}
        loading={loading}
        action="Shop all"
        actionTo="/shop?sort=newest"
      />
      <Anatomy />
      <Rail
        eyebrow="Most wanted"
        title="Bestsellers"
        products={featured}
        loading={loading}
        action="Shop all"
        actionTo="/shop"
      />
      <FitGuide />
      <StoryBand />
      <Faqs />
      <SignupBand />
    </>
  );
}
