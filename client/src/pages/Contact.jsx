import { useState } from 'react';
import { Alert, Breadcrumbs, Seo, Spinner } from '../components/ui';
import { Clock, Mail, Phone, Whatsapp } from '../components/Icons';
import { api } from '../lib/api';
import { useContent } from '../store/content';
import { Rich } from '../components/RichText';
import { useToast } from '../store/toast';

export default function Contact() {
  const BRAND = useContent('brand');
  const c = useContent('contact');
  const subjects = c.subjects?.length ? c.subjects : ['General enquiry'];

  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sent, setSent] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const { success } = useToast();

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      // The select shows the first subject before it is touched; send that.
      const res = await api.contact({ ...form, subject: form.subject || subjects[0] });
      setSent(res.message);
      success(res.message);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Seo title="Contact Us" description={`Call VELVENT on ${BRAND.phone} or send us a message — we reply within one business day.`} />
      <div className="shell py-8 sm:py-11">
        <Breadcrumbs items={[{ label: 'Contact' }]} />
        <h1 className="h-section mt-4">{c.title}</h1>
        <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-slate">
          <Rich>{c.intro}</Rich>
        </p>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-16">
          <form onSubmit={submit} className="card-surface p-6 sm:p-8">
            <h2 className="text-[12px] font-semibold uppercase tracking-wider2">{c.formTitle}</h2>

            {sent && <div className="mt-5"><Alert tone="success">{sent}</Alert></div>}
            {error && <div className="mt-5"><Alert>{error}</Alert></div>}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="ct-name">Your name</label>
                <input id="ct-name" required value={form.name} onChange={set('name')} className="field" />
              </div>
              <div>
                <label className="label" htmlFor="ct-email">Email address</label>
                <input id="ct-email" type="email" required value={form.email} onChange={set('email')} className="field" />
              </div>
              <div>
                <label className="label" htmlFor="ct-phone">Mobile (optional)</label>
                <input id="ct-phone" type="tel" maxLength={10} value={form.phone} onChange={set('phone')} className="field" />
              </div>
              <div>
                <label className="label" htmlFor="ct-subject">Subject</label>
                <select id="ct-subject" value={form.subject || subjects[0]} onChange={set('subject')} className="field">
                  {subjects.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="ct-message">Message</label>
                <textarea
                  id="ct-message"
                  rows={6}
                  required
                  value={form.message}
                  onChange={set('message')}
                  className="field resize-y"
                  placeholder="Tell us what you need — include your order number if it is about an order."
                />
              </div>
            </div>

            <button type="submit" disabled={busy} className="btn-primary mt-6">
              {busy ? <><Spinner size={16} /> Sending…</> : 'Send message'}
            </button>
          </form>

          <aside className="space-y-4">
            <a
              href={`tel:${BRAND.phoneRaw}`}
              className="card-surface flex items-start gap-4 p-6 transition hover:border-navy"
            >
              <Phone size={21} className="mt-0.5 shrink-0 text-navy" />
              <span>
                <span className="block text-[11px] font-semibold uppercase tracking-wider2 text-slate">Call us</span>
                <span className="mt-1.5 block text-[15px] font-semibold text-navy">{BRAND.phone}</span>
              </span>
            </a>

            <a
              href={`https://wa.me/${BRAND.whatsapp}`}
              target="_blank"
              rel="noreferrer noopener"
              className="card-surface flex items-start gap-4 p-6 transition hover:border-navy"
            >
              <Whatsapp size={21} className="mt-0.5 shrink-0 text-navy" />
              <span>
                <span className="block text-[11px] font-semibold uppercase tracking-wider2 text-slate">WhatsApp</span>
                <span className="mt-1.5 block text-[15px] font-semibold text-navy">Chat with us</span>
                <span className="mt-1 block text-[12.5px] text-slate">Fastest for order questions</span>
              </span>
            </a>

            <a
              href={`mailto:${BRAND.email}`}
              className="card-surface flex items-start gap-4 p-6 transition hover:border-navy"
            >
              <Mail size={21} className="mt-0.5 shrink-0 text-navy" />
              <span>
                <span className="block text-[11px] font-semibold uppercase tracking-wider2 text-slate">Email</span>
                <span className="mt-1.5 block text-[15px] font-semibold text-navy">{BRAND.email}</span>
              </span>
            </a>

            <div className="card-surface flex items-start gap-4 p-6">
              <Clock size={21} className="mt-0.5 shrink-0 text-navy" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider2 text-slate">Business hours</p>
                <dl className="mt-2.5 space-y-1.5 text-[13.5px]">
                  {BRAND.hours.map((h) => (
                    <div key={h.label} className="flex justify-between gap-6">
                      <dt className="text-slate">{h.label}</dt>
                      <dd className="font-medium text-navy">{h.value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 border-t border-mist pt-3 text-[12.5px] text-slate">
                  {BRAND.hoursDays} — we are open seven days a week.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
