import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard';
import { Breadcrumbs, EmptyState, Pagination, Seo } from '../components/ui';
import { useContent } from '../store/content';
import { Search as SearchIcon } from '../components/Icons';
import { api } from '../lib/api';

export default function Search() {
  const c = useContent('shop').search;
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const page = Number(params.get('page')) || 1;

  const [data, setData] = useState({ products: [], total: 0, pages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [term, setTerm] = useState(q);

  useEffect(() => { setTerm(q); }, [q]);

  useEffect(() => {
    if (!q) { setData({ products: [], total: 0, pages: 1, page: 1 }); setLoading(false); return undefined; }
    let alive = true;
    setLoading(true);
    api.products({ q, page, limit: 12 })
      .then((res) => alive && setData(res))
      .catch(() => alive && setData({ products: [], total: 0, pages: 1, page: 1 }))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [q, page]);

  const submit = (e) => {
    e.preventDefault();
    setParams(term.trim() ? { q: term.trim() } : {}, { replace: true });
  };

  return (
    <>
      <Seo title={q ? `Search: ${q}` : 'Search'} />
      <div className="shell py-8 sm:py-11">
        <Breadcrumbs items={[{ label: 'Search' }]} />
        <h1 className="h-section mt-4">Search</h1>

        <form onSubmit={submit} className="mt-6 flex max-w-xl">
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={c.placeholder}
            aria-label="Search products"
            className="field flex-1"
          />
          <button type="submit" className="btn-primary px-6"><SearchIcon size={17} /></button>
        </form>

        {q && (
          <p className="mt-6 text-[13px] text-slate">
            {loading ? 'Searching…' : `${data.total} result${data.total === 1 ? '' : 's'} for “${q}”`}
          </p>
        )}

        <div className="mt-8">
          {loading && q ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : !q ? (
            <EmptyState
              icon={SearchIcon}
              title={c.idleTitle}
              body={c.idleBody}
              action={<Link to="/shop" className="btn-primary">{c.idleCtaLabel}</Link>}
            />
          ) : data.products.length === 0 ? (
            <EmptyState
              icon={SearchIcon}
              title={`No matches for “${q}”`}
              body={c.emptyBody}
              action={<Link to="/shop" className="btn-primary">Shop all</Link>}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
                {data.products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
              <Pagination
                page={data.page}
                pages={data.pages}
                onChange={(p) => setParams({ q, page: String(p) }, { replace: true })}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
