import { MARK_PATH, MARK_VIEWBOX } from '../lib/mark';

/** The V monogram on its own. Inherits colour from the parent. */
export function Mark({ className = 'h-7 w-auto', title }) {
  return (
    <svg
      viewBox={MARK_VIEWBOX}
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d={MARK_PATH} fill="currentColor" />
    </svg>
  );
}

/**
 * Full lockup: monogram over the wordmark, with the "premium clothing" rule
 * underneath — matching the brand sheet.
 */
export default function Logo({ variant = 'row', withTagline = false, className = '' }) {
  if (variant === 'stacked') {
    return (
      <span className={`inline-flex flex-col items-center ${className}`}>
        <Mark className="h-10 w-auto sm:h-12" title="Velvent" />
        <span className="mt-2.5 font-display text-xl font-medium uppercase tracking-brand sm:text-2xl">
          Velvent
        </span>
        {withTagline && (
          <span className="mt-2 flex w-full items-center gap-2.5 text-[9px] font-medium uppercase tracking-brand opacity-70">
            <span className="h-px flex-1 bg-current" />
            Premium Clothing
            <span className="h-px flex-1 bg-current" />
          </span>
        )}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Mark className="h-6 w-auto sm:h-7" title="Velvent" />
      {/* Below about 360px the wordmark, the menu button and the three icons
          cannot all fit, and the row pushes the page into sideways scroll. The
          monogram carries the brand on its own at that size. */}
      <span className="hidden font-display text-base font-medium uppercase tracking-brand min-[360px]:inline sm:text-lg">
        Velvent
      </span>
    </span>
  );
}
