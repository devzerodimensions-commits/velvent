import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Mark } from '../../components/Logo';
import { Box, Chart, Close, Grid, Mail, Menu, Logout, Tag } from '../../components/Icons';
import { useAuth } from '../../store/auth';

const LINKS = [
  { to: '/admin', end: true, label: 'Dashboard', Icon: Chart },
  { to: '/admin/products', label: 'Products', Icon: Grid },
  { to: '/admin/orders', label: 'Orders', Icon: Box },
  { to: '/admin/categories', label: 'Categories', Icon: Grid },
  { to: '/admin/coupons', label: 'Coupons', Icon: Tag },
  { to: '/admin/inbox', label: 'Inbox', Icon: Mail },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="space-y-1">
      {LINKS.map(({ to, end, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 text-[12.5px] font-medium transition ${
              isActive ? 'bg-cream/15 text-cream' : 'text-cream/60 hover:bg-cream/10 hover:text-cream'
            }`}
        >
          <Icon size={18} /> {label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-cream/40">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col bg-navy lg:flex">
        <Link to="/" className="flex items-center gap-2.5 border-b border-cream/15 px-5 py-5 text-cream">
          <Mark className="h-6 w-auto" />
          <span className="font-display text-sm font-medium uppercase tracking-brand">Velvent</span>
        </Link>
        <div className="flex-1 overflow-y-auto py-4">{nav}</div>
        <div className="border-t border-cream/15 p-4">
          <p className="truncate text-[11px] text-cream/50">{user?.email}</p>
          <div className="mt-3 space-y-1">
            <Link to="/" className="block text-[12px] text-cream/70 transition hover:text-cream">← View store</Link>
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="flex items-center gap-2 text-[12px] text-cream/70 transition hover:text-cream"
            >
              <Logout size={14} /> Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
        <div
          className={`absolute inset-0 bg-navy-deep/50 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setOpen(false)}
        />
        <aside className={`absolute inset-y-0 left-0 flex w-64 flex-col bg-navy transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between border-b border-cream/15 px-5 py-5 text-cream">
            <span className="flex items-center gap-2.5">
              <Mark className="h-6 w-auto" />
              <span className="font-display text-sm font-medium uppercase tracking-brand">Velvent</span>
            </span>
            <button onClick={() => setOpen(false)} aria-label="Close menu"><Close size={21} /></button>
          </div>
          <div className="flex-1 overflow-y-auto py-4">{nav}</div>
          <div className="border-t border-cream/15 p-4">
            <Link to="/" className="block text-[12px] text-cream/70">← View store</Link>
          </div>
        </aside>
      </div>

      <div className="min-w-0 flex-1 lg:ml-60">
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-mist bg-white px-4 py-3 lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu" className="p-1 text-navy"><Menu size={22} /></button>
          <span className="font-display text-sm font-medium uppercase tracking-brand text-navy">Velvent Admin</span>
        </header>

        <main className="p-4 sm:p-6 lg:p-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
