import { useState } from 'react';
import { EditLayout, Field, MetaBox, Notice, PublishBox, ScreenHeader } from '../../components/adminUi';
import { Seo } from '../../components/ui';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { useAuth } from '../../store/auth';
import { useToast } from '../../store/toast';

/**
 * Your own account.
 *
 * Separate from Users on purpose: changing your own password needs the old one
 * and your own role is not yours to change, so the rules here are different
 * from the ones that apply to editing someone else.
 */
export default function Profile() {
  const { user, refresh, logout } = useAuth();
  const { success } = useToast();

  const [details, setDetails] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [pass, setPass] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [notice, setNotice] = useState(null);

  const saveDetails = async () => {
    setSavingDetails(true);
    setNotice(null);
    try {
      await api.updateMe(details);
      await refresh();
      success('Your details are saved.');
    } catch (err) {
      setNotice({ tone: 'error', text: err.message });
    } finally {
      setSavingDetails(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setNotice(null);

    if (pass.newPassword !== pass.confirm) {
      setNotice({ tone: 'error', text: 'The two new passwords do not match.' });
      return;
    }
    if (pass.newPassword.length < 6) {
      setNotice({ tone: 'error', text: 'The new password must be at least 6 characters.' });
      return;
    }

    setSavingPass(true);
    try {
      await api.changePassword({ currentPassword: pass.currentPassword, newPassword: pass.newPassword });
      setPass({ currentPassword: '', newPassword: '', confirm: '' });
      success('Password changed.');
    } catch (err) {
      setNotice({ tone: 'error', text: err.message });
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <>
      <Seo title="Profile" noindex />
      <ScreenHeader title="Profile">
        {notice && <Notice tone={notice.tone} onDismiss={() => setNotice(null)}>{notice.text}</Notice>}
      </ScreenHeader>

      <EditLayout
        main={(
          <>
            <MetaBox title="Your details">
              <div className="space-y-4">
                <Field label="Name" htmlFor="me-name" required>
                  <input
                    id="me-name"
                    value={details.name}
                    onChange={(e) => setDetails({ ...details, name: e.target.value })}
                    className="ad-input"
                  />
                </Field>
                <Field label="Mobile" htmlFor="me-phone">
                  <input
                    id="me-phone"
                    value={details.phone}
                    onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                    className="ad-input"
                  />
                </Field>
                <Field label="Email" hint="This is what you sign in with, so it cannot be changed here.">
                  <p className="pt-2 text-[13.5px] text-adm-ink">{user?.email}</p>
                </Field>
                <Field label="Role" hint="Only another administrator can change this.">
                  <p className="pt-2">
                    <span className="ad-chip bg-navy/10 text-navy">
                      {user?.role === 'admin' ? 'Administrator' : 'Customer'}
                    </span>
                  </p>
                </Field>
              </div>
            </MetaBox>

            <MetaBox title="Change password">
              <form onSubmit={changePassword} className="space-y-4">
                <Field label="Current password" htmlFor="me-cur" required>
                  <input
                    id="me-cur"
                    type="password"
                    autoComplete="current-password"
                    value={pass.currentPassword}
                    onChange={(e) => setPass({ ...pass, currentPassword: e.target.value })}
                    required
                    className="ad-input"
                  />
                </Field>
                <Field label="New password" htmlFor="me-new" required hint="At least 6 characters.">
                  <input
                    id="me-new"
                    type="password"
                    autoComplete="new-password"
                    value={pass.newPassword}
                    onChange={(e) => setPass({ ...pass, newPassword: e.target.value })}
                    required
                    minLength={6}
                    className="ad-input"
                  />
                </Field>
                <Field label="Repeat new password" htmlFor="me-rep" required>
                  <input
                    id="me-rep"
                    type="password"
                    autoComplete="new-password"
                    value={pass.confirm}
                    onChange={(e) => setPass({ ...pass, confirm: e.target.value })}
                    required
                    className="ad-input"
                  />
                </Field>
                <button type="submit" disabled={savingPass} className="ad-btn-primary">
                  {savingPass ? 'Changing…' : 'Change password'}
                </button>
              </form>
            </MetaBox>
          </>
        )}
        side={(
          <>
            <PublishBox onSave={saveDetails} saving={savingDetails} saveLabel="Save details">
              <p>Signed in as <strong className="text-adm-ink">{user?.email}</strong>.</p>
              {user?.created_at && <p>Account created {formatDate(user.created_at)}.</p>}
            </PublishBox>

            <MetaBox title="Session">
              <p className="mb-3 text-[12.5px] leading-relaxed text-adm-mute">
                Signing out here ends this session only. If you think someone else has your
                password, change it above — that is what locks them out.
              </p>
              <button type="button" onClick={logout} className="ad-btn-ghost">Sign out</button>
            </MetaBox>
          </>
        )}
      />
    </>
  );
}
