import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mark } from './Logo';
import { inr } from '../lib/format';

/*
 * The homepage opening has a static hero followed by two scroll-driven sections.
 * Those later stages receive --p, the fraction of the way through (0 → 1).
 */

function useStageProgress(enabled) {
  const outerRef = useRef(null);
  const stageRef = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;
    const outer = outerRef.current;
    const stage = stageRef.current;
    if (!outer || !stage) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;

    let frame = 0;
    let last = -1;
    const measure = () => {
      frame = 0;
      const rect = outer.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      const p = travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : 0;
      if (Math.abs(p - last) > 0.0005) {
        last = p;
        stage.style.setProperty('--p', p.toFixed(4));
      }
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(measure); };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [enabled]);

  return { outerRef, stageRef };
}

function Stage({ kind, label, children }) {
  const { outerRef, stageRef } = useStageProgress(kind !== 'frame');
  return (
    <section ref={outerRef} className={`cx-outer cx-outer--${kind}`} aria-label={label}>
      <div ref={stageRef} className={`cx-stage cx-stage--${kind}`}>
        {children}
        <div className="cx-grain" aria-hidden />
      </div>
    </section>
  );
}

const INTRO_KEY = 'velvent:intro';

function shouldShowIntro() {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
  try { return !sessionStorage.getItem(INTRO_KEY); } catch { return true; }
}

const STATEMENT = 'Velvent is knitted cotton for people who dress with intent.';
const EMPHASIS = new Set(['knitted', 'cotton', 'intent.']);

const RAIL_FALLBACK = [
  { id: 'a', slug: '', name: 'Cable Knit Contrast Polo', img: '/products/cable-knit-polo-green-1.jpg' },
  { id: 'b', slug: '', name: 'Coastal Stripe Polo', img: '/products/coastal-stripe-polo-1.jpg' },
  { id: 'c', slug: '', name: 'Cable Knit Polo', img: '/products/cable-knit-polo-burgundy-1.jpg' },
  { id: 'd', slug: '', name: 'Vertical Stripe Shirt', img: '/products/vertical-stripe-shirt-olive-1.jpg' },
  { id: 'e', slug: '', name: 'Fine Stripe Polo', img: '/products/fine-stripe-polo-1.jpg' },
];

const toRailItem = (p) => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  price: p.sale_price,
  img: p.images?.[0]?.url || p.image_url,
});

export function Cinema({ products = [] }) {
  const rail = products.length ? products.slice(0, 6).map(toRailItem) : RAIL_FALLBACK;

  return (
    <>
      {/* 1 — a full-screen, still photograph and headline */}
      <Stage kind="frame" label="Crafted for confidence">
        <div className="cx-frame">
          <img src="/products/rugby-stripe-polo-1.jpg" alt="" fetchpriority="high" />
        </div>

        <h1 className="cx-headline" aria-label="Crafted for confidence">
          <span className="cx-headline__line" aria-hidden>Crafted for</span>
          <span className="cx-headline__line" aria-hidden>Confidence</span>
        </h1>

        <span className="cx-side cx-meta hidden md:block" aria-hidden>Autumn knitwear — 01</span>
        <span className="cx-chapter cx-meta" aria-hidden>01 / 03</span>

        <div className="cx-caption">
          <span className="cx-meta">Shown here</span>
          <Link to="/product/rugby-stripe-knitted-polo" className="cx-link" data-cursor="View">
            Rugby Stripe Knitted Polo
          </Link>
        </div>

        <div className="cx-foot">
          <Link to="/shop" className="cx-link" data-cursor="Shop">Shop the collection <span aria-hidden>→</span></Link>
          <span className="cx-thread" aria-hidden>
            <span className="cx-meta">Scroll</span>
            <span className="cx-thread__line" />
          </span>
          <span className="cx-meta hidden sm:block">Sizes S – 3XL</span>
        </div>
      </Stage>

      {/* 2 — an outlined sentence fills in word by word as it is read */}
      <Stage kind="fill" label={STATEMENT}>
        <Mark className="cx-mark" />
        <figure className="cx-swatch cx-swatch--a" aria-hidden>
          <img src="/products/anatomy-cable.jpg" alt="" loading="lazy" />
        </figure>
        <figure className="cx-swatch cx-swatch--b" aria-hidden>
          <img src="/products/anatomy-collar.jpg" alt="" loading="lazy" />
        </figure>
        <p className="cx-fill" aria-label={STATEMENT}>
          {STATEMENT.split(' ').map((w, i) => (
            <span
              key={w + i}
              aria-hidden
              className={`cx-fill__word${EMPHASIS.has(w.toLowerCase()) ? ' cx-fill__word--em' : ''}`}
              style={{ '--i': i }}
            >
              {w}
            </span>
          ))}
        </p>
        <span className="cx-chapter cx-meta" aria-hidden>02 / 03</span>
      </Stage>

      {/* 3 — the range runs past sideways, a giant line sliding the other way */}
      <Stage kind="rail" label="The range">
        <span className="cx-backline" aria-hidden>Simple · Timeless · Premium ·</span>
        <div className="cx-rail-head">
          <p className="cx-meta">The range</p>
          <h2 className="h-display mt-3 text-[28px] sm:text-[40px]">Made to be<br />worn often</h2>
        </div>
        <span className="cx-chapter cx-meta" aria-hidden>03 / 03</span>

        <div className="cx-track">
          {rail.map((item, i) => (
            <Link
              key={item.id}
              to={item.slug ? `/product/${item.slug}` : '/shop'}
              className="cx-card"
              data-cursor="View"
            >
              <span className="cx-card__no">{String(i + 1).padStart(2, '0')}</span>
              <div className="cx-card__img"><img src={item.img} alt={item.name} loading="lazy" /></div>
              <p className="cx-card__name">{item.name}</p>
              {item.price != null && <p className="cx-card__price">{inr(item.price)}</p>}
            </Link>
          ))}
          <Link to="/shop" className="cx-end" data-cursor="Enter">Enter the<br />collection</Link>
        </div>

        <span className="cx-progress" aria-hidden />
      </Stage>
      <span data-cinema-end aria-hidden />
    </>
  );
}

/** Title card shown once per browser session. Click anywhere to skip. */
export function Intro() {
  const [phase, setPhase] = useState(() => (shouldShowIntro() ? 'on' : 'gone'));
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (phase === 'gone') return undefined;
    try { sessionStorage.setItem(INTRO_KEY, '1'); } catch { /* ignore */ }

    if (phase === 'on') {
      document.body.style.overflow = 'hidden';
      const start = performance.now();
      let raf = 0;
      const tick = (now) => {
        const t = Math.min(1, (now - start) / 2100);
        setCount(Math.round((1 - (1 - t) ** 3) * 100));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      const t = setTimeout(() => setPhase('leaving'), 2500);
      return () => { cancelAnimationFrame(raf); clearTimeout(t); };
    }

    // Let the page scroll again while the title card clears.
    document.body.style.overflow = '';
    const t = setTimeout(() => setPhase('gone'), 1400);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => () => { document.body.style.overflow = ''; }, []);

  if (phase === 'gone') return null;
  return (
    <div className={`intro${phase === 'leaving' ? ' is-leaving' : ''}`} onClick={() => setPhase('leaving')} role="presentation">
      <div className="intro__rows" aria-hidden>
        {Array.from({ length: 6 }, (_, i) => <span key={i} className="intro__row" style={{ '--i': i }} />)}
      </div>
      <div className="intro__body">
        <div className="flex flex-col items-center">
          <Mark className="intro__mark h-16 w-auto text-cream sm:h-20" />
          <span className="intro__word mt-7 text-xl sm:text-2xl">Velvent</span>
          <div className="mt-8 flex w-56 items-center gap-4 text-[10px] font-semibold tracking-brand text-cream/60">
            <span className="intro__bar flex-1" />
            <span className="intro__count w-8 text-right">{String(count).padStart(3, '0')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
