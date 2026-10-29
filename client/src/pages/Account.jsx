import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Breadcrumbs, EmptyState, Seo, Spinner } from '../components/ui';
import { useContent } from '../store/content';
import { Box, Heart, Logout, Pin, Plus, Trash, User } from '../components/Icons';
import { api } from '../lib/api';
import { CANCELLABLE, formatDate, inr, STATUS_LABEL, STATUS_TONE } from '../lib/format';
import { useAuth } from '../store/auth';
import { useToast } from '../store/toast';

const STATES = ['Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha',
  'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'];

function Orders() {
  const c = useContent('account').account;
  const [orders, setOrders] = useState(null);
  const { success, error } = useToast();

  const load = () => api.myOrders().then(setOrders).catch(() => setOrders([]));
  useEffect(() => { load(); }, []);

  const cancel = async (orderNumber) => {
    try {
      await api.cancelOrder(orderNumber);
      success('Order cancelled. Any stock has been released.');
      load();
    } catch (err) { error(err.message); }
  };

  if (!orders) return <div className="py-16 text-center"><Spinner className="text-navy" /></div>;

  if (!orders.length) {
    return (
      <EmptyState
        icon={Box}
        title={c.ordersEmptyTitle}
        body={c.ordersEmptyBody}
        action={<Link to="/shop" className="btn-primary">Start shopping</Link>}
      />
    );
  }

  return (
    <ul className="space-y-5">
      {orders.map((o) => (
        <li key={o.id} className="card-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-mist pb-4">
            <div>
              <Link to={`/order/${o.order_number}`} className="font-display text-[15px] font-semibold tracking-wide text-navy hover:underline">
                {o.order_number}
              </Link>
              <p className="mt-1 text-[12px] text-slate">
                {formatDate(o.created_at)} · {o.items.length} item{o.items.length === 1 ? '' : 's'} · {inr(o.total)}
              </p>
            </div>
            <span className={`px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider2 ${STATUS_TONE[o.status]}`}>
              {STATUS_LABEL[o.status]}
            </span>
          </div>

          <div className="mt-4 flex gap-2.5 overflow-x-auto no-bar">
            {o.items.map((i) => (
              <img key={i.id} src={i.image_url} alt={i.name} title={`${i.name} · ${i.color} · ${i.size}`}
                className="h-24 w-[72px] shrink-0 bg-cream object-cover" loading="lazy" />
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <Link to={`/order/${o.order_number}`} className="btn-ghost btn-sm">View details</Link>
            {CANCELLABLE.includes(o.status) && (
              <button onClick={() => cancel(o.order_number)} className="btn-sm btn border border-mist text-sale hover:border-sale">
                Cancel order
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function Addresses() {
  const c = useContent('account').account;
  const [list, setList] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    label: 'Home', full_name: '', phone: '', line1: '', line2: '',
    city: '', state: '', pincode: '', is_default: false,
  });
  const [fields, setFields] = useState({});
  const [busy, setBusy] = useState(false);
  const { success, error } = useToast();

  const load = () => api.addresses().then(setList).catch(() => setList([]));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFields({});
    try {
      await api.addAddress(form);
      success('Address saved.');
      setOpen(false);
      setForm({ label: 'Home', full_name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', is_default: false });
      load();
    } catch (err) {
      if (err.fields) setFields(err.fields);
      error(err.message);
    } finally { setBusy(false); }
  };

  const remove = async (id) => {
    await api.deleteAddress(id);
    success('Address removed.');
    load();
  };

  const field = (name, label, props = {}) => (
    <div className={props.wide ? 'sm:col-span-2' : ''}>
      <label className="label" htmlFor={`ad-${name}`}>{label}</label>
      <input
        id={`ad-${name}`}
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        className={`field ${fields[name] ? 'field-error' : ''}`}
        {...{ ...props, wide: undefined }}
      />
      {fields[name] && <p className="err">{fields[name]}</p>}
    </div>
  );

  if (!list) return <div className="py-16 text-center"><Spinner className="text-navy" /></div>;

  return (
    <div>
      {list.length === 0 && !open ? (
        <EmptyState
          icon={Pin}
          title={c.addressesEmptyTitle}
          body={c.addressesEmptyBody}
          action={<button onClick={() => setOpen(true)} className="btn-primary"><Plus size={16} /> Add address</button>}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {list.map((a) => (
              <div key={a.id} className="card-surface relative p-5">
                {a.is_default && (
                  <span className="absolute right-4 top-4 bg-navy px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-cream">
                    Default
                  </span>
                )}
                <p className="text-[11px] font-semibold uppercase tracking-wider2 text-slate">{a.label}</p>
                <p className="mt-2 text-[14px] font-semibold text-navy">{a.full_name}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate">
                  {a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />
                  {a.city}, {a.state} {a.pincode}<br />
                  {a.phone}
                </p>
                <button onClick={() => remove(a.id)} className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider2 text-slate hover:text-sale">
                  <Trash size={14} /> Remove
                </button>
              </div>
            ))}
          </div>

          {!open && (
            <button onClick={() => setOpen(true)} className="btn-outline mt-6"><Plus size={16} /> Add new address</button>
          )}
        </>
      )}

      {open && (
        <form onSubmit={submit} className="card-surface mt-6 p-6">
          <h3 className="text-[12px] font-semibold uppercase tracking-wider2">New address</h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {field('label', 'Label', { placeholder: 'Home, Office…' })}
            {field('full_name', 'Full name', { required: true })}
            {field('phone', 'Mobile number', { required: true, maxLength: 10, inputMode: 'numeric' })}
            {field('pincode', 'PIN code', { required: true, maxLength: 6, inputMode: 'numeric' })}
            {field('line1', 'Address', { required: true, wide: true })}
            {field('line2', 'Landmark (optional)', { wide: true })}
            {field('city', 'City', { required: true })}
            <div>
              <label className="label" htmlFor="ad-state">State</label>
              <select
                id="ad-state"
                required
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className={`field ${fields.state ? 'field-error' : ''}`}
              >
                <option value="">Select state</option>
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {fields.state && <p className="err">{fields.state}</p>}
            </div>
          </div>

          <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-[13px] text-navy">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
              className="h-4 w-4 accent-navy"
            />
            Make this my default address
          </label>

          <div className="mt-6 flex gap-3">
            <button type="submit" disabled={busy} className="btn-primary">{busy ? 'Saving…' : 'Save address'}</button>
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}

function Profile() {
  const c = useContent('account').account;
  const { user, refresh } = useAuth();
  const { success, error } = useToast();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [busy, setBusy] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await api.updateMe(form); await refresh(); success('Profile updated.'); }
    catch (err) { error(err.message); }
    finally { setBusy(false); }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.changePassword(pw);
      success('Password changed.');
      setPw({ currentPassword: '', newPassword: '' });
    } catch (err) { error(err.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={saveProfile} className="card-surface p-6">
        <h3 className="text-[12px] font-semibold uppercase tracking-wider2">{c.detailsTitle}</h3>
        <div className="mt-5 space-y-4">
          <div>
            <label className="label" htmlFor="pf-name">Full name</label>
            <input id="pf-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="field" />
          </div>
          <div>
            <label className="label" htmlFor="pf-phone">Mobile number</label>
            <input id="pf-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={10} className="field" />
          </div>
          <div>
            <label className="label">Email</label>
            <input value={user.email} disabled className="field bg-cream text-slate" />
          </div>
        </div>
        <button type="submit" disabled={busy} className="btn-primary mt-6">Save changes</button>
      </form>

      <form onSubmit={savePassword} className="card-surface p-6">
        <h3 className="text-[12px] font-semibold uppercase tracking-wider2">{c.passwordTitle}</h3>
        <div className="mt-5 space-y-4">
          <div>
            <label className="label" htmlFor="pf-cur">Current password</label>
            <input
              id="pf-cur" type="password" required autoComplete="current-password"
              value={pw.currentPassword}
              onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
              className="field"
            />
          </div>
          <div>
            <label className="label" htmlFor="pf-new">New password</label>
            <input
              id="pf-new" type="password" required minLength={6} autoComplete="new-password"
              value={pw.newPassword}
              onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
              className="field"
            />
          </div>
        </div>
        <button type="submit" disabled={busy} className="btn-primary mt-6">Update password</button>
      </form>
    </div>
  );
}

const TABS = [
  { key: 'orders', label: 'Orders', Icon: Box },
  { key: 'addresses', label: 'Addresses', Icon: Pin },
  { key: 'profile', label: 'Profile', Icon: User },
];

export default function Account() {
  const { user, isAdmin, logout } = useAuth();
  const [tab, setTab] = useState('orders');
  const navigate = useNavigate();

  return (
    <>
      <Seo title="My Account" noindex />
      <div className="shell py-8 sm:py-11">
        <Breadcrumbs items={[{ label: 'Account' }]} />

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="h-section">My Account</h1>
            <p className="mt-2 text-[13.5px] text-slate">{user.name} · {user.email}</p>
          </div>
          <div className="flex gap-2.5">
            {isAdmin && <Link to="/admin" className="btn-outline btn-sm">Admin panel</Link>}
            <Link to="/account/wishlist" className="btn-ghost btn-sm"><Heart size={15} /> Wishlist</Link>
            <button onClick={() => { logout(); navigate('/'); }} className="btn-ghost btn-sm"><Logout size={15} /> Sign out</button>
          </div>
        </div>

        <div className="mt-9 flex gap-1 border-b border-mist" role="tablist">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-[11.5px] font-semibold uppercase tracking-wider2 transition ${
                tab === key ? 'border-navy text-navy' : 'border-transparent text-slate hover:text-navy'
              }`}
            >
              <Icon size={16} /> <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        <div className="pt-8">
          {tab === 'orders' && <Orders />}
          {tab === 'addresses' && <Addresses />}
          {tab === 'profile' && <Profile />}
        </div>
      </div>
    </>
  );
}
