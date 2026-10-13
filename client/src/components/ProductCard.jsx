import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from './Icons';
import { inr, discountPct } from '../lib/format';
import { useAuth } from '../store/auth';
import { useToast } from '../store/toast';

export default function ProductCard({ product, eager = false }) {
  const images = product.images?.length ? product.images : [{ url: '/brand/favicon.svg', alt: product.name }];
  const [idx, setIdx] = useState(0);
  const { user, wishlistIds, toggleWishlist } = useAuth();
  const { success, error } = useToast();

  const off = discountPct(product.mrp, product.sale_price);
  const soldOut = Number(product.total_stock) === 0;
  const wished = wishlistIds?.has(product.id);
  const colors = (product.colors || []).filter((c) => c?.color);

  const onWish = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { error('Sign in to save pieces to your wishlist.'); return; }
    try {
      const added = await toggleWishlist(product.id);
      success(added ? 'Saved to your wishlist.' : 'Removed from your wishlist.');
    } catch (err) {
      error(err.message);
    }
  };

  return (
    <article className="group relative">
      <Link to={`/product/${product.slug}`} className="block">
        <div
          className="relative aspect-[3/4] overflow-hidden bg-cream"
          onMouseEnter={() => images[1] && setIdx(1)}
          onMouseLeave={() => setIdx(0)}
        >
          <img
            src={images[Math.min(idx, images.length - 1)].url}
            alt={images[Math.min(idx, images.length - 1)].alt || product.name}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            className={`h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04] ${
              soldOut ? 'opacity-60' : ''
            }`}
          />

          <div className="absolute left-0 top-3 flex flex-col items-start gap-1.5">
            {product.is_new && !soldOut && (
              <span className="bg-navy px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wider2 text-cream">New</span>
            )}
            {off > 0 && !soldOut && (
              <span className="bg-sale px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wider2 text-white">
                {off}% Off
              </span>
            )}
          </div>

          {soldOut && (
            <span className="absolute inset-x-0 bottom-0 bg-navy/90 py-2 text-center text-[10px] font-bold uppercase tracking-brand text-cream">
              Sold Out
            </span>
          )}

          <button
            onClick={onWish}
            aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={!!wished}
            className={`absolute right-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full bg-white/90 backdrop-blur transition
              hover:bg-white ${wished ? 'text-sale' : 'text-navy'}
              opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-sm:opacity-100`}
          >
            <Heart size={17} filled={wished} />
          </button>
        </div>
      </Link>

      <div className="pt-3.5">
        {product.category_name && (
          <p className="text-[10px] font-medium uppercase tracking-wider2 text-slate-light">{product.category_name}</p>
        )}
        <h3 className="mt-1 text-[13.5px] font-medium leading-snug text-navy">
          <Link to={`/product/${product.slug}`} className="link-underline">{product.name}</Link>
        </h3>

        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-[15px] font-semibold text-navy">{inr(product.sale_price)}</span>
          {off > 0 && <span className="text-xs text-slate-light line-through">{inr(product.mrp)}</span>}
          {off > 0 && <span className="text-[11px] font-semibold text-sale">{off}% off</span>}
        </div>

        {colors.length > 1 && (
          <div className="mt-2.5 flex items-center gap-1.5">
            {colors.slice(0, 5).map((c) => (
              <span
                key={c.color}
                title={c.color}
                className="h-3.5 w-3.5 rounded-full border border-mist"
                style={{ backgroundColor: c.hex || '#D6D6D6' }}
              />
            ))}
            <span className="ml-0.5 text-[10.5px] text-slate-light">{colors.length} colours</span>
          </div>
        )}
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div>
      <div className="skeleton aspect-[3/4] w-full" />
      <div className="skeleton mt-3.5 h-2.5 w-16" />
      <div className="skeleton mt-2 h-3.5 w-3/4" />
      <div className="skeleton mt-2 h-3.5 w-20" />
    </div>
  );
}
