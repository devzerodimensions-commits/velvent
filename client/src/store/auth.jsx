import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { api, getToken, setToken } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [wishlist, setWishlist] = useState([]);

  const loadWishlist = useCallback(async () => {
    try { setWishlist(await api.wishlist()); } catch { setWishlist([]); }
  }, []);

  useEffect(() => {
    if (!getToken()) { setReady(true); return; }
    api.me()
      .then((u) => { setUser(u); return loadWishlist(); })
      .catch(() => setToken(null))
      .finally(() => setReady(true));
  }, [loadWishlist]);

  const finish = useCallback(async ({ token, user: u }) => {
    setToken(token);
    setUser(u);
    await loadWishlist();
    return u;
  }, [loadWishlist]);

  const value = useMemo(() => ({
    user,
    ready,
    isAdmin: user?.role === 'admin',
    wishlist,
    wishlistIds: new Set(wishlist.map((w) => w.id)),
    login: async (body) => finish(await api.login(body)),
    register: async (body) => finish(await api.register(body)),
    logout: () => { setToken(null); setUser(null); setWishlist([]); },
    refresh: async () => setUser(await api.me()),
    toggleWishlist: async (productId) => {
      if (!user) return false;
      const has = wishlist.some((w) => w.id === productId);
      if (has) await api.removeWishlist(productId);
      else await api.addWishlist(productId);
      await loadWishlist();
      return !has;
    },
  }), [user, ready, wishlist, finish, loadWishlist]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
