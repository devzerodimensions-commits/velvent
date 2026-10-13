import { Link } from 'react-router-dom';
import { Breadcrumbs, EmptyState, Seo } from '../components/ui';
import { Heart, Trash } from '../components/Icons';
import { useAuth } from '../store/auth';
import { useToast } from '../store/toast';
import { inr } from '../lib/format';

export default function Wishlist() {
  const { wishlist, toggleWishlist } = useAuth();
  const { success, error } = useToast();

  const remove = async (id) => {
    try { await toggleWishlist(id); success('Removed from your wishlist.'); }
    catch (err) { error(err.message); }
  };

  return (
    <>
      <Seo title="Wishlist" noindex />
      <div className="shell py-8 sm:py-11">
        <Breadcrumbs items={[{ to: '/account', label: 'Account' }, { label: 'Wishlist' }]} />
        <h1 className="h-section mt-4">Wishlist <span className="text-slate">({wishlist.length})</span></h1>

        {wishlist.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Nothing saved yet"
            body="Tap the heart on any product to keep it here for later."
            action={<Link to="/shop" className="btn-primary">Browse the collection</Link>}
          />
        ) : (
          <div className="mt-9 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {wishlist.map((p) => (
              <article key={p.id} className="group relative">
                <Link to={`/product/${p.slug}`} className="block overflow-hidden bg-cream">
                  <img
                    src={p.image_url}
                    alt={p.name}
                    loading="lazy"
                    className="aspect-[3/4] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </Link>
                <button
                  onClick={() => remove(p.id)}
                  aria-label={`Remove ${p.name} from wishlist`}
                  className="absolute right-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-navy backdrop-blur transition hover:bg-white hover:text-sale"
                >
                  <Trash size={16} />
                </button>
                <h2 className="mt-3.5 text-[13.5px] font-medium leading-snug">
                  <Link to={`/product/${p.slug}`} className="link-underline">{p.name}</Link>
                </h2>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-[15px] font-semibold">{inr(p.sale_price)}</span>
                  <span className="text-xs text-slate-light line-through">{inr(p.mrp)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
