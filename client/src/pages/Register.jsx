import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Seo, Spinner } from '../components/ui';
import Logo from '../components/Logo';
import { useAuth } from '../store/auth';
import { useToast } from '../store/toast';

export default function Register() {
  const { user, register, ready } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();
  const { state } = useLocation();

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState(null);
  const [fields, setFields] = useState({});
  const [busy, setBusy] = useState(false);

  if (ready && user) return <Navigate to={state?.from || '/account'} replace />;

  const set = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value });
    if (fields[k]) setFields({ ...fields, [k]: undefined });
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFields({});
    try {
      const u = await register(form);
      success(`Welcome to VELVENT, ${u.name.split(' ')[0]}.`);
      navigate(state?.from || '/account', { replace: true });
    } catch (err) {
      setError(err.message);
      if (err.fields) setFields(err.fields);
      setBusy(false);
    }
  };

  const field = (name, label, props = {}) => (
    <div>
      <label className="label" htmlFor={`rg-${name}`}>{label}</label>
      <input
        id={`rg-${name}`}
        value={form[name]}
        onChange={set(name)}
        className={`field ${fields[name] ? 'field-error' : ''}`}
        aria-invalid={!!fields[name]}
        {...props}
      />
      {fields[name] && <p className="err">{fields[name]}</p>}
    </div>
  );

  return (
    <>
      <Seo title="Create Account" />
      <div className="shell flex justify-center py-16 sm:py-24">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center text-center">
            <Logo variant="stacked" withTagline className="text-navy" />
            <h1 className="mt-9 font-display text-xl font-semibold uppercase tracking-wider2">Create account</h1>
            <p className="mt-2 text-[13.5px] text-slate">Faster checkout, order history and a saved wishlist.</p>
          </div>

          <form onSubmit={submit} className="mt-9 space-y-4">
            {error && <Alert>{error}</Alert>}

            {field('name', 'Full name', { required: true, autoComplete: 'name' })}
            {field('email', 'Email address', { type: 'email', required: true, autoComplete: 'email' })}
            {field('phone', 'Mobile number (optional)', { type: 'tel', autoComplete: 'tel', maxLength: 10 })}
            {field('password', 'Password', {
              type: 'password', required: true, minLength: 6, autoComplete: 'new-password',
            })}
            <p className="-mt-2 text-[11.5px] text-slate">At least 6 characters.</p>

            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? <><Spinner size={16} /> Creating…</> : 'Create account'}
            </button>
          </form>

          <p className="mt-7 text-center text-[13.5px] text-slate">
            Already have an account?{' '}
            <Link to="/login" state={state} className="font-semibold text-navy underline">Sign in</Link>
          </p>
        </div>
      </div>
    </>
  );
}
