import { useEffect, useRef } from 'react';

const DARK = '.cx-stage, .bg-ink, .bg-navy, .bg-navy-deep, .intro';

/**
 * A ring that eases after the pointer and opens into a labelled disc over any
 * element carrying data-cursor="Label". Only mounts its loop on devices with a
 * fine pointer that allow motion; everywhere else it renders nothing visible.
 */
export default function Cursor() {
  const ref = useRef(null);
  const labelRef = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const fine = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!fine || still) return undefined;

    let x = -100; let y = -100; let cx = x; let cy = y; let raf = 0;

    const loop = () => {
      cx += (x - cx) * 0.2;
      cy += (y - cy) * 0.2;
      el.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e) => {
      x = e.clientX; y = e.clientY;
      el.classList.add('is-on');
      const target = e.target instanceof Element ? e.target : null;
      const hot = target?.closest('[data-cursor]');
      el.classList.toggle('is-big', Boolean(hot));
      if (hot && labelRef.current) labelRef.current.textContent = hot.getAttribute('data-cursor');
      el.classList.toggle('is-dark', Boolean(target?.closest(DARK)));
    };
    const onLeave = () => el.classList.remove('is-on');
    const onDown = () => el.classList.add('is-press');
    const onUp = () => el.classList.remove('is-press');

    raf = requestAnimationFrame(loop);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  return (
    <div ref={ref} className="cursor" aria-hidden>
      <span ref={labelRef} className="cursor__label">View</span>
    </div>
  );
}
