import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard';
import { Breadcrumbs, EmptyState, Pagination, Seo } from '../components/ui';
import { Close, Filter, Grid } from '../components/Icons';
import { api } from '../lib/api';
import { inr } from '../lib/format';

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'popular', label: 'Most popular' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name A–Z' },
];

function FilterPanel({ facets, selected, onToggle, onPrice, onClear, activeCount }) {
  const { sizes, colors, price } = selected;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-[12px] font-semibold uppercase tracking-wider2 text-navy">Filters</h2>
        {activeCount > 0 && (
          <button onClick={onClear} className="text-[11px] font-semibold uppercase tracking-wider2 text-sale hover:underline">
            Clear ({activeCount})
          </button>
        )}
      </div>

      <section>
        <h3 className="eyebrow">Size</h3>
        <div className="mt-3.5 flex flex-wrap gap-2">
          {facets.sizes.map((s) => (
            <button
              key={s}
              onClick={() => onToggle('size', s)}
              aria-pressed={sizes.includes(s)}
              className={`min-w-11 border px-3 py-2 text-[11.5px] font-semibold transition ${
                sizes.includes(s) ? 'border-navy bg-navy text-cream' : 'border-mist text-navy hover:border-navy'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="eyebrow">Colour</h3>
        <ul className="mt-3.5 space-y-2.5">
          {facets.colors.map((c) => (
            <li key={c.color}>
              <label className="flex cursor-pointer items-center gap-3 text-[13px] text-navy">
                <input
                  type="checkbox"
                  checked={colors.includes(c.color)}
                  onChange={() => onToggle('color', c.color)}
                  className="h-4 w-4 accent-navy"
                />
                <span className="h-4 w-4 shrink-0 rounded-full border border-mist" style={{ backgroundColor: c.hex || '#D6D6D6' }} />
                {c.color}
              </label>
            </li>
          ))}
        </ul>
      </section>

      {facets.price.max > facets.price.min && (
        <section>
          <h3 className="eyebrow">Max price</h3>
          <input
            type="range"
            min={Math.floor(facets.price.min)}
            max={Math.ceil(facets.price.max)}
            step={50}
            value={price || Math.ceil(facets.price.max)}
            onChange={(e) => onPrice(e.target.value)}
            className="mt-4 w-full accent-navy"
          />
          <div className="mt-1.5 flex justify-between text-[11.5px] text-slate">
            <span>{inr(facets.price.min)}</span>
            <span className="font-semibold text-navy">
              Up to {inr(price || facets.price.max)}
            </span>
          </div>
        </section>
      )}
    </div>
  );
}

export default function Shop() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();

  const [data, setData] = useState({ products: [], page: 1, pages: 1, total: 0 });
  const [facets, setFacets] = useState({ sizes: [], colors: [], price: { min: 0, max: 0 } });
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  const selected = useMemo(() => ({
    sizes: params.get('size')?.split(',').filter(Boolean) || [],
    colors: params.get('color')?.split(',').filter(Boolean) || [],
    price: params.get('maxPrice') || '',
    sort: params.get('sort') || 'newest',
    page: Number(params.get('page')) || 1,
  }), [params]);

  const activeCount = selected.sizes.length + selected.colors.length + (selected.price ? 1 : 0);

  const update = useCallback((patch, { resetPage = true } = {}) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (!v || (Array.isArray(v) && !v.length)) next.delete(k);
      else next.set(k, Array.isArray(v) ? v.join(',') : v);
    });
    if (resetPage) next.delete('page');
    setParams(next, { replace: true });
  }, [params, setParams]);

  const toggle = (key, value) => {
    const field = key === 'size' ? 'sizes' : 'colors';
    const list = selected[field];
    update({ [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] });
  };

  useEffect(() => {
    api.filters().then(setFacets).catch(() => {});
  }, []);

  useEffect(() => {
    if (!slug) { setCategory(null); return; }
    api.categories()
      .then((cats) => setCategory(cats.find((c) => c.slug === slug) || null))
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.products({
      category: slug,
      size: selected.sizes,
      color: selected.colors,
      maxPrice: selected.price,
      sort: selected.sort,
      page: selected.page,
      limit: 12,
    })
      .then((res) => alive && setData(res))
      .catch(() => alive && setData({ products: [], page: 1, pages: 1, total: 0 }))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [slug, selected]);

  useEffect(() => {
    document.body.style.overflow = sheetOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sheetOpen]);

  const title = category?.name || 'Shop All';

  return (
    <>
      <Seo
        title={title}
        description={category?.description || 'Browse every VELVENT piece — knitted polos, button-through shirts and heavyweight oversized tees.'}
      />

      <div className="border-b border-mist bg-cream">
        <div className="shell py-8 sm:py-11">
          <Breadcrumbs items={[{ to: '/shop', label: 'Shop' }, ...(category ? [{ label: category.name }] : [])]} />
          <h1 className="h-section mt-4 text-[26px] sm:text-[32px]">{title}</h1>
          {category?.description && (
            <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-slate">{category.description}</p>
          )}
        </div>
      </div>

      <div className="shell py-8 sm:py-12">
        <div className="lg:grid lg:grid-cols-[232px_1fr] lg:gap-12">
          <aside className="hidden lg:block">
            <div className="sticky top-[calc(var(--nav-h)+48px)]">
              <FilterPanel
                facets={facets}
                selected={selected}
                onToggle={toggle}
                onPrice={(v) => update({ maxPrice: v })}
                onClear={() => update({ size: '', color: '', maxPrice: '' })}
                activeCount={activeCount}
              />
            </div>
          </aside>

          <div>
            <div className="mb-7 flex items-center justify-between gap-4 border-b border-mist pb-4">
              <p className="text-[12px] text-slate">
                {loading ? 'Loading…' : `${data.total} ${data.total === 1 ? 'product' : 'products'}`}
              </p>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setSheetOpen(true)}
                  className="btn-ghost btn-sm lg:hidden"
                >
                  <Filter size={15} /> Filters{activeCount > 0 && ` (${activeCount})`}
                </button>

                <label className="flex items-center gap-2">
                  <span className="sr-only">Sort products</span>
                  <select
                    value={selected.sort}
                    onChange={(e) => update({ sort: e.target.value })}
                    className="border border-mist bg-white py-2.5 pl-3 pr-8 text-[12px] font-medium text-navy focus:border-navy focus:outline-none"
                  >
                    {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </label>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3">
                {Array.from({ length: 6 }, (_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : data.products.length === 0 ? (
              <EmptyState
                icon={Grid}
                title="Nothing matches those filters"
                body="Try widening your selection, or browse the full collection."
                action={
                  activeCount > 0
                    ? <button onClick={() => update({ size: '', color: '', maxPrice: '' })} className="btn-primary">Clear filters</button>
                    : <Link to="/shop" className="btn-primary">Shop all</Link>
                }
              />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3">
                  {data.products.map((p, i) => <ProductCard key={p.id} product={p} eager={i < 3} />)}
                </div>
                <Pagination page={data.page} pages={data.pages} onChange={(p) => update({ page: p }, { resetPage: false })} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter sheet */}
      <div className={`fixed inset-0 z-[65] lg:hidden ${sheetOpen ? '' : 'pointer-events-none'}`} aria-hidden={!sheetOpen}>
        <div
          className={`absolute inset-0 bg-navy-deep/50 transition-opacity ${sheetOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setSheetOpen(false)}
        />
        <div
          className={`absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto bg-white transition-transform duration-300 ${
            sheetOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="sticky top-0 flex items-center justify-between border-b border-mist bg-white px-5 py-4">
            <span className="text-[12px] font-semibold uppercase tracking-wider2">Filters</span>
            <button onClick={() => setSheetOpen(false)} aria-label="Close filters"><Close size={22} /></button>
          </div>
          <div className="px-5 py-6">
            <FilterPanel
              facets={facets}
              selected={selected}
              onToggle={toggle}
              onPrice={(v) => update({ maxPrice: v })}
              onClear={() => update({ size: '', color: '', maxPrice: '' })}
              activeCount={activeCount}
            />
          </div>
          <div className="sticky bottom-0 border-t border-mist bg-white px-5 py-4">
            <button onClick={() => setSheetOpen(false)} className="btn-primary w-full">
              Show {data.total} {data.total === 1 ? 'product' : 'products'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
