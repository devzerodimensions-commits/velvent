import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageLoader, Seo } from '../components/ui';
import PageRender from '../builder/Render';
import { normalise } from '../builder/model';
import { api } from '../lib/api';
import NotFound from './NotFound';

/**
 * A page the client built, as a shopper sees it.
 *
 * This sits on the catch-all route, so it is also what answers every address
 * that matches nothing else. A miss here is a genuine 404 and renders the
 * store's own not-found page rather than a second, different one.
 */
export default function BuiltPage() {
  const { slug } = useParams();
  const [state, setState] = useState({ status: 'loading', page: null });

  useEffect(() => {
    let alive = true;
    setState({ status: 'loading', page: null });

    api.page(slug)
      .then((page) => { if (alive) setState({ status: 'ready', page }); })
      .catch(() => { if (alive) setState({ status: 'missing', page: null }); });

    return () => { alive = false; };
  }, [slug]);

  if (state.status === 'loading') return <PageLoader />;
  if (state.status === 'missing') return <NotFound />;

  const { page } = state;
  return (
    <>
      <Seo title={page.seo_title || page.title} description={page.seo_desc || undefined} />
      <PageRender doc={normalise(page.content)} mode="live" />
    </>
  );
}
