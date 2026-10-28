import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { mergeContent } from '../lib/content';
import { DEFAULTS } from '../content';

/**
 * The store's standing copy, as the admin last saved it.
 *
 * Defaults ship in the bundle, so the first paint is never blank and never
 * waits on a request. The saved overrides land a moment later and are merged
 * on top. A cached copy in sessionStorage means that second paint usually
 * happens before anything is on screen at all, so edited copy does not visibly
 * replace built-in copy on every page load.
 */

const ContentContext = createContext(null);
const CACHE_KEY = 'velvent:content';

const readCache = () => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export function ContentProvider({ children }) {
  const [overrides, setOverrides] = useState(() => readCache() || {});

  const refresh = useCallback(async () => {
    try {
      const data = await api.content();
      const next = data && typeof data === 'object' ? data : {};
      setOverrides(next);
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(next)); } catch { /* private mode */ }
      return next;
    } catch {
      // Keep whatever we have. Built-in copy is always a correct store.
      return null;
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const value = useMemo(() => {
    const merged = {};
    for (const key of Object.keys(DEFAULTS)) {
      merged[key] = mergeContent(DEFAULTS[key], overrides[key]);
    }
    return { content: merged, overrides, refresh };
  }, [overrides, refresh]);

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

/**
 * `useContent()` gives every section; `useContent('footer')` gives one.
 *
 * Outside a provider — a lone component in a test, say — the defaults come
 * back, so nothing has to be wrapped just to render.
 */
export function useContent(section) {
  const ctx = useContext(ContentContext);
  const all = ctx?.content || DEFAULTS;
  return section ? all[section] : all;
}

/** Lets the admin re-read the site after saving, without a page reload. */
export function useContentRefresh() {
  return useContext(ContentContext)?.refresh || (async () => null);
}
