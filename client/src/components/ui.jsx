import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ChevronRight, Star } from './Icons';

/** Scrolls to the top on every navigation — routers do not do this by default. */
export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return null;
}

export function Spinner({ size = 22, className = '' }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function PageLoader() {
  return (
    <div className="grid min-h-[55vh] place-items-center">
      <Spinner size={30} className="text-navy" />
    </div>
  );
}

export function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[11px] uppercase tracking-wider2 text-slate">
      <Link to="/" className="transition hover:text-navy">Home</Link>
      {items.map((item, i) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <ChevronRight size={13} className="text-mist" />
          {item.to && i < items.length - 1
            ? <Link to={item.to} className="transition hover:text-navy">{item.label}</Link>
            : <span className="text-navy">{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function SectionHead({ eyebrow, title, action, actionTo, center = false }) {
  return (
    <div className={`mb-8 flex items-end gap-4 ${center ? 'flex-col items-center text-center' : 'justify-between'}`}>
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="h-section mt-2">{title}</h2>
      </div>
      {action && actionTo && (
        <Link to={actionTo} className="link-underline shrink-0 pb-1 text-[11px] font-semibold uppercase tracking-wider2 text-navy">
          {action}
        </Link>
      )}
    </div>
  );
}

export function Rating({ value = 0, count, size = 14, showCount = true }) {
  const v = Number(value) || 0;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="flex" aria-label={`Rated ${v} out of 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} size={size} filled={n <= Math.round(v)} className={n <= Math.round(v) ? 'text-navy' : 'text-mist'} />
        ))}
      </span>
      {showCount && (
        <span className="text-[11.5px] text-slate">
          {count ? `${v} (${count})` : 'No reviews yet'}
        </span>
      )}
    </span>
  );
}

export function Accordion({ items, defaultOpen = 0 }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="divide-y divide-mist border-y border-mist">
      {items.filter(Boolean).map((item, i) => (
        <div key={item.title}>
          <button
            onClick={() => setOpen(open === i ? -1 : i)}
            aria-expanded={open === i}
            className="flex w-full items-center justify-between py-4 text-left"
          >
            <span className="text-[12px] font-semibold uppercase tracking-wider2 text-navy">{item.title}</span>
            <ChevronDown size={18} className={`shrink-0 text-slate transition-transform duration-300 ${open === i ? 'rotate-180' : ''}`} />
          </button>
          <div className={`grid transition-all duration-300 ${open === i ? 'grid-rows-[1fr] pb-5' : 'grid-rows-[0fr]'}`}>
            <div className="overflow-hidden text-[13.5px] leading-relaxed text-slate">{item.body}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  const nums = [];
  for (let i = 1; i <= pages; i += 1) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
    else if (nums[nums.length - 1] !== '…') nums.push('…');
  }
  const btn = 'grid h-10 min-w-10 place-items-center border px-3 text-[12px] font-semibold transition';
  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-1.5">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className={`${btn} border-mist text-navy hover:border-navy disabled:opacity-35 disabled:hover:border-mist`}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>
      {nums.map((n, i) => (n === '…' ? (
        <span key={`gap-${i}`} className="px-1.5 text-slate">…</span>
      ) : (
        <button
          key={n}
          onClick={() => onChange(n)}
          aria-current={n === page ? 'page' : undefined}
          className={`${btn} ${n === page ? 'border-navy bg-navy text-cream' : 'border-mist text-navy hover:border-navy'}`}
        >
          {n}
        </button>
      )))}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= pages}
        className={`${btn} border-mist text-navy hover:border-navy disabled:opacity-35 disabled:hover:border-mist`}
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}

export function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      {Icon && <Icon size={46} className="text-mist" />}
      <h3 className="mt-5 text-base font-semibold text-navy">{title}</h3>
      {body && <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed text-slate">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Alert({ tone = 'error', children }) {
  if (!children) return null;
  const tones = {
    error: 'border-sale/30 bg-sale/8 text-sale',
    success: 'border-emerald-300 bg-emerald-50 text-emerald-800',
    info: 'border-mist bg-cream text-navy',
  };
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`border px-4 py-3 text-[13px] leading-relaxed ${tones[tone]}`}>
      {children}
    </div>
  );
}

const DEFAULT_DESCRIPTION =
  'VELVENT is a premium clothing label built on knitted cotton — polo t-shirts, '
  + 'button-through polo shirts and oversized tees. Simple. Timeless. Premium.';
const DEFAULT_SHARE_IMAGE = '/products/rugby-stripe-polo-1.jpg';

/** Creates the tag on first use, then just updates it. */
function upsertMeta(attr, name, content) {
  let tag = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function upsertLink(rel, href) {
  let tag = document.head.querySelector(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', href);
}

/**
 * Per-page title, description, canonical URL and social tags. Crawlers only ever
 * see one HTML shell in a single-page app, so every page has to write its own.
 *
 * `noindex` is for pages that should stay out of search results (the bag, the
 * checkout, an order, anything behind a sign-in). `jsonLd` takes a structured
 * data object — a Product on a product page, for instance.
 */
export function Seo({ title, description, image, noindex = false, jsonLd = null }) {
  useEffect(() => {
    const full = title ? `${title} | VELVENT` : 'VELVENT — Premium Clothing';
    const text = description || DEFAULT_DESCRIPTION;
    const { origin, pathname } = window.location;
    const canonical = origin + pathname;

    document.title = full;
    upsertMeta('name', 'description', text);
    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
    upsertMeta('property', 'og:title', full);
    upsertMeta('property', 'og:description', text);
    upsertMeta('property', 'og:url', canonical);
    // Social crawlers reject relative image paths, so resolve against the origin.
    upsertMeta('property', 'og:image', new URL(image || DEFAULT_SHARE_IMAGE, origin).href);
    upsertMeta('name', 'twitter:title', full);
    upsertMeta('name', 'twitter:description', text);
    upsertLink('canonical', canonical);
  }, [title, description, image, noindex]);

  useEffect(() => {
    if (!jsonLd) return undefined;
    const tag = document.createElement('script');
    tag.type = 'application/ld+json';
    tag.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(tag);
    return () => tag.remove();
  }, [jsonLd]);

  return null;
}
