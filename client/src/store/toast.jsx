import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);
let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback((message, tone = 'info', ms = 3600) => {
    const id = nextId++;
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => dismiss(id), ms);
    return id;
  }, [dismiss]);

  const value = useMemo(() => ({
    toast: push,
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error', 5000),
    dismiss,
  }), [push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[100] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex max-w-md animate-fade-up items-start gap-3 px-5 py-3.5 text-sm shadow-lg ${
              t.tone === 'error' ? 'bg-sale text-white'
                : t.tone === 'success' ? 'bg-navy text-cream'
                : 'bg-navy-deep text-cream'
            }`}
          >
            <span className="leading-snug">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="-mr-1 shrink-0 opacity-60 transition hover:opacity-100"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};
