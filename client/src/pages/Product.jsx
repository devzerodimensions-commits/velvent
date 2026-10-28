import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { Accordion, Alert, Breadcrumbs, PageLoader, Rating, SectionHead, Seo } from '../components/ui';
import { SizeGuideModal } from '../components/SizeGuide';
import { Bag, Heart, Minus, Plus, Refresh, Ruler, Share, Shield, Similar, Truck } from '../components/Icons';
import { api } from '../lib/api';
import { bySize, deliveryEstimate, discountPct, formatDate, inr } from '../lib/format';
import { BRAND } from '../lib/brand';
import { useCart } from '../store/cart';
import { useAuth } from '../store/auth';
import { useToast } from '../store/toast';

function Gallery({ images, name, activeColor }) {
  const shown = useMemo(() => {
    const forColor = images.filter((i) => !i.color || i.color === activeColor);
    return forColor.length ? forColor : images;
  }, [images, activeColor]);

  const [i, setI] = useState(0);
  const stripRef = useRef(null);
  // Once the shopper takes hold of the gallery it stops moving on its own:
  // an image sliding away mid-look is worse than one that never moved.
  const [taken, setTaken] = useState(false);

  useEffect(() => {
    setI(0);
    stripRef.current?.scrollTo({ left: 0, behavior: 'auto' });
  }, [activeColor]);

  /* On a phone the gallery carries itself through the images, so a shopper who
     never thinks to swipe still sees more than the first one. It only runs
     while the strip is laid out — it is display:none above the small
     breakpoint, where the thumbnail column does this job instead. */
  useEffect(() => {
    if (taken || shown.length < 2) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;

    const id = setInterval(() => {
      const el = stripRef.current;
      if (!el || !el.clientWidth) return;
      const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % shown.length;
      el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
    }, 4000);
    return () => clearInterval(id);
  }, [taken, shown.length]);

  const goTo = (n) => {
    setTaken(true);
    setI(n);
    const el = stripRef.current;
    if (el?.clientWidth) el.scrollTo({ left: n * el.clientWidth, behavior: 'smooth' });
  };

  /* The strip is the source of truth on a phone, so the bars follow it. */
  const onStripScroll = (e) => {
    const el = e.currentTarget;
    if (!el.clientWidth) return;
    const n = Math.round(el.scrollLeft / el.clientWidth);
    if (n !== i && n >= 0 && n < shown.length) setI(n);
  };

  const current = shown[Math.min(i, shown.length - 1)] || images[0];

  return (
    <div className="flex gap-3 lg:gap-4">
      {shown.length > 1 && (
        <div className="order-1 hidden w-[76px] shrink-0 flex-col gap-3 sm:flex">
          {shown.map((img, n) => (
            <button
              key={img.url + n}
              onClick={() => setI(n)}
              aria-label={`View image ${n + 1}`}
              aria-current={n === i}
              className={`aspect-[3/4] overflow-hidden border-2 bg-cream transition ${
                n === i ? 'border-navy' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img src={img.url} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      <div className="order-2 min-w-0 flex-1">
        {/* Above the small breakpoint the thumbnail column picks the image. */}
        <div className="hidden aspect-[3/4] overflow-hidden bg-cream sm:block">
          <img
            src={current?.url}
            alt={current?.alt || name}
            className="h-full w-full object-cover"
            fetchpriority="high"
          />
        </div>

        {/* On a phone it is a real strip: swipe it, or let it carry itself. */}
        <div
          ref={stripRef}
          onScroll={onStripScroll}
          onTouchStart={() => setTaken(true)}
          onPointerDown={() => setTaken(true)}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:hidden"
        >
          {shown.map((img, n) => (
            <div key={img.url + n} className="aspect-[3/4] w-full shrink-0 snap-center overflow-hidden bg-cream">
              <img
                src={img.url}
                alt={img.alt || name}
                className="h-full w-full object-cover"
                fetchpriority={n === 0 ? 'high' : undefined}
                loading={n === 0 ? undefined : 'lazy'}
              />
            </div>
          ))}
        </div>

        {shown.length > 1 && (
          <div className="mt-3 flex gap-2 sm:hidden">
            {shown.map((img, n) => (
              <button
                key={img.url + n}
                onClick={() => goTo(n)}
                aria-label={`View image ${n + 1}`}
                aria-current={n === i}
                className={`h-1.5 flex-1 transition ${n === i ? 'bg-navy' : 'bg-mist'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewForm({ slug, onDone }) {
  const [form, setForm] = useState({ author: '', rating: 5, title: '', body: '' });
  const [busy, setBusy] = useState(false);
  const { success, error } = useToast();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.addReview(slug, form);
      success('Thanks — your review is live.');
      setForm({ author: '', rating: 5, title: '', body: '' });
      onDone();
    } catch (err) {
      error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card-surface mt-8 p-6">
      <h3 className="text-[12px] font-semibold uppercase tracking-wider2">Write a review</h3>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="rv-name">Your name</label>
          <input
            id="rv-name"
            required
            value={form.author}
            onChange={(e) => setForm({ ...form, author: e.target.value })}
            className="field"
          />
        </div>
        <div>
          <label className="label" htmlFor="rv-rating">Rating</label>
          <select
            id="rv-rating"
            value={form.rating}
            onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
            className="field"
          >
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}
          </select>
        </div>
      </div>
      <div className="mt-4">
        <label className="label" htmlFor="rv-title">Headline</label>
        <input id="rv-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="field" />
      </div>
      <div className="mt-4">
        <label className="label" htmlFor="rv-body">Your review</label>
        <textarea
          id="rv-body"
          rows={4}
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          className="field resize-y"
        />
      </div>
      <button type="submit" disabled={busy} className="btn-primary mt-5">
        {busy ? 'Posting…' : 'Post review'}
      </button>
    </form>
  );
}

export default function Product() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const { user, wishlistIds, toggleWishlist } = useAuth();
  const { success, error } = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [color, setColor] = useState(null);
  const [size, setSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [sizeWarning, setSizeWarning] = useState(false);
  const [sizeGuide, setSizeGuide] = useState(false);

  const load = () => {
    setLoading(true);
    api.product(slug)
      .then((p) => {
        setProduct(p);
        setColor(p.variants?.[0]?.color || null);
        setSize(null);
        setQty(1);
        setNotFound(false);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  };

  useEffect(load, [slug]);

  const colors = useMemo(() => {
    if (!product) return [];
    const seen = new Map();
    product.variants.forEach((v) => { if (!seen.has(v.color)) seen.set(v.color, v.color_hex); });
    return [...seen].map(([name, hex]) => ({ name, hex }));
  }, [product]);

  const sizesForColor = useMemo(() => {
    if (!product) return [];
    return product.variants
      .filter((v) => v.color === color)
      .sort((a, b) => bySize(a.size, b.size));
  }, [product, color]);

  // Structured data, so search results can carry the price, stock and rating.
  // Image paths have to be absolute here, unlike everywhere else on the page.
  const structuredData = useMemo(() => {
    if (!product) return null;
    const { origin } = window.location;
    const inStock = product.variants.some((v) => v.stock > 0);
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.short_desc || product.description || undefined,
      sku: product.variants[0]?.sku || undefined,
      category: product.category_name || undefined,
      brand: { '@type': 'Brand', name: 'VELVENT' },
      image: (product.images || []).slice(0, 4).map((i) => new URL(i.url, origin).href),
      offers: {
        '@type': 'Offer',
        url: `${origin}/product/${product.slug}`,
        priceCurrency: 'INR',
        price: Number(product.sale_price).toFixed(2),
        availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        itemCondition: 'https://schema.org/NewCondition',
      },
      ...(Number(product.review_count) > 0 ? {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: Number(product.rating),
          reviewCount: Number(product.review_count),
        },
      } : {}),
    };
  }, [product]);

  const variant = sizesForColor.find((v) => v.size === size) || null;

  if (loading) return <PageLoader />;
  if (notFound || !product) {
    return (
      <div className="shell py-28 text-center">
        <h1 className="h-section">Product not found</h1>
        <p className="mt-3 text-sm text-slate">The piece you are looking for is no longer listed.</p>
        <Link to="/shop" className="btn-primary mt-8">Back to shop</Link>
      </div>
    );
  }

  const off = discountPct(product.mrp, product.sale_price);
  const wished = wishlistIds?.has(product.id);
  const totalStock = product.variants.reduce((n, v) => n + v.stock, 0);

  const addToBag = ({ buyNow = false } = {}) => {
    if (!variant) { setSizeWarning(true); return; }
    const image = product.images.find((i) => i.color === color)?.url || product.images[0]?.url;
    add({
      variantId: variant.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image,
      size: variant.size,
      color: variant.color,
      salePrice: Number(product.sale_price),
      quantity: qty,
    }, { open: !buyNow });
    if (buyNow) navigate('/checkout');
    else success(`${product.name} added to your bag.`);
  };

  const onWish = async () => {
    if (!user) { error('Sign in to save pieces to your wishlist.'); return; }
    try {
      const added = await toggleWishlist(product.id);
      success(added ? 'Saved to your wishlist.' : 'Removed from your wishlist.');
    } catch (err) { error(err.message); }
  };

  /**
   * The phone's own share sheet where there is one — that is how a shopper
   * sends a piece to WhatsApp, which is where most of this sharing happens.
   * Desktop browsers mostly have no sheet, so the link goes to the clipboard
   * instead. Dismissing the sheet is not a failure and says nothing.
   */
  const sharePiece = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, text: `${product.name} · ${inr(product.sale_price)}`, url });
        return;
      } catch (err) {
        // Closing the sheet is a decision, not a failure — say nothing.
        if (err?.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      success('Link copied — paste it anywhere.');
      return;
    } catch { /* the async clipboard is often refused; fall through */ }

    // The old way still works where permission for the new one does not.
    const field = document.createElement('textarea');
    field.value = url;
    field.setAttribute('readonly', '');
    field.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    document.body.appendChild(field);
    field.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch { copied = false; }
    field.remove();

    if (copied) success('Link copied — paste it anywhere.');
    else error('Could not copy. Use the address in your browser bar.');
  };

  return (
    <>
      <SizeGuideModal
        open={sizeGuide}
        onClose={() => setSizeGuide(false)}
        categorySlug={product.category_slug}
        selectedSize={size}
      />

      <Seo
        title={product.name}
        description={product.short_desc || product.description?.slice(0, 155)}
        image={product.images?.[0]?.url}
        jsonLd={structuredData}
      />

      <div className="shell pt-6">
        <Breadcrumbs
          items={[
            { to: '/shop', label: 'Shop' },
            ...(product.category_slug ? [{ to: `/category/${product.category_slug}`, label: product.category_name }] : []),
            { label: product.name },
          ]}
        />
      </div>

      <div className="shell grid gap-10 py-8 lg:grid-cols-2 lg:gap-16 lg:py-12">
        {/* The shortcut to the similar pieces, sitting on the photograph where
            a shopper is already looking. On a phone it clears the gallery's
            position bars; the anchor scrolls smoothly on its own. */}
        {/* self-start matters: as a grid item this column would otherwise
            stretch to the height of the details beside it, and the chip would
            anchor to the bottom of that empty space rather than the picture. */}
        <div className="relative self-start">
          <Gallery images={product.images} name={product.name} activeColor={color} />

          {/* Stacked on the photograph: similar first, share under it. Share is
              only here on a phone — on desktop it stays in the button row,
              where there is room for it and no need to say it twice. */}
          <div className="absolute bottom-9 right-3 flex flex-col items-end gap-2 sm:bottom-3">
            {product.related?.length > 0 && (
            <a
              href="#similar"
              onClick={(e) => {
                const el = document.getElementById('similar');
                if (!el) return;
                // Scrolled here rather than left to the hash: the router owns
                // the location and the address bar gaining a #similar it then
                // has to carry around is worse than a plain scroll.
                e.preventDefault();
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              data-cursor="Similar"
              title="See similar products"
              aria-label={`See ${product.related.length} similar ${product.related.length === 1 ? 'product' : 'products'}`}
              className="grid h-10 w-10 place-items-center rounded-md border border-mist bg-white/95 text-navy shadow-md backdrop-blur transition hover:border-navy hover:bg-white"
            >
              <Similar size={19} />
            </a>
            )}

            <button
              type="button"
              onClick={sharePiece}
              data-cursor="Share"
              aria-label={`Share ${product.name}`}
              className="grid h-10 w-10 place-items-center rounded-md border border-mist bg-white/95 text-navy shadow-md backdrop-blur transition hover:border-navy hover:bg-white sm:hidden"
            >
              <Share size={19} />
            </button>
          </div>
        </div>

        <div className="lg:max-w-lg">
          {product.category_name && (
            <Link
              to={`/category/${product.category_slug}`}
              className="text-[10.5px] font-medium uppercase tracking-brand text-slate hover:text-navy"
            >
              {product.category_name}
            </Link>
          )}
          <h1 className="mt-2.5 font-display text-2xl font-semibold leading-tight text-navy sm:text-3xl">
            {product.name}
          </h1>

          <div className="mt-3">
            <Rating value={product.rating} count={product.review_count} />
          </div>

          <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-2xl font-semibold text-navy">{inr(product.sale_price)}</span>
            {off > 0 && (
              <>
                <span className="text-base text-slate-light line-through">{inr(product.mrp)}</span>
                <span className="bg-sale px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
                  {off}% off
                </span>
              </>
            )}
          </div>
          <p className="mt-1 text-[11.5px] text-slate">Inclusive of all taxes</p>

          {product.short_desc && (
            <p className="mt-6 text-[14.5px] leading-relaxed text-slate">{product.short_desc}</p>
          )}

          {colors.length > 1 && (
            <section className="mt-8">
              <h2 className="eyebrow">
                Colour: <span className="text-navy">{color}</span>
              </h2>
              <div className="mt-3.5 flex flex-wrap gap-2.5">
                {colors.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => { setColor(c.name); setSize(null); setSizeWarning(false); }}
                    aria-label={c.name}
                    aria-pressed={c.name === color}
                    title={c.name}
                    className={`grid h-10 w-10 place-items-center rounded-full border-2 transition ${
                      c.name === color ? 'border-navy' : 'border-mist hover:border-slate'
                    }`}
                  >
                    <span className="h-7 w-7 rounded-full border border-black/5" style={{ backgroundColor: c.hex || '#D6D6D6' }} />
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="eyebrow">Select size</h2>
              <button
                type="button"
                onClick={() => setSizeGuide(true)}
                className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider2 text-navy hover:underline"
              >
                <Ruler size={15} /> Size guide
              </button>
            </div>

            <div className="mt-3.5 flex flex-wrap gap-2.5">
              {sizesForColor.map((v) => {
                const out = v.stock === 0;
                return (
                  <button
                    key={v.id}
                    disabled={out}
                    onClick={() => { setSize(v.size); setSizeWarning(false); setQty(1); }}
                    aria-pressed={v.size === size}
                    className={`relative min-w-[52px] border px-3.5 py-3 text-[12.5px] font-semibold transition ${
                      out
                        ? 'cursor-not-allowed border-mist text-mist line-through'
                        : v.size === size
                          ? 'border-navy bg-navy text-cream'
                          : 'border-mist text-navy hover:border-navy'
                    }`}
                  >
                    {v.size}
                  </button>
                );
              })}
            </div>

            {sizeWarning && <p className="err">Please choose a size first.</p>}
            {variant && variant.stock <= 5 && variant.stock > 0 && (
              <p className="mt-2.5 text-[12px] font-medium text-sale">
                Only {variant.stock} left in {variant.color} / {variant.size}
              </p>
            )}
          </section>

          <section className="mt-8 flex items-center gap-4">
            <h2 className="sr-only">Quantity</h2>
            <div className="flex items-center border border-mist">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                className="grid h-9 w-9 place-items-center transition hover:bg-cream disabled:cursor-not-allowed disabled:text-slate-light disabled:hover:bg-transparent"
                aria-label="Decrease quantity"
              >
                <Minus size={13} />
              </button>
              <span className="w-8 text-center text-[13px] font-semibold tabular-nums">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(10, variant ? Math.min(variant.stock, q + 1) : q + 1))}
                className="grid h-9 w-9 place-items-center transition hover:bg-cream"
                aria-label="Increase quantity"
              >
                <Plus size={13} />
              </button>
            </div>
            <p className="text-[12px] text-slate">
              {totalStock === 0 ? 'Out of stock' : variant ? `${variant.stock} in stock` : 'Choose a size'}
            </p>
          </section>

          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
            <button onClick={() => addToBag()} disabled={totalStock === 0} className="btn-primary flex-1">
              <Bag size={17} /> Add to bag
            </button>
            <button onClick={() => addToBag({ buyNow: true })} disabled={totalStock === 0} className="btn-outline flex-1">
              Buy it now
            </button>
            <button
              onClick={onWish}
              aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
              aria-pressed={!!wished}
              className={`btn border border-mist px-4 hover:border-navy ${wished ? 'text-sale' : 'text-navy'}`}
            >
              <Heart size={19} filled={wished} />
            </button>
            <button
              onClick={sharePiece}
              aria-label={`Share ${product.name}`}
              className="btn hidden border border-mist px-4 text-navy hover:border-navy sm:inline-flex"
            >
              <Share size={19} />
            </button>
          </div>

          <div className="mt-7 grid gap-3 border-y border-mist py-5 sm:grid-cols-3">
            {[
              { Icon: Truck, text: `Delivery by ${deliveryEstimate()}` },
              { Icon: Refresh, text: `${BRAND.shipping.returnDays}-day easy returns` },
              { Icon: Shield, text: 'Secure payment & COD' },
            ].map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 text-[12px] text-slate">
                <Icon size={19} className="shrink-0 text-navy" /> {text}
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Accordion
              items={[
                {
                  title: 'Product details',
                  body: (
                    <div className="space-y-4">
                      <p>{product.description}</p>
                      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[13px]">
                        {[
                          ['Fabric', product.fabric],
                          ['Fit', product.fit],
                          ['Sleeve', product.sleeve],
                          ['Collar', product.collar],
                          ['Weight', product.weight_grams ? `${product.weight_grams} g` : null],
                          ['Sizes', 'S to 3XL'],
                        ].filter(([, v]) => v).map(([k, v]) => (
                          <div key={k} className="contents">
                            <dt className="font-semibold uppercase tracking-wider text-[11px] text-navy">{k}</dt>
                            <dd className="text-slate">{v}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ),
                },
                product.wash_care && { title: 'Wash care', body: <p>{product.wash_care}</p> },
                {
                  title: 'Shipping & returns',
                  body: (
                    <div className="space-y-2.5">
                      <p>Dispatched within {BRAND.shipping.dispatchDays}. Delivery typically takes {BRAND.shipping.deliveryDays}.</p>
                      <p>Free shipping on prepaid orders above {inr(BRAND.shipping.freeAbove)}. Cash on delivery available nationwide.</p>
                      <p>
                        Return or exchange within {BRAND.shipping.returnDays} days of delivery — see{' '}
                        <Link to="/returns" className="underline">our returns policy</Link>.
                      </p>
                    </div>
                  ),
                },
                {
                  /* Reviews sit with the rest of what a shopper opens before
                     buying, rather than as a separate block further down the
                     page that most of them never scroll to. */
                  title: `Reviews (${product.review_count || 0})`,
                  body: (
                    <div className="space-y-5">
                      {product.reviews?.length ? (
                        <ul className="space-y-3">
                          {product.reviews.map((r) => (
                            <li key={r.id} className="border border-mist bg-white p-4">
                              <Rating value={r.rating} showCount={false} />
                              {r.title && <h3 className="mt-2.5 text-[14px] font-semibold text-navy">{r.title}</h3>}
                              {r.body && <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate">{r.body}</p>}
                              <p className="mt-3 text-[11px] uppercase tracking-wider2 text-slate-light">
                                {r.author} · {formatDate(r.created_at)}
                              </p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <Alert tone="info">No reviews yet — be the first to write one.</Alert>
                      )}
                      <ReviewForm slug={slug} onDone={load} />
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </div>
      </div>

      {product.related?.length > 0 && (
        <section id="similar" className="shell scroll-mt-28 py-12">
          <SectionHead eyebrow="You may also like" title="Complete the look" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {product.related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </>
  );
}
