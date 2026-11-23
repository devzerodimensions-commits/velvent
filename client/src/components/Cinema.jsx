import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../store/content';
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
  const c = useContent('home');
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const rowRef = useRef(null);
  /* The garments swing in when the row is reached rather than on load, or the
     entrance would play to nobody while the section is still below the fold. */
  const [shown, setShown] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const el = rowRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setShown(true); return undefined; }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setShown(true); io.disconnect(); }
    }, { rootMargin: '0px 0px -10% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

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
    <Stage kind="rail" label={c.railEyebrow} scrollDriven={false}>
      <div className="cx-rail-head">
        <p className="cx-meta">{c.railEyebrow}</p>
        <h2 className="h-display mt-3 text-[28px] sm:text-[40px]">{c.railTitle}</h2>
      </div>
      <span className="cx-chapter cx-meta" aria-hidden>03 / 03</span>

      {/* The glow the rail hangs in front of. Its colour is a setting, so the
          shop can have the brand's warm light or something colder without a
          deploy. */}
      <span className={`cx-rail-glow cx-rail-glow--${c.railGlow || 'warm'}`} aria-hidden />

      <div className={`cx-rail-row${shown ? ' is-in' : ''}`} ref={rowRef}>
        <div className="cx-viewport" ref={viewportRef}>
          {/* The rail itself: a bar across the window with a post at each end.
              It sits outside the track, so it stays put while the garments
              slide along underneath it. */}
          <span className="cx-rail-bar" aria-hidden />

          <div className="cx-track" ref={trackRef} style={{ transform: `translate3d(${-offset}px, 0, 0)` }}>
            {rail.map((item, i) => (
              <Link
                key={item.id}
                to={item.slug ? `/product/${item.slug}` : '/shop'}
                className="cx-card"
                data-cursor="View"
                style={{ '--i': i }}
                {...hidden(i)}
              >
                {/* Hangs from the bar: a stem down to the hanger, then the
                    garment under it. The stem length alternates so the row
                    still rises and falls across the stage. */}
                <span className="cx-hanger" aria-hidden>
                  <svg viewBox="0 0 48 22" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M24 8.5V7a2.6 2.6 0 1 1 2.6 2.6" />
                    <path d="M24 8.5 5 19.5h38L24 8.5Z" />
                  </svg>
                </span>

                <span className="cx-swing">
                  <span className="cx-card__no">{String(i + 1).padStart(2, '0')}</span>
                  <span className="cx-card__img"><img src={item.img} alt={item.name} loading="lazy" /></span>
                  <span className="cx-card__name">{item.name}</span>
                  {item.price != null && <span className="cx-card__price">{inr(item.price)}</span>}
                </span>
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
  const c = useContent('home');
  /* The label signs itself with the store's name, which is a brand setting
     rather than a home-page one — renaming the shop should rename this too. */
  const brand = useContent('brand');
  const HERO = c.hero;
  const STATEMENT = c.statement || '';
  const headline = [HERO.headline1, HERO.headline2].filter(Boolean).join(' ');
  /* The words to pick out are written as a comma-separated list in the admin,
     matched case-insensitively against the sentence. */
  const EMPHASIS = new Set(
    String(c.statementEmphasis || '').split(',').map((w) => w.trim().toLowerCase()).filter(Boolean),
  );
  const rail = products.length ? products.slice(0, 6).map(toRailItem) : RAIL_FALLBACK;

  return (
    <>
      {/* 1 — a full-bleed photo eases back behind closing bars; the headline splits around it */}
      <Stage kind="frame" label={headline} className={ready ? 'is-ready' : ''}>
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

        <h1 className="cx-headline" aria-label={headline}>
          <span className="cx-headline__line" aria-hidden><Rise text={HERO.headline1} /></span>
          <span className="cx-headline__line" aria-hidden><Rise text={HERO.headline2} offset={(HERO.headline1 || '').length} /></span>
        </h1>

        <span className="cx-side cx-meta hidden md:block" aria-hidden>{HERO.side}</span>
        <span className="cx-chapter cx-meta" aria-hidden>01 / 03</span>

        <div className="cx-caption">
          <span className="cx-meta">{HERO.captionLabel}</span>
          <Link to={`/product/${HERO.slug}`} className="cx-link" data-cursor="View">
            {HERO.name}
          </Link>
        </div>

        <div className="cx-foot">
          <Link to="/shop" className="cx-link" data-cursor="Shop">{HERO.shopLabel} <span aria-hidden>→</span></Link>
          <span className="cx-thread" aria-hidden>
            <span className="cx-meta">Scroll</span>
            <span className="cx-thread__line" />
          </span>
          <span className="cx-meta hidden sm:block">{HERO.note}</span>
        </div>
      </Stage>

      {/* 2 — the statement, read against one full-height photograph */}
      {/* scrollDriven off: nothing in this stage reads the scroll position, so
          there is no reason to measure it on every frame of every scroll. */}
      <Stage kind="fill" label={STATEMENT} scrollDriven={false}>
        <div className="cx-label__bg" aria-hidden>
          <img src={c.statementImageA} alt="" loading="lazy" />
        </div>

        <div className="cx-label">
          {c.statementLabel && <p className="cx-label__meta">{c.statementLabel}</p>}

          {/* The sentence is split into words so the emphasised ones can be
              picked out. Each word is hidden from assistive tech and the
              paragraph carries the whole sentence, or it would be read one
              word at a time with no punctuation between. */}
          <p className="cx-label__text" aria-label={STATEMENT}>
            {STATEMENT.split(' ').map((w, i) => (
              <span
                key={w + i}
                aria-hidden
                className={`cx-label__word${EMPHASIS.has(w.toLowerCase()) ? ' cx-label__word--em' : ''}`}
              >
                {w}{' '}
              </span>
            ))}
          </p>

          <span className="cx-label__rule" aria-hidden />
          <span className="cx-label__mark" aria-hidden>{brand.name || 'Velvent'}</span>
        </div>

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
