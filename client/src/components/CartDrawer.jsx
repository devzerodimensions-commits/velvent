import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bag, Close, Minus, Plus, Trash } from './Icons';
import { useCart } from '../store/cart';
import { inr } from '../lib/format';
import { useContent } from '../store/content';

export default function CartDrawer() {
  const BRAND = useContent('brand');
  const { items, lines, totals, pricing, priceError, drawerOpen, closeDrawer, setQty, remove, count } = useCart();

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && closeDrawer();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [drawerOpen, closeDrawer]);

  // Prefer server-priced lines; fall back to the local snapshot while they load.
  const rows = lines?.length
    ? lines
    : items.map((i) => ({
      variantId: i.variantId, name: i.name, slug: i.slug, imageUrl: i.image,
      size: i.size, color: i.color, unitPrice: i.salePrice, quantity: i.quantity,
      lineTotal: Number(i.salePrice) * i.quantity,
    }));

  const subtotal = totals?.subtotal ?? rows.reduce((s, r) => s + r.lineTotal, 0);
  const away = Math.max(0, BRAND.shipping.freeAbove - subtotal);
  const progress = Math.min(100, (subtotal / BRAND.shipping.freeAbove) * 100);

  return (
    <div className={`fixed inset-0 z-[70] ${drawerOpen ? '' : 'pointer-events-none'}`} aria-hidden={!drawerOpen}>
      <div
        className={`absolute inset-0 bg-navy-deep/50 transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={closeDrawer}
      />

      <aside
        role="dialog"
        aria-label="Shopping bag"
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex items-center justify-between border-b border-mist px-5 py-4">
          <h2 className="flex items-center gap-2.5 text-[12px] font-semibold uppercase tracking-wider2">
            <Bag size={19} /> Your Bag {count > 0 && <span className="text-slate">({count})</span>}
          </h2>
          <button onClick={closeDrawer} aria-label="Close bag" className="p-1 text-navy transition hover:text-slate">
            <Close size={22} />
          </button>
        </header>

        {rows.length > 0 && (
          <div className="border-b border-mist bg-cream px-5 py-3">
            {away > 0 ? (
              <p className="text-[11.5px] text-navy">
                Add <strong>{inr(away)}</strong> more for free shipping
              </p>
            ) : (
              <p className="text-[11.5px] font-semibold text-navy">You have unlocked free shipping.</p>
            )}
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-cream-deep">
              <div className="h-full rounded-full bg-navy transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5">
          {rows.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-16 text-center">
              <Bag size={44} className="text-mist" />
              <p className="mt-5 text-sm font-medium text-navy">Your bag is empty</p>
              <p className="mt-1.5 max-w-[16rem] text-[13px] leading-relaxed text-slate">
                Knitted polos, button-through shirts and oversized tees — all made in cotton.
              </p>
              <Link to="/shop" onClick={closeDrawer} className="btn-primary mt-6">Start shopping</Link>
            </div>
          ) : (
            <ul className="divide-y divide-mist/70">
              {rows.map((r) => (
                <li key={r.variantId} className="flex gap-4 py-4">
                  <Link to={`/product/${r.slug}`} onClick={closeDrawer} className="shrink-0">
                    <img src={r.imageUrl} alt={r.name} className="h-28 w-[84px] bg-cream object-cover" loading="lazy" />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link
                      to={`/product/${r.slug}`}
                      onClick={closeDrawer}
                      className="text-[13px] font-medium leading-snug text-navy hover:underline"
                    >
                      {r.name}
                    </Link>
                    <p className="mt-1 text-[11.5px] text-slate">{r.color} · Size {r.size}</p>

                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center border border-mist">
                        <button
                          onClick={() => setQty(r.variantId, r.quantity - 1)}
                          className="grid h-8 w-8 place-items-center text-navy transition hover:bg-cream disabled:opacity-40"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-[12.5px] font-semibold">{r.quantity}</span>
                        <button
                          onClick={() => setQty(r.variantId, r.quantity + 1)}
                          disabled={r.quantity >= 10}
                          className="grid h-8 w-8 place-items-center text-navy transition hover:bg-cream disabled:opacity-40"
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[13.5px] font-semibold">{inr(r.lineTotal)}</span>
                        <button
                          onClick={() => remove(r.variantId)}
                          aria-label={`Remove ${r.name}`}
                          className="text-slate transition hover:text-sale"
                        >
                          <Trash size={17} />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {rows.length > 0 && (
          <footer className="border-t border-mist px-5 py-4">
            {priceError && <p className="mb-3 bg-sale/10 px-3 py-2 text-[12px] text-sale">{priceError}</p>}

            <div className="flex items-baseline justify-between">
              <span className="text-[12px] font-semibold uppercase tracking-wider2 text-slate">Subtotal</span>
              <span className={`text-lg font-semibold ${pricing ? 'opacity-50' : ''}`}>{inr(subtotal)}</span>
            </div>
            <p className="mt-1 text-[11px] text-slate">Shipping and discounts are applied at checkout.</p>

            <Link to="/checkout" onClick={closeDrawer} className="btn-primary mt-4 w-full">
              Checkout · {inr(subtotal)}
            </Link>
            <Link to="/cart" onClick={closeDrawer} className="btn-outline mt-2 w-full">View full bag</Link>
          </footer>
        )}
      </aside>
    </div>
  );
}
