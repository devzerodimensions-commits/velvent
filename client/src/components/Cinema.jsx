import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../store/content';
import { Mark } from './Logo';
import { Box, Check, Refresh, Rupee, Shield, Tag, Truck } from './Icons';
import { inr } from '../lib/format';

/* The promise rows name their icon in the admin; this turns a name back into
   a component, falling back rather than breaking the section. */
const TRUST_ICONS = { Truck, Refresh, Shield, Box, Rupee, Check, Tag };

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

function Stage({ kind, label, className = '', style, scrollDriven = true, children }) {
  const { outerRef, stageRef } = useStageProgress(scrollDriven);
  return (
    <section ref={outerRef} className={`cx-outer cx-outer--${kind}`} aria-label={label}>
      <div ref={stageRef} className={`cx-stage cx-stage--${kind} ${className}`} style={style}>
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
/**
 * 3 — the range, as a runway.
 *
 * Three versions of this section were rejected: photographs scattered in
 * corners, a column of cards beside a heading, and a hanging rack copied from
 * a reference that needed cut-out garments nobody has. Each one made the
 * photography small so that something else could be clever.
 *
 * This stops doing that. The pieces are the best thing the shop owns, so they
 * run edge to edge at the height of the stage and move past like a show. It
 * never empties, because there is no end to the strip — the list is laid down
 * twice and the track travels exactly half its width before repeating, which
 * lands pixel for pixel on where it began.
 *
 * It holds still the moment you reach for it: hovering anywhere over the
 * strip, or tabbing into it, stops the drift so the thing you are aiming at
 * is not moving when you click.
 */
function RailStage({ rail }) {
  const c = useContent('home');
  const rowRef = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = rowRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setShown(true); return undefined; }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setShown(true); io.disconnect(); }
    }, { rootMargin: '0px 0px -10% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* The tilt.

     A piece leans toward the pointer while it is under it. The angles are
     written straight onto the element as custom properties rather than into
     React state: this runs on every mouse move, and a re-render per frame
     would cost far more than the effect is worth. */
  const tilt = (e) => {
    const piece = e.target.closest?.('.cx-piece');
    if (!piece) return;
    const r = piece.getBoundingClientRect();
    piece.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 15}deg`);
    piece.style.setProperty('--rx', `${-((e.clientY - r.top) / r.height - 0.5) * 11}deg`);
  };
  const untilt = (e) => {
    const piece = e.target.closest?.('.cx-piece');
    if (!piece) return;
    piece.style.removeProperty('--rx');
    piece.style.removeProperty('--ry');
  };

  /* Laid down twice. The second pass is scenery — it is the first pass again,
     so it is kept out of the tab order and away from screen readers. */
  const lap = (copy) => rail.map((item, i) => (
    <Link
      key={`${copy}-${item.id}`}
      to={item.slug ? `/product/${item.slug}` : '/shop'}
      className="cx-piece"
      data-cursor="View"
      style={{ '--i': i }}
      {...(copy === 1 ? { tabIndex: -1, 'aria-hidden': 'true' } : {})}
    >
      <span className="cx-piece__frame">
        <img src={item.img} alt={copy === 0 ? item.name : ''} loading="lazy" />
        <span className="cx-piece__meta">
          <span className="cx-piece__name">{item.name}</span>
          {item.price != null && <span className="cx-piece__price">{inr(item.price)}</span>}
        </span>
      </span>
    </Link>
  ));

  return (
    <Stage kind="rail" label={c.railEyebrow} scrollDriven={false}>

      <div className="cx-rail-head">
        <p className="cx-meta">{c.railEyebrow}</p>
        <h2 className="h-display mt-3 text-[28px] sm:text-[40px] lg:text-[52px]">{c.railTitle}</h2>
        {c.railBody && <p className="cx-rail-body">{c.railBody}</p>}
        {c.railCtaLabel && (
          <Link to={c.railCtaHref || '/shop'} className="cx-rail-cta">
            {c.railCtaLabel} <span aria-hidden>→</span>
          </Link>
        )}
      </div>

      <span className="cx-chapter cx-meta" aria-hidden>03 / 03</span>

      <div
        className={`cx-runway${shown ? ' is-in' : ''}`}
        ref={rowRef}
        onMouseMove={tilt}
        onMouseOut={untilt}
      >
        <div className="cx-runway__track">
          {lap(0)}
          {lap(1)}
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
      <Stage
        kind="fill"
        label={STATEMENT}
        scrollDriven={false}
        className="cx-cloth"
        style={{ '--knit': `url("${c.statementTexture || '/products/anatomy-cable.jpg'}")` }}
      >
        {/* The sentence, knitted.

            The emphasised words are not coloured in — they are filled with a
            photograph of the cloth itself, so "knitted cotton" is set in
            knitted cotton. The fabric drifts slowly inside the letterforms,
            which is the only motion on the stage. */}
        <div className="cx-knit">
          {c.statementLabel && <p className="cx-meta cx-knit__eyebrow">{c.statementLabel}</p>}

          <p className="cx-knit__text" aria-label={STATEMENT}>
            {STATEMENT.split(' ').map((w, i) => (
              <span
                key={w + i}
                aria-hidden
                className={`cx-knit__word${EMPHASIS.has(w.toLowerCase()) ? ' cx-knit__word--em' : ''}`}
              >
                {w}
              </span>
            ))}
          </p>

          <span className="cx-knit__rule" aria-hidden />
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
