import { useEffect, useMemo, useState } from 'react';
import { Check, Close } from '../../components/Icons';
import { Notice } from '../../components/adminUi';
import { api } from '../../lib/api';
import { useToast } from '../../store/toast';

/**
 * Sending a batch of parcels out at once.
 *
 * The shape follows what actually happens: a stack of orders, one courier, and
 * a column of tracking numbers read off the manifest. So the carrier is chosen
 * once for the batch, and the numbers go in a single column that can be pasted
 * into whole — because the courier hands them over as a list, not one at a
 * time into separate boxes.
 *
 * Results come back per order. Nineteen booked and one rejected is a true
 * account of what happened at the counter, and the screen says which.
 */
export default function BulkShipDialog({ orders, onClose, onDone }) {
  const [provider, setProvider] = useState(null);
  const [carrier, setCarrier] = useState('');
  const [numbers, setNumbers] = useState(() => orders.map((o) => o.tracking_number || ''));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const { success } = useToast();

  useEffect(() => {
    api.admin.shippingProviders()
      .then((r) => {
        const active = r.providers.find((p) => p.id === r.active) || r.providers[0];
        setProvider(active);
      })
      .catch(() => setProvider({ id: 'manual', manualEntry: true, carriers: [], label: 'Enter tracking by hand' }));
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, busy]);

  const setNumber = (i, value) => setNumbers((prev) => prev.map((n, j) => (j === i ? value : n)));

  /**
   * Pasting a column of numbers into the first box fills the column.
   *
   * A courier's manifest comes as a list; typing it back one box at a time is
   * where mistakes get made. Splitting on any whitespace or comma covers a
   * paste out of a spreadsheet, an email, or a text file.
   */
  const onPaste = (i) => (e) => {
    const text = e.clipboardData.getData('text');
    const parts = text.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
    if (parts.length < 2) return;

    e.preventDefault();
    setNumbers((prev) => prev.map((n, j) => (j >= i && parts[j - i] !== undefined ? parts[j - i] : n)));
  };

  const filled = useMemo(() => numbers.filter((n) => n.trim()).length, [numbers]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const shipments = orders
        .map((o, i) => ({ id: o.id, carrier, trackingNumber: numbers[i].trim() }))
        .filter((s) => s.trackingNumber);

      const res = await api.admin.shipOrders(shipments);
      setResults(res);

      if (res.failed === 0) {
        success(res.dispatched === 1 ? 'One parcel dispatched.' : `${res.dispatched} parcels dispatched.`);
        onDone(res);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const resultFor = (id) => results?.results.find((r) => r.id === id);

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <button type="button" aria-label="Close" onClick={onClose} className="fixed inset-0 cursor-default bg-adm-ink/50" />

      <div role="dialog" aria-modal="true" aria-label="Dispatch orders" className="ad-card relative w-full max-w-2xl overflow-hidden">
        <header className="flex items-center justify-between border-b border-adm-line px-5 py-3.5">
          <h2 className="text-[14px] font-semibold text-adm-ink">
            Dispatch {orders.length} order{orders.length === 1 ? '' : 's'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1 text-adm-mute transition hover:bg-adm-soft hover:text-adm-ink">
            <Close size={18} />
          </button>
        </header>

        <form onSubmit={submit}>
          <div className="max-h-[60vh] space-y-4 overflow-y-auto p-5">
            {error && <Notice tone="error" onDismiss={() => setError(null)}>{error}</Notice>}

            {results && (
              <Notice tone={results.failed ? 'warning' : 'success'}>
                {results.dispatched} dispatched
                {results.failed > 0 && <>, <strong>{results.failed} could not be</strong> — see the rows below</>}
              </Notice>
            )}

            {provider?.manualEntry && (
              <div>
                <label className="ad-label mb-1.5 block" htmlFor="bs-carrier">Carrier for all of these</label>
                <input
                  id="bs-carrier"
                  list="bs-carriers"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  placeholder="Delhivery"
                  className="ad-input"
                />
                <datalist id="bs-carriers">
                  {(provider.carriers || []).map((c) => <option key={c} value={c} />)}
                </datalist>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-adm-mute">
                  Paste a column of tracking numbers into the first box and the rest fill in.
                </p>
              </div>
            )}

            <div className="overflow-hidden rounded-lg border border-adm-line">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-adm-line bg-adm-soft">
                    {['Order', 'Ship to', 'Tracking number', ''].map((h) => (
                      <th key={h} className="px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-adm-mute">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-adm-line">
                  {orders.map((o, i) => {
                    const r = resultFor(o.id);
                    return (
                      <tr key={o.id} className={r && !r.ok ? 'bg-rose-50' : ''}>
                        <td className="px-3 py-2 text-[12.5px] font-medium text-adm-ink">{o.order_number}</td>
                        <td className="px-3 py-2 text-[12px] text-adm-mute">
                          {o.shipping_address?.full_name || o.email}
                          <span className="block">{o.shipping_address?.city}</span>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            value={numbers[i]}
                            onChange={(e) => setNumber(i, e.target.value)}
                            onPaste={onPaste(i)}
                            aria-label={`Tracking number for ${o.order_number}`}
                            className="ad-input font-mono text-[12px]"
                          />
                          {r && !r.ok && <span className="mt-1 block text-[11px] text-sale">{r.error}</span>}
                        </td>
                        <td className="px-3 py-2">
                          {r?.ok && <Check size={16} className="text-ok" />}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-[11.5px] leading-relaxed text-adm-mute">
              Orders with no number are left alone. Dispatching moves an order to
              <strong className="text-adm-ink"> Shipped</strong> and shows the customer a tracking link.
            </p>
          </div>

          <footer className="flex items-center justify-between gap-3 border-t border-adm-line bg-adm-soft px-5 py-3">
            <span className="text-[12.5px] text-adm-mute">
              {filled} of {orders.length} ready
            </span>
            <span className="flex gap-2">
              <button type="button" onClick={onClose} className="ad-btn-ghost">
                {results ? 'Done' : 'Cancel'}
              </button>
              <button type="submit" disabled={busy || !filled || !provider} className="ad-btn-primary">
                {busy ? 'Dispatching…' : results?.failed ? 'Retry the failures' : `Dispatch ${filled}`}
              </button>
            </span>
          </footer>
        </form>
      </div>
    </div>
  );
}
