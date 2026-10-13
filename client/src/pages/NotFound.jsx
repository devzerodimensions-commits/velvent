import { Link } from 'react-router-dom';
import { Seo } from '../components/ui';
import { Mark } from '../components/Logo';

export default function NotFound() {
  return (
    <>
      <Seo title="Page not found" />
      <div className="shell flex min-h-[62vh] flex-col items-center justify-center py-20 text-center">
        <Mark className="h-12 w-auto text-mist" />
        <p className="mt-8 font-display text-5xl font-semibold tracking-wider2 text-navy">404</p>
        <h1 className="mt-4 font-display text-lg font-semibold uppercase tracking-wider2 text-navy">
          This page does not exist
        </h1>
        <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-slate">
          The link may be old, or the piece you were after is no longer listed.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link to="/" className="btn-primary">Back home</Link>
          <Link to="/shop" className="btn-outline">Shop the collection</Link>
        </div>
      </div>
    </>
  );
}
