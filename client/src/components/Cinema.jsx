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

/* ------------------------------------------------- the range, on a rack ---- */

/* The garment, drawn rather than photographed.

   The shop owns model photography and nothing else — no cut-outs, no packshots
   on a plain ground. So the pieces on this rack are the real photographs seen
   through a garment-shaped hole: one path for the body and sleeves, a second
   for the collar and a third for the placket, each filled with the same
   picture at a different brightness. That is what makes it read as a polo
   hanging up rather than as a rectangle of a man wearing one.

   Written in objectBoundingBox units, so one path fits every size it is given. */
const POLO = 'M.372 .052C.335 .056 .300 .060 .278 .070L.082 .152C.050 .167 .030 .195 .024 .232'
  + 'L.012 .330C.008 .368 .022 .400 .052 .416L.124 .452C.152 .466 .178 .455 .186 .424L.238 .268'
  + 'L.214 .940C.212 .958 .222 .968 .242 .968L.758 .968C.778 .968 .788 .958 .786 .940L.762 .268'
  + 'L.814 .424C.822 .455 .848 .466 .876 .452L.948 .416C.978 .400 .992 .368 .988 .330L.976 .232'
  + 'C.970 .195 .950 .167 .918 .152L.722 .070C.700 .060 .665 .056 .628 .052'
  + 'C.620 .140 .380 .140 .372 .052Z';
const COLLAR = 'M.352 .028C.360 .120 .640 .120 .648 .028L.690 .046C.680 .164 .320 .164 .310 .046Z';
const PLACKET = 'M.468 .120L.532 .120L.537 .300L.463 .300Z';

/** The clip shapes, defined once for the page. */
function GarmentShapes() {
  return (
    <svg className="cx-shapes" aria-hidden focusable="false">
      <defs>
        <clipPath id="vv-polo" clipPathUnits="objectBoundingBox"><path d={POLO} /></clipPath>
        <clipPath id="vv-collar" clipPathUnits="objectBoundingBox"><path d={COLLAR} /></clipPath>
        <clipPath id="vv-placket" clipPathUnits="objectBoundingBox"><path d={PLACKET} /></clipPath>
      </defs>
    </svg>
  );
}

/* Where the garment is, in a photograph nobody measured.

   A piece on this rack is one of the shop's own photographs seen through a
   polo-shaped hole, so something has to decide which band of the photograph
   that hole is filled with. It cannot be worked out from the file: these
   pictures are framed anywhere from head-to-hip to the whole model standing
   in a room, two of them are the same proportions and nothing alike, and the
   obvious tricks — look for skin, look for the shoulders — both read a beige
   studio wall as a person.

   So it is a setting rather than a guess. One number for the range, in the
   admin, and a short list of exceptions for the photographs that do not sit
   where the rest do. Lower is higher up the picture: 25 lands on the chest of
   a full-length shot, 45 on the chest of one framed at the hip. The client can
   see what it does without being told what it means, which is the point —
   every photograph they add from here is theirs to place. */
const DEFAULT_CROP = 45;

const fixFor = (img, fixes) => (Array.isArray(fixes) ? fixes.find((f) => f && f.image === img) : null);

/** The crop for one piece, as a background-position. */
const cropFor = (img, fallback, fixes) => {
  const fix = fixFor(img, fixes);
  const n = Number(fix && fix.crop !== '' && fix.crop !== null ? fix.crop : fallback);
  return `50% ${Number.isFinite(n) ? Math.min(90, Math.max(0, n)) : DEFAULT_CROP}%`;
};

/* Some photographs cannot hang. One of the range is shot with the model's
   arms folded across his chest, and there is no band of that picture which is
   only cloth — every crop of it puts a forearm on the rail. Rather than leave
   the shop to notice that on its own homepage, a photograph can be marked in
   the admin as one to leave off, and the rack simply takes the next piece. */
const onTheRack = (fixes) => (piece) => !fixFor(piece.img, fixes)?.hide;

/** A wire hanger. Its hook is drawn long enough to cross the rail above it. */
function Hanger() {
  return (
    <svg className="cx-hang__hanger" viewBox="0 0 120 46" fill="none" aria-hidden focusable="false">
      <path d="M60 17c0-7-5.5-7-5.5-11A5.5 5.5 0 0 1 65 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M11.5 41 60 17l48.5 24" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M11.5 41h97" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/**
 * 3 — the range, stood up in a showroom.
 *
 * The brief for this section was a reference picture: a slim chrome rack in a
 * dark room, one piece facing you and the rest overlapping away to the right,
 * lit from behind by a violet ring. It is built here out of the parts the
 * browser already has — the rail, the legs and the base are boxes with a
 * chrome gradient down them, the ring is a circle of light, and the pieces are
 * the shop's own photographs cut to the shape of a polo.
 *
 * Only the rack is turned. The whole group leans a few degrees on its Y axis
 * inside a perspective, so the pieces stand at real distances from the eye and
 * the ones further right are genuinely smaller and dimmer rather than drawn
 * that way. The copy beside it is left square to the page, because type set at
 * an angle is type nobody reads.
 *
 * Three things move, all of them small: the pieces drop onto the rail one
 * after another when the section is first reached, each rocks on its hook at
 * its own pace, and the one under the pointer swings forward out of the row.
 */
function RailStage({ rail }) {
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

  /* Four hang on the rail: one facing you and three stepping back behind it.
     A fifth is a sliver of sleeve, which is clutter rather than depth. */
  const pieces = rail.filter(onTheRack(c.railCropFixes)).slice(0, 4);

  return (
    <Stage kind="rail" label={c.railEyebrow} scrollDriven={false}>
      <GarmentShapes />

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
            <span className="cx-rack__leg cx-rack__leg--l" aria-hidden />
            <span className="cx-rack__leg cx-rack__leg--r" aria-hidden />
            <span className="cx-rack__base" aria-hidden />

            <ul className="cx-hang">
              {pieces.map((item, i) => (
                <li key={item.id} className="cx-hang__item" style={{ '--d': i, '--pos': cropFor(item.img, c.railCrop, c.railCropFixes) }}>
                  <Link
                    to={item.slug ? `/product/${item.slug}` : '/shop'}
                    className="cx-hang__link"
                    data-cursor="View"
                  >
                    <span className="cx-hang__figure">
                      <span className="cx-hang__swing">
                        <Hanger />
                        <span className="cx-garment" style={{ '--img': `url("${item.img}")` }} />
                        <span className="cx-garment__collar" style={{ '--img': `url("${item.img}")` }} />
                        <span className="cx-garment__placket" style={{ '--img': `url("${item.img}")` }} />
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

      {/* 3 — the range, hanging on a rack in a showroom */}
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
