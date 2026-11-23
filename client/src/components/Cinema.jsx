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

/* ------------------------------------------------- the range, on a rack ---- */

/* A product's name as a fallback label, from its slug, for a piece whose
   product cannot be found in the catalogue (or before the catalogue loads). */
const fromSlug = (slug) => String(slug || '')
  .split('-').filter(Boolean)
  .map((w) => w[0].toUpperCase() + w.slice(1))
  .join(' ');

/** A wire hanger. Its hook is drawn long enough to cross the rail above it. */
function Hanger({ className = 'cx-hang__hanger' }) {
  return (
    <svg className={className} viewBox="0 0 120 46" fill="none" aria-hidden focusable="false">
      <path d="M60 17c0-7-5.5-7-5.5-11A5.5 5.5 0 0 1 65 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M11.5 41 60 17l48.5 24" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M11.5 41h97" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/**
 * 3 — the range, on a rack in a showroom.
 *
 * The rail, the legs and the base are boxes with a chrome gradient down them,
 * the light behind is a circle, and the floor is a shadow. The pieces are
 * garment cut-outs — each one alone, front on, on a transparent ground — hung
 * in the order the admin lists them, the first facing the reader and the rest
 * stepping back behind it.
 *
 * Which garment hangs where is a homepage setting rather than a product one.
 * The rack is a display: the shop chooses what is on it and in what order, and
 * a cut-out belongs to the rack rather than to the product page, where a
 * customer needs a photograph of the real thing.
 *
 * Only the rack is turned. The plane leans a few degrees on its Y axis inside
 * a perspective, so the far end of the rail is genuinely further away; the
 * copy beside it stays square to the page.
 *
 * Three things move, all of them small: the pieces drop onto the rail one
 * after another when the section is first reached, each rocks on its hook at
 * its own pace, and the one under the pointer swings forward out of the row.
 */
function RailStage({ products }) {
  const c = useContent('home');
  const rackRef = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = rackRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setShown(true); return undefined; }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setShown(true); io.disconnect(); }
    }, { rootMargin: '0px 0px -12% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* The name and price come from the catalogue, so a rename or a sale in the
     admin reaches the rack without anyone remembering that it is there. */
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const pieces = (Array.isArray(c.railPieces) ? c.railPieces : [])
    .filter((p) => p && p.image)
    .slice(0, 8)
    .map((p, i) => {
      const product = bySlug.get(p.slug);
      return {
        key: `${i}-${p.image}`,
        image: p.image,
        slug: product ? product.slug : p.slug,
        name: product?.name?.trim() || fromSlug(p.slug) || 'VELVENT',
        price: product?.sale_price ?? null,
      };
    });

  return (
    <Stage kind="rail" label={c.railEyebrow} scrollDriven={false}>
      <div className="cx-showroom">
        <div className="cx-showroom__copy">
          <p className="cx-meta">{c.railEyebrow}</p>
          <h2 className="h-display mt-3 text-[30px] leading-[1.08] sm:text-[38px] lg:text-[46px]">{c.railTitle}</h2>
          {c.railBody && <p className="cx-rail-body">{c.railBody}</p>}
          {c.railCtaLabel && (
            <Link to={c.railCtaHref || '/shop'} className="cx-rail-cta" data-cursor="Shop">
              {c.railCtaLabel} <span aria-hidden>→</span>
            </Link>
          )}
        </div>

        <div className="cx-showroom__scene">
          <span className="cx-glow" aria-hidden />

          <div className={`cx-rack${shown ? ' is-in' : ''}`} ref={rackRef}>
            <span className="cx-rack__floor" aria-hidden />
            <span className="cx-rack__plane" aria-hidden />
            <span className="cx-rack__leg cx-rack__leg--l" aria-hidden />
            <span className="cx-rack__leg cx-rack__leg--r" aria-hidden />
            <span className="cx-rack__base" aria-hidden />

            {/* The rest of the rail, hung but not on show. Behind the garments,
                so they read as stock further along rather than as clutter. */}
            <span className="cx-rack__hooks" aria-hidden>
              {Array.from({ length: 11 }, (_, i) => <Hanger key={i} className="cx-rack__hook" />)}
            </span>

            <ul className="cx-hang">
              {pieces.map((item, i) => (
                <li key={item.key} className="cx-hang__item" style={{ '--d': i }}>
                  <Link
                    to={item.slug ? `/product/${item.slug}` : '/shop'}
                    className="cx-hang__link"
                    data-cursor="View"
                  >
                    <span className="cx-hang__figure">
                      <span className="cx-hang__swing">
                        {/* Behind the garment, as a hanger is: only the hook
                            shows, above the collar. */}
                        <Hanger />
                        <img
                          className="cx-garment"
                          src={item.image}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          draggable={false}
                        />
                      </span>
                    </span>
                    <span className="cx-hang__label">
                      <span className="cx-hang__name">{item.name}</span>
                      {item.price != null && <span className="cx-hang__price">{inr(item.price)}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Drawn after the hangers so the rail passes in front of the hooks. */}
            <span className="cx-rack__bar" aria-hidden />
          </div>
        </div>
      </div>

      <span className="cx-chapter cx-meta" aria-hidden>03 / 03</span>
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

      {/* 3 — the range, hanging on a rack in a showroom */}
      <RailStage products={products} />
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
