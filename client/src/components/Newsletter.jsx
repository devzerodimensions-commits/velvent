import { useState } from 'react';
import { api } from '../lib/api';
import { useToast } from '../store/toast';

/**
 * Shared signup form. `tone="dark"` is for the navy footer and banner,
 * `tone="light"` for use on cream or white.
 */
export default function Newsletter({ tone = 'dark', id = 'newsletter', label = 'Join the list', note }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const { success, error } = useToast();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.newsletter(email);
      success(res.message);
      setEmail('');
      setDone(true);
    } catch (err) {
      error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const dark = tone === 'dark';

  return (
    <form onSubmit={submit} className="w-full">
      {label && (
        <label
          htmlFor={id}
          className={`text-[11px] font-semibold uppercase tracking-wider2 ${dark ? 'text-cream/70' : 'text-slate'}`}
        >
          {label}
        </label>
      )}
      <div className={`flex ${label ? 'mt-2.5' : ''}`}>
        <input
          id={id}
          type="email"
          required
          value={email}
          onChange={(e) => { setEmail(e.target.value); setDone(false); }}
          placeholder="your@email.com"
          className={`w-full border px-3.5 py-3 text-sm focus:outline-none ${
            dark
              ? 'border-cream/25 bg-transparent text-cream placeholder:text-cream/40 focus:border-cream'
              : 'border-mist bg-white text-navy placeholder:text-slate-light focus:border-navy'
          }`}
        />
        <button
          type="submit"
          disabled={busy}
          className={`btn px-6 disabled:opacity-60 ${
            dark ? 'bg-cream text-navy hover:bg-white' : 'bg-navy text-cream hover:bg-navy-deep'
          }`}
        >
          {busy ? '…' : done ? 'Done' : 'Join'}
        </button>
      </div>
      {note && (
        <p className={`mt-2 text-[11px] leading-relaxed ${dark ? 'text-cream/50' : 'text-slate'}`}>{note}</p>
      )}
    </form>
  );
}
