import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Mark } from '../../components/Logo';
import {
  Box, Chart, ChevronDown, ChevronLeft, Close, Grid, Logout, Mail, Menu,
  Ruler, Search, Tag, Upload, User,
} from '../../components/Icons';
import { useAuth } from '../../store/auth';
import { api } from '../../lib/api';

/**
 * The admin shell: a dark rail of sections on a light canvas, with a white bar
 * across the top carrying search and the account menu.
 *
 * The rail groups by job rather than by table — what you sell, who buys it,
 * what the store says — because that is how someone running the shop thinks
 * about it. It collapses to icons on desktop and becomes a drawer on mobile.
 */
const MENU = [
  {
    heading: null,
    items: [{ to: '/admin', end: true, label: 'Dashboard', Icon: Chart }],
  },
  {
    heading: 'Selling',
    items: [
      { to: '/admin/orders', label: 'Orders', Icon: Box, badge: 'orders' },
      {
        to: '/admin/products',
        label: 'Products',
        Icon: Grid,
        children: [
          { to: '/admin/products', end: true, label: 'All products' },
          { to: '/admin/products/new', label: 'Add new' },
          { to: '/admin/categories', label: 'Categories' },
        ],
      },
      { to: '/admin/coupons', label: 'Coupons', Icon: Tag },
    ],
  },
  {
    heading: 'People',
    items: [
      { to: '/admin/customers', label: 'Customers', Icon: User },
      { to: '/admin/inbox', label: 'Inbox', Icon: Mail, badge: 'messages' },
    ],
  },
  {
    heading: 'Store content',
    items: [
      {
        to: '/admin/content',
        label: 'Content',
        Icon: Ruler,
        children: [
          { to: '/admin/content', end: true, label: 'All sections' },
          { to: '/admin/content/header', label: 'Header' },
          { to: '/admin/content/footer', label: 'Footer' },
          { to: '/admin/content/home', label: 'Home page' },
          { to: '/admin/content/brand', label: 'Brand & contact' },
        ],
      },
      {
        to: '/admin/media',
        label: 'Media',
        Icon: Upload,
        children: [
          { to: '/admin/media', end: true, label: 'Library' },
          { to: '/admin/media/new', label: 'Add Media File' },
        ],
      },
    ],
  },
];

const ALL_ITEMS = MENU.flatMap((g) => g.items);

function Bubble({ n, floating }) {
  if (!n) return null;
  return (
    <span
      className={`min-w-[18px] rounded-full bg-sale px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white ${
        floating ? 'absolute right-1 top-1' : 'ml-auto'
      }`}
    >
      {n > 99 ? '99+' : n}
    </span>
  );
}

/* --------------------------------------------------------------- the rail */

function Rail({ pathname, counts, showLabels, onNavigate }) {
  return (
    <nav className="space-y-5 px-3 py-4">
      {MENU.map((group, gi) => (
        <div key={group.heading || gi}>
          {group.heading && showLabels && (
            <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
              {group.heading}
            </p>
          )}
          <div className="space-y-0.5">
            {group.items.map(({ to, end, label, Icon, children, badge }) => {
              const inSection = children
                ? children.some((c) => (c.end ? pathname === c.to : pathname.startsWith(c.to)))
                : (end ? pathname === to : pathname.startsWith(to));

              return (
                <div key={label}>
                  <NavLink
                    to={to}
                    end={end}
                    onClick={onNavigate}
                    title={showLabels ? undefined : label}
                    className={`ad-nav ${inSection ? 'ad-nav-on' : 'ad-nav-off'} ${showLabels ? '' : 'justify-center px-0'}`}
                  >
                    <Icon size={17} className="shrink-0" />
                    {showLabels && <span className="flex-1 truncate">{label}</span>}
                    <Bubble n={counts[badge]} floating={!showLabels} />
                  </NavLink>

                  {showLabels && children && inSection && (
                    <div className="mb-1 mt-0.5 space-y-px border-l border-white/10 pl-3 ml-[21px]">
                      {children.map((c) => (
                        <NavLink
                          key={c.to + c.label}
                          to={c.to}
                          end={c.end}
                          onClick={onNavigate}
                          className={({ isActive }) =>
                            `block rounded-md px-2.5 py-1.5 text-[12.5px] transition ${
                              isActive ? 'font-semibold text-white' : 'text-white/50 hover:text-white'
                            }`}
                        >
                          {c.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

/* ------------------------------------------------------- jump-to-anything */

function QuickSearch() {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef(null);

  /* Cmd/Ctrl-K is the shortcut people already have in their fingers. */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  const hits = term.trim()
    ? ALL_ITEMS.filter((i) => i.label.toLowerCase().includes(term.trim().toLowerCase())).slice(0, 6)
    : [];

  const go = (to) => {
    setOpen(false);
    setTerm('');
    navigate(to);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-lg border border-adm-line bg-adm-soft px-3 py-1.5 text-[12.5px] text-adm-mute transition hover:border-slate-light sm:flex"
      >
        <Search size={14} />
        <span>Search the panel</span>
        <kbd className="ml-6 rounded border border-adm-line bg-white px-1.5 py-0.5 text-[10px] font-semibold">⌘K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center p-4 pt-[12vh]">
          <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="absolute inset-0 cursor-default bg-adm-ink/40" />
          <div className="relative w-full max-w-md overflow-hidden rounded-xl bg-white shadow-pop">
            <div className="flex items-center gap-2 border-b border-adm-line px-4">
              <Search size={16} className="text-adm-mute" />
              <input
                ref={inputRef}
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && hits[0]) go(hits[0].to); }}
                placeholder="Go to…"
                className="w-full border-0 py-3.5 text-[14px] text-adm-ink outline-none placeholder:text-slate-light"
              />
            </div>
            <ul className="max-h-72 overflow-y-auto p-2">
              {(term ? hits : ALL_ITEMS).map((i) => (
                <li key={i.to + i.label}>
                  <button
                    type="button"
                    onClick={() => go(i.to)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] text-adm-ink transition hover:bg-adm-soft"
                  >
                    <i.Icon size={16} className="text-adm-mute" /> {i.label}
                  </button>
                </li>
              ))}
              {term && hits.length === 0 && (
                <li className="px-3 py-6 text-center text-[13px] text-adm-mute">Nothing matches “{term}”.</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

/* -------------------------------------------------------------- the shell */

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('velvent.admin.menu') === 'collapsed'; } catch { return false; }
  });
  const [counts, setCounts] = useState({ orders: 0, messages: 0 });
  const [userMenu, setUserMenu] = useState(false);

  useEffect(() => {
    try { localStorage.setItem('velvent.admin.menu', collapsed ? 'collapsed' : 'open'); } catch { /* private mode */ }
  }, [collapsed]);

  // The count bubbles. A failure here must never stop the panel rendering.
  useEffect(() => {
    let alive = true;
    Promise.all([api.admin.stats().catch(() => null), api.admin.messages().catch(() => null)])
      .then(([stats, messages]) => {
        if (!alive) return;
        setCounts({
          orders: stats?.orders?.new_orders || 0,
          messages: Array.isArray(messages) ? messages.filter((m) => !m.is_read).length : 0,
        });
      });
    return () => { alive = false; };
  }, [pathname]);

  const close = () => setMobileOpen(false);
  useEffect(() => { close(); }, [pathname]);

  return (
    <div className="ad-screen lg:flex">
      {/* ----------------------------------------------------- desktop rail */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col bg-adm-rail transition-[width] duration-200 lg:flex ${
          collapsed ? 'w-[68px]' : 'w-60'
        }`}
      >
        <Link to="/" className="flex h-16 items-center gap-2.5 px-5 text-white">
          <Mark className="h-6 w-auto shrink-0" />
          {!collapsed && (
            <span className="font-heading text-[15px] font-semibold uppercase tracking-wider2">Velvent</span>
          )}
        </Link>

        <div className="flex-1 overflow-y-auto">
          <Rail pathname={pathname} counts={counts} showLabels={!collapsed} />
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="flex items-center gap-2.5 border-t border-white/10 px-5 py-3 text-[12px] text-white/50 transition hover:text-white"
          title={collapsed ? 'Expand menu' : 'Collapse menu'}
        >
          <ChevronLeft size={15} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          {!collapsed && 'Collapse'}
        </button>
      </aside>

      {/* ---------------------------------------------------- mobile drawer */}
      <div className={`fixed inset-0 z-[70] lg:hidden ${mobileOpen ? '' : 'pointer-events-none'}`} aria-hidden={!mobileOpen}>
        <div
          className={`absolute inset-0 bg-adm-ink/50 transition-opacity ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={close}
        />
        <aside className={`absolute inset-y-0 left-0 flex w-64 flex-col bg-adm-rail transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex h-16 items-center justify-between px-5 text-white">
            <span className="flex items-center gap-2.5">
              <Mark className="h-6 w-auto" />
              <span className="font-heading text-[15px] font-semibold uppercase tracking-wider2">Velvent</span>
            </span>
            <button type="button" onClick={close} aria-label="Close menu" className="text-white/70 hover:text-white">
              <Close size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Rail pathname={pathname} counts={counts} showLabels onNavigate={close} />
          </div>
        </aside>
      </div>

      {/* --------------------------------------------------------- the page */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-50 flex h-16 items-center gap-3 border-b border-adm-line bg-white/90 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="ad-btn-quiet -ml-2 px-2 lg:hidden"
          >
            <Menu size={20} />
          </button>

          <QuickSearch />

          <div className="ml-auto flex items-center gap-2">
            <Link to="/" target="_blank" rel="noreferrer" className="ad-btn-ghost ad-btn-sm hidden sm:inline-flex">
              View store
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenu((v) => !v)}
                aria-expanded={userMenu}
                className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 transition hover:bg-adm-soft"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-navy text-[12px] font-bold text-white">
                  {(user?.name || 'A').trim().charAt(0).toUpperCase()}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-[12.5px] font-semibold leading-tight text-adm-ink">
                    {user?.name?.split(' ')[0] || 'Admin'}
                  </span>
                  <span className="block text-[11px] leading-tight text-adm-mute">Administrator</span>
                </span>
                <ChevronDown size={15} className="hidden text-adm-mute sm:block" />
              </button>

              {userMenu && (
                <>
                  <button className="fixed inset-0 z-0 cursor-default" aria-hidden="true" tabIndex={-1} onClick={() => setUserMenu(false)} />
                  <div className="absolute right-0 z-10 mt-2 w-56 overflow-hidden rounded-xl border border-adm-line bg-white py-1 shadow-pop">
                    <p className="truncate border-b border-adm-line px-3.5 py-2.5 text-[12px] text-adm-mute">{user?.email}</p>
                    <Link to="/account" className="block px-3.5 py-2.5 text-[13px] text-adm-ink transition hover:bg-adm-soft">
                      My account
                    </Link>
                    <button
                      type="button"
                      onClick={() => { logout(); navigate('/'); }}
                      className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[13px] text-sale transition hover:bg-adm-soft"
                    >
                      <Logout size={15} /> Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
