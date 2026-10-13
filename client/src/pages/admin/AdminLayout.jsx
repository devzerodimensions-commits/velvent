import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Mark } from '../../components/Logo';
import {
  Box, Chart, ChevronLeft, Close, Grid, Mail, Menu, Logout, Tag, User,
} from '../../components/Icons';
import { useAuth } from '../../store/auth';
import { api } from '../../lib/api';

/**
 * The WordPress admin menu: a dark rail of top-level items, each with a
 * submenu that opens under the section you are in, and a "Collapse menu"
 * control at the bottom that shrinks the whole thing to icons.
 */
const MENU = [
  { to: '/admin', end: true, label: 'Dashboard', Icon: Chart },
  { to: '/admin/orders', label: 'Orders', Icon: Box, badge: 'orders' },
  {
    to: '/admin/products',
    label: 'Products',
    Icon: Grid,
    children: [
      { to: '/admin/products', end: true, label: 'All Products' },
      { to: '/admin/products/new', label: 'Add New' },
      { to: '/admin/categories', label: 'Categories' },
    ],
  },
  {
    to: '/admin/coupons',
    label: 'Marketing',
    Icon: Tag,
    children: [{ to: '/admin/coupons', end: true, label: 'Coupons' }],
  },
  { to: '/admin/inbox', label: 'Inbox', Icon: Mail, badge: 'messages' },
];

/** WooCommerce's orange count bubble. */
function Bubble({ n, collapsed }) {
  if (!n) return null;
  return (
    <span
      className={`ml-auto min-w-[18px] rounded-full bg-sale px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white ${
        collapsed ? 'absolute right-1 top-1 ml-0' : ''
      }`}
    >
      {n > 99 ? '99+' : n}
    </span>
  );
}

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

  const menu = (showLabels) => (
    <nav className="py-1">
      {MENU.map(({ to, end, label, Icon, children, badge }) => {
        const inSection = children
          ? children.some((c) => (c.end ? pathname === c.to : pathname.startsWith(c.to)))
          : (end ? pathname === to : pathname.startsWith(to));
        return (
          <div key={label}>
            <NavLink
              to={to}
              end={end}
              onClick={close}
              title={showLabels ? undefined : label}
              className={`relative flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors ${
                inSection
                  ? 'bg-navy-deep font-semibold text-cream shadow-[inset_3px_0_0_0_theme(colors.cream)]'
                  : 'text-cream/70 hover:bg-navy-deep/60 hover:text-cream'
              } ${showLabels ? '' : 'justify-center px-0'}`}
            >
              <Icon size={17} />
              {showLabels && <span className="flex-1">{label}</span>}
              <Bubble n={counts[badge]} collapsed={!showLabels} />
            </NavLink>

            {/* WordPress only opens the submenu for the section you are in. */}
            {showLabels && children && inSection && (
              <div className="bg-navy-deep/70 py-1">
                {children.map((c) => (
                  <NavLink
                    key={c.to + c.label}
                    to={c.to}
                    end={c.end}
                    onClick={close}
                    className={({ isActive }) =>
                      `block py-1.5 pl-11 pr-4 text-[12.5px] transition-colors ${
                        isActive ? 'font-semibold text-cream' : 'text-cream/60 hover:text-cream'
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
    </nav>
  );

  const railWidth = collapsed ? 'w-14' : 'w-[164px]';

  return (
    <div className="wp-screen flex flex-col">
      {/* ------------------------------------------------------- admin bar */}
      <header className="sticky top-0 z-50 flex h-10 items-center gap-3 bg-navy-deep px-3 text-cream">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="p-1 lg:hidden"
        >
          <Menu size={19} />
        </button>

        <Link to="/" className="flex items-center gap-2 text-[12.5px] transition hover:text-white">
          <Mark className="h-4 w-auto" />
          <span className="font-display font-medium uppercase tracking-wider2">Velvent</span>
        </Link>

        <Link
          to="/"
          className="hidden text-[12px] text-cream/70 transition hover:text-cream sm:inline"
        >
          Visit store
        </Link>

        <div className="relative ml-auto">
          <button
            onClick={() => setUserMenu((v) => !v)}
            aria-expanded={userMenu}
            className="flex items-center gap-2 py-1 text-[12px] text-cream/80 transition hover:text-cream"
          >
            <span className="hidden sm:inline">Howdy, {user?.name?.split(' ')[0] || 'Admin'}</span>
            <span className="flex h-6 w-6 items-center justify-center bg-cream/15"><User size={13} /></span>
          </button>
          {userMenu && (
            <>
              <button className="fixed inset-0 z-0 cursor-default" aria-hidden="true" tabIndex={-1} onClick={() => setUserMenu(false)} />
              <div className="absolute right-0 z-10 mt-1 w-52 border border-mist bg-white py-1 text-navy shadow-lg">
                <p className="truncate border-b border-mist px-3 py-2 text-[11.5px] text-slate">{user?.email}</p>
                <Link to="/account" className="block px-3 py-2 text-[12.5px] transition hover:bg-cream/60">My account</Link>
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] transition hover:bg-cream/60"
                >
                  <Logout size={13} /> Log Out
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <div className="flex flex-1">
        {/* ------------------------------------------------------- sidebar */}
        <aside className={`${railWidth} sticky top-10 hidden h-[calc(100vh-2.5rem)] shrink-0 flex-col bg-navy transition-[width] duration-200 lg:flex`}>
          <div className="flex-1 overflow-y-auto">{menu(!collapsed)}</div>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="flex items-center gap-3 border-t border-cream/10 px-4 py-2.5 text-[12px] text-cream/60 transition hover:text-cream"
            title={collapsed ? 'Expand menu' : 'Collapse menu'}
          >
            <ChevronLeft size={15} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed && 'Collapse menu'}
          </button>
        </aside>

        {/* ------------------------------------------------- mobile drawer */}
        <div className={`fixed inset-0 z-50 lg:hidden ${mobileOpen ? '' : 'pointer-events-none'}`} aria-hidden={!mobileOpen}>
          <div
            className={`absolute inset-0 bg-navy-deep/60 transition-opacity ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={close}
          />
          <aside className={`absolute inset-y-0 left-0 flex w-60 flex-col bg-navy transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex items-center justify-between border-b border-cream/10 px-4 py-3 text-cream">
              <span className="flex items-center gap-2">
                <Mark className="h-5 w-auto" />
                <span className="font-display text-[12.5px] font-medium uppercase tracking-wider2">Velvent</span>
              </span>
              <button onClick={close} aria-label="Close menu"><Close size={19} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">{menu(true)}</div>
            <Link to="/" className="border-t border-cream/10 px-4 py-3 text-[12px] text-cream/70">← Visit store</Link>
          </aside>
        </div>

        {/* ---------------------------------------------------------- body */}
        <main className="min-w-0 flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
