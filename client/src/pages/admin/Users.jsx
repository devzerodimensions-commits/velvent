import { useEffect, useState } from 'react';
import { Cell, Field, ListTable, MetaBox, Notice, RowActions, ScreenHeader } from '../../components/adminUi';
import { Seo } from '../../components/ui';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { useAuth } from '../../store/auth';
import { useToast } from '../../store/toast';

const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email', className: 'hidden md:table-cell' },
  { key: 'role', label: 'Role', className: 'w-36' },
  { key: 'orders', label: 'Orders', className: 'hidden sm:table-cell w-24' },
  { key: 'joined', label: 'Joined', className: 'hidden lg:table-cell w-32' },
];

const BLANK = { name: '', email: '', phone: '', password: '', role: 'customer' };

/**
 * Every account on the store, and what each one may do.
 *
 * An admin can open this panel; a customer can only shop. The dangerous edits
 * — removing an account or taking someone's admin away — are refused by the
 * server when they would leave nobody able to get back in, and the reason is
 * shown here rather than swallowed.
 */
export default function Users() {
  const [rows, setRows] = useState(null);
  const [term, setTerm] = useState('');
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  const { user } = useAuth();
  const { success } = useToast();

  const load = (q = term) => api.admin.users(q).then(setRows).catch((err) => setNotice({ tone: 'error', text: err.message }));
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [term]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      const created = await api.admin.createUser(form);
      setForm(null);
      await load();
      success(`${created.name} added as ${created.role === 'admin' ? 'an administrator' : 'a customer'}.`);
    } catch (err) {
      setNotice({ tone: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const changeRole = async (u, role) => {
    setNotice(null);
    try {
      await api.admin.updateUser(u.id, { role });
      await load();
      success(`${u.name} is now ${role === 'admin' ? 'an administrator' : 'a customer'}.`);
    } catch (err) {
      setNotice({ tone: 'error', text: err.message });
    }
  };

  const remove = async (u) => {
    if (!window.confirm(`Delete ${u.name}? Their orders stay in the shop's records, but the account is gone for good.`)) return;
    setNotice(null);
    try {
      await api.admin.deleteUser(u.id);
      await load();
      success(`${u.name} deleted.`);
    } catch (err) {
      setNotice({ tone: 'error', text: err.message });
    }
  };

  const resetPassword = async (u) => {
    const password = window.prompt(`Set a new password for ${u.name}. They can change it afterwards.`);
    if (!password) return;
    setNotice(null);
    try {
      await api.admin.setUserPassword(u.id, password);
      success(`Password changed for ${u.name}. Tell them what it is — it is not emailed.`);
    } catch (err) {
      setNotice({ tone: 'error', text: err.message });
    }
  };

  return (
    <>
      <Seo title="Users" noindex />
      <ScreenHeader title="Users" count={rows?.length} action="Add user" onAction={() => setForm(BLANK)}>
        {notice && <Notice tone={notice.tone} onDismiss={() => setNotice(null)}>{notice.text}</Notice>}
      </ScreenHeader>

      {form && (
        <div className="mb-5">
          <MetaBox title="Add a new user">
            <form onSubmit={create} className="space-y-4">
              <Field label="Name" htmlFor="u-name" required>
                <input id="u-name" value={form.name} onChange={set('name')} required className="ad-input" />
              </Field>
              <Field label="Email" htmlFor="u-email" required hint="This is what they sign in with.">
                <input id="u-email" type="email" value={form.email} onChange={set('email')} required className="ad-input" />
              </Field>
              <Field label="Mobile" htmlFor="u-phone">
                <input id="u-phone" value={form.phone} onChange={set('phone')} className="ad-input" />
              </Field>
              <Field label="Password" htmlFor="u-pass" required hint="At least 6 characters. Tell them what it is — nothing is emailed.">
                <input id="u-pass" type="password" value={form.password} onChange={set('password')} required minLength={6} className="ad-input" />
              </Field>
              <Field label="Role" htmlFor="u-role" hint="An administrator can open this panel and change anything in it.">
                <select id="u-role" value={form.role} onChange={set('role')} className="ad-select">
                  <option value="customer">Customer</option>
                  <option value="admin">Administrator</option>
                </select>
              </Field>

              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={busy} className="ad-btn-primary">
                  {busy ? 'Adding…' : 'Add user'}
                </button>
                <button type="button" onClick={() => setForm(null)} className="ad-btn-ghost">Cancel</button>
              </div>
            </form>
          </MetaBox>
        </div>
      )}

      <ListTable
        columns={COLUMNS}
        rows={rows || []}
        loading={rows === null}
        search={term}
        onSearch={setTerm}
        searchPlaceholder="Search name, email or phone"
        total={rows?.length}
        empty="No accounts yet."
        renderRow={(u) => (
          <>
            <Cell primary>
              <span className="font-semibold text-adm-ink">{u.name}</span>
              {u.id === user?.id && <span className="ml-2 text-[11.5px] text-adm-mute">(you)</span>}
              <span className="block text-[11.5px] text-adm-mute md:hidden">{u.email}</span>
              <RowActions
                actions={[
                  { label: 'Reset password', onClick: () => resetPassword(u) },
                  u.id !== user?.id && { label: 'Delete', onClick: () => remove(u), danger: true },
                ]}
              />
            </Cell>
            <Cell className="hidden md:table-cell">{u.email}</Cell>
            <Cell>
              {u.id === user?.id ? (
                <span className="ad-chip bg-navy/10 text-navy">Administrator</span>
              ) : (
                <select
                  value={u.role}
                  onChange={(e) => changeRole(u, e.target.value)}
                  aria-label={`Role for ${u.name}`}
                  className="ad-select py-1 text-[12px]"
                >
                  <option value="customer">Customer</option>
                  <option value="admin">Administrator</option>
                </select>
              )}
            </Cell>
            <Cell className="hidden sm:table-cell">{u.orders}</Cell>
            <Cell className="hidden lg:table-cell">{formatDate(u.created_at)}</Cell>
          </>
        )}
      />
    </>
  );
}
