import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mark } from './Logo';
import { inr } from '../lib/format';

/*
 * The homepage opening: three tall sections, each with a full-screen stage pinned
 * inside it. While a section scrolls past, its stage receives --p, the fraction of
 * the way through (0 → 1). Every effect is plain CSS that reads --p (see the
 * "cinema" rules in index.css), so this file only measures and writes one number.
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

function Stage({ kind, label, className = '', scrollDriven = true, children }) {
  const { outerRef, stageRef } = useStageProgress(scrollDriven);
  return (
    <section ref={outerRef} className={`cx-outer cx-outer--${kind}`} aria-label={label}>
      <div ref={stageRef} className={`cx-stage cx-stage--${kind} ${className}`}>
        {children}
        <div className="cx-grain" aria-hidden />
      </div>
    </section>
  );
}

/* ---- intro hand-off: the opening stage waits for the title card to leave ---- */

const INTRO_KEY = 'velvent:intro';
const INTRO_DONE = 'velvent:intro-done';

function shouldShowIntro() {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
  try { return !sessionStorage.getItem(INTRO_KEY); } catch { return true; }
}

let introRunning = false;

function useIntroDone() {
  const [done, setDone] = useState(() => !introRunning);
  useEffect(() => {
    if (done) return undefined;
    const on = () => setDone(true);
    window.addEventListener(INTRO_DONE, on);
    return () => window.removeEventListener(INTRO_DONE, on);
  }, [done]);
  return done;
}

/** Splits a line into letters that rise one after another. */
function Rise({ text, offset = 0 }) {
  return [...text].map((ch, i) => (
    <span key={i} style={{ '--i': i + offset }}>{ch === ' ' ? ' ' : ch}</span>
  ));
}

/* The garment the opening stage is shot in. The photograph, the caption and the
   click target over the whole stage all read from here so they cannot drift
   apart and send someone to a different product than the one on show. */
const HERO = {
  slug: 'rugby-stripe-knitted-polo',
  name: 'Rugby Stripe Knitted Polo',
  photo: '/products/rugby-stripe-polo-1.jpg',
};

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

/* ------------------------------------------------ the range, stepped ---- */

/**
 * The range used to run sideways as the page scrolled, which took the reader's
 * scroll away from them for three screens. It is now an ordinary row they step
 * through with the two buttons underneath. The row stays a real scroller, so a
 * swipe still works on a phone and focusing a card off-screen still brings it
 * into view — the buttons simply drive it, and the bar shows how far along it is.
 */
function RailStage({ rail }) {
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const [page, setPage] = useState(0);
  // How many fit, how many pages that makes, and how far to slide. All three
  // are measured rather than assumed, because the CSS decides how many cards
  // share the row at a given width and it changes with the breakpoints.
  const [view, setView] = useState({ per: 4, pages: 1, offset: 0 });

  // The range, plus the circle that leads into the shop: it takes a card's
  // place on the last page rather than trailing after the final product.
  const count = rail.length + 1;

  // Products arrive after the first render and change how many pages there are.
  useEffect(() => { setPage(0); }, [rail.length]);

  useEffect(() => {
    const vp = viewportRef.current;
    const track = trackRef.current;
    if (!vp || !track) return undefined;

    const measure = () => {
      const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
      const card = track.querySelector('.cx-card');
      const width = card ? card.getBoundingClientRect().width : 0;
      const span = vp.clientWidth;
      const per = width > 0 ? Math.max(1, Math.round((span + gap) / (width + gap))) : 1;
      const pages = Math.max(1, Math.ceil(count / per));

      // Stop at the track's end instead of overshooting, so the last page is a
      // full row of products rather than one card and a stretch of background.
      const limit = Math.max(0, track.scrollWidth - span);
      const current = Math.min(page, pages - 1);
      if (current !== page) setPage(current);
      setView({ per, pages, offset: Math.min(current * (span + gap), limit) });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(vp);
    return () => ro.disconnect();
  }, [page, count]);

  const { per, pages, offset } = view;
  const atStart = page === 0;
  const atEnd = page >= pages - 1;
  const onPage = (i) => Math.floor(i / per) === page;

  /* Everything off the current page is left in the layout but taken out of the
     tab order and the accessibility tree. Without this, tabbing reaches a card
     nobody can see and the browser drags the window sideways to show it. */
  const hidden = (i) => (onPage(i) ? undefined : { tabIndex: -1, 'aria-hidden': 'true' });

  return (
    <Stage kind="rail" label="The range" scrollDriven={false}>
      <div className="cx-rail-head">
        <p className="cx-meta">The range</p>
        <h2 className="h-display mt-3 text-[28px] sm:text-[40px]">Made to be<br />worn often</h2>
      </div>
      <span className="cx-chapter cx-meta" aria-hidden>03 / 03</span>

      <div className="cx-rail-row">
        <div className="cx-viewport" ref={viewportRef}>
          <div className="cx-track" ref={trackRef} style={{ transform: `translate3d(${-offset}px, 0, 0)` }}>
            {rail.map((item, i) => (
              <Link
                key={item.id}
                to={item.slug ? `/product/${item.slug}` : '/shop'}
                className="cx-card"
                data-cursor="View"
                {...hidden(i)}
              >
                <span className="cx-card__no">{String(i + 1).padStart(2, '0')}</span>
                <div className="cx-card__img"><img src={item.img} alt={item.name} loading="lazy" /></div>
                <p className="cx-card__name">{item.name}</p>
                {item.price != null && <p className="cx-card__price">{inr(item.price)}</p>}
              </Link>
            ))}
            <div className="cx-end-slot">
              <Link to="/shop" className="cx-end" data-cursor="Enter" {...hidden(rail.length)}>
                Enter the<br />collection
              </Link>
            </div>
          </div>
        </div>

        <div className="cx-rail-nav">
          <div className="cx-arrows">
            <button
              type="button"
              className="cx-arrow"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={atStart}
              aria-label="Previous products"
            >
              <span aria-hidden>←</span>
            </button>
            <button
              type="button"
              className="cx-arrow"
              onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
              disabled={atEnd}
              aria-label="Next products"
            >
              <span aria-hidden>→</span>
            </button>
          </div>
          <p className="cx-rail-count cx-meta" aria-live="polite">
            {String(page + 1).padStart(2, '0')} / {String(pages).padStart(2, '0')}
          </p>
        </div>
      </div>
    </Stage>
  );
}

export function Cinema({ products = [] }) {
  const ready = useIntroDone();
  const rail = products.length ? products.slice(0, 6).map(toRailItem) : RAIL_FALLBACK;

  return (
    <>
      {/* 1 — a full-bleed photo eases back behind closing bars; the headline splits around it */}
      <Stage kind="frame" label="Crafted for confidence" className={ready ? 'is-ready' : ''}>
        <div className="cx-frame">
          <img src={HERO.photo} alt="" fetchpriority="high" />
        </div>
        <div className="cx-bands" aria-hidden>
          {Array.from({ length: 8 }, (_, i) => <span key={i} className="cx-band" style={{ '--i': i }} />)}
        </div>

        {/* The photograph itself is the link to the garment it shows. It is a
            pointer convenience only: the caption below carries the same
            destination as real, focusable text, so this layer stays out of the
            tab order and out of the accessibility tree rather than announcing
            the same product twice. */}
        <Link
          to={`/product/${HERO.slug}`}
          className="cx-plate"
          data-cursor="View"
          aria-hidden="true"
          tabIndex={-1}
        />

        <h1 className="cx-headline" aria-label="Crafted for confidence">
          <span className="cx-headline__line" aria-hidden><Rise text="Crafted for" /></span>
          <span className="cx-headline__line" aria-hidden><Rise text="Confidence" offset={4} /></span>
        </h1>

        <span className="cx-side cx-meta hidden md:block" aria-hidden>Autumn knitwear — 01</span>
        <span className="cx-chapter cx-meta" aria-hidden>01 / 03</span>

        <div className="cx-caption">
          <span className="cx-meta">Shown here</span>
          <Link to={`/product/${HERO.slug}`} className="cx-link" data-cursor="View">
            {HERO.name}
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
            >
              {w}
            </span>
          ))}
        </p>
        <span className="cx-chapter cx-meta" aria-hidden>02 / 03</span>
      </Stage>

      {/* 3 — the range, stepped through with its own arrows */}
      <RailStage rail={rail} />
      <span data-cinema-end aria-hidden />
    </>
  );
}

/** Title card shown once per browser session. Click anywhere to skip. */
export function Intro() {
  const [phase, setPhase] = useState(() => (shouldShowIntro() ? 'on' : 'gone'));
  const [count, setCount] = useState(0);
  if (phase === 'on') introRunning = true;

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

    // leaving: let the stage start its own entrance while the rows clear
    document.body.style.overflow = '';
    introRunning = false;
    window.dispatchEvent(new Event(INTRO_DONE));
    const t = setTimeout(() => setPhase('gone'), 1400);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => () => { document.body.style.overflow = ''; introRunning = false; }, []);

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
