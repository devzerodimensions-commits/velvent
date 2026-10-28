import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Breadcrumbs, EmptyState, Seo } from '../components/ui';
import { Bag, Check, Minus, Plus, Tag, Trash, Truck } from '../components/Icons';
import { useCart } from '../store/cart';
import { useToast } from '../store/toast';
import { api } from '../lib/api';
import { inr } from '../lib/format';
import { useContent } from '../store/content';

function CouponBox() {
  const { couponCode, setCouponCode, totals } = useCart();
  const [code, setCode] = useState('');
  const [offers, setOffers] = useState([]);
  const [busy, setBusy] = useState(false);
  const { success, error } = useToast();

  useEffect(() => { api.offers().then(setOffers).catch(() => {}); }, []);

  const apply = async (e) => {
    e?.preventDefault();
    const value = (code || '').trim();
    if (!value) return;
    setBusy(true);
    try {
      const coupon = await api.coupon(value);
      setCouponCode(coupon.code);
      setCode('');
      success(`Coupon ${coupon.code} applied.`);
    } catch (err) {
      error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (couponCode && totals?.discount > 0) {
    return (
      <div className="flex items-center justify-between border border-emerald-300 bg-emerald-50 px-4 py-3">
        <span className="flex items-center gap-2.5 text-[13px] font-medium text-emerald-900">
          <Check size={17} /> {couponCode} applied — you saved {inr(totals.discount)}
        </span>
        <button onClick={() => setCouponCode('')} className="text-[11px] font-semibold uppercase tracking-wider2 text-emerald-900 hover:underline">
          Remove
        </button>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={apply} className="flex">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Coupon code"
          aria-label="Coupon code"
          className="field flex-1 uppercase"
        />
        <button type="submit" disabled={busy || !code.trim()} className="btn-outline px-5">
          {busy ? '…' : 'Apply'}
        </button>
      </form>

      {offers.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {offers.map((o) => (
            <li key={o.code}>
              <button
                onClick={() => setCode(o.code)}
                className="flex w-full items-center gap-2 text-left text-[12px] text-slate transition hover:text-navy"
              >
                <Tag size={14} className="shrink-0" />
                <span className="font-semibold text-navy">{o.code}</span> — {o.description}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Cart() {
  const BRAND = useContent('brand');
  const { items, lines, totals, pricing, priceError, setQty, remove, count } = useCart();

  const rows = lines?.length ? lines : items.map((i) => ({
    variantId: i.variantId, name: i.name, slug: i.slug, imageUrl: i.image,
    size: i.size, color: i.color, unitPrice: i.salePrice, quantity: i.quantity,
    mrp: i.salePrice, lineTotal: Number(i.salePrice) * i.quantity,
  }));

  if (rows.length === 0) {
    return (
      <>
        <Seo title="Your Bag" noindex />
        <div className="shell py-10">
          <Breadcrumbs items={[{ label: 'Bag' }]} />
          <EmptyState
            icon={Bag}
            title="Your bag is empty"
            body="Nothing here yet. Browse knitted polos, button-through shirts and oversized tees."
            action={<Link to="/shop" className="btn-primary">Start shopping</Link>}
          />
        </div>
      </>
    );
  }

  const subtotal = totals?.subtotal ?? rows.reduce((s, r) => s + r.lineTotal, 0);
  const away = Math.max(0, BRAND.shipping.freeAbove - subtotal);

  return (
    <>
      <Seo title="Your Bag" noindex />
      <div className="shell py-8 sm:py-11">
        <Breadcrumbs items={[{ label: 'Bag' }]} />
        <h1 className="h-section mt-4">Your Bag <span className="text-slate">({count})</span></h1>

        {priceError && <div className="mt-6"><Alert>{priceError}</Alert></div>}

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-14">
          <div>
            {away > 0 ? (
              <p className="mb-6 flex items-center gap-2.5 border border-mist bg-cream px-4 py-3 text-[13px] text-navy">
                <Truck size={18} className="shrink-0" />
                Add <strong>{inr(away)}</strong> more to get free shipping
              </p>
            ) : (
              <p className="mb-6 flex items-center gap-2.5 border border-emerald-300 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-900">
                <Check size={18} className="shrink-0" /> Your order ships free
              </p>
            )}

            <ul className="divide-y divide-mist border-y border-mist">
              {rows.map((r) => (
                <li key={r.variantId} className="flex gap-4 py-6 sm:gap-6">
                  <Link to={`/product/${r.slug}`} className="shrink-0">
                    <img src={r.imageUrl} alt={r.name} className="h-36 w-[108px] bg-cream object-cover sm:h-44 sm:w-[132px]" loading="lazy" />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <Link to={`/product/${r.slug}`} className="text-[14px] font-medium leading-snug text-navy hover:underline">
                          {r.name}
                        </Link>
                        <p className="mt-1.5 text-[12.5px] text-slate">{r.color} · Size {r.size}</p>
                        {r.sku && <p className="mt-0.5 text-[11px] text-slate-light">SKU {r.sku}</p>}
                      </div>
                      <button
                        onClick={() => remove(r.variantId)}
                        aria-label={`Remove ${r.name}`}
                        className="shrink-0 text-slate transition hover:text-sale"
                      >
                        <Trash size={18} />
                      </button>
                    </div>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-4">
                      <div className="flex items-center border border-mist">
                        <button
                          onClick={() => setQty(r.variantId, r.quantity - 1)}
                          className="grid h-10 w-10 place-items-center transition hover:bg-cream"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-9 text-center text-[13px] font-semibold">{r.quantity}</span>
                        <button
                          onClick={() => setQty(r.variantId, r.quantity + 1)}
                          disabled={r.quantity >= 10}
                          className="grid h-10 w-10 place-items-center transition hover:bg-cream disabled:opacity-40"
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="text-[15px] font-semibold text-navy">{inr(r.lineTotal)}</p>
                        <p className="text-[11.5px] text-slate">{inr(r.unitPrice)} each</p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <Link to="/shop" className="link-underline mt-6 inline-block text-[11.5px] font-semibold uppercase tracking-wider2 text-navy">
              ← Continue shopping
            </Link>
          </div>

          <aside className="lg:sticky lg:top-[calc(var(--nav-h)+40px)] lg:h-fit">
            <div className="card-surface p-6">
              <h2 className="text-[12px] font-semibold uppercase tracking-wider2">Order summary</h2>

              <div className="mt-5"><CouponBox /></div>

              <dl className={`mt-6 space-y-3 border-t border-mist pt-5 text-[13.5px] ${pricing ? 'opacity-60' : ''}`}>
                {totals?.mrpTotal > totals?.subtotal && (
                  <div className="flex justify-between text-slate">
                    <dt>Total MRP</dt>
                    <dd className="line-through">{inr(totals.mrpTotal)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-slate">Subtotal</dt>
                  <dd className="font-medium text-navy">{inr(subtotal)}</dd>
                </div>
                {totals?.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <dt>Coupon ({totals.couponCode})</dt>
                    <dd>− {inr(totals.discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-slate">Shipping</dt>
                  <dd className="font-medium">
                    {totals ? (totals.shipping === 0 ? <span className="text-emerald-700">Free</span> : inr(totals.shipping)) : '—'}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between border-t border-mist pt-4 text-base">
                  <dt className="font-semibold uppercase tracking-wider2 text-[12px]">Total</dt>
                  <dd className="text-lg font-semibold">{inr(totals?.total ?? subtotal)}</dd>
                </div>
              </dl>

              {totals?.savings > 0 && (
                <p className="mt-3 bg-emerald-50 px-3 py-2 text-center text-[12.5px] font-medium text-emerald-800">
                  You save {inr(totals.savings)} on this order
                </p>
              )}

              <Link to="/checkout" className="btn-primary mt-6 w-full">Proceed to checkout</Link>
              <p className="mt-3 text-center text-[11px] text-slate">Taxes included · Secure checkout</p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
