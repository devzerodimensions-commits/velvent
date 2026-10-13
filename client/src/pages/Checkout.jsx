import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, Breadcrumbs, Seo, Spinner } from '../components/ui';
import { Bag, Check, Rupee, Shield } from '../components/Icons';
import { useCart } from '../store/cart';
import { useAuth } from '../store/auth';
import { useToast } from '../store/toast';
import { api } from '../lib/api';
import { inr } from '../lib/format';
import { BRAND } from '../lib/brand';

const STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands',
  'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh',
  'Lakshadweep', 'Puducherry'];

const EMPTY = {
  full_name: '', phone: '', email: '',
  line1: '', line2: '', city: '', state: '', pincode: '', notes: '',
};

/** Loads the Razorpay widget only when online payment is actually configured. */
function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function Checkout() {
  const navigate = useNavigate();
  const { items, lines, totals, pricing, priceError, couponCode, clear } = useCart();
  const { user } = useAuth();
  const { error: toastError } = useToast();

  const [form, setForm] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [method, setMethod] = useState('cod');
  const [methods, setMethods] = useState({ cod: true, razorpay: false });
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [placing, setPlacing] = useState(false);

  useEffect(() => { api.paymentMethods().then(setMethods).catch(() => {}); }, []);

  useEffect(() => {
    if (!user) return;
    setForm((f) => ({ ...f, full_name: f.full_name || user.name, email: f.email || user.email, phone: f.phone || user.phone || '' }));
    api.addresses().then((list) => {
      setSavedAddresses(list);
      const def = list.find((a) => a.is_default) || list[0];
      if (def) {
        setForm((f) => ({
          ...f,
          full_name: def.full_name, phone: def.phone, line1: def.line1,
          line2: def.line2 || '', city: def.city, state: def.state, pincode: def.pincode,
        }));
      }
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!items.length && !placing) navigate('/cart', { replace: true });
  }, [items.length, placing, navigate]);

  const rows = lines || [];
  const set = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value });
    if (fieldErrors[k]) setFieldErrors({ ...fieldErrors, [k]: undefined });
  };

  const useAddress = (a) => setForm((f) => ({
    ...f,
    full_name: a.full_name, phone: a.phone, line1: a.line1,
    line2: a.line2 || '', city: a.city, state: a.state, pincode: a.pincode,
  }));

  const canPay = !pricing && !priceError && rows.length > 0 && !placing;

  const submit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setPlacing(true);

    const payload = {
      items: items.map(({ variantId, quantity }) => ({ variantId, quantity })),
      address: {
        full_name: form.full_name.trim(), phone: form.phone.trim(), line1: form.line1.trim(),
        line2: form.line2.trim(), city: form.city.trim(), state: form.state, pincode: form.pincode.trim(),
      },
      email: form.email.trim(),
      phone: form.phone.trim(),
      notes: form.notes.trim() || undefined,
      couponCode: couponCode || undefined,
      paymentMethod: method,
    };

    try {
      const res = await api.placeOrder(payload);
      const orderNumber = res.order.order_number;

      if (method === 'razorpay' && res.razorpay) {
        const ready = await loadRazorpay();
        if (!ready) throw new Error('Could not open the payment window. Please try Cash on Delivery.');

        await new Promise((resolve, reject) => {
          const rzp = new window.Razorpay({
            key: res.razorpay.keyId,
            amount: res.razorpay.amount,
            currency: 'INR',
            name: BRAND.name,
            description: `Order ${orderNumber}`,
            order_id: res.razorpay.orderId,
            prefill: { name: form.full_name, email: form.email, contact: form.phone },
            theme: { color: '#2C3544' },
            handler: async (r) => {
              try {
                await api.verifyPayment(orderNumber, r);
                resolve();
              } catch (err) { reject(err); }
            },
            modal: {
              ondismiss: () => reject(new Error('Payment was cancelled. Your order is saved as unpaid — you can retry from your account.')),
            },
          });
          rzp.open();
        });
      }

      clear();
      navigate(`/order/${orderNumber}`, { state: { justPlaced: true, email: payload.email }, replace: true });
    } catch (err) {
      setPlacing(false);
      if (err.fields) setFieldErrors(err.fields);
      setFormError(err.message);
      toastError(err.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const input = (name, label, { wide, ...props } = {}) => (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <label className="label" htmlFor={`co-${name}`}>{label}</label>
      <input
        id={`co-${name}`}
        value={form[name]}
        onChange={set(name)}
        className={`field ${fieldErrors[name] ? 'field-error' : ''}`}
        aria-invalid={!!fieldErrors[name]}
        {...props}
      />
      {fieldErrors[name] && <p className="err">{fieldErrors[name]}</p>}
    </div>
  );

  return (
    <>
      <Seo title="Checkout" noindex />
      <div className="shell py-8 sm:py-11">
        <Breadcrumbs items={[{ to: '/cart', label: 'Bag' }, { label: 'Checkout' }]} />
        <h1 className="h-section mt-4">Checkout</h1>

        {!user && (
          <p className="mt-5 border border-mist bg-cream px-4 py-3 text-[13px] text-navy">
            Checking out as a guest.{' '}
            <Link to="/login" state={{ from: '/checkout' }} className="font-semibold underline">Sign in</Link>{' '}
            to use a saved address and track this order from your account.
          </p>
        )}

        {(formError || priceError) && <div className="mt-5"><Alert>{formError || priceError}</Alert></div>}

        <form onSubmit={submit} className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-14">
          <div className="space-y-10">
            {savedAddresses.length > 0 && (
              <section>
                <h2 className="text-[12px] font-semibold uppercase tracking-wider2">Saved addresses</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {savedAddresses.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => useAddress(a)}
                      className="border border-mist p-4 text-left text-[13px] transition hover:border-navy"
                    >
                      <p className="font-semibold text-navy">{a.full_name} · {a.label}</p>
                      <p className="mt-1 leading-relaxed text-slate">
                        {a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} {a.pincode}
                      </p>
                      <p className="mt-1 text-slate">{a.phone}</p>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="text-[12px] font-semibold uppercase tracking-wider2">Contact</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {input('email', 'Email address', { type: 'email', required: true, autoComplete: 'email', placeholder: 'you@example.com' })}
                {input('phone', 'Mobile number', { type: 'tel', required: true, autoComplete: 'tel', placeholder: '10-digit mobile', maxLength: 10 })}
              </div>
            </section>

            <section>
              <h2 className="text-[12px] font-semibold uppercase tracking-wider2">Shipping address</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {input('full_name', 'Full name', { required: true, autoComplete: 'name', wide: true })}
                {input('line1', 'Address', { required: true, autoComplete: 'address-line1', placeholder: 'House / flat, street', wide: true })}
                {input('line2', 'Landmark (optional)', { autoComplete: 'address-line2', wide: true })}
                {input('city', 'City', { required: true, autoComplete: 'address-level2' })}

                <div>
                  <label className="label" htmlFor="co-state">State</label>
                  <select
                    id="co-state"
                    value={form.state}
                    onChange={set('state')}
                    required
                    className={`field ${fieldErrors.state ? 'field-error' : ''}`}
                  >
                    <option value="">Select state</option>
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {fieldErrors.state && <p className="err">{fieldErrors.state}</p>}
                </div>

                {input('pincode', 'PIN code', { required: true, inputMode: 'numeric', maxLength: 6, autoComplete: 'postal-code' })}

                <div className="sm:col-span-2">
                  <label className="label" htmlFor="co-notes">Delivery notes (optional)</label>
                  <textarea
                    id="co-notes"
                    rows={3}
                    value={form.notes}
                    onChange={set('notes')}
                    className="field resize-y"
                    placeholder="Anything our courier should know"
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-[12px] font-semibold uppercase tracking-wider2">Payment</h2>
              <div className="mt-4 space-y-3">
                <label className={`flex cursor-pointer items-start gap-3.5 border p-4 transition ${method === 'cod' ? 'border-navy bg-cream' : 'border-mist'}`}>
                  <input type="radio" name="pay" value="cod" checked={method === 'cod'} onChange={() => setMethod('cod')} className="mt-1 h-4 w-4 accent-navy" />
                  <span>
                    <span className="flex items-center gap-2 text-[13.5px] font-semibold text-navy">
                      <Rupee size={17} /> Cash on Delivery
                    </span>
                    <span className="mt-1 block text-[12.5px] leading-relaxed text-slate">
                      Pay the courier in cash when your parcel arrives.
                    </span>
                  </span>
                </label>

                {methods.razorpay ? (
                  <label className={`flex cursor-pointer items-start gap-3.5 border p-4 transition ${method === 'razorpay' ? 'border-navy bg-cream' : 'border-mist'}`}>
                    <input type="radio" name="pay" value="razorpay" checked={method === 'razorpay'} onChange={() => setMethod('razorpay')} className="mt-1 h-4 w-4 accent-navy" />
                    <span>
                      <span className="flex items-center gap-2 text-[13.5px] font-semibold text-navy">
                        <Shield size={17} /> Pay online
                      </span>
                      <span className="mt-1 block text-[12.5px] leading-relaxed text-slate">
                        UPI, credit or debit card, net banking and wallets — secured by Razorpay.
                      </span>
                    </span>
                  </label>
                ) : (
                  <p className="border border-dashed border-mist px-4 py-3 text-[12.5px] leading-relaxed text-slate">
                    Online payment is not switched on yet. Add your Razorpay keys in the server
                    environment to accept UPI, cards and net banking.
                  </p>
                )}
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-[calc(var(--nav-h)+40px)] lg:h-fit">
            <div className="card-surface p-6">
              <h2 className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider2">
                <Bag size={17} /> Your order
              </h2>

              <ul className="mt-5 max-h-72 space-y-4 overflow-y-auto pr-1">
                {rows.map((r) => (
                  <li key={r.variantId} className="flex gap-3.5">
                    <div className="relative shrink-0">
                      <img src={r.imageUrl} alt="" className="h-20 w-[60px] bg-cream object-cover" loading="lazy" />
                      <span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-navy text-[10px] font-bold text-cream">
                        {r.quantity}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-medium text-navy">{r.name}</p>
                      <p className="mt-0.5 text-[11.5px] text-slate">{r.color} · {r.size}</p>
                    </div>
                    <span className="text-[12.5px] font-semibold">{inr(r.lineTotal)}</span>
                  </li>
                ))}
              </ul>

              <dl className={`mt-6 space-y-3 border-t border-mist pt-5 text-[13.5px] ${pricing ? 'opacity-60' : ''}`}>
                <div className="flex justify-between">
                  <dt className="text-slate">Subtotal</dt>
                  <dd className="font-medium">{inr(totals?.subtotal ?? 0)}</dd>
                </div>
                {totals?.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <dt>Coupon ({totals.couponCode})</dt>
                    <dd>− {inr(totals.discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-slate">Shipping</dt>
                  <dd className="font-medium">
                    {totals?.shipping === 0 ? <span className="text-emerald-700">Free</span> : inr(totals?.shipping ?? 0)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between border-t border-mist pt-4">
                  <dt className="text-[12px] font-semibold uppercase tracking-wider2">Total</dt>
                  <dd className="text-lg font-semibold">{inr(totals?.total ?? 0)}</dd>
                </div>
              </dl>

              <button type="submit" disabled={!canPay} className="btn-primary mt-6 w-full">
                {placing ? <><Spinner size={16} /> Placing order…</>
                  : method === 'cod' ? <>Place order · {inr(totals?.total ?? 0)}</>
                    : <>Pay {inr(totals?.total ?? 0)}</>}
              </button>

              <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate">
                <Check size={14} /> Taxes included · {BRAND.shipping.returnDays}-day returns
              </p>
            </div>
          </aside>
        </form>
      </div>
    </>
  );
}
