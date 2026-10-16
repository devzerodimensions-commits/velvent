import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mark } from './Logo';

/*
 * The homepage opening: three tall sections, each with a full-screen stage pinned
 * inside it. While a section scrolls past, its stage receives --p, the fraction of
 * the way through (0 → 1). Every effect is plain CSS that reads --p (see the
 * "cinema" rules in index.css), so this file only measures and writes one number.
 */

function useStageProgress() {
  const outerRef = useRef(null);
  const stageRef = useRef(null);

  useEffect(() => {
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
  }, []);

  return { outerRef, stageRef };
}

function Stage({ kind, label, children }) {
  const { outerRef, stageRef } = useStageProgress();
  return (
    <section ref={outerRef} className={`cx-outer cx-outer--${kind}`} aria-label={label}>
      <div ref={stageRef} className={`cx-stage cx-stage--${kind}`}>
        {children}
        <div className="cx-grain" aria-hidden />
      </div>
    </section>
  );
}

/** Splits a line into letters, keeping each letter's position for the stagger. */
function Letters({ text }) {
  return [...text].map((ch, i) =>
    ch === ' '
      ? <span key={i} className="cx-space" />
      : <span key={i} className="cx-char" style={{ '--i': i }}>{ch}</span>);
}

const STATEMENT = 'Velvent is knitted cotton for people who dress with intent.';
const EMPHASIS = new Set(['knitted', 'cotton', 'intent.']);

export function Cinema() {
  return (
    <>
      {/* 1 — the headline arrives small and parts as it grows past the reader */}
      <Stage kind="open" label="Crafted for confidence">
        <img
          src="/products/rugby-stripe-polo-1.jpg"
          alt=""
          className="cx-photo"
          fetchpriority="high"
        />
        <div className="cx-vignette" aria-hidden />
        <span className="cx-ring cx-ring--a" aria-hidden />
        <h1 className="cx-type" aria-label="Crafted for confidence">
          <span className="cx-type__a" aria-hidden>Crafted for</span>
          <span className="cx-type__b" aria-hidden>Confidence</span>
        </h1>
        <p className="cx-eyebrow">Velvent / Autumn knitwear / 01</p>
        <div className="cx-foot">
          <Link to="/shop" className="cx-link">Shop the collection <span aria-hidden>→</span></Link>
          <span className="cx-hint" aria-hidden>Scroll</span>
          <span className="hidden text-[10px] font-semibold uppercase tracking-brand text-cream/55 sm:block">
            Sizes S – 3XL
          </span>
        </div>
      </Stage>

      {/* 2 — one sentence, resolving a word at a time over a blooming close-up */}
      <Stage kind="words" label={STATEMENT}>
        <div className="cx-orbs cx-orbs--words" aria-hidden>
          <img src="/products/anatomy-cable.jpg" alt="" loading="lazy" />
          <img src="/products/anatomy-collar.jpg" alt="" loading="lazy" />
        </div>
        <span className="cx-ring cx-ring--a" aria-hidden />
        <span className="cx-ring cx-ring--b" aria-hidden />
        <div className="cx-vignette" aria-hidden />
        <p className="cx-words" aria-label={STATEMENT}>
          {STATEMENT.split(' ').map((w, i) => (
            <span key={w + i} aria-hidden className={`cx-word${EMPHASIS.has(w.toLowerCase()) ? ' cx-word--em' : ''}`} style={{ '--i': i }}>
              {w}
            </span>
          ))}
        </p>
      </Stage>

      {/* 3 — the brand line assembles from scattered letters, then hands over to the shop */}
      <Stage kind="theme" label="Simple. Timeless. Premium.">
        <div className="cx-orbs cx-orbs--theme" aria-hidden>
          <img src="/products/cable-knit-polo-green-1.jpg" alt="" loading="lazy" />
          <img src="/products/coastal-stripe-polo-1.jpg" alt="" loading="lazy" />
          <img src="/products/cable-knit-polo-burgundy-1.jpg" alt="" loading="lazy" />
        </div>
        <span className="cx-ring cx-ring--a" aria-hidden />
        <div className="cx-vignette" aria-hidden />
        <h2 className="cx-assemble" aria-label="Simple. Timeless. Premium.">
          <span className="cx-assemble__line" aria-hidden><Letters text="Simple. Timeless." /></span>
          <span className="cx-assemble__line" aria-hidden><Letters text="Premium." /></span>
        </h2>
        <p className="cx-statement">
          One fabric, done properly. Polos, button-through shirts and heavyweight oversized tees,
          cut to sit right and made in short runs.
        </p>
        <div className="cx-outro">
          <Mark className="h-9 w-auto text-cream" />
          <span className="cx-wordmark">Velvent</span>
          <Link to="/shop" className="cx-link">Enter the collection <span aria-hidden>→</span></Link>
        </div>
      </Stage>
      <span data-cinema-end aria-hidden />
    </>
  );
}

const INTRO_KEY = 'velvent:intro';

/** Title card shown once per browser session, over the first stage. Click anywhere to skip. */
export function Intro() {
  const [phase, setPhase] = useState(() => {
    try {
      if (sessionStorage.getItem(INTRO_KEY)) return 'gone';
    } catch { /* storage blocked — just show it */ }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return 'gone';
    return 'on';
  });

  useEffect(() => {
    if (phase === 'gone') return undefined;
    try { sessionStorage.setItem(INTRO_KEY, '1'); } catch { /* ignore */ }
    if (phase === 'on') {
      document.body.style.overflow = 'hidden';
      const t = setTimeout(() => setPhase('leaving'), 2600);
      return () => clearTimeout(t);
    }
    document.body.style.overflow = '';
    const t = setTimeout(() => setPhase('gone'), 900);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => () => { document.body.style.overflow = ''; }, []);

  if (phase === 'gone') return null;
  return (
    <div
      className={`intro${phase === 'leaving' ? ' is-leaving' : ''}`}
      onClick={() => setPhase('leaving')}
      role="presentation"
    >
      <div className="flex flex-col items-center">
        <Mark className="intro__mark h-16 w-auto text-cream sm:h-20" />
        <span className="intro__word mt-7 text-xl sm:text-2xl" aria-label="Velvent">
          {[...'Velvent'].map((c, i) => (
            <span key={i} className="intro__char" style={{ '--i': i }} aria-hidden>{c}</span>
          ))}
        </span>
        <span className="mt-4 flex w-56 items-center gap-3 text-[9px] font-semibold uppercase tracking-brand text-cream/60">
          <span className="intro__rule h-px flex-1 bg-cream/40" />
          Premium clothing
          <span className="intro__rule h-px flex-1 bg-cream/40" />
        </span>
      </div>
    </div>
  );
}
