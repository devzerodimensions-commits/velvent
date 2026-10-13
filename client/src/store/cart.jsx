import { createContext, useContext, useEffect, useMemo, useReducer, useState, useCallback } from 'react';
import { api } from '../lib/api';

const KEY = 'velvent.cart';
const CartContext = createContext(null);

/**
 * The cart lives in localStorage so guests keep it between visits. Prices shown
 * here are only ever a preview — the server re-prices every cart at checkout.
 */
function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(raw) ? raw.filter((i) => i?.variantId && i?.quantity > 0) : [];
  } catch {
    return [];
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'add': {
      const { item } = action;
      const found = state.find((i) => i.variantId === item.variantId);
      if (found) {
        return state.map((i) =>
          i.variantId === item.variantId
            ? { ...i, quantity: Math.min(10, i.quantity + item.quantity) }
            : i);
      }
      return [...state, item];
    }
    case 'setQty':
      return state
        .map((i) => (i.variantId === action.variantId
          ? { ...i, quantity: Math.max(0, Math.min(10, action.quantity)) }
          : i))
        .filter((i) => i.quantity > 0);
    case 'remove':
      return state.filter((i) => i.variantId !== action.variantId);
    case 'clear':
      return [];
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(reducer, undefined, load);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [couponCode, setCouponCode] = useState(() => localStorage.getItem('velvent.coupon') || '');
  const [priced, setPriced] = useState(null);
  const [pricing, setPricing] = useState(false);
  const [priceError, setPriceError] = useState(null);

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(items)); }, [items]);
  useEffect(() => {
    if (couponCode) localStorage.setItem('velvent.coupon', couponCode);
    else localStorage.removeItem('velvent.coupon');
  }, [couponCode]);

  // Re-price against the server whenever the cart or coupon changes.
  useEffect(() => {
    let cancelled = false;
    if (!items.length) { setPriced(null); setPriceError(null); return undefined; }

    setPricing(true);
    api.priceCart(items.map(({ variantId, quantity }) => ({ variantId, quantity })), couponCode || undefined)
      .then((res) => { if (!cancelled) { setPriced(res); setPriceError(null); } })
      .catch((err) => {
        if (cancelled) return;
        // A bad coupon should not blank the cart — drop it and let the plain cart price.
        if (couponCode && /coupon/i.test(err.message)) { setCouponCode(''); return; }
        setPriceError(err.message);
        setPriced(null);
      })
      .finally(() => { if (!cancelled) setPricing(false); });

    return () => { cancelled = true; };
  }, [items, couponCode]);

  const add = useCallback((item, { open = true } = {}) => {
    dispatch({ type: 'add', item: { ...item, quantity: item.quantity || 1 } });
    if (open) setDrawerOpen(true);
  }, []);

  const value = useMemo(() => {
    const count = items.reduce((n, i) => n + i.quantity, 0);
    // Local estimate keeps the UI responsive before the server responds.
    const estimate = items.reduce((n, i) => n + Number(i.salePrice || 0) * i.quantity, 0);
    return {
      items,
      count,
      subtotalEstimate: estimate,
      priced,
      pricing,
      priceError,
      totals: priced?.totals || null,
      lines: priced?.lines || null,
      couponCode,
      setCouponCode,
      add,
      setQty: (variantId, quantity) => dispatch({ type: 'setQty', variantId, quantity }),
      remove: (variantId) => dispatch({ type: 'remove', variantId }),
      clear: () => { dispatch({ type: 'clear' }); setCouponCode(''); },
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
    };
  }, [items, priced, pricing, priceError, couponCode, drawerOpen, add]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
};
