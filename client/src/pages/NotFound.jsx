import { Link } from 'react-router-dom';
import { Seo } from '../components/ui';
import { Mark } from '../components/Logo';
import { useContent } from '../store/content';

export default function NotFound() {
  const c = useContent('notFound');

  return (
    <>
      <Seo title="Page not found" />
      <div className="shell flex min-h-[62vh] flex-col items-center justify-center py-20 text-center">
        <Mark className="h-12 w-auto text-mist" />
        <p className="mt-8 font-display text-5xl font-semibold tracking-wider2 text-navy">{c.code}</p>
        <h1 className="mt-4 font-display text-lg font-semibold uppercase tracking-wider2 text-navy">
          {c.title}
        </h1>
        <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-slate">
          {c.body}
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link to={c.primaryTo} className="btn-primary">{c.primaryLabel}</Link>
          <Link to={c.secondaryTo} className="btn-outline">{c.secondaryLabel}</Link>
        </div>
      </div>
    </>
  );
}
