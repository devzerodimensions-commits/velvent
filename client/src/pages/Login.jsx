import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Seo, Spinner } from '../components/ui';
import Logo from '../components/Logo';
import { useAuth } from '../store/auth';
import { useToast } from '../store/toast';

export default function Login() {
  const { user, login, ready } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();
  const { state } = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (ready && user) return <Navigate to={state?.from || '/account'} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const u = await login(form);
      success(`Welcome back, ${u.name.split(' ')[0]}.`);
      navigate(state?.from || (u.role === 'admin' ? '/admin' : '/account'), { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <>
      <Seo title="Sign In" />
      <div className="shell flex justify-center py-16 sm:py-24">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center text-center">
            <Logo variant="stacked" withTagline className="text-navy" />
            <h1 className="mt-9 font-display text-xl font-semibold uppercase tracking-wider2">Sign in</h1>
            <p className="mt-2 text-[13.5px] text-slate">Track orders, save addresses and keep a wishlist.</p>
          </div>

          <form onSubmit={submit} className="mt-9 space-y-4">
            {error && <Alert>{error}</Alert>}

            <div>
              <label className="label" htmlFor="li-email">Email address</label>
              <input
                id="li-email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="field"
              />
            </div>
            <div>
              <label className="label" htmlFor="li-pass">Password</label>
              <input
                id="li-pass"
                type="password"
                required
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="field"
              />
            </div>

            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? <><Spinner size={16} /> Signing in…</> : 'Sign in'}
            </button>
          </form>

          <p className="mt-7 text-center text-[13.5px] text-slate">
            New here?{' '}
            <Link to="/register" state={state} className="font-semibold text-navy underline">Create an account</Link>
          </p>
          <p className="mt-3 text-center text-[13px] text-slate">
            Just want to check an order?{' '}
            <Link to="/track-order" className="font-semibold text-navy underline">Track it without signing in</Link>
          </p>
        </div>
      </div>
    </>
  );
}
