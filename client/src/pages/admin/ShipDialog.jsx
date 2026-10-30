import { useEffect, useState } from 'react';
import { Close } from '../../components/Icons';
import { Field, Notice } from '../../components/adminUi';
import { api } from '../../lib/api';
import { useToast } from '../../store/toast';

/**
 * Recording a dispatch.
 *
 * Which fields appear is decided by whatever shipping provider is configured,
 * not by this file. The one that ships today asks for a carrier and the number
 * written on the label; a provider that books over an API would hide both and
 * just have a button. Either way the order comes back with the same fields, so
 * this dialog does not grow a branch per courier.
 */
export default function ShipDialog({ order, onClose, onDone }) {
  const [provider, setProvider] = useState(null);
  const [form, setForm] = useState({
    carrier: order.carrier || '',
    trackingNumber: order.tracking_number || '',
    trackingUrl: order.tracking_url || '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const { success } = useToast();

  useEffect(() => {
    api.admin.shippingProviders()
      .then((r) => setProvider(r.providers.find((p) => p.id === r.active) || r.providers[0]))
      .catch(() => setProvider({ id: 'manual', label: 'Enter tracking by hand', manualEntry: true, carriers: [] }));
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const updated = await api.admin.shipOrder(order.id, form);
      success(`${order.order_number} marked as shipped.`);
      onDone(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => {
    if (!window.confirm('Remove the tracking details from this order?')) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await api.admin.shipOrder(order.id, { clear: true });
      success('Tracking removed.');
      onDone(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const shipped = Boolean(order.tracking_number);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default bg-adm-ink/50" />

      <div role="dialog" aria-modal="true" aria-label="Shipping details" className="ad-card relative w-full max-w-lg overflow-hidden">
        <header className="flex items-center justify-between border-b border-adm-line px-5 py-3.5">
          <h2 className="text-[14px] font-semibold text-adm-ink">
            {shipped ? 'Shipping details' : 'Mark as shipped'}
            <span className="ml-2 font-normal text-adm-mute">{order.order_number}</span>
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1 text-adm-mute transition hover:bg-adm-soft hover:text-adm-ink">
            <Close size={18} />
          </button>
        </header>

        <form onSubmit={submit} className="space-y-4 p-5">
          {error && <Notice tone="error" onDismiss={() => setError(null)}>{error}</Notice>}

          {!provider && <p className="py-6 text-center text-[13px] text-adm-mute">Loading…</p>}

          {provider?.manualEntry && (
            <>
              <Field label="Carrier" htmlFor="sh-carrier" hint="Pick one to get a tracking link automatically, or type any name.">
                <input
                  id="sh-carrier"
                  list="sh-carriers"
                  value={form.carrier}
                  onChange={set('carrier')}
                  placeholder="Delhivery"
                  className="ad-input"
                />
                <datalist id="sh-carriers">
                  {(provider.carriers || []).map((c) => <option key={c} value={c} />)}
                </datalist>
              </Field>

              <Field label="Tracking number" htmlFor="sh-awb" required>
                <input id="sh-awb" value={form.trackingNumber} onChange={set('trackingNumber')} required className="ad-input" />
              </Field>

              <Field label="Tracking link" htmlFor="sh-url" hint="Leave empty and one is built from the carrier above, where we know its format.">
                <input id="sh-url" type="url" value={form.trackingUrl} onChange={set('trackingUrl')} placeholder="https://…" className="ad-input" />
              </Field>
            </>
          )}

          {provider && !provider.manualEntry && (
            <p className="text-[13px] leading-relaxed text-adm-mute">
              {provider.label} will book this parcel and fill in the tracking details.
            </p>
          )}

          <div className="flex items-center justify-between gap-3 pt-1">
            {shipped ? (
              <button type="button" onClick={clear} disabled={busy} className="text-[12.5px] font-medium text-sale transition hover:underline">
                Remove tracking
              </button>
            ) : <span />}

            <span className="flex gap-2">
              <button type="button" onClick={onClose} className="ad-btn-ghost">Cancel</button>
              <button type="submit" disabled={busy || !provider} className="ad-btn-primary">
                {busy ? 'Saving…' : shipped ? 'Update' : 'Mark as shipped'}
              </button>
            </span>
          </div>

          {!shipped && (
            <p className="border-t border-adm-line pt-3 text-[11.5px] leading-relaxed text-adm-mute">
              This also moves the order to <strong className="text-adm-ink">Shipped</strong>, and the
              customer sees the tracking link on their order page.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
