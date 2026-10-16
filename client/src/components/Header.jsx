import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { Bag, Close, Heart, Menu, Search, User } from './Icons';
import { useCart } from '../store/cart';
import { useAuth } from '../store/auth';
import { BRAND } from '../lib/brand';

const NAV = [
  { to: '/shop', label: 'Shop All' },
  { to: '/category/polo-t-shirt', label: 'Polo T-Shirt' },
  { to: '/category/polo-shirt', label: 'Polo Shirt' },
  { to: '/category/oversized-t-shirt', label: 'Oversized Tee' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

const TICKER = [
  'Free shipping on every prepaid order',
  'Flat 33% off — MRP ₹1,499 · Now ₹1,005',
  'Easy 7-day returns',
  'Cash on delivery available',
];

function Ticker() {
  const strip = (
    <div className="flex shrink-0 items-center">
      {TICKER.map((t) => (
        <span key={t} className="flex items-center whitespace-nowrap px-6 text-[10.5px] font-medium uppercase tracking-wider2">
          {t}
          <span className="ml-6 h-1 w-1 rounded-full bg-cream/40" />
        </span>
      ))}
    </div>
  );
  return (
    <div className="overflow-hidden bg-navy py-2 text-cream">
      <div className="flex w-max animate-marquee pause-hover">{strip}{strip}</div>
    </div>
  );
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [solid, setSolid] = useState(false);
  const [onDark, setOnDark] = useState(false);
  const headerRef = useRef(null);
  const { count, openDrawer } = useCart();
  const { user, wishlist } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);

  useEffect(() => { setMenuOpen(false); setSearchOpen(false); }, [location.pathname]);
  useEffect(() => {
    // The homepage opens on full-screen dark stages; the bar goes clear and light
    // until the end marker after them scrolls up under it.
    const onScroll = () => {
      setSolid(window.scrollY > 8);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      headerRef.current?.style.setProperty('--read', max > 0 ? (window.scrollY / max).toFixed(4) : '0');
      const end = document.querySelector('[data-cinema-end]');
      const h = headerRef.current?.offsetHeight ?? 0;
      setOnDark(Boolean(end) && end.getBoundingClientRect().top > h);
    };
    onScroll();
    const t = setTimeout(onScroll, 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      clearTimeout(t);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [location.pathname]);

  // Publishes the header's height so the first homepage stage can tuck up under it.
  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => {
      document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);
  useEffect(() => { if (searchOpen) searchRef.current?.focus(); }, [searchOpen]);

  const submitSearch = (e) => {
    e.preventDefault();
    const q = term.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setTerm('');
  };

  const iconBtn = `relative grid h-10 w-10 place-items-center transition ${
    onDark ? 'text-cream hover:text-cream-deep' : 'text-navy hover:text-slate'
  }`;

  return (
    <header ref={headerRef} className="sticky top-0 z-50">
      <Ticker />

      <div
        className={`border-b backdrop-blur transition-[background-color,color,border-color,box-shadow] duration-500 ${
          onDark
            ? `border-cream/10 text-cream ${solid ? 'bg-ink/55' : 'bg-transparent'}`
            : `bg-white/95 text-navy ${solid ? 'border-mist shadow-sm' : 'border-transparent'}`
        }`}
      >
        <div className="shell flex h-[var(--nav-h)] items-center justify-between gap-4">
          <button
            className={`${iconBtn} lg:hidden`}
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          <Link to="/" className="shrink-0 lg:w-[210px]" aria-label="VELVENT home">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `link-underline py-1 text-[11.5px] font-semibold uppercase tracking-wider2 transition ${
                    onDark
                      ? (isActive ? 'text-cream after:w-full' : 'text-cream/70 hover:text-cream')
                      : (isActive ? 'text-navy after:w-full' : 'text-slate hover:text-navy')
                  }`}
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-0.5 lg:w-[210px]">
            <button className={iconBtn} onClick={() => setSearchOpen((v) => !v)} aria-label="Search">
              {searchOpen ? <Close size={21} /> : <Search size={21} />}
            </button>

            <Link to={user ? '/account/wishlist' : '/login'} className={`${iconBtn} hidden sm:grid`} aria-label="Wishlist">
              <Heart size={21} />
              {wishlist.length > 0 && (
                <span className="absolute right-1 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-navy px-1 text-[9px] font-bold text-cream">
                  {wishlist.length}
                </span>
              )}
            </Link>

            <Link to={user ? '/account' : '/login'} className={iconBtn} aria-label={user ? 'My account' : 'Sign in'}>
              <User size={21} />
            </Link>

            <button className={iconBtn} onClick={openDrawer} aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}>
              <Bag size={21} />
              {count > 0 && (
                <span className="absolute right-0.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-navy px-1 text-[9px] font-bold text-cream">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* reading thread: how far down the page you are */}
        <div className="read-thread" aria-hidden />

        {searchOpen && (
          <div className="border-t border-mist bg-white">
            <form onSubmit={submitSearch} className="shell flex items-center gap-3 py-4">
              <Search size={20} className="shrink-0 text-slate" />
              <input
                ref={searchRef}
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search polos, oversized tees, colours…"
                className="w-full border-0 bg-transparent py-1 text-sm focus:outline-none focus:ring-0"
              />
              <button type="submit" className="btn-primary btn-sm">Search</button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${menuOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!menuOpen}
      >
        <div
          className={`absolute inset-0 bg-navy-deep/50 transition-opacity ${menuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMenuOpen(false)}
        />
        <div
          className={`absolute inset-y-0 left-0 flex w-[82%] max-w-sm flex-col bg-white transition-transform duration-300 ${
            menuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-mist px-5 py-4">
            <Logo />
            <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="p-1 text-navy">
              <Close size={22} />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-5 py-3">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `block border-b border-mist/60 py-4 text-sm font-semibold uppercase tracking-wider2 ${
                    isActive ? 'text-navy' : 'text-slate'
                  }`}
              >
                {n.label}
              </NavLink>
            ))}
            <Link to="/track-order" className="block border-b border-mist/60 py-4 text-sm font-semibold uppercase tracking-wider2 text-slate">
              Track Order
            </Link>
            <Link to={user ? '/account' : '/login'} className="block py-4 text-sm font-semibold uppercase tracking-wider2 text-slate">
              {user ? 'My Account' : 'Sign In'}
            </Link>
          </nav>
          <div className="border-t border-mist bg-cream px-5 py-4 text-[11px] uppercase tracking-wider2 text-slate">
            <a href={`tel:${BRAND.phoneRaw}`} className="block font-semibold text-navy">{BRAND.phone}</a>
            <p className="mt-1 normal-case tracking-normal">{BRAND.hoursShort}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
